type SchemaNode = Record<string, unknown>;

/** Resolve publisher references across JSON-LD blocks, as a non-JS crawler must. */
export function assertArticlePublisherLogos(nodes: SchemaNode[], expectedLogo: string, route: string): void {
  for (const article of nodes.filter((node) => node["@type"] === "Article")) {
    const declaredPublisher = article.publisher as SchemaNode | undefined;
    const publisher = declaredPublisher?.["@id"]
      ? nodes.find((node) => node["@id"] === declaredPublisher["@id"] && node["@type"] === "Organization") ?? declaredPublisher
      : declaredPublisher;
    const logo = publisher?.logo;
    const logoUrl = typeof logo === "string" ? logo : (logo as SchemaNode | undefined)?.url;
    if (publisher?.["@type"] !== "Organization" || logoUrl !== expectedLogo || !/^https?:\/\//i.test(String(logoUrl))) {
      throw new Error(`Article publisher must resolve to an Organization with absolute logo ${expectedLogo} on ${route}`);
    }
  }
}
