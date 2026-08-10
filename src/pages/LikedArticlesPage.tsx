import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Article } from '../types/article';
import { fetchUserLikedArticles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ArticleCard from '../components/article/ArticleCard';
import { ArrowLeft } from 'lucide-react';

export const LikedArticlesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
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
    loadLikedArticles();
  }, [user]);

  const loadLikedArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const likedData = await fetchUserLikedArticles();
      setArticles(likedData);
    } catch (err: any) {
      console.error('Error fetching user liked articles:', err);
      setError(err.message || 'Failed to load liked articles');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((art) => {
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
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        pageTitle="Liked Articles"
        hideThemeToggle={true}
      />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-6 sm:px-8 pt-6 sm:pt-8 pb-16 w-full flex flex-col">
        {/* Back Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Articles</span>
          </button>
        </div>

        {/* Uniform Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse py-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-border/20 rounded-xl p-6 space-y-4" />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center border border-border/50 rounded-xl p-8 bg-surface/50 max-w-lg mx-auto">
            <p className="text-muted text-sm mb-4">{error}</p>
            <button
              onClick={loadLikedArticles}
              className="px-4 py-2 text-xs font-medium bg-ink text-paper rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center max-w-lg mx-auto space-y-2">
            <p className="font-serif text-xl sm:text-2xl text-ink mb-2">No liked articles yet</p>
            <p className="text-muted text-sm font-light">
              Explore articles and click the heart icon to save your favorites to this collection.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-xs font-semibold bg-ink text-paper rounded-xl hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Explore Articles</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
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

export default LikedArticlesPage;
