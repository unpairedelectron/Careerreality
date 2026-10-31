import type { Article, ArticleCategory } from "./content";

export type { Article, ArticleCategory } from "./content";

const categoryLabels: Record<ArticleCategory, string> = {
  "career-reality-checks": "Career reality checks",
  "career-strategy": "Career strategy",
  engineering: "Engineering",
  "money-reality": "Money reality",
  "software-engineering": "Software engineering",
};

// Archived editorial records remain available to audit scripts, not browser-facing modules.
export const articles: Article[] = [];

export const articleCategories = Object.entries(categoryLabels).map(([value, label]) => ({
  value: value as ArticleCategory,
  label,
}));

export const toolsCatalog = [
  { slug: "ctc-calculator", href: "/salary-calculator", title: "CTC decoder", label: "MONEY", description: "Translate an offer into monthly cash, deferred pay, and tax reality." },
];

export function getArticle(_slug: string): Article | undefined {
  return undefined;
}
