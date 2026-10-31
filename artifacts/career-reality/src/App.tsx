import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCheckReadinessDeskAccessQueryKey, useCheckReadinessDeskAccess } from '@workspace/api-client-react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const Home = lazy(() => import('@/pages/home'));
const ProPage = lazy(() => import('@/pages/pro'));
const Workspace = lazy(() => import('@/pages/workspace'));
const CatalogReviewPage = lazy(() => import('@/pages/workspace/catalog-review'));
const ApplicationReadinessDashboard = lazy(() => import('@/pages/admin/application-readiness-dashboard'));
const CareerRealityCompassPage = lazy(() => import('@/pages/compass'));
const SitemapPage = lazy(() => import('@/pages/sitemap'));
const MobileAppPage = lazy(() => import('@/pages/mobile-app'));
const SignInPage = lazy(() => import('@/pages/auth/sign-in'));
const SignUpPage = lazy(() => import('@/pages/auth/sign-up'));
const NotFound = lazy(() => import('@/pages/not-found'));
const SalaryCalculatorPage = lazy(() => import('@/pages/salary-calculator-page'));
const RiskAnalyzerPage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.RiskAnalyzerPage })));
const LayoffRadarPage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.LayoffRadarPage })));
const SalaryDropPage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.SalaryDropPage })));
const EscapePlanPage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.EscapePlanPage })));
const CareerRealityIndexPage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.CareerRealityIndexPage })));
const AiPulsePage = lazy(() => import('@/pages/public-tools').then((module) => ({ default: module.AiPulsePage })));
const SearchPage = lazy(() => import('@/pages/public-editorial').then((module) => ({ default: module.SearchPage })));
const TrustPage = lazy(() => import('@/pages/public-editorial').then((module) => ({ default: module.TrustPage })));
const ArticleDetailPage = lazy(() => import('@/pages/public-editorial').then((module) => ({ default: module.ArticleDetailPage })));
const ToolsHubPage = lazy(() => import('@/pages/public-hubs').then((module) => ({ default: module.ToolsHubPage })));
const GuidesHubPage = lazy(() => import('@/pages/public-hubs').then((module) => ({ default: module.GuidesHubPage })));
const ToolSuitePage = lazy(() => import('@/pages/tool-suite-page').then((module) => ({ default: module.ToolSuitePage })));
const JobPostingRealityCheckPage = lazy(() => import('@/pages/job-posting-reality-check'));
const CompaniesVerificationPage = lazy(() => import('@/pages/companies-verification'));
const PillarGuidePage = lazy(() => import('@/pages/pillar-guide-page').then((module) => ({ default: module.PillarGuidePage })));
const RulesLibraryPage = lazy(() => import('@/pages/rules-library').then((module) => ({ default: module.RulesLibraryPage })));
const LayoffHubPage = lazy(() => import('@/pages/layoff-hub'));
import { PublicAppAuthProvider, TestAppAuthProvider, useAppAuth } from '@/lib/app-auth-context';
import routeRegistry from '@/data/route-registry';

const isE2e = import.meta.env.VITE_E2E === "true";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { isSignedIn } = useAppAuth();
  return (
    isSignedIn ? <Redirect to="/compass" /> : <Home />
  );
}

function ApplicationReadinessRoute() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const accessQuery = useCheckReadinessDeskAccess({
    query: {
      queryKey: getCheckReadinessDeskAccessQueryKey(),
      enabled: isLoaded && isSignedIn,
      retry: false,
    },
  });

  if (!isLoaded) return <main className="p-8 text-sm text-muted-foreground" role="status">Checking sign-in…</main>;
  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect_url=${encodeURIComponent("/admin/application-readiness")}`} />;
  }
  if (accessQuery.isLoading) return <main className="p-8 text-sm text-muted-foreground" role="status">Checking reviewer access…</main>;
  if (accessQuery.error) {
    const status = "status" in accessQuery.error ? accessQuery.error.status : undefined;
    if (status === 403) {
      return (
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="font-display text-3xl">Reviewer access required</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This readiness desk is limited to approved quality reviewers.
          </p>
        </main>
      );
    }
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Readiness desk unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reviewer access could not be confirmed. The internal register has not been loaded.
        </p>
        <button className="mt-5 rounded-md border border-border px-3 py-2 text-sm" onClick={() => void accessQuery.refetch()}>
          Try again
        </button>
      </main>
    );
  }
  return <ApplicationReadinessDashboard />;
}

function AppRoutes() {
  const routeComponents: Record<string, ComponentType<any>> = {
    home: HomeRedirect,
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
    const component = routeComponents[route.component];
    if (!component) {
      throw new Error(`Route registry references an unknown page component: ${route.path}`);
    }
    if (route.path.includes("*")) return [{ path: route.path, component }];
    return route.path === "/"
      ? [{ path: route.path, component }]
      : [{ path: route.path, component }, { path: `${route.path}/`, component }];
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

type ClerkRuntimeComponent = ComponentType<{
  children: React.ReactNode;
  queryClient: QueryClient;
}>;

function routeNeedsImmediateAuth(path: string): boolean {
  return /^\/(?:sign-in|sign-up|compass|pro|workspace(?:\/|$)|admin\/application-readiness(?:\/|$))/.test(path);
}

function DeferredClerkRoutes() {
  const [path] = useLocation();
  const [ClerkRuntime, setClerkRuntime] = useState<ClerkRuntimeComponent | null>(null);
  const [authLoadFailed, setAuthLoadFailed] = useState(false);
  const immediateAuth = routeNeedsImmediateAuth(path);

  useEffect(() => {
    if (ClerkRuntime) return;
    let active = true;
    const loadClerk = async () => {
      try {
        const module = await import("./lib/clerk-runtime");
        if (active) setClerkRuntime(() => module.default);
      } catch (error) {
        console.error("Authentication could not be loaded.", error);
        if (active) setAuthLoadFailed(true);
      }
    };
    const timer = window.setTimeout(() => void loadClerk(), immediateAuth ? 0 : 5000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [ClerkRuntime, immediateAuth]);

  if (ClerkRuntime) {
    return <ClerkRuntime queryClient={queryClient}><AppRoutes /></ClerkRuntime>;
  }
  if (immediateAuth) {
    if (authLoadFailed) {
      return (
        <main className="mx-auto max-w-lg p-8 text-center" role="alert">
          <p className="text-sm text-muted-foreground">Sign-in could not be loaded. Check your connection and reload this page.</p>
          <button className="mt-4 rounded-md border border-border px-3 py-2 text-sm" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      );
    }
    return <main className="p-8 text-sm text-muted-foreground" role="status">Loading sign-in…</main>;
  }
  return <PublicAppAuthProvider><AppRoutes /></PublicAppAuthProvider>;
}

function App() {
  const authAvailable = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  return (
    <WouterRouter base={basePath}>
      {isE2e || !authAvailable
        ? <TestAppAuthProvider><AppRoutes /></TestAppAuthProvider>
        : <DeferredClerkRoutes />}
    </WouterRouter>
  );
}

export default App;