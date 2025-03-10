import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  applyActionCode as firebaseApplyActionCode,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { auth, getActionCodeSettings, createAuditLog } from '../lib/firebase';
import { createUser, getUser, updateUser } from '../lib/db';
import { createAuthToken, invalidateUserTokens } from '../lib/tokens';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';

// We're using our Mailgun email service for all auth emails in production
const USE_CUSTOM_EMAIL_PROVIDER = true;

interface AuthContextType {
  currentUser: User | null;
  emailVerified: boolean;
  signup: (email: string, password: string, isVendor?: boolean) => Promise<any>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyEmail: (actionCode: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const signup = async (email: string, password: string, isVendor: boolean = false) => {
    // First create the Firebase Auth user without touching the database
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Only after successful auth creation, create user in database
        await createUser(userCredential.user.uid, {
          email: email,
          role: isVendor ? 'vendor' : 'customer',
          createdAt: new Date(),
          emailVerified: false
        });
        
        // Log the signup event
        await createAuditLog({
          userId: userCredential.user.uid,
          userEmail: email,
          action: 'user_signup',
          entity: 'user',
          entityId: userCredential.user.uid,
          details: { isVendor }
        });
        
        // Send verification email after all database operations are complete
        if (USE_CUSTOM_EMAIL_PROVIDER) {
          // Generate custom token and send via Mailgun
          const token = await createAuthToken(
            email, 
            userCredential.user.uid, 
            'emailVerification'
          );
          await sendVerificationEmail(email, token);
        } else {
          // Use Firebase only
          await firebaseSendEmailVerification(
            userCredential.user, 
            getActionCodeSettings('emailVerification')
          );
        }
        
        return userCredential;
      } catch (dbError) {
        // If database operations fail, delete the auth user to avoid orphaned auth accounts
        console.error('Database operation failed during signup:', dbError);
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Failed to clean up auth user after database error:', deleteError);
        }
        throw dbError;
      }
    } catch (authError) {
      console.error('Auth creation failed during signup:', authError);
      throw authError;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Log successful login
      await createAuditLog({
        userId: result.user.uid,
        userEmail: email,
        action: 'user_login',
        entity: 'user',
        entityId: result.user.uid
      });
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        // Log logout event before signing out
        await createAuditLog({
          userId: currentUser.uid,
          userEmail: currentUser.email || undefined,
          action: 'user_logout',
          entity: 'user',
          entityId: currentUser.uid
        });
      }
      
      return signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    if (USE_CUSTOM_EMAIL_PROVIDER) {
      // Invalidate any existing verification tokens
      await invalidateUserTokens(currentUser.uid, 'emailVerification');
      
      // Generate a new token and send via Mailgun
      const token = await createAuthToken(
        currentUser.email!, 
        currentUser.uid, 
        'emailVerification'
      );
      
      await createAuditLog({
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        action: 'resend_verification_email',
        entity: 'user',
        entityId: currentUser.uid
      });
            return sendVerificationEmail(currentUser.email!, token);
    } else {
      // Use Firebase
      return firebaseSendEmailVerification(
        currentUser, 
        getActionCodeSettings('emailVerification')
      );
    }
  };

  const resetPassword = async (email: string) => {
    // Get user ID from email (needed for token generation)
    try {
      if (USE_CUSTOM_EMAIL_PROVIDER) {
        // Find the user with this email to get their ID
        const usersSnapshot = await getUser(email);
        if (!usersSnapshot) {
          // We don't want to reveal if an email exists or not for security reasons
          // Just log and return as if successful
          console.log('Password reset requested for non-existent email:', email);
          return;
        }
        
        // Invalidate any existing reset tokens
        await invalidateUserTokens(usersSnapshot.id, 'passwordReset');
        
        // Generate new token and send
        const token = await createAuthToken(
          email, 
          usersSnapshot.id, 
          'passwordReset'
        );
        
        // Log password reset request
        await createAuditLog({
          userId: usersSnapshot.id,
          userEmail: email,
          action: 'password_reset_request',
          entity: 'user',
          entityId: usersSnapshot.id
        });
        
        // Send through Mailgun
        await sendPasswordResetEmail(email, token);
      } else {
        // Use Firebase only
        await firebaseSendPasswordResetEmail(auth, email, {
          url: 'https://bilo.fi/auth/action'
        });
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw new Error('Salasanan nollausviestin lähettäminen epäonnistui.');
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('No user logged in');
    }
    
    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      
      // Invalidate existing password reset tokens after successful change
      await invalidateUserTokens(currentUser.uid, 'passwordReset');
      
      // Update database if needed
      await updateUser(currentUser.uid, { passwordLastChanged: new Date() });
      
      // Log password change
      await createAuditLog({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'password_changed',
        entity: 'user',
        entityId: currentUser.uid
      });
      
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const verifyEmail = async (actionCode: string) => {
    try {
      // For now, we'll continue to use Firebase's verification
      // But in the future this will be replaced with our custom verification
      await firebaseApplyActionCode(auth, actionCode);
      
      // Update user in database
      if (currentUser) {
        await updateUser(currentUser.uid, { emailVerified: true });
        
        // Log email verification
        await createAuditLog({
          userId: currentUser.uid,
          userEmail: currentUser.email || undefined,
          action: 'email_verified',
          entity: 'user',
          entityId: currentUser.uid
        });
        
        // Refresh the current user
        await currentUser.reload();
        setEmailVerified(currentUser.emailVerified);
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setEmailVerified(user?.emailVerified || false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    emailVerified,
    signup,
    login,
    logout,
    resendVerificationEmail,
    resetPassword,
    updateUserPassword,
    verifyEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
