import { Highlight } from '../types/highlight';

// Calculate global character offset of a DOM Node + nodeOffset within container
export function getGlobalOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
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

// Reconstruct a native DOM Range from global character offsets
export function createRangeFromGlobalOffsets(container: HTMLElement, start: number, end: number): Range | null {
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
      console.warn('[HIGHLIGHT] Failed to create range from offsets:', e);
    }
  }

  return null;
}

// Safely clear all <mark class="veyra-highlight"> elements from container
export function clearDomHighlights(container: HTMLElement): void {
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

// Render a single highlight by wrapping matching text nodes in <mark> tags
export function applyDomHighlight(
  container: HTMLElement,
  highlight: Highlight,
  onSelectHighlight: (highlight: Highlight, rect: DOMRect) => void
): boolean {
  const fullText = container.textContent || '';
  let start = highlight.startOffset;
  let end = highlight.endOffset;

  // Verify match or locate via context search fallback
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
        console.warn('[HIGHLIGHT] Could not locate highlight text in container:', highlight.selectedText);
        return false;
      }
    }
  }

  const range = createRangeFromGlobalOffsets(container, start, end);
  if (!range) return false;

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

  return true;
}
