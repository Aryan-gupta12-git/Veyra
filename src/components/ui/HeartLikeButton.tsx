import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface HeartLikeButtonProps {
  hasLiked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  disabled?: boolean;
  isAdmin?: boolean;
}

export const HeartLikeButton: React.FC<HeartLikeButtonProps> = ({
  hasLiked,
  likeCount,
  onToggleLike,
  disabled = false,
  isAdmin = false,
}) => {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; rot: number; size: number; delay: number }[]
  >([]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasLiked) {
      // Generate 9 radial spring bursting heart particles
      const count = 9;
      const newParticles = Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const distance = 35 + Math.random() * 30;
        return {
          id: Date.now() + i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 30,
          rot: (Math.random() - 0.5) * 60,
          size: Math.random() > 0.4 ? 14 : 10,
          delay: i * 25,
        };
      });
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1200);
    }

    onToggleLike();
  };

  if (isAdmin) {
    return (
      <div
        className="flex items-center gap-1.5 text-muted cursor-default"
        title="Article like count"
      >
        <Heart className="w-4 h-4 text-muted" />
        <span className="text-[11px]">{likeCount}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleLikeClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 relative group ${
          hasLiked ? 'text-red-600 dark:text-red-500 font-semibold' : 'text-muted hover:text-ink'
        }`}
        title={hasLiked ? 'Unlike article' : 'Like article'}
      >
        <Heart
          className={`w-4.5 h-4.5 transition-all duration-300 ${
            hasLiked
              ? 'fill-red-600 text-red-600 dark:fill-red-500 dark:text-red-500 scale-110 animate-heart-pulse drop-shadow-xs'
              : 'text-muted group-hover:text-ink scale-100 group-hover:scale-110'
          }`}
        />
        <span className="text-[11px] select-none">{likeCount}</span>
      </button>

      {/* Floating Pop-out Bursting Heart Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 left-0 pointer-events-none z-50 animate-heart-pop"
          style={
            {
              '--pop-x': `${p.x}px`,
              '--pop-y': `${p.y}px`,
              '--pop-r': `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          <Heart
            className="fill-red-500 text-red-500 dark:fill-red-500 dark:text-red-500 filter drop-shadow-xs"
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
          />
        </span>
      ))}
    </div>
  );
};

export default HeartLikeButton;
