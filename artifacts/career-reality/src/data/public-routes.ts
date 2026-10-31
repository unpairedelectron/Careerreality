import routeRegistry from "@/data/route-registry";

export type PublicRoute = (typeof routeRegistry.routes)[number];

export const publicRoutes = routeRegistry.routes.filter(
  (route) => route.indexability === "indexable",
);

export const primaryRoutes = publicRoutes.filter(
  (route) => route.navigation === "primary",
);

export const footerRoutes = publicRoutes.filter(
  (route) => route.navigation === "footer",
);

export const toolRoutes = publicRoutes.filter((route) => route.kind === "tool");
export const guideRoutes = publicRoutes.filter((route) => route.kind === "guide");

export const searchRoute = routeRegistry.routes.find((route) => route.component === "search");
export const ctcCalculatorRoute = publicRoutes.find((route) => route.toolId === "ctc-calculator");
