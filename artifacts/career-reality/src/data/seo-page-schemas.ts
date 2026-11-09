/**
 * Page-level JSON-LD shared by crawler snapshots (scripts/generate-route-snapshots.ts)
 * and the hydrated client (src/lib/seo.ts), so both emit identical objects.
 */

const FINANCE_TOOL_ROUTES = new Set([
  "/salary-calculator",
  "/offer-comparison",
  "/tax-regime-comparison",
  "/gratuity-estimator",
  "/final-pay-estimator",
  "/layoff-runway",
  "/home-loan-stress-test",
  "/salary-drop",
]);

/** Tool routes that are checklists or editorial hubs rather than applications. */
const NON_APPLICATION_TOOL_ROUTES = new Set(["/companies"]);

export const SITE_SOCIAL_IMAGE_PATH = "/social-card.png";

function originOf(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function canonicalUrl(siteUrl: string, routePath: string): string {
  const origin = originOf(siteUrl);
  return routePath === "/" ? `${origin}/` : `${origin}${routePath.replace(/\/+$/, "")}/`;
}

export function toolApplicationCategory(routePath: string): string {
  return FINANCE_TOOL_ROUTES.has(routePath) ? "FinanceApplication" : "BusinessApplication";
}

export function isApplicationToolRoute(route: { path: string; kind?: string } | undefined): boolean {
  return Boolean(route && route.kind === "tool" && !NON_APPLICATION_TOOL_ROUTES.has(route.path));
}

export function createToolApplicationSchema(
  siteUrl: string,
  route: { path: string; title: string; description: string },
): Record<string, unknown> {
  const origin = originOf(siteUrl);
  const url = canonicalUrl(siteUrl, route.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: route.title,
    description: route.description,
    url,
    applicationCategory: toolApplicationCategory(route.path),
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@id": `${origin}/#organization` },
    inLanguage: "en-IN",
  };
}

export type RulesPageSchemaInput = {
  path: string;
  title: string;
  description: string;
  verified: string;
  sources: Array<{ label: string; url: string }>;
};

/** `lastReviewed` mirrors the verification date printed on the rules page. */
export function createRulesPageSchema(siteUrl: string, page: RulesPageSchemaInput): Record<string, unknown> {
  const origin = originOf(siteUrl);
  const url = canonicalUrl(siteUrl, page.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: page.title,
    description: page.description,
    url,
    ...(/^\d{4}-\d{2}-\d{2}$/.test(page.verified) ? { lastReviewed: page.verified } : {}),
    citation: page.sources
      .filter((source) => /^https?:\/\//.test(source.url))
      .map((source) => ({ "@type": "CreativeWork", name: source.label, url: source.url })),
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` },
    inLanguage: "en-IN",
  };
}
