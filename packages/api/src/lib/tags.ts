/**
 * Extract hashtags from post content.
 * Returns lowercase, deduplicated tags, max 10.
 */
export function extractTags(content: string): string[] {
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];

  const tags = [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  return tags.slice(0, 10);
}
