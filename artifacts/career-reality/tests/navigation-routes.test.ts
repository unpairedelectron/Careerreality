import assert from "node:assert/strict";
import test from "node:test";
import routeRegistry from "../src/data/route-registry";
import { ctcCalculatorRoute, primaryRoutes, searchRoute } from "../src/data/navigation-routes";

test("the lightweight navigation data matches the route registry", () => {
  const publicRoutes = routeRegistry.routes.filter((route) => route.indexability === "indexable");
  const expectedPrimary = publicRoutes
    .filter((route) => route.navigation === "primary")
    .map(({ path, title }) => ({ path, title }));
  const expectedSearch = routeRegistry.routes.find((route) => route.component === "search");
  const expectedCalculator = publicRoutes.find((route) => route.toolId === "ctc-calculator");

  assert.deepEqual(primaryRoutes, expectedPrimary);
  assert.deepEqual(searchRoute, { path: expectedSearch?.path, title: expectedSearch?.title });
  assert.deepEqual(ctcCalculatorRoute, { path: expectedCalculator?.path, title: expectedCalculator?.title });
});
