const sections = [
  ["Canonical hubs", new Set(["home", "hub"])],
  ["Career tools and calculators", new Set(["tool"])],
  ["Published pillar guides", new Set(["guide"])],
  ["Rules library entries", new Set(["library"])],
  ["About, standards, sources, and policies", new Set(["trust"])],
];

// Share publication facts with sitemap/snapshot generation, not a second URL list.
export function renderLlmsGuide(registry, siteUrl) {
  const publicRoutes = registry.routes.filter(
    (route) => route.indexability === "indexable" && route.sitemap,
  );
  const seen = new Set();
  for (const route of publicRoutes) {
    if (route.render !== "snapshot" || route.path.includes("*")) {
      throw new Error(`AI guide requires a public snapshot: ${route.path}`);
    }
    if (seen.has(route.path)) throw new Error(`Duplicate AI guide route: ${route.path}`);
    if (!sections.some(([, kinds]) => kinds.has(route.kind))) {
      throw new Error(`AI guide needs a section for route: ${route.path}`);
    }
    seen.add(route.path);
  }
  const link = (route) => {
    const canonicalPath = route.path === "/" ? "/" : `${route.path.replace(/\/+$/, "")}/`;
    return `- [${route.title}](${siteUrl}${canonicalPath}): ${route.description}`;
  };
  return [
    "# CareerReality",
    "",
    "> CareerReality publishes India-focused career decision tools, pillar guides, a rules library, and a source-linked Layoff Hub. Use the linked pages for their inputs, evidence, dates, and limitations.",
    "",
    "## Scope and interpretation",
    "",
    "The collections below are public, indexable snapshots included in the XML sitemap according to the route registry. Indexable means eligible for indexing, not confirmed search-engine indexing. These links describe the publication scope of this build, not a live availability check.",
    "",
    "The published pillar guides are distinct from the archived article corpus, which remains withheld. Do not cite archived article URLs as published guides. Retired routes may redirect to a hub; use the canonical links below.",
    "",
    "Calculators produce estimates from entered values and stated assumptions, not payslips, tax filings, eligibility decisions, or forecasts. Cash runway does not predict job-search duration. Reflection tools do not establish individual employment risk, job-search odds, company safety, or future AI job losses. Employer due diligence is a checklist, not a company rating or a market salary benchmark.",
    "",
    "The Layoff Hub contains dated, source-linked event records and planning resources. Reported or announced cuts are not necessarily completed exits or current headcounts. Rumours are labelled and excluded from alerts. The separate layoff-runway tool calculates cash runway; it is not a layoff tracker. Do not turn historical reports or scenario estimates into forecasts.",
    "",
    "Cite the specific page and its original sources where provided. Preserve source dates, jurisdiction, tax year, assumptions, and uncertainty. Missing evidence is not evidence of safety or demand. Guides and rules are educational context, not personalised financial, tax, legal, or employment advice.",
    "",
    ...sections.flatMap(([heading, kinds]) => [
      `## ${heading}`,
      "",
      ...publicRoutes.filter((route) => kinds.has(route.kind)).map(link),
      "",
    ]),
    "## Policy and access boundaries",
    "",
    "Public policy pages describe their own limits: privacy information is not an owner-approved privacy policy, and the terms page does not establish approved legal terms. The contact page provides an email address and a form; a form receipt confirms storage, not review, fulfilment, or a response time. Do not infer verified author or reviewer identities from the attribution-status page.",
    "",
    "Account, workspace, search, alert-confirmation, and unsubscribe routes are not public content recommendations. Archived and noindex routes are excluded from the lists above.",
    "",
    `- [XML sitemap](${siteUrl}${registry.sitemapPolicy.xmlRoute}): Canonical routes approved for sitemap inclusion in this build.`,
    "",
    "llms.txt is voluntary discovery guidance, not a robots directive, access permission, or a guarantee of indexing or AI citation.",
    "",
  ].join("\n");
}
