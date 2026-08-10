import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Highlighter, Copy, Check, Trash2, LogIn } from 'lucide-react';
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
  approxWidth: number = 84
): React.CSSProperties {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const buttonHeight = 28;
  const gap = 8; // 8px spacing directly above selection
  const minEdgePadding = 12; // Keep pill inside viewport

  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  // Calculate centered horizontal position relative to document.body
  const selectionCenterX = rect.left + scrollX + rect.width / 2;
  const minLeft = approxWidth / 2 + minEdgePadding + scrollX;
  const maxLeft = viewportWidth - approxWidth / 2 - minEdgePadding + scrollX;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, selectionCenterX));

  // Check if there is enough space above the selection (top viewport boundary)
  const spaceAbove = rect.top;
  const isTooCloseToTop = spaceAbove < buttonHeight + gap + 8;

  if (!isTooCloseToTop) {
    // Position centered directly 8px ABOVE selection line anchored to document.body
    return {
      position: 'absolute',
      top: `${rect.top + scrollY - gap}px`,
      left: `${clampedLeft}px`,
      transform: 'translate(-50%, -100%)',
    };
  }

  // Fallback: Position centered directly 8px BELOW selection line anchored to document.body
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
  onRemoveHighlight,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1500);
  };

  const content = (
    <>
      {/* Floating icon action toolbar centered directly ABOVE newly selected text */}
      {pendingSelection && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(pendingSelection.rect, 84)}
        >
          <div className="flex items-center gap-0.5 p-1 rounded-full border border-border/80 bg-surface/95 shadow-md backdrop-blur-md text-ink animate-fade-in select-none">
            {/* Copy Icon Button */}
            <button
              type="button"
              onClick={() => handleCopyText(pendingSelection.selectedText)}
              className="p-1.5 rounded-full text-ink/80 hover:text-ink hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              title={copiedText ? 'Copied!' : 'Copy text'}
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/50 my-auto mx-0.5" />

            {/* Highlight Icon Button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSaveHighlight}
                disabled={saving}
                className="p-1.5 rounded-full text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title={saving ? 'Saving...' : 'Highlight'}
              >
                <Highlighter className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-full text-muted hover:text-ink hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                title="Sign in to highlight"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Floating icon action toolbar centered directly ABOVE existing highlight */}
      {activeHighlightPopover && (
        <div
          className="z-50 veyra-highlight-popover pointer-events-auto"
          style={computePillPosition(activeHighlightPopover.rect, 84)}
        >
          <div className="flex items-center gap-0.5 p-1 rounded-full border border-border/80 bg-surface/95 shadow-md backdrop-blur-md text-ink animate-fade-in select-none">
            {/* Copy Icon Button */}
            <button
              type="button"
              onClick={() => handleCopyText(activeHighlightPopover.highlight.selectedText)}
              className="p-1.5 rounded-full text-ink/80 hover:text-ink hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              title={copiedText ? 'Copied!' : 'Copy text'}
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-3.5 bg-border/50 my-auto mx-0.5" />

            {/* Remove Highlight Icon Button */}
            <button
              type="button"
              onClick={onRemoveHighlight}
              disabled={deleting}
              className="p-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title={deleting ? 'Removing...' : 'Remove highlight'}
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
