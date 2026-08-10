import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { fetchUserLikedArticles } from '../services/api';
import { Mail, Calendar, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [likedCount, setLikedCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchUserLikedArticles()
        .then((arts) => setLikedCount(arts.length))
        .catch(() => setLikedCount(0));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-paper text-ink font-sans flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto px-6">
          <p className="font-serif text-xl sm:text-2xl text-ink mb-2">Access Restricted</p>
          <p className="text-muted text-sm font-light mb-6">Please log in to view your profile details.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-ink text-paper rounded-xl hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[900px] mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-16 w-full flex flex-col justify-between">
        <div className="space-y-8">
          {/* Back Link */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Articles</span>
            </Link>
          </div>

          {/* Profile Editorial Card */}
          <div className="border border-border/80 bg-surface/80 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
            {/* Header / Name Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
              <div>
                <h1 className="font-serif text-lg sm:text-xl font-normal text-ink leading-tight">
                  {user.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {user.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-border/70 bg-surface/80 text-[10px] font-sans font-semibold uppercase tracking-wider text-ink shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-border/70 bg-surface/80 text-[10px] font-sans font-semibold uppercase tracking-wider text-ink shadow-xs">
                    <span>Reader</span>
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/60 bg-surface/50 space-y-1">
                <div className="flex items-center gap-2 text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-ink truncate">{user.email}</p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-surface/50 space-y-1">
                <div className="flex items-center gap-2 text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Member Since</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-ink">{createdDate}</p>
              </div>

              <Link
                to="/liked"
                className="p-4 rounded-xl border border-border/60 bg-surface/50 hover:border-ink transition-colors space-y-1 group"
              >
                <div className="flex items-center gap-2 text-muted text-[11px] uppercase tracking-wider font-semibold group-hover:text-ink transition-colors">
                  <span>Liked Articles</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-ink">
                  {likedCount} {likedCount === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            </div>

            {/* Sign Out Action Bar */}
            <div className="pt-6 border-t border-border/60 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none p-0"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
