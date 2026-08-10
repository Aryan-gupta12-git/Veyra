import React from 'react';

interface ArticleCardSkeletonProps {
  count?: number;
}

export const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col h-full bg-surface border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all"
        >
          {/* Top Category Badge Skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-20 rounded-full skeleton-shimmer" />
            <div className="h-3 w-12 rounded-md skeleton-shimmer" />
          </div>

          {/* Title Lines Skeleton */}
          <div className="space-y-2.5 mb-3">
            <div className="h-5 w-full rounded-md skeleton-shimmer" />
            <div className="h-5 w-4/5 rounded-md skeleton-shimmer" />
          </div>

          {/* Excerpt Lines Skeleton */}
          <div className="space-y-2 mb-6 flex-1">
            <div className="h-3.5 w-full rounded-md skeleton-shimmer opacity-80" />
            <div className="h-3.5 w-5/6 rounded-md skeleton-shimmer opacity-80" />
            <div className="h-3.5 w-3/4 rounded-md skeleton-shimmer opacity-80" />
          </div>

          {/* Footer Metadata & Author Avatar Skeleton */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
            </div>
            <div className="h-3.5 w-16 rounded-md skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ArticleCardSkeleton;
