import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 'strike', 's',
      'blockquote', 'ul', 'ol', 'li', 'a', 'hr',
      'span', 'pre', 'code'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class'],
  });
}
