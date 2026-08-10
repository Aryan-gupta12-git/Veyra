import React from 'react';

export const ArticleSkeleton: React.FC = () => {
  return (
    <article className="max-w-[700px] mx-auto px-6 sm:px-8 pt-10 sm:pt-14 pb-16 animate-fade-in">
      {/* Back Button Skeleton */}
      <div className="mb-10">
        <div className="h-4 w-28 rounded-md skeleton-shimmer" />
      </div>

      {/* Article Header Skeleton */}
      <header className="mb-10">
        {/* Category Pill */}
        <div className="h-3.5 w-24 rounded-full skeleton-shimmer mb-5" />

        {/* Article Title Lines */}
        <div className="space-y-3 mb-6">
          <div className="h-9 sm:h-11 w-full rounded-xl skeleton-shimmer" />
          <div className="h-9 sm:h-11 w-3/4 rounded-xl skeleton-shimmer" />
        </div>

        {/* Author Metadata Bar */}
        <div className="flex items-center justify-between py-4 border-y border-border/40 my-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded-md skeleton-shimmer" />
              <div className="h-3 w-24 rounded-md skeleton-shimmer opacity-70" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </header>

      {/* Article Content Paragraph Skeletons */}
      <div className="space-y-6">
        <div className="space-y-2.5">
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-11/12 rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-4/5 rounded-md skeleton-shimmer opacity-90" />
        </div>

        <div className="h-8 w-1/2 rounded-lg skeleton-shimmer my-8" />

        <div className="space-y-2.5">
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-5/6 rounded-md skeleton-shimmer opacity-90" />
        </div>

        {/* Blockquote Skeleton */}
        <div className="pl-6 border-l-2 border-border/60 py-2 space-y-2 my-8">
          <div className="h-4 w-full rounded-md skeleton-shimmer italic opacity-80" />
          <div className="h-4 w-3/4 rounded-md skeleton-shimmer italic opacity-80" />
        </div>

        <div className="space-y-2.5">
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-full rounded-md skeleton-shimmer opacity-90" />
          <div className="h-4 w-2/3 rounded-md skeleton-shimmer opacity-90" />
        </div>
      </div>
    </article>
  );
};

export default ArticleSkeleton;
