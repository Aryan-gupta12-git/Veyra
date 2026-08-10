import { Article, CreateArticleInput, UpdateArticleInput } from '../types/article';
import { Topic, User } from '../types/user';

export const FALLBACK_TOPICS: Topic[] = [
  { id: 'top-1', name: 'Technology', slug: 'technology' },
  { id: 'top-2', name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
  { id: 'top-3', name: 'Software Development', slug: 'software-development' },
  { id: 'top-4', name: 'Startups', slug: 'startups' },
  { id: 'top-5', name: 'Business', slug: 'business' },
  { id: 'top-6', name: 'Finance', slug: 'finance' },
  { id: 'top-7', name: 'Productivity', slug: 'productivity' },
  { id: 'top-8', name: 'Psychology', slug: 'psychology' },
  { id: 'top-9', name: 'Science', slug: 'science' },
  { id: 'top-10', name: 'Health', slug: 'health' },
  { id: 'top-11', name: 'Fitness', slug: 'fitness' },
  { id: 'top-12', name: 'Design', slug: 'design' },
  { id: 'top-13', name: 'Books', slug: 'books' },
  { id: 'top-14', name: 'Career', slug: 'career' },
  { id: 'top-15', name: 'Education', slug: 'education' },
  { id: 'top-16', name: 'History', slug: 'history' },
  { id: 'top-17', name: 'Philosophy', slug: 'philosophy' },
  { id: 'top-18', name: 'Travel', slug: 'travel' },
  { id: 'top-19', name: 'Culture', slug: 'culture' },
  { id: 'top-20', name: 'Sports', slug: 'sports' },
];

const mockAuthor = {
  id: 'admin-1',
  name: 'Aryan Gupta',
  email: 'aryan@veyra.dev',
  role: 'ADMIN' as const,
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
};

const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Why We Struggle to Finish What We Start',
    slug: 'why-we-struggle-to-finish-what-we-start',
    excerpt: 'Small changes in how we approach difficult work can completely change our ability to stay consistent.',
    content: `<p>Starting something new is often exciting. Finishing it is where things become difficult.</p>
<p>In the initial phase of any project, enthusiasm masks friction. The novelty provides dopamine, momentum feels effortless, and the destination seems close. But as the work progresses, the immediate rewards fade, leaving only the quiet demand for deliberate effort.</p>
<h2>The Psychology of Friction</h2>
<p>Most people attribute incomplete projects to a lack of willpower or discipline. However, psychological research suggests that consistency is rarely about brute force. It is about managing friction points and lowering cognitive barrier to entry.</p>
<blockquote><p>"We do not rise to the level of our expectations; we fall to the level of our systems."</p></blockquote>
<p>When tasks feel monumental, the mind defaults to avoidance. By breaking down deep work into small, unassailable daily habits, the anxiety surrounding completion begins to evaporate.</p>`,
    category: 'Productivity',
    topicId: 'top-7',
    topic: { id: 'top-7', name: 'Productivity', slug: 'productivity' },
    tags: ['Productivity', 'Mindset'],
    readingTime: 4,
    views: 0,
    likes: 0,
    authorName: 'Aryan Gupta',
    published: true,
    authorId: 'admin-1',
    author: mockAuthor,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let articlesCache: Article[] | null = null;
let topicsCache: Topic[] | null = null;
let articlesCacheTimestamp = 0;
let topicsCacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

export function getHasCachedArticles(): boolean {
  return articlesCache !== null && articlesCache.length > 0;
}

export function getCachedArticles(): Article[] | null {
  return articlesCache;
}

export function getCachedTopics(): Topic[] | null {
  return topicsCache;
}

export function clearArticlesCache(): void {
  articlesCache = null;
  articlesCacheTimestamp = 0;
}

export async function fetchTopics(forceRefresh = false): Promise<Topic[]> {
  const now = Date.now();
  if (!forceRefresh && topicsCache && now - topicsCacheTimestamp < CACHE_TTL_MS) {
    return topicsCache;
  }

  try {
    const res = await fetch('/api/user/topics', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const result = data.topics || FALLBACK_TOPICS;
      topicsCache = result;
      topicsCacheTimestamp = now;
      return result;
    }
  } catch (err) {
    console.warn('Backend API unreachable, using fallback topics:', err);
  }

  return topicsCache || FALLBACK_TOPICS;
}

export async function saveUserInterests(topicIds: string[]): Promise<User> {
  const res = await fetch('/api/user/interests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ topicIds }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('SAVE INTERESTS FAILED', res.status, errText);
    let parsedErr: any = {};
    try { parsedErr = JSON.parse(errText); } catch (e) {}
    throw new Error(parsedErr.details || parsedErr.error || 'Failed to update interests');
  }

  // Clear cache to reflect interest changes in article feed
  clearArticlesCache();

  const data = await res.json();
  return data.user;
}

export async function fetchPublicArticles(topicSlug?: string, userId?: string, forceRefresh = false): Promise<Article[]> {
  const now = Date.now();

  if (!forceRefresh && articlesCache && now - articlesCacheTimestamp < CACHE_TTL_MS) {
    let filtered = [...articlesCache];
    if (topicSlug && topicSlug !== 'all' && topicSlug !== 'for-you') {
      const targetLower = topicSlug.toLowerCase();
      filtered = filtered.filter((a) => 
        a.topicId === topicSlug ||
        a.topic?.id === topicSlug ||
        (a.topic?.slug && a.topic.slug.toLowerCase() === targetLower) ||
        (a.topic?.name && a.topic.name.toLowerCase() === targetLower) ||
        (a.category && a.category.toLowerCase() === targetLower)
      );
    }
    return filtered;
  }

  try {
    const url = new URL('/api/articles', window.location.origin);
    if (topicSlug && topicSlug !== 'all' && topicSlug !== 'for-you') {
      url.searchParams.append('topic', topicSlug);
    }
    if (userId) url.searchParams.append('userId', userId);

    const res = await fetch(url.toString(), { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.articles) {
        // If fetching all, update cache with complete article list
        if (!topicSlug || topicSlug === 'all' || topicSlug === 'for-you') {
          articlesCache = data.articles;
          articlesCacheTimestamp = now;
        }
        return data.articles;
      }
    }
  } catch (err) {
    console.warn('Backend API unreachable, using fallback articles:', err);
  }

  if (articlesCache) {
    let filtered = [...articlesCache];
    if (topicSlug && topicSlug !== 'all' && topicSlug !== 'for-you') {
      const targetLower = topicSlug.toLowerCase();
      filtered = filtered.filter((a) => 
        a.topicId === topicSlug ||
        a.topic?.id === topicSlug ||
        (a.topic?.slug && a.topic.slug.toLowerCase() === targetLower) ||
        (a.topic?.name && a.topic.name.toLowerCase() === targetLower) ||
        (a.category && a.category.toLowerCase() === targetLower)
      );
    }
    return filtered;
  }

  let filtered = [...FALLBACK_ARTICLES];
  if (topicSlug && topicSlug !== 'all' && topicSlug !== 'for-you') {
    const targetLower = topicSlug.toLowerCase();
    filtered = filtered.filter((a) => 
      a.topicId === topicSlug ||
      a.topic?.id === topicSlug ||
      (a.topic?.slug && a.topic.slug.toLowerCase() === targetLower) ||
      (a.topic?.name && a.topic.name.toLowerCase() === targetLower) ||
      (a.category && a.category.toLowerCase() === targetLower)
    );
  }

  return filtered;
}

export async function fetchArticleByIdOrSlug(idOrSlug: string, skipView = false): Promise<Article> {
  try {
    const url = `/api/articles/${idOrSlug}${skipView ? '?skipView=true' : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.article) return data.article;
    }
  } catch (err) {
    console.warn('Backend API unreachable, using fallback article search:', err);
  }

  const found = FALLBACK_ARTICLES.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
  if (found) return found;

  throw new Error('Article not found');
}

export async function fetchAdminArticles(): Promise<Article[]> {
  try {
    const res = await fetch('/api/admin/articles', {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.articles) return data.articles;
    } else {
      const errText = await res.text();
      console.error('FETCH ADMIN ARTICLES FAILED', res.status, errText);
    }
  } catch (err) {
    console.warn('Backend API unreachable, returning fallback admin articles:', err);
  }

  return FALLBACK_ARTICLES;
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  console.log('CLIENT CREATING ARTICLE PAYLOAD:', input);
  try {
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (res.ok) {
      const data = await res.json();
      clearArticlesCache();
      return data.article;
    }

    const responseText = await res.text();
    console.error('CREATE ARTICLE FAILED', res.status, responseText);
    let parsedErr: any = {};
    try {
      parsedErr = JSON.parse(responseText);
    } catch (e) {}

    throw new Error(parsedErr.details || parsedErr.error || `Server responded with status ${res.status}`);
  } catch (err: any) {
    console.error('Error in createArticle API helper:', err);
    throw err;
  }
}

export async function updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
  console.log('CLIENT UPDATING ARTICLE PAYLOAD:', { id, input });
  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (res.ok) {
      const data = await res.json();
      clearArticlesCache();
      return data.article;
    }

    const responseText = await res.text();
    console.error('UPDATE ARTICLE FAILED', res.status, responseText);
    let parsedErr: any = {};
    try {
      parsedErr = JSON.parse(responseText);
    } catch (e) {}

    throw new Error(parsedErr.details || parsedErr.error || `Server responded with status ${res.status}`);
  } catch (err: any) {
    console.error('Error in updateArticle API helper:', err);
    throw err;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      clearArticlesCache();
      return true;
    }

    const responseText = await res.text();
    console.error('DELETE ARTICLE FAILED', res.status, responseText);
  } catch (err) {
    console.warn('Backend API unreachable, deleting mock article:', err);
  }

  const idx = FALLBACK_ARTICLES.findIndex((a) => a.id === id);
  if (idx !== -1) {
    FALLBACK_ARTICLES.splice(idx, 1);
    clearArticlesCache();
    return true;
  }

  return false;
}

export async function togglePublishArticle(id: string, published: boolean): Promise<Article> {
  return updateArticle(id, { published });
}

export async function toggleLikeArticle(idOrSlug: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`/api/articles/${idOrSlug}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any = {};
    try {
      parsedErr = JSON.parse(errText);
    } catch (e) {}
    throw new Error(parsedErr.error || parsedErr.details || `Failed to like article (${res.status})`);
  }

  const data = await res.json();
  return data;
}

export async function fetchUserLikedArticles(): Promise<Article[]> {
  try {
    const res = await fetch('/api/user/liked', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.articles) return data.articles;
    }
  } catch (err) {
    console.warn('Backend API unreachable for liked articles:', err);
  }
  return [];
}

export async function fetchArticleHighlights(articleIdOrSlug: string): Promise<import('../types/highlight').Highlight[]> {
  try {
    const res = await fetch(`/api/articles/${articleIdOrSlug}/highlights`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.highlights) return data.highlights;
    }
  } catch (err) {
    console.warn('Failed to fetch article highlights:', err);
  }
  return [];
}

export async function createArticleHighlight(
  articleIdOrSlug: string,
  input: import('../types/highlight').CreateHighlightInput
): Promise<import('../types/highlight').Highlight> {
  const res = await fetch(`/api/articles/${articleIdOrSlug}/highlights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any = {};
    try { parsedErr = JSON.parse(errText); } catch (e) {}
    throw new Error(parsedErr.error || parsedErr.details || `Failed to save highlight (${res.status})`);
  }

  const data = await res.json();
  return data.highlight;
}

export async function deleteHighlight(highlightId: string): Promise<boolean> {
  const res = await fetch(`/api/highlights/${highlightId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any = {};
    try { parsedErr = JSON.parse(errText); } catch (e) {}
    throw new Error(parsedErr.error || `Failed to delete highlight (${res.status})`);
  }

  return true;
}

export async function createKnowledgeItem(
  articleIdOrSlug: string,
  input: import('../types/highlight').CreateHighlightInput
): Promise<{ knowledgeItem: import('../types/knowledge').KnowledgeItem; highlight?: import('../types/highlight').Highlight }> {
  const res = await fetch(`/api/articles/${articleIdOrSlug}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any = {};
    try { parsedErr = JSON.parse(errText); } catch (e) {}
    throw new Error(parsedErr.error || `Failed to save to Knowledge (${res.status})`);
  }

  return await res.json();
}

export async function fetchUserKnowledgeItems(): Promise<import('../types/knowledge').KnowledgeItem[]> {
  try {
    const res = await fetch('/api/knowledge', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.knowledgeItems) return data.knowledgeItems;
    }
  } catch (err) {
    console.warn('Failed to fetch user knowledge items:', err);
  }
  return [];
}
