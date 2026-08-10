import React, { useRef, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
  const dotLottieRef = useRef<any>(null);

  useEffect(() => {
    if (dotLottieRef.current) {
      if (hasLiked) {
        dotLottieRef.current.play();
      }
    }
  }, [hasLiked]);

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
        onClick={onToggleLike}
        disabled={disabled}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 relative group ${
          hasLiked ? 'text-red-600 dark:text-red-500 font-semibold' : 'text-muted hover:text-ink'
        }`}
        title={hasLiked ? 'Unlike article' : 'Like article'}
      >
        <div className="relative w-6 h-6 flex items-center justify-center pointer-events-none">
          {hasLiked ? (
            <DotLottieReact
              dotLottieRefCallback={(dotLottie) => {
                dotLottieRef.current = dotLottie;
              }}
              src="https://lottie.host/8040d7c7-0130-4e6f-a89e-5e4c41460d3d/M50Z47X0eK.json"
              autoplay={true}
              loop={false}
              className="w-8 h-8 absolute -inset-1"
            />
          ) : (
            <Heart
              className="w-4 h-4 text-muted group-hover:text-ink transition-all transform group-hover:scale-110"
            />
          )}
        </div>
        <span className="text-[11px] ml-0.5">{likeCount}</span>
      </button>
    </div>
  );
};

export default HeartLikeButton;
