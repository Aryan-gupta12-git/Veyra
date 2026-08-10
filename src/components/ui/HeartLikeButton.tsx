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
    if (dotLottieRef.current && hasLiked) {
      dotLottieRef.current.play();
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
        type="button"
        onClick={onToggleLike}
        disabled={disabled}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 relative group ${
          hasLiked ? 'text-red-600 dark:text-red-500 font-semibold' : 'text-muted hover:text-ink'
        }`}
        title={hasLiked ? 'Unlike article' : 'Like article'}
      >
        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
          {hasLiked ? (
            <DotLottieReact
              dotLottieRefCallback={(dotLottie) => {
                dotLottieRef.current = dotLottie;
              }}
              src="https://lottie.host/c99f236d-0f5a-40d7-93d2-bbce7ec2dd5b/iTjk8mF118.lottie"
              autoplay={true}
              loop={false}
              className="w-10 h-10 absolute -top-2 -left-2 pointer-events-none"
            />
          ) : (
            <Heart
              className="w-4 h-4 text-muted group-hover:text-ink transition-all transform group-hover:scale-110"
            />
          )}
        </div>
        <span className="text-[11px] select-none ml-1">{likeCount}</span>
      </button>
    </div>
  );
};

export default HeartLikeButton;
