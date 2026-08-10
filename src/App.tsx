import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SmoothScrollProvider from './components/layout/SmoothScrollProvider';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import AuthorPage from './pages/AuthorPage';
import OnboardingPage from './pages/OnboardingPage';
import AdminPage from './pages/AdminPage';
import EditorPage from './pages/EditorPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import LikedArticlesPage from './pages/LikedArticlesPage';
import MemoryFeedPage from './pages/MemoryFeedPage';
import { Loader2 } from 'lucide-react';

const scrollPositionsMap = new Map<string, number>();

// Smart Scroll Restoration helper component
function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isPopRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!isPopRef.current) {
        scrollPositionsMap.set(location.pathname, window.scrollY);
        if (location.key) {
          scrollPositionsMap.set(location.key, window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, location.key]);

  useEffect(() => {
    if (navigationType === 'POP') {
      isPopRef.current = true;
      const savedY = scrollPositionsMap.get(location.key) ?? scrollPositionsMap.get(location.pathname) ?? 0;

      const performScroll = () => {
        window.scrollTo(0, savedY);
      };

      performScroll();
      const t1 = setTimeout(performScroll, 30);
      const t2 = setTimeout(performScroll, 100);
      const t3 = setTimeout(() => {
        performScroll();
        isPopRef.current = false;
      }, 250);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      isPopRef.current = false;
      if (!location.search.includes('highlightId')) {
        window.scrollTo(0, 0);
      }
    }
  }, [location.pathname, location.key, location.search, navigationType]);

  return null;
}

// Route Guard for authenticated users
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin users are directed to publisher workspace, skipping reader onboarding
  if (isAdmin && window.location.pathname === '/onboarding') {
    return <Navigate to="/admin" replace />;
  }

  // If standard user hasn't completed onboarding, direct them to interest selection
  if (!isAdmin && user && !user.onboardingCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Route Guard for Admin Users
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppContent() {
  const { isAdmin } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<AuthPage isSignUp={false} />} />
      <Route path="/signup" element={<AuthPage isSignUp={true} />} />

      {/* Onboarding Route */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      {/* Main Authenticated Application Routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            {isAdmin ? <Navigate to="/admin" replace /> : <HomePage />}
          </RequireAuth>
        }
      />
      <Route
        path="/article/:id"
        element={
          <RequireAuth>
            <ArticlePage />
          </RequireAuth>
        }
      />
      <Route
        path="/author/:name"
        element={
          <RequireAuth>
            <AuthorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/memory-feed"
        element={
          <RequireAuth>
            <MemoryFeedPage />
          </RequireAuth>
        }
      />
      <Route
        path="/liked"
        element={
          <RequireAuth>
            <LikedArticlesPage />
          </RequireAuth>
        }
      />

      {/* Publisher Workspace Routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/editor/:id"
        element={
          <RequireAdmin>
            <EditorPage />
          </RequireAdmin>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/'} replace />} />
    </Routes>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SmoothScrollProvider>
          <AppContent />
        </SmoothScrollProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
