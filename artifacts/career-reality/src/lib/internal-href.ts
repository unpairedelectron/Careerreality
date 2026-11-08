/**
 * Canonical internal URLs on careerreality.in end in a trailing slash
 * (`/tools/`, `/guides/some-guide/`). Links rendered without it cost a 301 when
 * crawled, so every internal href goes through this helper.
 *
 * Left untouched: external/protocol URLs (`https:`, `mailto:`, `tel:`, `//cdn`),
 * pure fragments/queries (`#top`, `?q=1`), the root `/`, paths that already end
 * in `/`, and file-like paths whose last segment has an extension (`/sources.json`,
 * `/.well-known/security.txt`). Query strings and hashes are preserved.
 */
export function withTrailingSlash(href: string): string;
export function withTrailingSlash(href: string | undefined): string | undefined;
export function withTrailingSlash(href: string | undefined): string | undefined {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return href;
  const match = /^([^?#]*)(.*)$/.exec(href);
  if (!match) return href;
  const [, path, suffix] = match;
  if (path === "" || path.endsWith("/")) return href;
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  if (/\.[a-z0-9]+$/i.test(lastSegment)) return href;
  return `${path}/${suffix}`;
}
