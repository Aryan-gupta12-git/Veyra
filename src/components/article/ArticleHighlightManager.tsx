import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Highlight, CreateHighlightInput } from '../../types/highlight';
import { fetchArticleHighlights, createArticleHighlight, deleteHighlight } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Highlighter, Trash2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ArticleHighlightManagerProps {
  articleId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

interface PendingSelection {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore: string;
  contextAfter: string;
  rect: DOMRect;
}

interface ActiveHighlightPopover {
  highlight: Highlight;
  rect: DOMRect;
}

// Calculate text offset of a Node + nodeOffset within container
function getTextOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let charCount = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode === targetNode) {
      return charCount + targetOffset;
    }
    charCount += currentNode.nodeValue?.length || 0;
    currentNode = walker.nextNode();
  }
  return charCount;
}

// Find Range for [startOffset, endOffset] in container
function createRangeFromOffsets(container: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let charCount = 0;
  let startNode: Node | null = null;
  let startOffsetInNode = 0;
  let endNode: Node | null = null;
  let endOffsetInNode = 0;

  let currentNode = walker.nextNode();

  while (currentNode) {
    const len = currentNode.nodeValue?.length || 0;
    const nextCharCount = charCount + len;

    if (!startNode && start >= charCount && start <= nextCharCount) {
      startNode = currentNode;
      startOffsetInNode = start - charCount;
    }

    if (!endNode && end >= charCount && end <= nextCharCount) {
      endNode = currentNode;
      endOffsetInNode = end - charCount;
    }

    if (startNode && endNode) break;

    charCount = nextCharCount;
    currentNode = walker.nextNode();
  }

  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffsetInNode);
      range.setEnd(endNode, endOffsetInNode);
      return range;
    } catch (e) {
      console.warn('Failed to create range from offsets:', e);
    }
  }

  return null;
}

// Clear existing mark tags from container safely
function clearDomHighlights(container: HTMLElement) {
  const marks = Array.from(container.querySelectorAll('mark.veyra-highlight'));
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    }
  });
}

// Wrap text nodes in range with highlight mark tags
function applyDomHighlight(
  container: HTMLElement,
  highlight: Highlight,
  onSelectHighlight: (highlight: Highlight, rect: DOMRect) => void
) {
  const fullText = container.textContent || '';
  let start = highlight.startOffset;
  let end = highlight.endOffset;

  // Verify match or locate via context search
  if (fullText.slice(start, end) !== highlight.selectedText) {
    const contextSearch = (highlight.contextBefore || '') + highlight.selectedText + (highlight.contextAfter || '');
    const contextIdx = fullText.indexOf(contextSearch);
    if (contextIdx !== -1) {
      start = contextIdx + (highlight.contextBefore?.length || 0);
      end = start + highlight.selectedText.length;
    } else {
      const directIdx = fullText.indexOf(highlight.selectedText);
      if (directIdx !== -1) {
        start = directIdx;
        end = directIdx + highlight.selectedText.length;
      } else {
        return;
      }
    }
  }

  const range = createRangeFromOffsets(container, start, end);
  if (!range) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];

  let currentNode = walker.nextNode();
  while (currentNode) {
    if (range.intersectsNode(currentNode)) {
      textNodes.push(currentNode as Text);
    }
    currentNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    let nodeStart = 0;
    let nodeEnd = textNode.nodeValue?.length || 0;

    if (textNode === range.startContainer) {
      nodeStart = range.startOffset;
    }
    if (textNode === range.endContainer) {
      nodeEnd = range.endOffset;
    }

    if (nodeStart < nodeEnd) {
      const mark = document.createElement('mark');
      mark.className = 'veyra-highlight cursor-pointer transition-colors duration-150 select-text';
      mark.setAttribute('data-highlight-id', highlight.id);
      mark.setAttribute('title', 'Click to remove highlight');

      const targetTextNode = textNode.splitText(nodeStart);
      targetTextNode.splitText(nodeEnd - nodeStart);

      const parent = targetTextNode.parentNode;
      if (parent) {
        parent.replaceChild(mark, targetTextNode);
        mark.appendChild(targetTextNode);

        mark.addEventListener('click', (e) => {
          e.stopPropagation();
          const rect = mark.getBoundingClientRect();
          onSelectHighlight(highlight, rect);
        });
      }
    }
  });
}

export const ArticleHighlightManager: React.FC<ArticleHighlightManagerProps> = ({ articleId, contentRef }) => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<ActiveHighlightPopover | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load user highlights once when article loads or user logs in
  useEffect(() => {
    if (!user || !articleId) {
      setHighlights([]);
      return;
    }

    let isMounted = true;
    fetchArticleHighlights(articleId).then((data) => {
      if (isMounted) {
        setHighlights(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [articleId, user]);

  const handleSelectHighlightPopover = useCallback((highlight: Highlight, rect: DOMRect) => {
    setPendingSelection(null);
    setActiveHighlightPopover({ highlight, rect });
  }, []);

  // Re-render DOM highlights whenever highlights state or article HTML content changes
  const renderHighlightsOnDom = useCallback(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    clearDomHighlights(container);

    if (highlights.length === 0) return;

    // Apply highlights
    highlights.forEach((h) => {
      applyDomHighlight(container, h, handleSelectHighlightPopover);
    });
  }, [contentRef, highlights, handleSelectHighlightPopover]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderHighlightsOnDom();
    }, 50);
    return () => clearTimeout(timer);
  }, [renderHighlightsOnDom]);

  // Handle selection changes inside article content container
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
      let startOffset = getTextOffset(container, range.startContainer, range.startOffset);
      let endOffset = getTextOffset(container, range.endContainer, range.endOffset);

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
      const rect = range.getBoundingClientRect();

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
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [contentRef]);

  // Dismiss popovers on outside click
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

  const handleSaveHighlight = async () => {
    if (!pendingSelection || !user || saving) return;
    try {
      setSaving(true);
      const input: CreateHighlightInput = {
        selectedText: pendingSelection.selectedText,
        startOffset: pendingSelection.startOffset,
        endOffset: pendingSelection.endOffset,
        contextBefore: pendingSelection.contextBefore,
        contextAfter: pendingSelection.contextAfter,
      };

      const created = await createArticleHighlight(articleId, input);
      setHighlights((prev) => [...prev.filter((h) => h.id !== created.id), created]);

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setPendingSelection(null);
    } catch (err: any) {
      console.error('Failed to create highlight:', err);
      alert(err.message || 'Failed to save highlight');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHighlight = async () => {
    if (!activeHighlightPopover || deleting) return;
    const highlightId = activeHighlightPopover.highlight.id;
    try {
      setDeleting(true);
      await deleteHighlight(highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      setActiveHighlightPopover(null);
    } catch (err: any) {
      console.error('Failed to delete highlight:', err);
      alert(err.message || 'Failed to remove highlight');
    } finally {
      setDeleting(false);
    }
  };

  // Render floating action popovers
  return (
    <>
      {/* Popover for newly selected text: "Highlight" */}
      {pendingSelection && (
        <div
          className="fixed z-50 veyra-highlight-popover transform -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{
            top: `${Math.max(12, pendingSelection.rect.top - 8)}px`,
            left: `${pendingSelection.rect.left + pendingSelection.rect.width / 2}px`,
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-surface/95 shadow-lg backdrop-blur-md text-xs font-sans font-medium text-ink animate-fade-in select-none">
            {user ? (
              <button
                type="button"
                onClick={handleSaveHighlight}
                disabled={saving}
                className="flex items-center gap-1.5 text-ink hover:text-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{saving ? 'Saving...' : 'Highlight'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-ink hover:text-muted transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>Sign in to highlight</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Popover for existing highlighted section: "Remove highlight" */}
      {activeHighlightPopover && (
        <div
          className="fixed z-50 veyra-highlight-popover transform -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{
            top: `${Math.max(12, activeHighlightPopover.rect.top - 8)}px`,
            left: `${activeHighlightPopover.rect.left + activeHighlightPopover.rect.width / 2}px`,
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-surface/95 shadow-lg backdrop-blur-md text-xs font-sans font-medium text-ink animate-fade-in select-none">
            <button
              type="button"
              onClick={handleRemoveHighlight}
              disabled={deleting}
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>{deleting ? 'Removing...' : 'Remove highlight'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleHighlightManager;
