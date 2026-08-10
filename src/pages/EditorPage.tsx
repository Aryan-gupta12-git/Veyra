import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createArticle, updateArticle, fetchArticleByIdOrSlug, fetchTopics } from '../services/api';
import { Topic } from '../types/user';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import {
  ArrowLeft,
  Globe,
  Loader2,
  Eye,
  ChevronDown,
  Check,
  Tag,
  User as UserIcon,
} from 'lucide-react';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || 'Aryan Gupta');
  const [category, setCategory] = useState('Technology');
  const [topicId, setTopicId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(isEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin');
      return;
    }

    if (isEditing && id) {
      loadArticleData(id);
    }
  }, [id, isEditing, isAdmin, authLoading]);

  useEffect(() => {
    if (user?.name && !authorName) {
      setAuthorName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTopics = async () => {
    try {
      const data = await fetchTopics();
      setTopics(data);
      if (data.length > 0 && !topicId) {
        setTopicId(data[0].id);
        setCategory(data[0].name);
      }
    } catch (e) {}
  };

  const loadArticleData = async (articleId: string) => {
    try {
      setLoadingArticle(true);
      const article = await fetchArticleByIdOrSlug(articleId, true);
      setTitle(article.title);
      setExcerpt(article.excerpt || '');
      setAuthorName(article.authorName || article.author?.name || user?.name || 'Aryan Gupta');
      setCategory(article.category || 'Technology');
      if (article.topicId) setTopicId(article.topicId);
      setContent(article.content || '');
      setPublished(article.published);
    } catch (err: any) {
      console.error('Error loading article for editor:', err);
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please enter an article title and content.');
      return;
    }

    if (title.trim().length > 100) {
      alert(`Title is too long (${title.trim().length}/100 characters). Please keep headlines under 100 characters (~15 words).`);
      return;
    }

    if (excerpt.trim().length > 180) {
      alert(`Excerpt/Subtitle is too long (${excerpt.trim().length}/180 characters). Please keep summaries under 180 characters (~30 words).`);
      return;
    }

    try {
      setSaving(true);
      const selectedTopic = topics.find((t) => t.id === topicId);

      const input = {
        title,
        excerpt,
        authorName,
        category: selectedTopic ? selectedTopic.name : category,
        topicId: topicId || undefined,
        content,
        published: true,
      };

      if (isEditing && id) {
        await updateArticle(id, input);
      } else {
        await createArticle(input);
      }

      navigate('/admin');
    } catch (err: any) {
      console.error('Error saving article:', err);
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentTopicName = topics.find((t) => t.id === topicId)?.name || category || 'Select Topic';

  if (authLoading || loadingArticle) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      {/* Editor Fixed Full Width Header */}
      <header className="navbar-surface sticky top-0 z-50 border-b border-border/50 px-4 sm:px-10 py-3">
        <div className="w-full flex items-center justify-between">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-muted hover:text-ink transition-colors"
            title="Back to Workspace"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">
              {isEditing ? 'Edit Article' : 'New Article'}
            </span>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-9 sm:w-36 h-9 box-border border border-border/70 text-xs font-semibold text-ink bg-surface/80 hover:border-ink hover:bg-surface rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              title={showPreview ? 'Edit Mode' : 'Preview Article'}
            >
              <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted shrink-0" />
              <span className="hidden sm:inline leading-none">{showPreview ? 'Edit Mode' : 'Preview'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 sm:w-36 h-9 box-border border border-ink text-xs font-semibold bg-ink text-paper rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-paper shrink-0" />
              )}
              <span className="leading-none">{published ? 'Update' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Focused Editor */}
      <main className="flex-1 max-w-[750px] mx-auto px-6 sm:px-8 py-12 w-full">
        {showPreview ? (
          /* Preview Mode */
          <div className="space-y-6 animate-fade-in">
            <div className="text-xs uppercase font-semibold text-muted tracking-wider pb-2 border-b border-border/40">
              Preview Mode
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal leading-tight text-ink">
              {title || 'Untitled Article'}
            </h1>
            <div className="text-xs font-medium text-muted">
              By {authorName || 'Aryan Gupta'}
            </div>
            {excerpt && (
              <p className="text-muted font-sans text-base italic leading-relaxed">
                {excerpt}
              </p>
            )}
            <div
              className="veyra-reader-content text-ink font-sans text-base sm:text-lg leading-[1.8] space-y-6 pt-4 border-t border-border/40"
              dangerouslySetInnerHTML={{ __html: content || '<p>No content written yet.</p>' }}
            />
          </div>
        ) : (
          /* Writing Mode */
          <div className="space-y-8 sm:space-y-10">
            {/* Topic & Author Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Custom Topic Dropdown */}
              <div className="relative inline-block" ref={dropdownRef}>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-sans font-semibold tracking-widest text-muted uppercase">
                    Topic:
                  </span>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/70 bg-surface/80 text-ink text-xs font-semibold hover:border-ink transition-all shadow-xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-muted" />
                    <span>{currentTopicName}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown Floating Menu */}
                {dropdownOpen && (
                  <div className="absolute left-14 top-full mt-2 z-50 w-56 p-1.5 rounded-xl border border-border/70 bg-surface shadow-md backdrop-blur-md max-h-60 overflow-y-auto space-y-0.5 animate-fade-in">
                    {topics.map((t) => {
                      const isSelected = topicId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTopicId(t.id);
                            setCategory(t.name);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-black/[0.06] dark:bg-white/[0.08] text-ink font-semibold'
                              : 'text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-ink'
                          }`}
                        >
                          <span>{t.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-ink" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Author Name Field */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-sans font-semibold tracking-widest text-muted uppercase">
                  Author:
                </span>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/70 bg-surface/80 text-ink text-xs font-semibold hover:border-ink focus-within:border-ink transition-all shadow-xs">
                  <UserIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Author name..."
                    className="bg-transparent border-none focus:outline-none text-ink text-xs font-semibold w-32 sm:w-40 placeholder:text-muted/40"
                  />
                </div>
              </div>
            </div>

            {/* Article Title Input */}
            <div>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article Title..."
                maxLength={100}
                rows={2}
                className="w-full font-serif text-3xl sm:text-4xl md:text-[42px] font-normal leading-snug text-ink bg-transparent border-b border-border/40 focus:border-ink focus:outline-none resize-none overflow-hidden pb-2 placeholder:text-muted/70 transition-colors"
              />
              <div className="text-[10px] font-sans text-muted/60 text-right pr-1 pt-1 mb-2">
                {title.length}/100 chars (max ~15 words)
              </div>
            </div>

            {/* Excerpt / Summary Input */}
            <div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary or subtitle..."
                maxLength={180}
                rows={2}
                className="w-full font-sans text-sm sm:text-base font-light text-ink bg-transparent border-b border-border/40 focus:border-ink focus:outline-none resize-none overflow-hidden pb-2 placeholder:text-muted/70 transition-colors"
              />
              <div className="text-[10px] font-sans text-muted/60 text-right pr-1 pt-1">
                {excerpt.length}/180 chars (max ~30 words)
              </div>
            </div>

            {/* Main Body Editor */}
            <div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste HTML article content here... (e.g. <h2>Title</h2><p>Paragraph...</p>)"
                rows={18}
                className="w-full font-sans text-base sm:text-lg leading-[1.85] text-ink bg-transparent border-none focus:outline-none resize-y placeholder:text-muted/60"
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EditorPage;
