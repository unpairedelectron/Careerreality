export const ARTICLE_TITLE_SUFFIX = " | CareerReality Journal";

export function formatSeoTitle(title: string): string {
  const normalized = title.trim();
  return normalized.includes(" | ")
    ? normalized
    : `${normalized} | CareerReality`;
}