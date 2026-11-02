import routeRegistry from "./route-registry";
import { footerTools } from "./footer-tools";

export type SiteMapItem = {
  label: string;
  href: string;
  description?: string;
};

export type SiteMapSection = {
  label: string;
  items: SiteMapItem[];
};

export const siteMap: SiteMapSection[] = [
  {
    label: "Explore",
    items: [
      { label: "Home", href: "/" },
      { label: "All tools", href: "/tools" },
      { label: "Editorial guides", href: "/guides" },
      { label: "Rules and data", href: "/rules" },
      { label: "Layoff hub", href: "/layoffs" },
      { label: "Public sitemap", href: "/sitemap" },
    ],
  },
  {
    label: "Tools",
    items: footerTools,
  },
  {
    label: "Account",
    items: [
      { label: "Sign-in and workspace", href: "/workspace", description: "Account routes are present in code; production data handling and service details remain unverified." },
    ],
  },
  {
    label: "Trust",
    items: [
      { label: "About the desk", href: "/about" },
      { label: "Team and attribution", href: "/team" },
      { label: "Editorial standards", href: "/editorial" },
      { label: "Corrections", href: "/corrections" },
      { label: "Methodology", href: "/methodology" },
      { label: "Sources and data", href: "/sources" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Security", href: "/security" },
    ],
  },
];

// Account and noindex utility routes are not public discovery destinations.
// The human sitemap is the deliberate exception: it remains noindex, follow.
export const publicSiteMap: SiteMapSection[] = siteMap
  .map((section) => ({
    ...section,
    items: section.items.filter((item) => routeRegistry.routes.some((route) =>
      route.path === item.href && route.render === "snapshot" &&
      (route.indexability === "indexable" || route.path === routeRegistry.sitemapPolicy.humanRoute.replace(/\/+$/, "")),
    )),
  }))
  .filter((section) => section.items.length > 0);

const sitemapRoutes = routeRegistry.routes.filter(
  (route) => route.indexability === "indexable" && route.sitemap && route.render === "snapshot",
);

// Shared by the hydrated directory and the crawler-visible HTML.
export const sitemapSections = [
  { label: "Home and hubs", items: sitemapRoutes.filter((route) => route.kind === "home" || route.kind === "hub") },
  { label: "Tools", items: sitemapRoutes.filter((route) => route.kind === "tool") },
  { label: "Guides", items: sitemapRoutes.filter((route) => route.kind === "guide") },
  { label: "Rules and data", items: sitemapRoutes.filter((route) => route.kind === "library") },
  { label: "Trust information", items: sitemapRoutes.filter((route) => route.kind === "trust") },
].filter((section) => section.items.length > 0);