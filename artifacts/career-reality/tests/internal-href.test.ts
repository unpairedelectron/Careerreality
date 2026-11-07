import assert from "node:assert/strict";
import test from "node:test";
import { withTrailingSlash } from "../src/lib/internal-href";

test("internal paths gain the canonical trailing slash", () => {
  assert.equal(withTrailingSlash("/tools"), "/tools/");
  assert.equal(withTrailingSlash("/rules/gratuity-wages"), "/rules/gratuity-wages/");
  assert.equal(withTrailingSlash("/guides?topic=tax"), "/guides/?topic=tax");
  assert.equal(withTrailingSlash("/salary-calculator#method"), "/salary-calculator/#method");
});

test("non-page and already-canonical hrefs are untouched", () => {
  for (const href of ["/", "/tools/", "/guides/?q=1", "#top", "?q=1", "/sources.json", "/.well-known/security.txt", "/logo.png", "https://careerreality.in/tools", "//cdn.example.com/x", "mailto:hello@careerreality.in", "tel:+911234567890", ""]) {
    assert.equal(withTrailingSlash(href), href, href);
  }
  assert.equal(withTrailingSlash(undefined), undefined);
});
