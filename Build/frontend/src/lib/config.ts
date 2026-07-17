export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    return ""; // Browser uses Next.js rewrites
  }
  return "http://127.0.0.1:8000"; // Server-side rendering talks directly to backend
}
