import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, KeyRound, LogIn, Loader2, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      // Handle different error codes
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Virheellinen sähköposti tai salasana');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Liian monta epäonnistunutta yritystä. Yritä myöhemmin uudelleen.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Virheelliset tunnistetiedot. Tarkista sähköposti ja salasana.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Virheellinen sähköpostiosoite.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Tämä käyttäjätili on poistettu käytöstä.');
      } else {
        setError(err.message || 'Kirjautuminen epäonnistui');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Syötä sähköpostiosoitteesi');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/invalid-email') {
        setError('Virheellinen sähköpostiosoite.');
      } else if (err.code === 'auth/user-not-found') {
        // For security, don't reveal if an email exists or not
        // Just show success message anyway
        setResetSent(true);
      } else {
        setError('Salasanan nollaus epäonnistui. Tarkista sähköpostiosoitteesi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bilo-gray to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Tabs at top */}
        <div className="flex">
          <div className="flex-1 py-4 text-center bg-bilo-silver text-bilo-navy font-medium">
            Kirjaudu sisään
          </div>
          <Link
            to="/register"
            className="flex-1 py-4 text-center text-bilo-navy hover:text-bilo-navy/80 border-b transition-colors duration-300"
          >
            Rekisteröidy
          </Link>
        </div>

        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-bilo-gray mb-4">
              <User className="w-10 h-10 text-bilo-navy" />
            </div>
            <h2 className="text-2xl font-semibold text-bilo-navy">
              {isResetMode ? 'Palauta salasana' : 'Kirjaudu sisään'}
            </h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {isResetMode ? (
            resetSent ? (
              <div className="mt-8 space-y-6">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div>
                      <p className="text-sm text-green-700">
                        Salasanan nollauslinkki on lähetetty sähköpostiisi.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setIsResetMode(false);
                      setResetSent(false);
                    }}
                    className="next-step-button w-full flex justify-center py-3 px-4 rounded-xl
                      text-sm font-medium text-bilo-navy relative group
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                  >
                    Takaisin kirjautumiseen
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="reset-email" className="block text-sm font-medium text-bilo-navy mb-1">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Sähköposti
                      </span>
                    </label>
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="mt-1 block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                        focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                        transition-all duration-300 ease-in-out"
                      placeholder="Sähköposti"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => setIsResetMode(false)}
                  >
                    Takaisin kirjautumiseen
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="next-step-button w-full flex justify-center py-3 px-4 rounded-xl
                      text-sm font-medium text-bilo-navy relative group
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        <span>Lähetetään...</span>
                      </div>
                    ) : (
                      <span>Lähetä nollauslinkki</span>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="email-address" className="block text-sm font-medium text-bilo-navy mb-1">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Sähköposti
                    </span>
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                      focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                      transition-all duration-300 ease-in-out"
                    placeholder="Sähköposti"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-bilo-navy mb-1">
                    <span className="flex items-center">
                      <KeyRound className="w-4 h-4 mr-2" />
                      Salasana
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="mt-1 block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                        focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                        transition-all duration-300 ease-in-out"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Muista minut
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setResetEmail(email);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Unohditko salasanan?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="next-step-button w-full flex justify-center py-3 px-4 rounded-xl
                    text-sm font-medium text-bilo-navy relative group
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      <span>Kirjaudutaan...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                      Kirjaudu sisään
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
