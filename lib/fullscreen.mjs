/**
 * Requests native fullscreen when the browser supports it. Returns false when
 * the element API is missing or the browser rejects the request, so callers
 * can provide an in-page presentation fallback.
 */
export async function requestElementFullscreen(element) {
  const candidate = element.requestFullscreen ?? element.webkitRequestFullscreen;
  if (typeof candidate !== "function") return false;

  try {
    await candidate.call(element);
    return true;
  } catch {
    return false;
  }
}
