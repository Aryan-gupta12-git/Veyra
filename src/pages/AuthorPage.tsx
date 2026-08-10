import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Article } from '../types/article';
import { fetchPublicArticles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ArticleCard from '../components/article/ArticleCard';
import { ArrowLeft } from 'lucide-react';

export const AuthorPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedAuthorName = name ? decodeURIComponent(name) : 'Aryan Gupta';
  const { user } = useAuth();

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
    loadAuthorArticles();
  }, [decodedAuthorName, user]);

  const loadAuthorArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const allArticles = await fetchPublicArticles('all', user?.id);

      // Filter articles matching authorName or author.name
      const authorFiltered = allArticles.filter((art) => {
        const artAuthor = art.authorName || art.author?.name || 'Aryan Gupta';
        return artAuthor.toLowerCase() === decodedAuthorName.toLowerCase();
      });

      setArticles(authorFiltered);
    } catch (err: any) {
      console.error('Error fetching author articles:', err);
      setError(err.message || 'Failed to load articles for author');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      (art.excerpt && art.excerpt.toLowerCase().includes(q)) ||
      (art.category && art.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        authorName={decodedAuthorName}
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
              onClick={loadAuthorArticles}
              className="px-4 py-2 text-xs font-medium bg-ink text-paper rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center max-w-lg mx-auto">
            <p className="font-serif text-xl sm:text-2xl text-ink mb-2">No articles found for {decodedAuthorName}</p>
            <p className="text-muted text-sm font-light">
              Check back later for new articles by this author.
            </p>
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

export default AuthorPage;
