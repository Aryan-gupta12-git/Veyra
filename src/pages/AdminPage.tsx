import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Article } from '../types/article';
import { fetchAdminArticles, deleteArticle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { formatRelativeTime } from '../utils/relativeTime';
import { Plus, Edit3, Trash2, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        setError('Admin access required to view this section.');
        setLoading(false);
        return;
      }
      loadArticles();
    }
  }, [authLoading, isAdmin]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminArticles();
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setActionId(articleId);
      await deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-[1440px] mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-16 w-full flex flex-col">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-border/60">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink">
              Workspace
            </h1>
          </div>

          {isAdmin && (
            <Link
              to="/admin/editor/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-paper text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Article</span>
            </Link>
          )}
        </div>

        {/* Access Denied or Loading */}
        {authLoading || loading ? (
          <div className="py-20 text-center flex items-center justify-center gap-2 text-muted text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading articles...</span>
          </div>
        ) : error || !isAdmin ? (
          <div className="py-16 text-center border border-red-500/20 rounded-2xl p-8 bg-red-500/5 max-w-lg mx-auto space-y-4">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
            <h2 className="font-serif text-xl text-ink font-normal">Access Restricted</h2>
            <p className="text-muted text-xs leading-relaxed">
              {error || 'You must be logged in as an administrator to manage articles.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-ink text-paper rounded-xl hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Feed</span>
            </Link>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center max-w-lg mx-auto space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">No Articles Published Yet</h2>
            <p className="text-muted text-sm font-light">
              Get started by creating your first article essay using the button above.
            </p>
          </div>
        ) : (
          /* Admin Articles Table / List */
          <div className="space-y-3">
            {articles.map((article) => {
              const isProcessing = actionId === article.id;
              const relativeTime = formatRelativeTime(article.createdAt);

              return (
                <div
                  key={article.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border/70 bg-surface/70 hover:border-ink hover:bg-surface transition-all gap-4 shadow-xs"
                >
                  <Link
                    to={`/article/${article.slug || article.id}`}
                    className="space-y-1.5 flex-1 min-w-0 pr-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md border border-border/70 bg-surface/80 text-ink">
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                      {article.category && (
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                          · {article.category}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-normal text-ink group-hover:text-ink/80 transition-colors leading-snug truncate">
                      {article.title}
                    </h3>

                    <p className="text-xs text-muted font-light line-clamp-1">
                      {article.excerpt || 'No summary provided.'}
                    </p>

                    <div className="text-[11px] text-muted pt-1">
                      Published {relativeTime} by{' '}
                      <span className="font-medium text-ink">
                        {article.authorName || article.author?.name || 'Aryan Gupta'}
                      </span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={isProcessing}
                      className="p-2 text-muted hover:bg-ink hover:text-paper transition-all rounded-xl hover:opacity-90 disabled:opacity-50"
                      title="Delete Article"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
