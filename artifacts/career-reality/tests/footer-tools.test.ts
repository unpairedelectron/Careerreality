import assert from "node:assert/strict";
import test from "node:test";
import routeRegistry from "../src/data/route-registry";
import { footerTools } from "../src/data/footer-tools";

test("footer tool destinations come from the public route registry", () => {
  assert.deepEqual(
    footerTools.map(({ label }) => label),
    [
      "CTC calculator",
      "Offer comparison",
      "Tax regime comparison",
      "Gratuity worksheet",
      "Final pay estimator",
      "Layoff runway calculator",
    ],
  );

  for (const tool of footerTools) {
    const route = routeRegistry.routes.find((candidate) => candidate.path === tool.href);
    assert.ok(route, `${tool.href} exists in the route registry`);
    assert.equal(route.kind, "tool");
    assert.equal(route.indexability, "indexable");
  }
});

test("Layoff Hub remains in the primary navigation", () => {
  assert.ok(
    routeRegistry.routes.some((route) =>
      route.path === "/layoffs" &&
      route.component === "layoffHub" &&
      route.navigation === "primary"
    ),
  );
});
