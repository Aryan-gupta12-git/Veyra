import React from 'react';
import { useTheme, ThemeType } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const themes: { id: ThemeType; label: string }[] = [
    { id: 'paper', label: 'Paper' },
    { id: 'dark', label: 'Charcoal' },
    { id: 'studio', label: 'Studio' },
  ];

  const activeIndex = Math.max(
    0,
    themes.findIndex((t) => theme === t.id)
  );

  return (
    <div
      aria-label="Theme mode switcher"
      role="radiogroup"
      className={`relative grid grid-cols-3 p-1 h-9 sm:h-[38px] rounded-[12px] border border-border/70 bg-black/[0.03] dark:bg-white/[0.03] text-xs font-sans font-medium select-none items-center ${className}`}
    >
      {/* Elevated active indicator pill */}
      <div
        className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] bg-surface rounded-[8px] border border-border/70 shadow-xs transition-transform duration-200 ease-out pointer-events-none"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(t.id)}
            className={`relative h-full px-2 sm:px-3 flex items-center justify-center text-center rounded-[8px] text-[11px] sm:text-xs font-medium transition-colors duration-150 z-10 focus:outline-none whitespace-nowrap ${
              isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
