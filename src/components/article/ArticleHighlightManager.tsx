import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Highlight } from '../../types/highlight';
import { useAuth } from '../../context/AuthContext';
import { useArticleHighlights } from '../../hooks/useArticleHighlights';
import HighlightPopover, { PendingSelection, ActiveHighlightPopover } from './HighlightPopover';
import {
  getGlobalOffset,
  clearDomHighlights,
  applyDomHighlight,
} from '../../utils/highlightRange';

interface ArticleHighlightManagerProps {
  articleId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const ArticleHighlightManager: React.FC<ArticleHighlightManagerProps> = ({ articleId, contentRef }) => {
  const { user } = useAuth();
  const { highlights, saving, deleting, addHighlight, addKnowledge, removeHighlight } = useArticleHighlights(articleId);

  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<ActiveHighlightPopover | null>(null);

  const handleSelectHighlight = useCallback((highlight: Highlight, rect: DOMRect) => {
    setPendingSelection(null);
    setActiveHighlightPopover({ highlight, rect });
  }, []);

  // Re-render DOM highlights stably whenever highlights state array updates or content container changes
  const renderHighlights = useCallback(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    clearDomHighlights(container);

    if (highlights.length === 0) return;

    highlights.forEach((h) => {
      applyDomHighlight(container, h, handleSelectHighlight);
    });
  }, [contentRef, highlights, handleSelectHighlight]);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      renderHighlights();
    }, 20);
    return () => clearTimeout(timer);
  }, [renderHighlights]);

  // Selection detection listener
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!contentRef.current) return;
      const container = contentRef.current;
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPendingSelection(null);
        return;
      }

      if (selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);

      // Strictly enforce selection inside article content container
      if (!container.contains(range.commonAncestorContainer)) {
        setPendingSelection(null);
        return;
      }

      const fullText = container.textContent || '';
      let startOffset = getGlobalOffset(container, range.startContainer, range.startOffset);
      let endOffset = getGlobalOffset(container, range.endContainer, range.endOffset);

      if (startOffset > endOffset) {
        const temp = startOffset;
        startOffset = endOffset;
        endOffset = temp;
      }

      const selectedText = fullText.slice(startOffset, endOffset).trim();
      if (selectedText.length < 2) {
        setPendingSelection(null);
        return;
      }

      const contextBefore = fullText.slice(Math.max(0, startOffset - 30), startOffset);
      const contextAfter = fullText.slice(endOffset, Math.min(fullText.length, endOffset + 30));
      const clientRects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0 && r.height > 0
      );
      const rect = clientRects[0] || range.getBoundingClientRect();

      setActiveHighlightPopover(null);
      setPendingSelection({
        selectedText,
        startOffset,
        endOffset,
        contextBefore,
        contextAfter,
        rect,
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [contentRef]);

  // Dismiss popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.veyra-highlight-popover') && !target.closest('mark.veyra-highlight')) {
        setActiveHighlightPopover(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic scroll & resize coordinate sync listener so popover stays locked to text while scrolling
  useEffect(() => {
    if (!pendingSelection && !activeHighlightPopover) return;

    const handleScrollOrResize = () => {
      if (pendingSelection) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const clientRects = Array.from(range.getClientRects()).filter(
            (r) => r.width > 0 && r.height > 0
          );
          const newRect = clientRects[0] || range.getBoundingClientRect();
          setPendingSelection((prev) => (prev ? { ...prev, rect: newRect } : null));
        }
      } else if (activeHighlightPopover) {
        const mark = document.querySelector(
          `mark[data-highlight-id="${activeHighlightPopover.highlight.id}"]`
        );
        if (mark) {
          const clientRects = Array.from(mark.getClientRects()).filter(
            (r) => r.width > 0 && r.height > 0
          );
          const newRect = clientRects[0] || mark.getBoundingClientRect();
          setActiveHighlightPopover((prev) => (prev ? { ...prev, rect: newRect } : null));
        }
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [pendingSelection, activeHighlightPopover]);

  const handleSaveHighlight = async () => {
    if (!pendingSelection) return;
    const res = await addHighlight({
      selectedText: pendingSelection.selectedText,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
      contextBefore: pendingSelection.contextBefore,
      contextAfter: pendingSelection.contextAfter,
    });

    if (res) {
      window.getSelection()?.removeAllRanges();
      setPendingSelection(null);
    }
  };

  const handleSaveKnowledge = async () => {
    if (!pendingSelection) return;
    const ok = await addKnowledge({
      selectedText: pendingSelection.selectedText,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
      contextBefore: pendingSelection.contextBefore,
      contextAfter: pendingSelection.contextAfter,
    });

    if (ok) {
      window.getSelection()?.removeAllRanges();
      setPendingSelection(null);
    }
  };

  const handleRemoveHighlight = async () => {
    if (!activeHighlightPopover) return;
    const ok = await removeHighlight(activeHighlightPopover.highlight.id);
    if (ok) {
      setActiveHighlightPopover(null);
    }
  };

  const handleDismiss = useCallback(() => {
    setPendingSelection(null);
    setActiveHighlightPopover(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return (
    <HighlightPopover
      pendingSelection={pendingSelection}
      activeHighlightPopover={activeHighlightPopover}
      isAuthenticated={!!user}
      saving={saving}
      deleting={deleting}
      onSaveHighlight={handleSaveHighlight}
      onSaveKnowledge={handleSaveKnowledge}
      onRemoveHighlight={handleRemoveHighlight}
      onDismiss={handleDismiss}
    />
  );
};

export default ArticleHighlightManager;
