export type LegacyReplacement = {
  title: string;
  description: string;
  eyebrow: string;
  summary: string;
  destination: string;
  destinationLabel: string;
};

export const legacyCompanyReplacements: Record<string, LegacyReplacement> = {
};

export const legacyAiReplacements: Record<string, LegacyReplacement> = {};

export const legacyArticleReplacements: Record<string, LegacyReplacement> = {
};

export function getLegacyCompanyReplacement(slug: string): LegacyReplacement | undefined {
  return legacyCompanyReplacements[slug];
}

export function getLegacyAiReplacement(slug: string): LegacyReplacement | undefined {
  return legacyAiReplacements[slug];
}

export function getLegacyArticleReplacement(slug: string): LegacyReplacement | undefined {
  return legacyArticleReplacements[slug];
}