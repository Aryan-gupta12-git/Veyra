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
        dotLottieRef.current.setSpeed(1.8);
        dotLottieRef.current.play();
      } else {
        dotLottieRef.current.stop();
        if (typeof (dotLottieRef.current as any).setFrame === 'function') {
          (dotLottieRef.current as any).setFrame(0);
        }
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
        type="button"
        onClick={onToggleLike}
        disabled={disabled}
        className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 relative group font-medium ${
          hasLiked ? 'text-red-600 dark:text-red-500' : 'text-ink hover:text-ink'
        }`}
        title={hasLiked ? 'Unlike article' : 'Like article'}
      >
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0 overflow-visible">
          {hasLiked ? (
            <DotLottieReact
              dotLottieRefCallback={(dotLottie) => {
                dotLottieRef.current = dotLottie;
                if (dotLottie) {
                  dotLottie.setSpeed(1.8);
                  dotLottie.play();
                }
              }}
              src="https://lottie.host/c99f236d-0f5a-40d7-93d2-bbce7ec2dd5b/iTjk8mF118.lottie"
              autoplay={true}
              loop={false}
              speed={1.8}
              className="w-7 h-7 absolute -top-1 -left-1 pointer-events-none"
            />
          ) : (
            <Heart className="w-4.5 h-4.5 text-black dark:text-white stroke-[2.25] group-hover:scale-110 transition-all" />
          )}
        </div>
        <span className="text-[11px] tabular-nums select-none">{likeCount}</span>
      </button>
    </div>
  );
};

export default HeartLikeButton;
