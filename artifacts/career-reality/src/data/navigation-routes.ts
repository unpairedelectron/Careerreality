export type NavigationRoute = {
  path: string;
  title: string;
};

export const primaryRoutes: NavigationRoute[] = [
  { path: "/tools", title: "Career Tools for India" },
  { path: "/guides", title: "Career Guides for India" },
  { path: "/layoffs", title: "Layoff Support Hub for India" },
  { path: "/companies", title: "Verify an Indian Employer and Job Offer | CareerReality" },
  { path: "/interview-guides", title: "Interview Guides" },
];

export const searchRoute: NavigationRoute = {
  path: "/search",
  title: "Search CareerReality",
};

export const ctcCalculatorRoute: NavigationRoute = {
  path: "/salary-calculator",
  title: "CTC Calculator India: Estimate In-Hand Pay",
};
