import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBcAsupGNfgh1JUg2VPJ31DUVK8KNDOVjo",
  authDomain: "bilo.fi",
  projectId: "b2c-car-4c084",
  storageBucket: "b2c-car-4c084.firebasestorage.app",
  messagingSenderId: "702189199418",
  appId: "1:702189199418:web:3d3773bf1d033b602cd503"
};

// Always set auth domain to bilo.fi for production
// This ensures auth flows work correctly with the custom domain
firebaseConfig.authDomain = "bilo.fi";

// Initialize Firebase with production configuration
const app = initializeApp(firebaseConfig);

// Initialize Auth, Firestore and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set default language to Finnish for all auth operations
auth.languageCode = 'fi';

// Get base URL for redirects - always use the production domain for auth actions
const getBaseUrl = () => {
  return 'https://bilo.fi/email-verified';
};

// Configure action code settings for email verification
export const getActionCodeSettings = (action: 'emailVerification' | 'passwordReset') => {
  const baseUrl = getBaseUrl();
  const settings = {
    url: baseUrl,
    handleCodeInApp: true
  };
  return settings;
};

// Initialize Storage
export const storage = getStorage(app);

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'service_categories',
  APPOINTMENTS: 'appointments',
  VENDORS: 'vendors',
  FEEDBACK: 'feedback',
  OFFERS: 'offers',
  SUPPORT_TICKETS: 'support_tickets',
  AUTH_TOKENS: 'auth_tokens',
  AUDIT_LOGS: 'audit_logs'
} as const;

// Create audit log for important system events
export const createAuditLog = async (data: {
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entity: 'user' | 'vendor' | 'appointment' | 'service' | 'payment' | 'system' | 'support';
  entityId?: string;
  details?: any;
}) => {
  try {
    const auditCollection = db.collection('audit_logs');
    await auditCollection.add({
      ...data,
      timestamp: new Date(),
      ipAddress: window.location.hostname,
      userAgent: navigator.userAgent
    });
    return true;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return false;
  }
};
