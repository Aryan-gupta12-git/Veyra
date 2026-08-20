import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Article } from '../../types/article';
import { formatRelativeTime } from '../../utils/relativeTime';
import { useArticleStore } from '../../store/useArticleStore';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const location = useLocation();
  const relativeTime = formatRelativeTime(article.createdAt);
  const authorDisplayName = article.authorName || article.author?.name || 'Aryan Gupta';

  const handlePrefetch = () => {
    const target = article.slug || article.id;
    if (target) {
      useArticleStore.getState().prefetchArticle(target);
    }
  };

  return (
    <article
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="group flex flex-col justify-between h-full min-h-[250px] border border-border/90 bg-surface/50 hover:bg-surface hover:border-ink hover:shadow-md hover:-translate-y-1 rounded-xl p-6 sm:p-7 transition-all duration-300 ease-out cursor-pointer"
    >
      <Link
        to={`/article/${article.slug || article.id}`}
        state={{ from: location.pathname + location.search }}
        onFocus={handlePrefetch}
        className="flex-1 flex flex-col justify-between focus:outline-none"
      >
        <div className="flex-1 flex flex-col">
          {/* Article Cover Image with Codrops Inner Parallax Scale Animation */}
          {article.coverImage && (
            <div className="inner-image-wrap w-full h-44 sm:h-48 mb-4 rounded-lg bg-black/5 dark:bg-white/5 border border-border/40 overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
              />
            </div>
          )}

          {/* Article Title */}
          <h2 className="font-serif text-lg sm:text-xl font-normal leading-snug text-ink mb-3 group-hover:text-ink/85 transition-colors line-clamp-2">
            {article.title}
          </h2>

          {/* Article Excerpt */}
          {article.excerpt && (
            <p className="text-muted font-sans text-xs sm:text-sm font-light leading-relaxed mb-6 line-clamp-2">
              {article.excerpt}
            </p>
          )}
        </div>

        {/* Card Footer Meta Bar */}
        <div className="pt-4 border-t border-border/60 text-[11px] font-sans text-muted flex items-center justify-between group-hover:border-border/80 transition-colors mt-auto shrink-0">
          <span className="font-medium text-ink/90 truncate max-w-[140px]">
            {authorDisplayName}
          </span>
          <span className="shrink-0">{relativeTime}</span>
        </div>
      </Link>
    </article>
  );
};

export default ArticleCard;
