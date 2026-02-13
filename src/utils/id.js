/**
 * Generate a unique ID for snippets
 * Uses timestamp + random string for uniqueness
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
