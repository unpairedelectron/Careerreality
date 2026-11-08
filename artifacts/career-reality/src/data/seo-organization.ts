import { founderPersonId } from "./site-founder";

/** Shared by crawler snapshots and hydrated Article / WebSite structured data. */
export function createSiteOrganization(siteUrl: string, assetBasePath = "") {
  const origin = siteUrl.replace(/\/+$/, "");
  const base = assetBasePath.replace(/^\/+|\/+$/g, "");
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "CareerReality",
    legalName: "Doffysoft pvt. Limited.",
    url: origin,
    logo: new URL(`${base ? `/${base}` : ""}/logo.png`, `${origin}/`).href,
    email: "hello@careerreality.in",
    founder: { "@id": founderPersonId(origin) },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hinjewadi Phase 3, Pune",
      addressCountry: "IN",
    },
    publishingPrinciples: `${origin}/editorial/`,
    correctionsPolicy: `${origin}/corrections/`,
    privacyPolicy: `${origin}/privacy-policy/`,
    ethicsPolicy: `${origin}/editorial/`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "general, corrections, privacy, security, press, and complaints",
      email: "hello@careerreality.in",
    },
  };
}
