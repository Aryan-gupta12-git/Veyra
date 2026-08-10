import React from 'react';
import ReactDOM from 'react-dom';
import { Brain, Highlighter, Copy, Trash2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Highlight } from '../../types/highlight';

export interface PendingSelection {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore: string;
  contextAfter: string;
  rect: DOMRect;
}

export interface ActiveHighlightPopover {
  highlight: Highlight;
  rect: DOMRect;
}

interface HighlightPopoverProps {
  pendingSelection: PendingSelection | null;
  activeHighlightPopover: ActiveHighlightPopover | null;
  isAuthenticated: boolean;
  saving: boolean;
  deleting: boolean;
  onSaveHighlight: () => void;
  onSaveKnowledge: () => void;
  onSaveKnowledgeForActive?: () => void;
  onRemoveHighlight: () => void;
  onDismiss: () => void;
}

function computePillPosition(
  rect: DOMRect,
  approxWidth: number = 112
): React.CSSProperties {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const buttonHeight = 32;
  const gap = 8; // 8px spacing directly above selection
  const minEdgePadding = 12; // Keep pill inside viewport

  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  // Calculate centered horizontal position relative to document.body
  const selectionCenterX = rect.left + scrollX + rect.width / 2;
  const minLeft = approxWidth / 2 + minEdgePadding + scrollX;
  const maxLeft = viewportWidth - approxWidth / 2 - minEdgePadding + scrollX;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, selectionCenterX));

  // Check if target line is too close to top of viewport
  const spaceAbove = rect.top;
  const isTooCloseToTop = spaceAbove < buttonHeight + gap + 8;

  if (!isTooCloseToTop) {
    // Position absolute relative to document.body so popover moves synchronously with text when scrolling
    return {
      position: 'absolute',
      top: `${rect.top + scrollY - gap}px`,
      left: `${clampedLeft}px`,
      transform: 'translate(-50%, -100%)',
    };
  }

  // Fallback: Position absolute 8px BELOW selection line relative to document.body
  return {
    position: 'absolute',
    top: `${rect.bottom + scrollY + gap}px`,
    left: `${clampedLeft}px`,
    transform: 'translate(-50%, 0)',
  };
}

export const HighlightPopover: React.FC<HighlightPopoverProps> = ({
  pendingSelection,
  activeHighlightPopover,
  isAuthenticated,
  saving,
  deleting,
  onSaveHighlight,
  onSaveKnowledge,
  onSaveKnowledgeForActive,
  onRemoveHighlight,
  onDismiss,
}) => {
  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onDismiss();
  };

  const handleSaveHighlight = () => {
    onSaveHighlight();
    onDismiss();
  };

  const handleSaveKnowledge = () => {
    onSaveKnowledge();
    onDismiss();
  };

  const handleSaveKnowledgeForActive = () => {
    if (onSaveKnowledgeForActive) {
      onSaveKnowledgeForActive();
    } else {
      onSaveKnowledge();
    }
    onDismiss();
  };

  const handleRemove = () => {
    onRemoveHighlight();
    onDismiss();
  };

  const content = (
    <>
      {/* Floating action toolbar centered directly ABOVE newly selected text: [ Brain | Highlighter | Copy ] */}
      {pendingSelection && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(pendingSelection.rect, 112)}
        >
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/80 bg-surface shadow-xs text-ink animate-fade-in select-none">
            {/* Add to Memory (Brain Icon) */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSaveKnowledge}
                disabled={saving}
                className="p-1.5 rounded-lg text-ink/80 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Add to Memory"
              >
                <Brain className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-lg text-ink/80 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all cursor-pointer"
                title="Sign in to add to Memory"
              >
                <Brain className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/60 my-auto" />

            {/* Highlight Icon Button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSaveHighlight}
                disabled={saving}
                className="p-1.5 rounded-lg text-ink/80 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Highlight text"
              >
                <Highlighter className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-lg text-ink/80 hover:text-ink hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                title="Sign in to highlight"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/60 my-auto" />

            {/* Copy Icon Button */}
            <button
              type="button"
              onClick={() => handleCopyText(pendingSelection.selectedText)}
              className="p-1.5 rounded-lg text-ink/80 hover:text-ink hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Floating action toolbar centered directly ABOVE existing highlight: [ Brain | Copy | Trash ] */}
      {activeHighlightPopover && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(activeHighlightPopover.rect, 112)}
        >
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/80 bg-surface shadow-xs text-ink animate-fade-in select-none">
            {/* Add to Memory (Brain Icon) */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSaveKnowledgeForActive}
                disabled={saving}
                className="p-1.5 rounded-lg text-ink/80 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Add to Memory"
              >
                <Brain className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-lg text-ink/80 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all cursor-pointer"
                title="Sign in to add to Memory"
              >
                <Brain className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/60 my-auto" />

            {/* Copy Icon Button */}
            <button
              type="button"
              onClick={() => handleCopyText(activeHighlightPopover.highlight.selectedText)}
              className="p-1.5 rounded-lg text-ink/80 hover:text-ink hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/60 my-auto" />

            {/* Remove Highlight Icon Button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={deleting}
              className="p-1.5 rounded-lg text-ink/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Remove highlight"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default HighlightPopover;
