import { useEffect } from "react";

const HOME_TITLE = "Career Tools & Salary Calculators for India | CareerReality";
const HOME_DESCRIPTION = "Career tools for India: compare written job offers, estimate take-home pay with stated tax assumptions, and use sourced guides to plan your next career move.";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setHomeBreadcrumb(canonical: string) {
  document.head.querySelectorAll(
    'script[data-career-seo-schema="breadcrumbs"], script[data-career-seo-schema="article"], script[data-career-seo-schema="faq"]',
  ).forEach((node) => node.remove());

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-career-seo-schema", "breadcrumbs");
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: canonical }],
  });
  document.head.appendChild(script);
}

export function useHomeSeo() {
  useEffect(() => {
    const configuredSiteUrl = import.meta.env.VITE_SITE_URL;
    const siteUrl = configuredSiteUrl
      ? configuredSiteUrl.replace(/\/+$/, "")
      : import.meta.env.DEV
        ? window.location.origin.replace(/\/+$/, "")
        : null;
    if (!siteUrl) {
      throw new Error("Missing VITE_SITE_URL. Production SEO metadata requires the canonical CareerReality origin.");
    }

    const configuredBase = import.meta.env.BASE_URL ?? "/";
    const basePath = configuredBase === "/" ? "" : `/${configuredBase.replace(/^\/+|\/+$/g, "")}`;
    const canonical = new URL(`${basePath}/`, `${siteUrl}/`).toString();
    const socialImage = new URL(`${basePath}/social-card.png`, `${siteUrl}/`).toString();

    document.title = HOME_TITLE;
    setMeta("name", "description", HOME_DESCRIPTION);
    setMeta("name", "robots", import.meta.env.DEV ? "noindex, follow" : "index, follow");
    setMeta("property", "og:title", HOME_TITLE);
    setMeta("property", "og:description", HOME_DESCRIPTION);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:locale", "en_IN");
    setMeta("property", "og:site_name", "CareerReality");
    setMeta("property", "og:image", socialImage);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", HOME_TITLE);
    setMeta("name", "twitter:description", HOME_DESCRIPTION);
    setMeta("name", "twitter:image", socialImage);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("data-career-seo", "canonical");
    canonicalLink.href = canonical;
    setHomeBreadcrumb(canonical);
  }, []);
}
