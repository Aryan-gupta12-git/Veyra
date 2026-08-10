export interface Highlight {
  id: string;
  userId: string;
  articleId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore?: string | null;
  contextAfter?: string | null;
  createdAt: string;
}

export interface CreateHighlightInput {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore?: string;
  contextAfter?: string;
}
