import React from 'react';
import { Highlighter, Trash2, LogIn } from 'lucide-react';
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
}

function computePillPosition(
  rect: DOMRect,
  approxWidth: number = 130
): React.CSSProperties {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const gap = 8; // Small gap of 6–10px between text and action pill
  const minEdgePadding = 12; // Keep pill inside viewport

  // Calculate centered horizontal position over selected range
  const selectionCenterX = rect.left + rect.width / 2;
  const clampedLeft = Math.max(
    approxWidth / 2 + minEdgePadding,
    Math.min(viewportWidth - approxWidth / 2 - minEdgePadding, selectionCenterX)
  );

  // Check if there is enough space above the selection (header / screen top offset)
  const isTooCloseToTop = rect.top < 44;

  if (!isTooCloseToTop) {
    // Position centered directly ABOVE selected text with 8px gap
    return {
      position: 'fixed',
      top: `${rect.top - gap}px`,
      left: `${clampedLeft}px`,
      transform: 'translate(-50%, -100%)',
    };
  }

  // Fallback: Position centered directly BELOW selected text with 8px gap
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
}) => {
  return (
    <>
      {/* Floating action pill centered directly ABOVE selected text: [ Highlight ] */}
      {pendingSelection && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(pendingSelection.rect, 130)}
        >
          <div className="flex items-center px-3 py-1 rounded-full border border-border/80 bg-surface/95 shadow-xs backdrop-blur-md text-[11px] font-sans font-medium text-ink animate-fade-in select-none">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSaveHighlight}
                disabled={saving}
                className="flex items-center gap-1 text-ink hover:text-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                <Highlighter className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{saving ? 'Saving...' : 'Highlight'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-ink hover:text-muted transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3 text-muted shrink-0" />
                <span>Sign in to highlight</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Floating action pill centered directly ABOVE existing highlight: [ Remove highlight ] */}
      {activeHighlightPopover && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(activeHighlightPopover.rect, 155)}
        >
          <div className="flex items-center px-3 py-1 rounded-full border border-border/80 bg-surface/95 shadow-xs backdrop-blur-md text-[11px] font-sans font-medium text-ink animate-fade-in select-none">
            <button
              type="button"
              onClick={onRemoveHighlight}
              disabled={deleting}
              className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 shrink-0" />
              <span>{deleting ? 'Removing...' : 'Remove highlight'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HighlightPopover;
