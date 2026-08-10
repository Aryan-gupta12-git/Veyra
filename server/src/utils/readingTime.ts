export function calculateReadingTime(content: string): number {
  if (!content) return 1;
  // Remove HTML tags to count words accurately
  const plainText = content.replace(/<[^>]*>/g, ' ');
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  // Average reading speed: 200 words per minute
  const readingTime = Math.ceil(words / 200);
  return Math.max(1, readingTime);
}

export function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return baseSlug || `article-${Date.now()}`;
}
