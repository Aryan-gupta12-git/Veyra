import { useState, useEffect, useCallback } from 'react';
import { Highlight, CreateHighlightInput } from '../types/highlight';
import { fetchArticleHighlights, createArticleHighlight, deleteHighlight, createKnowledgeItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useArticleHighlights(articleId: string) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadHighlights = useCallback(async () => {
    if (!user || !articleId) {
      setHighlights([]);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchArticleHighlights(articleId);
      console.log(`[HIGHLIGHTS FETCHED] articleId=${articleId} count=${data.length}`);
      setHighlights(data);
    } catch (err) {
      console.error('HIGHLIGHT FETCH FAILED', err);
    } finally {
      setLoading(false);
    }
  }, [articleId, user]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  const addHighlight = async (input: CreateHighlightInput): Promise<Highlight | null> => {
    if (!user || !articleId || saving) return null;
    try {
      setSaving(true);
      console.log('[HIGHLIGHT CREATE]', {
        articleId,
        selectedText: input.selectedText,
        startOffset: input.startOffset,
        endOffset: input.endOffset,
      });

      const created = await createArticleHighlight(articleId, input);
      console.log('[HIGHLIGHT SAVED]', created.id);

      setHighlights((prev) => [...prev.filter((h) => h.id !== created.id), created]);
      return created;
    } catch (err: any) {
      console.error('HIGHLIGHT CREATE FAILED', err);
      alert(err.message || 'Failed to save highlight');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const addKnowledge = async (input: CreateHighlightInput): Promise<boolean> => {
    if (!user || !articleId || saving) return false;
    try {
      setSaving(true);
      console.log('[KNOWLEDGE CREATE]', { articleId, selectedText: input.selectedText });
      const res = await createKnowledgeItem(articleId, input);
      if (res.highlight) {
        const createdH = res.highlight;
        setHighlights((prev) => [...prev.filter((h) => h.id !== createdH.id), createdH]);
      }
      return true;
    } catch (err: any) {
      console.error('KNOWLEDGE CREATE FAILED', err);
      alert(err.message || 'Failed to save to Knowledge');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeHighlight = async (highlightId: string): Promise<boolean> => {
    if (!user || deleting) return false;
    try {
      setDeleting(true);
      console.log('[HIGHLIGHT DELETE]', highlightId);
      await deleteHighlight(highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      return true;
    } catch (err: any) {
      console.error('HIGHLIGHT DELETE FAILED', err);
      alert(err.message || 'Failed to remove highlight');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    highlights,
    loading,
    saving,
    deleting,
    addHighlight,
    addKnowledge,
    removeHighlight,
    reloadHighlights: loadHighlights,
  };
}
