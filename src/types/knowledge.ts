export interface KnowledgeItem {
  id: string;
  userId: string;
  articleId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore?: string | null;
  contextAfter?: string | null;
  createdAt: string;
  article?: {
    id: string;
    slug: string;
    title: string;
    category?: string | null;
    authorName?: string | null;
  };
}
