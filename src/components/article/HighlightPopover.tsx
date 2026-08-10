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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSaveHighlight}
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
              onClick={onRemoveHighlight}
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

export default HighlightPopover;
