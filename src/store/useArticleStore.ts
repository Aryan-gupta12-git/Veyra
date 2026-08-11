import { create } from 'zustand';
import { Article } from '../types/article';
import { fetchArticleByIdOrSlug, fetchPublicArticles } from '../services/api';

interface ArticleState {
  articlesCache: Map<string, Article>;
  authorArticlesCache: Map<string, Article[]>;
  pendingFetches: Set<string>;

  // Actions
  getArticleFromCache: (idOrSlug: string) => Article | null;
  setCachedArticles: (articles: Article[]) => void;
  fetchArticle: (idOrSlug: string, skipView?: boolean) => Promise<Article>;
  prefetchArticle: (idOrSlug: string) => Promise<void>;
  fetchAuthorArticles: (
    authorId?: string,
    authorName?: string,
    currentArticleId?: string
  ) => Promise<Article[]>;
  updateArticleLikeState: (articleId: string, likes: number, hasLiked: boolean) => void;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articlesCache: new Map<string, Article>(),
  authorArticlesCache: new Map<string, Article[]>(),
  pendingFetches: new Set<string>(),

  getArticleFromCache: (idOrSlug: string) => {
    const { articlesCache } = get();
    return articlesCache.get(idOrSlug) || null;
  },

  setCachedArticles: (articles: Article[]) => {
    set((state) => {
      const nextCache = new Map(state.articlesCache);
      articles.forEach((art) => {
        const existing = (art.id ? nextCache.get(art.id) : undefined) || (art.slug ? nextCache.get(art.slug) : undefined);
        const merged: Article = {
          ...existing,
          ...art,
          content: art.content || (existing ? existing.content : ''),
          hasLiked: art.hasLiked !== undefined ? art.hasLiked : (existing ? existing.hasLiked : undefined),
        };
        if (merged.id) nextCache.set(merged.id, merged);
        if (merged.slug) nextCache.set(merged.slug, merged);
      });
      return { articlesCache: nextCache };
    });
  },

  fetchArticle: async (idOrSlug: string, skipView = false) => {
    const { articlesCache, pendingFetches } = get();

    // 1. Check instant cache lookup
    const cached = articlesCache.get(idOrSlug);
    const hasFullContent = Boolean(cached && cached.content && cached.content.length > 0);
    const hasLikeStatus = Boolean(cached && cached.hasLiked !== undefined);

    if (hasFullContent && hasLikeStatus) {
      return cached!;
    }

    // 2. Prevent duplicate parallel in-flight fetches for same article
    if (pendingFetches.has(idOrSlug)) {
      // Wait for pending fetch to populate cache
      await new Promise((resolve) => setTimeout(resolve, 100));
      const retryCache = get().articlesCache.get(idOrSlug);
      if (retryCache && retryCache.content && retryCache.hasLiked !== undefined) return retryCache;
    }

    set((state) => {
      const nextPending = new Set(state.pendingFetches);
      nextPending.add(idOrSlug);
      return { pendingFetches: nextPending };
    });

    try {
      const article = await fetchArticleByIdOrSlug(idOrSlug, skipView);

      set((state) => {
        const nextCache = new Map(state.articlesCache);
        const existing = (article.id ? nextCache.get(article.id) : undefined) || (article.slug ? nextCache.get(article.slug) : undefined);
        const merged = { ...existing, ...article };

        if (merged.id) nextCache.set(merged.id, merged);
        if (merged.slug) nextCache.set(merged.slug, merged);

        const nextPending = new Set(state.pendingFetches);
        nextPending.delete(idOrSlug);

        return { articlesCache: nextCache, pendingFetches: nextPending };
      });

      return article;
    } catch (err) {
      set((state) => {
        const nextPending = new Set(state.pendingFetches);
        nextPending.delete(idOrSlug);
        return { pendingFetches: nextPending };
      });
      throw err;
    }
  },

  prefetchArticle: async (idOrSlug: string) => {
    if (!idOrSlug) return;
    const { articlesCache, pendingFetches } = get();

    // If already fully cached or currently fetching, skip
    const cached = articlesCache.get(idOrSlug);
    if ((cached && cached.content && cached.content.length > 0 && cached.hasLiked !== undefined) || pendingFetches.has(idOrSlug)) {
      return;
    }

    set((state) => {
      const nextPending = new Set(state.pendingFetches);
      nextPending.add(idOrSlug);
      return { pendingFetches: nextPending };
    });

    try {
      const article = await fetchArticleByIdOrSlug(idOrSlug, true); // skip view count increment on prefetch

      set((state) => {
        const nextCache = new Map(state.articlesCache);
        const existing = (article.id ? nextCache.get(article.id) : undefined) || (article.slug ? nextCache.get(article.slug) : undefined);
        const merged = { ...existing, ...article };

        if (merged.id) nextCache.set(merged.id, merged);
        if (merged.slug) nextCache.set(merged.slug, merged);

        const nextPending = new Set(state.pendingFetches);
        nextPending.delete(idOrSlug);

        return { articlesCache: nextCache, pendingFetches: nextPending };
      });
    } catch (err) {
      // Silent fail on prefetch background errors
      set((state) => {
        const nextPending = new Set(state.pendingFetches);
        nextPending.delete(idOrSlug);
        return { pendingFetches: nextPending };
      });
    }
  },

  fetchAuthorArticles: async (
    authorId?: string,
    authorName?: string,
    currentArticleId?: string
  ) => {
    const key = `${authorId || ''}_${authorName || ''}_${currentArticleId || ''}`;
    const { authorArticlesCache } = get();

    if (authorArticlesCache.has(key)) {
      return authorArticlesCache.get(key)!;
    }

    try {
      const results = await fetchPublicArticles({
        authorId,
        authorName,
        excludeId: currentArticleId,
        limit: 3,
      });

      set((state) => {
        const nextAuthorCache = new Map(state.authorArticlesCache);
        nextAuthorCache.set(key, results);
        return { authorArticlesCache: nextAuthorCache };
      });

      return results;
    } catch (err) {
      console.warn('Failed to fetch author articles:', err);
      return [];
    }
  },

  updateArticleLikeState: (articleId: string, likes: number, hasLiked: boolean) => {
    set((state) => {
      const nextCache = new Map(state.articlesCache);
      const art = nextCache.get(articleId);
      if (art) {
        const updated = { ...art, likes, hasLiked };
        if (art.id) nextCache.set(art.id, updated);
        if (art.slug) nextCache.set(art.slug, updated);
      }
      return { articlesCache: nextCache };
    });
  },
}));
