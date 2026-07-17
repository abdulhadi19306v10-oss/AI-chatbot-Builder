export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    return ""; // Browser uses Next.js rewrites
  }
  return process.env.BACKEND_URL || "http://127.0.0.1:8000";
}
