import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Search, X, ShieldCheck, User as UserIcon, Heart, ChevronDown } from 'lucide-react';

interface HeaderProps {
  progress?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  authorName?: string;
  pageTitle?: string;
  hideThemeToggle?: boolean;
  hideSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  progress = 0,
  searchQuery = '',
  onSearchChange,
  authorName,
  pageTitle,
  hideThemeToggle = false,
  hideSearch = false,
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState('');

  const { user, logout, isAdmin } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const currentSearchValue = onSearchChange ? searchQuery : internalQuery;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      const scrolled = currentScrollY > 10;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));

      // Hysteresis threshold: scroll past 100px and delta > 8px for butter-smooth hides
      if (currentScrollY > 100) {
        if (scrollDelta > 8) {
          setIsVisible(false);
          setProfileMenuOpen(false);
        } else if (scrollDelta < -8) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Click outside handler for Profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
      if (val.trim()) {
        navigate(`/?q=${encodeURIComponent(val)}`);
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    tapCount.current += 1;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setIsSearchOpen(true);

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      tapTimer.current = setTimeout(() => {
        const count = tapCount.current;
        tapCount.current = 0;
        if (count > 0 && count < 3) {
          navigate(isAdmin ? '/admin' : '/');
        }
      }, 300);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full navbar-surface border-b transform-gpu will-change-transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled ? 'border-border/80 shadow-xs' : 'border-border/40'
      }`}
    >
      {/* Responsive Header: Grid on desktop, Flex on Mobile */}
      <div className="w-full px-3 sm:px-10 h-16 flex sm:grid sm:grid-cols-3 items-center justify-between font-sans gap-2 sm:gap-0">
        {/* Left Column: Clean Brand */}
        <div className="flex items-center justify-start shrink-0 pr-3 sm:pr-0">
          <Link
            to={isAdmin ? '/admin' : '/'}
            onClick={handleLogoClick}
            className="flex items-center gap-2 group transition-opacity duration-150 hover:opacity-85 select-none cursor-pointer"
            title="Triple-tap to search articles"
          >
            <span className="font-serif text-xl sm:text-3xl font-normal tracking-tight text-ink">
              Veyra
            </span>
          </Link>
        </div>

        {/* Center Column: Page Title / Author Name / Theme Toggle */}
        <div
          className={`justify-center items-center shrink-0 transition-opacity duration-200 px-1 sm:px-0 ${
            isSearchOpen ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {authorName ? (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-sans font-semibold tracking-widest text-muted uppercase">
                Written by
              </span>
              <span className="font-serif text-sm sm:text-base font-normal text-ink truncate max-w-[160px] sm:max-w-[280px]">
                {authorName}
              </span>
            </div>
          ) : pageTitle ? (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs sm:text-sm font-sans font-semibold tracking-widest text-ink uppercase">
                {pageTitle}
              </span>
            </div>
          ) : !hideThemeToggle ? (
            <ThemeToggle className="w-[165px] sm:w-56 md:w-60" />
          ) : null}
        </div>

        {/* Right Column: Search & Profile */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
          {/* Smooth Expanding Search Bar (Hidden when hideSearch is true or on mobile when closed) */}
          {!hideSearch && (
            <div className={`relative flex items-center ${!isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
              <div
                className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out bg-surface/80 border shadow-xs rounded-xl ${
                  isSearchOpen
                    ? 'w-48 sm:w-72 px-3 py-1.5 border-border/80 focus-within:border-ink'
                    : 'px-3 py-1.5 justify-center cursor-pointer border-border/70 hover:border-ink hover:bg-surface'
                }`}
                onClick={() => {
                  if (!isSearchOpen) setIsSearchOpen(true);
                }}
              >
                <button
                  type="button"
                  className="p-0.5 text-muted hover:text-ink transition-colors shrink-0"
                  title="Search articles"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted" />
                </button>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={currentSearchValue}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search articles..."
                  className={`w-full bg-transparent text-xs sm:text-sm text-ink placeholder:text-muted/50 font-sans focus:outline-none transition-all duration-300 pl-2 ${
                    isSearchOpen
                      ? 'opacity-100 pointer-events-auto'
                      : 'w-0 opacity-0 pointer-events-none hidden'
                  }`}
                />

                {isSearchOpen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQueryChange('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 text-muted hover:text-ink transition-colors shrink-0 ml-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    title="Close search"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {user ? (
            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl border border-border/70 bg-surface/80 hover:border-ink transition-all shadow-xs cursor-pointer group"
                title="Account Menu"
              >
                {/* Mobile View */}
                <span className="sm:hidden text-xs font-semibold text-ink uppercase">
                  {isAdmin ? 'Admin' : (user.name ? user.name.trim().charAt(0).toUpperCase() : 'U')}
                </span>

                {/* Desktop View */}
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-ink truncate max-w-[140px] sm:max-w-[180px]">
                  {isAdmin ? 'Admin' : user.name}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0 ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Account Floating Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-56 p-1.5 rounded-xl border border-border/80 bg-surface shadow-lg backdrop-blur-md space-y-0.5 animate-fade-in">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-xs font-semibold text-ink truncate">
                      {isAdmin ? 'Admin' : user.name}
                    </p>
                    <p className="text-[10px] text-muted truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-ink shrink-0" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-muted shrink-0" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/liked"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Liked Articles</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer group"
                    >
                      <LogOut className="w-4 h-4 text-muted group-hover:text-red-700 dark:group-hover:text-red-400 shrink-0 transition-colors" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-ink hover:text-muted transition-colors"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reading Progress Bar */}
      {progress > 0 && (
        <div className="w-full h-[2px] bg-black/[0.05] dark:bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-ink/60 transition-all duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </header>
  );
};

export default Header;
