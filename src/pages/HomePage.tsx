import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Article } from '../types/article';
import { Topic } from '../types/user';
import { fetchPublicArticles, fetchTopics, getHasCachedArticles, getCachedArticles, getCachedTopics } from '../services/api';
import { useArticleStore } from '../store/useArticleStore';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ArticleCard from '../components/article/ArticleCard';
import ArticleCardSkeleton from '../components/skeleton/ArticleCardSkeleton';
import { Tag, ChevronDown, Check } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>(() => getCachedArticles() || []);
  const [topics, setTopics] = useState<Topic[]>(() => getCachedTopics() || []);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(() => !getHasCachedArticles());
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [user]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const hasCached = getHasCachedArticles();
      if (!hasCached) {
        setLoading(true);
      }
      setError(null);
      const [articlesData, topicsData] = await Promise.all([
        fetchPublicArticles('all', user?.id),
        fetchTopics(),
      ]);
      setArticles(articlesData);
      setTopics(topicsData);
      useArticleStore.getState().setCachedArticles(articlesData);
    } catch (err: any) {
      console.error('Error loading homepage data:', err);
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId || t.slug === selectedTopicId);
  const selectedTopicName = selectedTopic ? selectedTopic.name : selectedTopicId === 'all' ? 'All Topics' : selectedTopicId;

  const filteredArticles = articles.filter((art) => {
    // Topic filter
    if (selectedTopicId !== 'all') {
      const matchId = art.topicId === selectedTopicId || art.topic?.id === selectedTopicId;
      const matchName = art.category?.toLowerCase() === selectedTopicName.toLowerCase() || art.topic?.name?.toLowerCase() === selectedTopicName.toLowerCase();
      if (!matchId && !matchName) return false;
    }

    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const authorDisplayName = art.authorName || art.author?.name || 'Aryan Gupta';

    return (
      art.title.toLowerCase().includes(q) ||
      (art.excerpt && art.excerpt.toLowerCase().includes(q)) ||
      (art.category && art.category.toLowerCase().includes(q)) ||
      authorDisplayName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-16 w-full flex flex-col">
        {/* Enriched Topic Dropdown Menu */}
        <div className="mb-8 flex items-center justify-between">
          <div className="relative inline-block" ref={dropdownRef}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-sans font-semibold tracking-widest text-muted uppercase">
                Topic:
              </span>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/80 bg-surface/90 text-ink text-xs sm:text-sm font-semibold hover:border-ink focus:outline-none transition-all shadow-xs cursor-pointer"
              >
                <Tag className="w-4 h-4 text-muted shrink-0" />
                <span>{selectedTopicName}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Dropdown Floating Menu */}
            {dropdownOpen && (
              <div
                data-lenis-prevent
                className="absolute left-12 sm:left-14 top-full mt-2 z-50 w-64 sm:w-72 p-2 rounded-xl border border-border/80 bg-surface shadow-lg backdrop-blur-md max-h-72 overflow-y-auto overscroll-contain space-y-1 animate-fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicId('all');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                    selectedTopicId === 'all'
                      ? 'bg-black/[0.06] dark:bg-white/[0.08] text-ink font-semibold'
                      : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-ink'
                  }`}
                >
                  <span>All Topics</span>
                  {selectedTopicId === 'all' && <Check className="w-4 h-4 text-ink" />}
                </button>

                {topics.map((t) => {
                  const isSelected = selectedTopicId === t.id || selectedTopicId === t.slug;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-black/[0.06] dark:bg-white/[0.08] text-ink font-semibold'
                          : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-ink'
                      }`}
                    >
                      <span>{t.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-ink" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Uniform Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-6 items-stretch">
            <ArticleCardSkeleton count={8} />
          </div>
        ) : error ? (
          <div className="py-12 text-center border border-border/50 rounded-xl p-8 bg-surface/50 max-w-lg mx-auto">
            <p className="text-muted text-sm mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 text-xs font-medium bg-ink text-paper rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center max-w-lg mx-auto">
            <p className="font-serif text-xl sm:text-2xl text-ink mb-2">No articles found</p>
            <p className="text-muted text-sm font-light">
              Try searching for a different title, topic, or author name.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch animate-fade-in">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
