import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KnowledgeItem } from '../types/knowledge';
import { fetchUserKnowledgeItems, deleteKnowledgeItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ArticleCardSkeleton from '../components/skeleton/ArticleCardSkeleton';
import { ArrowLeft, Brain, BookOpen, Trash2 } from 'lucide-react';

export const MemoryFeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, [user]);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserKnowledgeItems();
      setKnowledgeItems(data);
    } catch (err: any) {
      console.error('Error fetching knowledge items:', err);
      setError(err.message || 'Failed to load Memory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      setKnowledgeItems((prev) => prev.filter((i) => i.id !== itemId));
      await deleteKnowledgeItem(itemId);
    } catch (err: any) {
      console.error('Error deleting memory item:', err);
      alert(err.message || 'Failed to delete memory item');
      loadKnowledge();
    }
  };

  const filteredItems = knowledgeItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = item.article?.title || '';
    const category = item.article?.category || '';
    return (
      item.selectedText.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      category.toLowerCase().includes(q)
    );
  });

  const handleCardClick = (item: KnowledgeItem) => {
    if (!item.article) return;
    const targetSlug = item.article.slug || item.article.id;
    // Pass startOffset and text to locate exact highlight Range in ArticlePage
    navigate(`/article/${encodeURIComponent(targetSlug)}?highlightId=${encodeURIComponent(item.id)}&startOffset=${item.startOffset}`);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        pageTitle="Memory"
        hideThemeToggle={true}
      />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-6 sm:px-8 pt-6 sm:pt-8 pb-16 w-full flex flex-col">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Articles</span>
          </button>
        </div>

        {/* Knowledge Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-6 items-stretch">
            <ArticleCardSkeleton count={8} />
          </div>
        ) : error ? (
          <div className="py-12 text-center border border-border/50 rounded-xl p-8 bg-surface/50 max-w-lg mx-auto">
            <p className="text-muted text-sm mb-4">{error}</p>
            <button
              onClick={loadKnowledge}
              className="px-4 py-2 text-xs font-medium bg-ink text-paper rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center max-w-lg mx-auto space-y-3">
            <p className="font-serif text-xl sm:text-2xl text-ink">No saved memories yet</p>
            <p className="text-muted text-sm font-light leading-relaxed">
              Select text inside any article and click the brain icon to save quotes to your personal Memory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch animate-fade-in">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group flex flex-col justify-between h-[250px] sm:h-[260px] border border-border/90 bg-surface/50 hover:bg-surface hover:border-ink hover:shadow-md hover:-translate-y-1 rounded-xl p-6 sm:p-7 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden"
              >
                {/* Highlighted Quote Text & Delete Button */}
                <div className="flex items-start justify-between gap-3 mb-4 overflow-hidden">
                  <p className="font-serif text-base sm:text-lg font-normal text-ink leading-snug tracking-tight italic group-hover:text-ink/85 transition-colors line-clamp-4 flex-1">
                    “{item.selectedText}”
                  </p>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMemory(e, item.id)}
                    className="text-ink/40 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Article Info */}
                <div className="pt-4 border-t border-border/60 text-[11px] font-sans text-muted group-hover:border-border/80 transition-colors mt-auto shrink-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink group-hover:underline truncate">
                    <BookOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">{item.article?.title || 'Original Article'}</span>
                  </div>

                  {item.article?.category && (
                    <span className="inline-block text-[10px] font-sans font-semibold tracking-wider text-muted uppercase">
                      {item.article.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MemoryFeedPage;
