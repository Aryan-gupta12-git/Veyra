import React from 'react';
import ReactDOM from 'react-dom';
import { Highlighter, Copy, Trash2, LogIn } from 'lucide-react';
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
  onRemoveHighlight: () => void;
  onDismiss: () => void;
}

function computePillPosition(
  rect: DOMRect,
  approxWidth: number = 88
): React.CSSProperties {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const buttonHeight = 32;
  const gap = 8; // 8px spacing directly above selection
  const minEdgePadding = 12; // Keep pill inside viewport

  // Calculate centered horizontal position sticky over target selection
  const selectionCenterX = rect.left + rect.width / 2;
  const clampedLeft = Math.max(
    approxWidth / 2 + minEdgePadding,
    Math.min(viewportWidth - approxWidth / 2 - minEdgePadding, selectionCenterX)
  );

  // Check if there is enough space above the selection (top viewport boundary)
  const spaceAbove = rect.top;
  const isTooCloseToTop = spaceAbove < buttonHeight + gap + 8;

  if (!isTooCloseToTop) {
    // Sticky position fixed directly 8px ABOVE selection in UI
    return {
      position: 'fixed',
      top: `${rect.top - gap}px`,
      left: `${clampedLeft}px`,
      transform: 'translate(-50%, -100%)',
    };
  }

  // Fallback: Sticky position fixed directly 8px BELOW selection in UI
  return {
    position: 'fixed',
    top: `${rect.bottom + gap}px`,
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
  onRemoveHighlight,
  onDismiss,
}) => {
  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onDismiss();
  };

  const handleSave = () => {
    onSaveHighlight();
    onDismiss();
  };

  const handleRemove = () => {
    onRemoveHighlight();
    onDismiss();
  };

  const content = (
    <>
      {/* Sticky action toolbar centered directly ABOVE newly selected text */}
      {pendingSelection && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(pendingSelection.rect, 88)}
        >
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/80 bg-surface shadow-xs text-ink animate-fade-in select-none">
            {/* Copy Icon Button */}
            <button
              type="button"
              onClick={() => handleCopyText(pendingSelection.selectedText)}
              className="p-1.5 rounded-lg text-ink/80 hover:text-ink hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/60 my-auto" />

            {/* Highlight Icon Button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Highlight text"
              >
                <Highlighter className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                title="Sign in to highlight"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Sticky action toolbar centered directly ABOVE existing highlight */}
      {activeHighlightPopover && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(activeHighlightPopover.rect, 88)}
        >
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/80 bg-surface shadow-xs text-ink animate-fade-in select-none">
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
              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
