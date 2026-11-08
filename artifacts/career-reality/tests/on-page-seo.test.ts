import assert from "node:assert/strict";
import test from "node:test";
import registry from "../src/data/route-registry";
import { archivedArticleRecords } from "../src/data/content.ts";
import { assertAuthoredDescription, assertPublicRouteDescription } from "../src/data/seo-description-policy.ts";
import { createSiteOrganization } from "../src/data/seo-organization.ts";
import { assertArticlePublisherLogos } from "../scripts/lib/verify-publisher-logo.ts";

test("all legacy articles retain explicit, unique summaries without publishing them", () => {
  assert.equal(archivedArticleRecords.length, registry.drafts.articles.length);
  const descriptions = new Set<string>();
  for (const article of archivedArticleRecords) {
    assertAuthoredDescription(article.excerpt, article.slug);
    assertAuthoredDescription(article.editorial.metaDescription, article.slug);
    assert.equal(article.excerpt, article.editorial.metaDescription);
    assert.ok(!descriptions.has(article.excerpt), `Duplicate summary: ${article.slug}`);
    descriptions.add(article.excerpt);
  }
});

test("content guard rejects missing and generic summaries with the exact route", () => {
  for (const description of [undefined, "", "  ", "A concise editorial brief on engineering careers."]) {
    assert.throws(() => assertAuthoredDescription(description, "/article/example"), /\/article\/example/);
  }
  assert.doesNotThrow(() => assertAuthoredDescription("Compare engineering scope and authority before switching roles.", "/article/example"));
});

test("indexable public metadata meets snippet budgets and remains distinct", () => {
  const descriptions = new Set<string>();
  for (const route of registry.routes) {
    assertPublicRouteDescription(route);
    if (route.indexability !== "indexable") continue;
    assert.ok(!descriptions.has(route.description), `Duplicate description: ${route.path}`);
    descriptions.add(route.description);
  }
});

test("snippet guard reports both short and long descriptions but permits concise trust pages", () => {
  const route = { path: "/tools", kind: "hub", indexability: "indexable", description: "Too short." };
  assert.throws(() => assertPublicRouteDescription(route), /\/tools.*10 characters/);
  assert.throws(() => assertPublicRouteDescription({ ...route, description: "x".repeat(159) }), /159 characters/);
  for (const length of [150, 158]) {
    assert.doesNotThrow(() => assertPublicRouteDescription({ ...route, description: "x".repeat(length) }));
  }
  assert.doesNotThrow(() => assertPublicRouteDescription({ ...route, kind: "trust" }));
  assert.doesNotThrow(() => assertPublicRouteDescription({ ...route, indexability: "noindex" }));
});

test("static and hydrated schema use the same absolute publisher logo, including preview bases", () => {
  assert.equal(createSiteOrganization("https://example.test/").logo, "https://example.test/logo.png");
  assert.equal(createSiteOrganization("https://example.test", "/preview/").logo, "https://example.test/preview/logo.png");
});

test("publisher verification accepts inline or referenced organizations and ImageObjects", () => {
  const organization = createSiteOrganization("https://example.test");
  const article = { "@type": "Article", publisher: { "@id": organization["@id"] } };
  assert.doesNotThrow(() => assertArticlePublisherLogos([article, organization], organization.logo, "/guide"));
  assert.doesNotThrow(() => assertArticlePublisherLogos([{ ...article, publisher: organization }], organization.logo, "/guide"));
  assert.doesNotThrow(() => assertArticlePublisherLogos([
    article, { ...organization, logo: { "@type": "ImageObject", url: organization.logo } },
  ], organization.logo, "/guide"));
  for (const nodes of [
    [article],
    [article, { ...organization, logo: undefined }],
    [article, { ...organization, logo: "/logo.svg" }],
    [article, { ...organization, logo: "https://other.test/logo.svg" }],
    [{ "@type": "Article" }],
  ]) {
    assert.throws(() => assertArticlePublisherLogos(nodes, organization.logo, "/guide"), /absolute logo.*\/guide/);
  }
});
