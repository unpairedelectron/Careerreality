import routeRegistry from "./route-registry";

const footerToolLabels = [
  ["ctc-calculator", "CTC calculator"],
  ["offer-comparison", "Offer comparison"],
  ["tax-regime-comparison", "Tax regime comparison"],
  ["gratuity-estimator", "Gratuity worksheet"],
  ["final-pay-estimator", "Final pay estimator"],
  ["layoff-runway", "Layoff runway calculator"],
] as const;

const routesByToolId = new Map(
  routeRegistry.routes
    .filter((route) => route.kind === "tool")
    .map((route) => [route.toolId, route]),
);

export const footerTools = footerToolLabels.map(([toolId, label]) => {
  const route = routesByToolId.get(toolId);
  if (!route) {
    throw new Error(`Footer tool ${toolId} is missing from the public route registry.`);
  }

  return {
    label,
    href: route.path,
    description: route.description,
  };
});
