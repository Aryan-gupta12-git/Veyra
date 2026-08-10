import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { ArrowRight, KeyRound, Mail, User as UserIcon } from 'lucide-react';

interface AuthPageProps {
  isSignUp?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isSignUp = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, login, signup, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect logged in users back to their feed/admin page
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    }
  }, [isAuthenticated, authLoading, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (isSignUp) {
        await signup(name, email, password);
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header hideSearch={true} hideUserMenu={true} />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-16 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-[420px] my-auto">
          <div className="text-center mb-8">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-ink block mb-2">
              Veyra
            </span>
            <h1 className="text-lg font-medium text-ink">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-xs text-muted font-light mt-1">
              {isSignUp
                ? 'Sign up to discover personalized articles.'
                : 'Log in to access your personalized article feed.'}
            </p>
          </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aryan Gupta"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border/60 rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-ink transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aryan@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border/60 rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-ink transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border/60 rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-ink transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-2.5 px-4 bg-ink text-paper text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Auth Mode Toggle */}
        <div className="text-center mt-6 text-xs text-muted">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <Link to="/login" className="text-ink font-medium underline">
                Log in
              </Link>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <Link to="/signup" className="text-ink font-medium underline">
                Create account
              </Link>
            </span>
          )}
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
