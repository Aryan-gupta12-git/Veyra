import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'paper' | 'dark' | 'studio';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('veyra_theme');
        if (saved === 'dark' || saved === 'paper' || saved === 'studio') return saved as ThemeType;
        if (saved === 'white') return 'studio';
      } catch (e) {
        console.error('Error reading theme from localStorage:', e);
      }
    }
    return 'paper';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-paper', 'theme-studio', 'theme-white');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'studio') {
      root.classList.add('theme-studio');
    } else {
      root.classList.add('theme-paper');
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('veyra_theme', theme);
      } catch (e) {}
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
