import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { api } from '../api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link: missing token.');
        return;
      }

      try {
        const data = await api('GET', `/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may be expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-green-500 text-5xl">✓</div>
            <p className="text-gray-600">{message}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-500 text-5xl">!</div>
            <p className="text-gray-600">{message}</p>
            <Link
              to="/"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
