export const ARTICLE_TITLE_SUFFIX = " | CareerReality Journal";

export function formatSeoTitle(title: string): string {
  const normalized = title.trim();
  return normalized.includes(" | ")
    ? normalized
    : `${normalized} | CareerReality`;
}

/** Registry routes may carry a shorter `seoTitle` for the <title> tag; `title` stays the page H1. */
export function routeSeoTitle(route: { title: string; seoTitle?: string }): string {
  return formatSeoTitle(route.seoTitle ?? route.title);
}
