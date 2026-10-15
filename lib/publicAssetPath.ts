/**
 * Prefixes a public asset URL for the repository subpath used by GitHub Pages.
 * The variable is set by next.config only when the Pages build is enabled, so
 * local builds keep using root-relative public asset paths.
 */
export function publicAssetPath(path: `/${string}`): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
