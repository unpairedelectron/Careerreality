import { lazy, Suspense, type ComponentType } from "react";
import { Switch, Route } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import routeRegistry from "@/data/route-registry";

const ProPage = lazy(() => import("@/pages/pro"));
const Workspace = lazy(() => import("@/pages/workspace"));
const CatalogReviewPage = lazy(() => import("@/pages/workspace/catalog-review"));
const ApplicationReadinessRoute = lazy(() => import("@/pages/admin/application-readiness-route"));
const CareerRealityCompassPage = lazy(() => import("@/pages/compass"));
const SitemapPage = lazy(() => import("@/pages/sitemap"));
const MobileAppPage = lazy(() => import("@/pages/mobile-app"));
const SignInPage = lazy(() => import("@/pages/auth/sign-in"));
const SignUpPage = lazy(() => import("@/pages/auth/sign-up"));
const NotFound = lazy(() => import("@/pages/not-found"));
const SalaryCalculatorPage = lazy(() => import("@/pages/salary-calculator-page"));
const RiskAnalyzerPage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.RiskAnalyzerPage })));
const LayoffRadarPage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.LayoffRadarPage })));
const SalaryDropPage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.SalaryDropPage })));
const EscapePlanPage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.EscapePlanPage })));
const CareerRealityIndexPage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.CareerRealityIndexPage })));
const AiPulsePage = lazy(() => import("@/pages/public-tools").then((module) => ({ default: module.AiPulsePage })));
const SearchPage = lazy(() => import("@/pages/public-editorial").then((module) => ({ default: module.SearchPage })));
const TrustPage = lazy(() => import("@/pages/public-editorial").then((module) => ({ default: module.TrustPage })));
const ArticleDetailPage = lazy(() => import("@/pages/public-editorial").then((module) => ({ default: module.ArticleDetailPage })));
const ToolsHubPage = lazy(() => import("@/pages/public-hubs").then((module) => ({ default: module.ToolsHubPage })));
const GuidesHubPage = lazy(() => import("@/pages/public-hubs").then((module) => ({ default: module.GuidesHubPage })));
const ToolSuitePage = lazy(() => import("@/pages/tool-suite-page").then((module) => ({ default: module.ToolSuitePage })));
const JobPostingRealityCheckPage = lazy(() => import("@/pages/job-posting-reality-check"));
const CompaniesVerificationPage = lazy(() => import("@/pages/companies-verification"));
const PillarGuidePage = lazy(() => import("@/pages/pillar-guide-page").then((module) => ({ default: module.PillarGuidePage })));
const RulesLibraryPage = lazy(() => import("@/pages/rules-library").then((module) => ({ default: module.RulesLibraryPage })));
const LayoffHubPage = lazy(() => import("@/pages/layoff-hub"));

const routeComponents: Record<string, ComponentType<any>> = {
  toolsHub: ToolsHubPage,
  guidesHub: GuidesHubPage,
  toolSuite: ToolSuitePage,
  jobPostingRealityCheck: JobPostingRealityCheckPage,
  companyDueDiligence: CompaniesVerificationPage,
  guide: PillarGuidePage,
  rulesLibrary: RulesLibraryPage,
  pro: ProPage,
  workspace: Workspace,
  workspaceCatalog: CatalogReviewPage,
  applicationReadiness: ApplicationReadinessRoute,
  sitemap: SitemapPage,
  tools: SitemapPage,
  mobileApp: MobileAppPage,
  compass: CareerRealityCompassPage,
  ctcCalculator: SalaryCalculatorPage,
  resignationRisk: RiskAnalyzerPage,
  layoffRadar: LayoffRadarPage,
  salaryDrop: SalaryDropPage,
  escapePlan: EscapePlanPage,
  careerRealityIndex: CareerRealityIndexPage,
  aiPrompts: AiPulsePage,
  search: SearchPage,
  about: () => <TrustPage kind="about" />,
  team: () => <TrustPage kind="team" />,
  editorial: () => <TrustPage kind="editorial" />,
  corrections: () => <TrustPage kind="corrections" />,
  methodology: () => <TrustPage kind="methodology" />,
  sources: () => <TrustPage kind="sources" />,
  privacy: () => <TrustPage kind="privacy" />,
  terms: () => <TrustPage kind="terms" />,
  contact: () => <TrustPage kind="contact" />,
  signIn: SignInPage,
  signUp: SignUpPage,
  articleDetail: ArticleDetailPage,
  layoffHub: LayoffHubPage,
};

const registeredRoutes = routeRegistry.routes.flatMap((route) => {
  if (route.component === "home") return [];
  const component = routeComponents[route.component];
  if (!component) {
    throw new Error(`Route registry references an unknown page component: ${route.path}`);
  }
  if (route.path.includes("*")) return [{ path: route.path, component }];
  return [{ path: route.path, component }, { path: `${route.path}/`, component }];
});

export default function RegisteredRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<main className="p-8 text-sm text-muted-foreground" role="status">Loading page…</main>}>
        <Switch>
          <Route path="/layoffs" component={LayoffHubPage} />
          <Route path="/layoffs/" component={LayoffHubPage} />
          <Route path="/layoffs/:slug" component={LayoffHubPage} />
          <Route path="/layoffs/:slug/" component={LayoffHubPage} />
          {registeredRoutes.map(({ path, component }) => (
            <Route key={path} path={path} component={component} />
          ))}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}
