import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Article } from '../types/article';
import { fetchArticleByIdOrSlug, fetchPublicArticles, toggleLikeArticle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/relativeTime';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ArticleCard from '../components/article/ArticleCard';
import ArticleSkeleton from '../components/skeleton/ArticleSkeleton';
import HeartLikeButton from '../components/ui/HeartLikeButton';
import ArticleHighlightManager from '../components/article/ArticleHighlightManager';
import { ArrowLeft, Share2, Check, Edit3, Heart } from 'lucide-react';

const ArticleContentBody = React.memo<{ content: string; contentRef: React.RefObject<HTMLDivElement | null> }>(
  ({ content, contentRef }) => {
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    if (hasHtmlTags) {
      return (
        <div
          ref={contentRef}
          className="veyra-reader-content prose dark:prose-invert max-w-none text-ink font-serif leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    const paragraphs = content.split(/\n\s*\n/);
    return (
      <div
        ref={contentRef}
        className="veyra-reader-content prose dark:prose-invert max-w-none text-ink font-serif leading-relaxed"
      >
        {paragraphs.map((pText, idx) => (
          <p key={idx}>{pText.trim()}</p>
        ))}
      </div>
    );
  }
);

export const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [authorArticles, setAuthorArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [heartParticles, setHeartParticles] = useState<{ id: number; x: number; y: number; rot: number; size: number; delay: number }[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to specific highlight when navigating from Memory Feed
  useEffect(() => {
    if (!article || loading) return;
    const searchParams = new URLSearchParams(window.location.search);
    const highlightId = searchParams.get('highlightId');

    if (highlightId) {
      const scrollTimer = setTimeout(() => {
        const mark = document.querySelector(`mark[data-highlight-id="${highlightId}"]`) || document.querySelector('mark.veyra-highlight');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(scrollTimer);
    }
  }, [article, loading]);

  const loadArticle = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchArticleByIdOrSlug(id);
      setArticle(data);
      setHasLiked(data.hasLiked || false);
      setLikeCount(data.likes || 0);

      // Fetch author articles
      if (data.authorId || data.authorName) {
        const allArticles = await fetchPublicArticles('all');
        const filtered = allArticles
          .filter((a) => a.id !== data.id && (a.authorId === data.authorId || a.authorName === data.authorName))
          .slice(0, 3);
        setAuthorArticles(filtered);
      }
    } catch (err: any) {
      console.error('Error loading article:', err);
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!article) return;
    if (!user) {
      alert('Please log in to like this article.');
      return;
    }

    // ⚡ INSTANT OPTIMISTIC UPDATE (0ms Latency like Instagram)
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    // Synchronously update local UI state immediately
    setHasLiked(nextLiked);
    setLikeCount(nextCount);
    setArticle((prev) => (prev ? { ...prev, likes: nextCount, hasLiked: nextLiked } : null));

    // Background HTTP Server Sync
    try {
      const res = await toggleLikeArticle(article.id);
      setHasLiked(res.liked);
      setLikeCount(res.likes);
      setArticle((prev) => (prev ? { ...prev, likes: res.likes, hasLiked: res.liked } : null));
    } catch (err: any) {
      console.error('Error toggling like:', err);
      // Rollback on network failure
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
      setArticle((prev) => (prev ? { ...prev, likes: prevCount, hasLiked: prevLiked } : null));
      alert(err.message || 'Failed to toggle like');
    }
  };

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const lastDoubleTapTriggeredRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);

  const handleDoubleTapToLike = async () => {
    if (!article) return;

    // Trigger Instagram-style screen-center big glowing heart burst
    setShowBigHeart(true);
    setTimeout(() => setShowBigHeart(false), 850);

    if (!user) {
      alert('Please log in to like this article.');
      return;
    }

    // If already liked, stay liked and play heart animation
    if (hasLiked) {
      return;
    }

    // Synchronously update local UI state immediately
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    const nextCount = prevCount + 1;

    setHasLiked(true);
    setLikeCount(nextCount);
    setArticle((prev) => (prev ? { ...prev, likes: nextCount, hasLiked: true } : null));

    // Background HTTP Server Sync
    try {
      const res = await toggleLikeArticle(article.id);
      setHasLiked(res.liked);
      setLikeCount(res.likes);
      setArticle((prev) => (prev ? { ...prev, likes: res.likes, hasLiked: res.liked } : null));
    } catch (err: any) {
      console.error('Error toggling like on double-tap:', err);
      // Rollback on network failure
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
      setArticle((prev) => (prev ? { ...prev, likes: prevCount, hasLiked: prevLiked } : null));
      alert(err.message || 'Failed to toggle like');
    }
  };

  const handleArticleTapOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Do not trigger double-tap like when tapping interactive controls
    if (target.closest('a, button, input, textarea, [role="button"]')) {
      return;
    }

    const now = Date.now();

    if ('touches' in e || (e.type && e.type.startsWith('touch'))) {
      lastTouchTimeRef.current = now;
    } else if (now - lastTouchTimeRef.current < 500) {
      // Ignore synthetic click event right after touch
      return;
    }

    const timeDiff = now - lastTapRef.current.time;

    let clientX = 0;
    let clientY = 0;

    if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const distX = Math.abs(clientX - lastTapRef.current.x);
    const distY = Math.abs(clientY - lastTapRef.current.y);

    if (timeDiff > 40 && timeDiff < 350 && distX < 60 && distY < 60) {
      if (now - lastDoubleTapTriggeredRef.current >= 400) {
        lastDoubleTapTriggeredRef.current = now;
        handleDoubleTapToLike();
      }
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTapRef.current = { time: now, x: clientX, y: clientY };
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const authorDisplayName = article ? article.authorName || article.author?.name || 'Aryan Gupta' : 'Aryan Gupta';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header progress={readingProgress} />

      {/* Instagram-Style Screen-Center Big Heart Popup */}
      {showBigHeart && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-insta-heart">
            <Heart className="w-28 h-28 sm:w-36 sm:h-36 text-red-500 fill-red-500 filter drop-shadow-2xl opacity-90" />
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        {loading ? (
          <ArticleSkeleton />
        ) : error || !article ? (
          <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
            <h1 className="font-serif text-2xl font-normal text-ink mb-3">Article Unavailable</h1>
            <p className="text-muted text-sm mb-6">{error || 'The requested article could not be found.'}</p>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-ink text-paper rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles</span>
            </button>
          </div>
        ) : (
          <article
            onClick={handleArticleTapOrClick}
            onTouchEnd={handleArticleTapOrClick}
            className="max-w-[700px] mx-auto px-6 sm:px-8 pt-10 sm:pt-14 pb-16 animate-fade-in"
          >
            {/* Back Button */}
            <div className="mb-10">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Back to Articles</span>
              </button>
            </div>

            {/* Article Header */}
            <header className="mb-10">
              {(article.topic?.name || article.category) && (
                <div className="text-[11px] font-sans font-semibold tracking-widest text-muted uppercase mb-5">
                  {article.topic?.name || article.category}
                </div>
              )}

              {/* Expressive Title */}
              <h1
                onDoubleClick={handleDoubleTapToLike}
                className="font-serif text-3xl sm:text-4xl md:text-[44px] font-normal leading-[1.35] sm:leading-[1.35] tracking-tight text-ink mb-8 select-none cursor-pointer transition-transform active:scale-[0.99]"
                title="Double-tap or double-click to like this article"
              >
                {article.title}
              </h1>

              {/* Author, Timestamp & Views */}
              <div className="flex items-center justify-between border-y border-border py-4 text-xs font-sans text-muted">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/author/${encodeURIComponent(authorDisplayName)}`}
                    className="font-semibold text-ink hover:underline cursor-pointer transition-colors"
                    title={`View all articles by ${authorDisplayName}`}
                  >
                    {authorDisplayName}
                  </Link>
                  <span>·</span>
                  <span>{formatRelativeTime(article.createdAt)}</span>
                  <span>·</span>
                  <span>{(article.views || 0).toLocaleString()} views</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Smooth Lottie Heart Like Button */}
                  <HeartLikeButton
                    hasLiked={hasLiked}
                    likeCount={likeCount}
                    onToggleLike={handleToggleLike}
                    disabled={liking}
                    isAdmin={isAdmin}
                  />

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-muted hover:text-ink transition-colors"
                    title="Share article link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-ink" />
                        <span className="text-[11px] text-ink font-medium">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Share</span>
                      </>
                    )}
                  </button>

                  {user && isAdmin && (
                    <Link
                      to={`/admin/editor/${article.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-border/70 bg-surface/80 text-ink text-xs font-semibold hover:border-ink transition-all shadow-xs"
                      title="Edit Article"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted" />
                      <span>Edit Article</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Hero Cover Image with Codrops Parallax Scale Animation */}
              {article.coverImage && (
                <div className="inner-image-wrap group mt-6 mb-2 w-full h-[260px] sm:h-[360px] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-border/50">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <ArticleContentBody content={article.content} contentRef={contentRef} />

            {/* Private Kindle-Style Personal Highlight Layer */}
            <ArticleHighlightManager articleId={article.id} contentRef={contentRef} />

            {/* "More Articles by Author" Section */}
            {authorArticles.length > 0 && (
              <section className="mt-16 pt-12 border-t border-border">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl font-normal text-ink">
                    More from{' '}
                    <Link
                      to={`/author/${encodeURIComponent(authorDisplayName)}`}
                      className="hover:underline text-ink"
                    >
                      {authorDisplayName}
                    </Link>
                  </h2>
                  <Link
                    to={`/author/${encodeURIComponent(authorDisplayName)}`}
                    className="text-xs font-medium text-muted hover:text-ink transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {authorArticles.map((relArt) => (
                    <ArticleCard key={relArt.id} article={relArt} />
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;
