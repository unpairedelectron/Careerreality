import { useEffect } from "react";
import { categoryMeta } from "@/data/category-meta";
import { ARTICLE_TITLE_SUFFIX, formatSeoTitle } from "@/data/seo-title";
import routeRegistry from "@/data/route-registry";
import { createSiteOrganization } from "@/data/seo-organization";

const SITE_NAME = "CareerReality";

export type Breadcrumb = {
  name: string;
  path: string;
};

export type ArticleSchemaInput = {
  headline: string;
  description: string;
  datePublished: string | null;
  dateModified: string | null;
  section: string;
  keywords: string[];
  citations?: Array<{ name: string; url: string }>;
};

export type FaqSchemaInput = {
  question: string;
  answer: string;
};

export type SeoConfig = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  breadcrumbs?: Breadcrumb[];
  article?: ArticleSchemaInput;
  faqs?: FaqSchemaInput[];
};

const routeSeo: Record<string, { title: string; description: string; noIndex?: boolean }> = {
  "/": {
    title: "Career Intelligence for India | CareerReality",
    description: "Use CareerReality's CTC calculator to compare fixed pay, target variable pay, employer costs, PF, and a sourced new-regime tax estimate.",
  },
  "/compass": {
    title: "Career Decision Compass for India | CareerReality",
    description: "Compare an offer, a move, and staying through separate evidence and prompts. No combined score or employment forecast is produced.",
  },
  "/admin/application-readiness": {
    title: "Application Readiness | CareerReality",
    description: "Internal staging register for application evidence, tests, blockers, and weighted scorecards.",
    noIndex: true,
  },
  "/mobile-app": {
    title: "CareerReality Mobile App | CareerReality",
    description: "Mobile career planning and market tools are under device and release verification.",
    noIndex: true,
  },
  "/tools": {
    title: "Career Tools Directory for India | CareerReality",
    description: "Compare offers, estimate monthly take-home, compare both tax regimes, and check career costs using transparent inputs and stated limits.",
  },
  "/salary-calculator": {
    title: "Indian CTC Calculator Estimate | CareerReality",
    description: "Estimate fixed and target monthly take-home with visible CTC, PF, professional-tax, and Tax Year 2026–27 default-regime assumptions.",
  },
  "/resignation-risk": {
    title: "Resignation Planning Checklist for India | CareerReality",
    description: "Review notice, offer status, repayment terms, and cash runway with a checklist. It does not calculate resignation risk or replace professional advice.",
    noIndex: true,
  },
  "/layoff-radar": {
    title: "Layoff Radar for Indian Companies | CareerReality",
    description: "No publishable company or layoff records are available in this build. An empty result is not evidence of safety, hiring, or a future employment outcome.",
    noIndex: true,
  },
  "/salary-drop": {
    title: "Salary Change Planner | CareerReality",
    description: "Compare estimated take-home for two Indian salary packages across variable-pay outcomes using the 2026–27 new-regime model; PF and payroll details are excluded.",
  },
  "/escape-plan": {
    title: "Career Escape Plan: Turn Stuck Into Next Steps | CareerReality",
    description: "Choose a career goal and build a session-only checklist with an exact time budget. It does not estimate job-search odds or resignation readiness.",
  },
  "/career-reality-index": {
    title: "Career Reality Check | CareerReality",
    description: "Review four self-reported answers; each response selects evidence checks and relevant tools, with no score, prediction, or stay-or-leave recommendation.",
  },
  "/ai": {
    title: "AI and Career Task Prompts | CareerReality",
    description: "Use your task, repeatability, error impact, and human-review path to plan an AI test. This is not an exposure score or job-loss forecast.",
  },
  "/search": {
    title: "Search Career Tools and Articles | CareerReality",
    description: "Search the active CareerReality tool catalogue and current site pages. Quarantined articles and unsupported company records are excluded.",
    noIndex: true,
  },
  "/about": {
    title: "About CareerReality | Current Scope",
    description: "See what this local CareerReality build contains, what remains withheld, and which operating details are not verified.",
  },
  "/editorial": {
    title: "Editorial Standards | CareerReality",
    description: "Review the evidence, sourcing, attribution, freshness, and uncertainty rules used in this local CareerReality build.",
  },
  "/corrections": {
    title: "Corrections Log | CareerReality",
    description: "See the limits of the correction record available for this CareerReality review and what remains unverified.",
  },
  "/methodology": {
    title: "CTC Calculator Methodology | CareerReality",
    description: "Read the CTC calculator's tax, PF, offer-reconciliation, and professional-tax assumptions and limits.",
  },
  "/sources": {
    title: "Sources and Data | CareerReality",
    description: "Review the official tax and PF sources used for the CTC estimate and the provenance limits on other data.",
  },
  "/privacy-policy": {
    title: "Privacy Information | CareerReality",
    description: "Read the data-flow facts visible in this local CareerReality build and the privacy questions that remain unverified.",
  },
  "/terms": {
    title: "Terms Status | CareerReality",
    description: "Terms of use have not been approved for this local CareerReality build.",
  },
  "/contact": {
    title: "Contact CareerReality | Channel Status",
    description: "Current contact-channel status for CareerReality; no monitored public channel has been verified for this review.",
  },
  "/pro": {
    title: "Membership Availability | CareerReality",
    description: "Membership pricing, service details, and delivery have not been verified for this release candidate. No membership is offered here.",
    noIndex: true,
  },
};

const canonicalAliases: Record<string, string> = {
  "/tools/ctc": "/salary-calculator",
  "/tools/risk": "/resignation-risk",
  "/tools/layoffs": "/layoff-radar",
  "/payments/pricing": "/pro",
};

function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  const normalized = withoutQuery.replace(/\/+$/, "") || "/";
  return canonicalAliases[normalized] ?? normalized;
}

function siteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  throw new Error("Missing VITE_SITE_URL. Production SEO metadata requires the canonical CareerReality origin.");
}

function basePath(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return base === "/" ? "" : `/${base.replace(/^\/+|\/+$/g, "")}`;
}

function absoluteUrl(path: string): string {
  const normalizedPath = normalizePath(path);
  const pathWithBase = `${basePath()}${normalizedPath === "/" ? "/" : normalizedPath}`;
  const url = new URL(pathWithBase, `${siteUrl()}/`).toString();
  const isFilePath = /\.(?:png|jpe?g|webp|svg|gif|ico|xml|txt|json|pdf|woff2?|ttf|css|js|mjs)$/i.test(normalizedPath);
  return isFilePath ? url.replace(/\/$/, "") : `${url.replace(/\/$/, "")}/`;
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("data-career-seo", "canonical");
  canonical.href = url;
}

function setSchema(id: string, schema: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(`script[data-career-seo-schema="${id}"]`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-career-seo-schema", id);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

function removeOptionalSchemas() {
  document.head.querySelectorAll('script[data-career-seo-schema="breadcrumbs"], script[data-career-seo-schema="article"], script[data-career-seo-schema="faq"]').forEach((node) => node.remove());
}

function getRegisteredRoute(path: string) {
  return routeRegistry.routes.find((route) => route.path === path)
    ?? routeRegistry.routes.find((route) => {
      if (!route.path.endsWith("/*?") && !route.path.endsWith("/*")) return false;
      const optional = route.path.endsWith("/*?");
      const prefix = route.path.slice(0, optional ? -3 : -2);
      return (optional && path === prefix) || path.startsWith(`${prefix}/`);
    });
}

export function getRouteSeo(path: string): { title?: string; description?: string; noIndex?: boolean } {
  const normalized = normalizePath(path);
  const registeredRoute = getRegisteredRoute(normalized);
  if (registeredRoute) {
    return {
      title: formatSeoTitle(registeredRoute.title),
      description: registeredRoute.description,
      noIndex: registeredRoute.indexability === "noindex",
    };
  }
  if (routeSeo[normalized]) return routeSeo[normalized];
  if (normalized.startsWith("/article/")) {
    return {
      title: "Career Reality Article | CareerReality Journal",
      description: "This article is retained as a staging draft while its evidence and editorial review are completed.",
      noIndex: true,
    };
  }
  if (normalized.startsWith("/companies/")) {
    // Retired records redirect in the route registry. Any future reviewed
    // record must supply its own name and source copy, not a shared assessment.
    return { noIndex: true };
  }
  if (normalized.startsWith("/category/")) {
    const category = categoryMeta[normalized.slice("/category/".length)];
    if (category) {
      return {
        title: `${category} Career Articles | CareerReality`,
        description: `Browse CareerReality's evidence-aware reads about ${category.toLowerCase()} and the decisions behind the headline.`,
        noIndex: true,
      };
    }
    return {
      title: "Career Topic Archive | CareerReality Journal",
      description: "Browse focused CareerReality reads about the evidence, trade-offs, and next questions behind an important career decision.",
      noIndex: true,
    };
  }
  return {};
}

export function useSeo(config: SeoConfig) {
  const serializedConfig = JSON.stringify(config);
  useEffect(() => {
    const canonicalPath = normalizePath(config.path ?? (typeof window === "undefined" ? "/" : window.location.pathname));
    const canonical = absoluteUrl(canonicalPath);
    const normalizedRoute = canonicalPath.replace(/\/+$/, "") || "/";
    const routePolicy = getRegisteredRoute(normalizedRoute);
    // The registry owns public indexability. Config and legacy defaults only
    // apply to unregistered routes; development previews remain non-indexable.
    const noIndex =
      import.meta.env.DEV ||
      (routePolicy
        ? routePolicy.indexability === "noindex"
        : Boolean(config.noIndex) || routeSeo[normalizedRoute]?.noIndex === true);
    // Registered public routes use exactly the same copy before and after hydration.
    const description = routePolicy?.render === "snapshot" ? routePolicy.description : config.description;
    const title = routePolicy?.render === "snapshot"
      ? formatSeoTitle(routePolicy.title)
      : config.article
        ? (config.title.endsWith(ARTICLE_TITLE_SUFFIX) ? config.title : `${config.title}${ARTICLE_TITLE_SUFFIX}`)
        : formatSeoTitle(config.title);

    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", noIndex ? "noindex, follow" : "index, follow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", config.article ? "article" : "website");
    setMeta("property", "og:locale", "en_IN");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:image", absoluteUrl("/social-card.png"));
    setMeta("property", "og:image:type", "image/png");
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", "CareerReality career intelligence for India");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", absoluteUrl("/social-card.png"));
    setMeta("name", "twitter:image:alt", "CareerReality career intelligence for India");
    setCanonical(canonical);

    const organization = createSiteOrganization(siteUrl(), basePath());
    setSchema("site", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl()}/#website`,
          name: SITE_NAME,
          url: siteUrl(),
          inLanguage: "en-IN",
          publisher: { "@id": `${siteUrl()}/#organization` },
        },
        organization,
      ],
    });

    removeOptionalSchemas();
    const breadcrumbs = config.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: config.title.replace(/\s+\|.*$/, ""), path: canonicalPath },
    ];
    setSchema("breadcrumbs", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    });
    if (config.article) {
      setSchema("article", {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: config.article.headline,
        description: routePolicy?.kind === "guide" ? description : config.article.description,
        ...(config.article.datePublished ? { datePublished: config.article.datePublished } : {}),
        ...(config.article.dateModified ? { dateModified: config.article.dateModified } : {}),
        articleSection: config.article.section,
        keywords: config.article.keywords,
        mainEntityOfPage: canonical,
        publisher: organization,
         citation: config.article.citations,
      });
    }
    if (config.faqs?.length) {
      setSchema("faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: config.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      });
    }
  }, [serializedConfig]);
}
