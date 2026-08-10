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
import { ArrowLeft, Share2, Check, Heart, Edit3 } from 'lucide-react';

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
  const [heartParticles, setHeartParticles] = useState<{ id: number; x: number; y: number; rot: number; size: number; delay: number }[]>([]);

  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (id && loadedIdRef.current !== id) {
      loadedIdRef.current = id;
      loadArticle(id);
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadArticle = async (articleId: string) => {
    try {
      window.scrollTo(0, 0);
      setLoading(true);
      setError(null);
      const data = await fetchArticleByIdOrSlug(articleId);
      setArticle(data);
      setHasLiked(Boolean(data.hasLiked));
      setLikeCount(data.likes || 0);
      setLoading(false);

      // Fetch other articles by the same author in background asynchronously
      const authorName = data.authorName || data.author?.name || 'Aryan Gupta';
      fetchPublicArticles('all')
        .then((allArticles) => {
          const filtered = allArticles.filter((a) => {
            const aAuthor = a.authorName || a.author?.name || 'Aryan Gupta';
            return aAuthor.toLowerCase() === authorName.toLowerCase() && a.id !== data.id && a.slug !== data.slug;
          });
          setAuthorArticles(filtered.slice(0, 3));
        })
        .catch(() => {});
    } catch (err: any) {
      console.error('Error fetching article:', err);
      setError(err.message || 'Failed to load article');
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!article) return;
    if (!user) {
      alert('Please log in to like this article.');
      return;
    }

    try {
      setLiking(true);
      const res = await toggleLikeArticle(article.id);
      setHasLiked(res.liked);
      setLikeCount(res.likes);
      setArticle((prev) => (prev ? { ...prev, likes: res.likes, hasLiked: res.liked } : null));

      if (res.liked) {
        const count = 9;
        const particles = Array.from({ length: count }).map((_, i) => {
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
        setHeartParticles(particles);
        setTimeout(() => setHeartParticles([]), 1200);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      alert(err.message || 'Failed to toggle like');
    } finally {
      setLiking(false);
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
          <article className="max-w-[700px] mx-auto px-6 sm:px-8 pt-10 sm:pt-14 pb-16 animate-fade-in">
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
              <h1 className="font-serif text-3xl sm:text-4xl md:text-[44px] font-normal leading-[1.35] sm:leading-[1.35] tracking-tight text-ink mb-8">
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
                  {/* Like Count / Button with Floating Heart Burst */}
                  {isAdmin ? (
                    <div
                      className="flex items-center gap-1.5 text-muted cursor-default"
                      title="Article like count"
                    >
                      <Heart className="w-4 h-4 text-muted" />
                      <span className="text-[11px]">{likeCount}</span>
                    </div>
                  ) : (
                    <div className="relative inline-flex items-center">
                      <button
                        onClick={handleToggleLike}
                        disabled={liking}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 relative ${
                          hasLiked ? 'text-red-600 dark:text-red-500 font-semibold' : 'text-muted hover:text-ink'
                        }`}
                        title={hasLiked ? 'Unlike article' : 'Like article'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            hasLiked
                              ? 'fill-red-600 text-red-600 dark:fill-red-500 dark:text-red-500 scale-110 animate-heart-pulse drop-shadow-xs'
                              : 'scale-100'
                          }`}
                        />
                        <span className="text-[11px]">{likeCount}</span>
                      </button>

                      {/* Floating Pop-out Heart Particles (GPU Hardware-Accelerated) */}
                      {heartParticles.map((p) => (
                        <span
                          key={p.id}
                          className="absolute top-0 left-1 pointer-events-none z-50 animate-heart-pop"
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
                  )}

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
            </header>

            {/* Article Content */}
            {(() => {
              const hasHtmlTags = /<[a-z][\s\S]*>/i.test(article.content);
              if (hasHtmlTags) {
                return (
                  <div
                    className="veyra-reader-content prose dark:prose-invert max-w-none text-ink font-serif leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                );
              }
              const paragraphs = article.content.split(/\n\s*\n/);
              return (
                <div className="veyra-reader-content prose dark:prose-invert max-w-none text-ink font-serif leading-relaxed">
                  {paragraphs.map((pText, idx) => (
                    <p key={idx}>{pText.trim()}</p>
                  ))}
                </div>
              );
            })()}

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
