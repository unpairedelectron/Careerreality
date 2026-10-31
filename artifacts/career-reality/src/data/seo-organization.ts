/** Shared by crawler snapshots and hydrated Article / WebSite structured data. */
export function createSiteOrganization(siteUrl: string, assetBasePath = "") {
  const origin = siteUrl.replace(/\/+$/, "");
  const base = assetBasePath.replace(/^\/+|\/+$/g, "");
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "CareerReality",
    url: origin,
    logo: new URL(`${base ? `/${base}` : ""}/logo.svg`, `${origin}/`).href,
    email: "hello@careerreality.in",
  };
}
