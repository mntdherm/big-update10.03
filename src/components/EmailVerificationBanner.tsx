import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { currentUser, emailVerified, resendVerificationEmail } = useAuth();
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!currentUser || emailVerified) {
    return null;
  }

  const handleResend = async () => {
    try {
      setSending(true);
      setError('');
      await resendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error('Failed to resend verification:', err);
      setError('Viestin lähetys epäonnistui. Yritä uudelleen myöhemmin.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            Vahvista sähköpostiosoitteesi napsauttamalla sähköpostiisi lähetettyä linkkiä.
            {!sent && !sending && (
              <span className="ml-2">
                Etkö saanut viestiä?{' '}
                <button
                  onClick={handleResend}
                  className="font-medium underline text-blue-700 hover:text-blue-600"
                >
                  Lähetä uudelleen
                </button>
              </span>
            )}
            {sending && <span className="ml-2">Lähetetään...</span>}
            {sent && <span className="ml-2 text-green-600">Viesti lähetetty!</span>}
          </p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
