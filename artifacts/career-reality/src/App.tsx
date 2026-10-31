import { lazy, Suspense, useEffect, useRef, type ComponentType } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
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
import { AppAuthProvider, TestAppAuthProvider, useAppAuth } from '@/lib/app-auth';
import { useTheme } from '@/lib/theme';
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

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: 'hsl(164, 71%, 22%)',
    colorForeground: 'hsl(221, 29%, 18%)',
    colorMutedForeground: 'hsl(218, 13%, 47%)',
    colorDanger: 'hsl(5, 60%, 48%)',
    colorBackground: 'hsl(42, 33%, 98%)',
    colorInput: 'hsl(38, 22%, 82%)',
    colorInputForeground: 'hsl(221, 29%, 18%)',
    colorNeutral: 'hsl(38, 22%, 85%)',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-[0_14px_30px_hsl(var(--foreground)/.08)] !border !border-border !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-2xl text-foreground",
    headerSubtitle: "text-muted-foreground font-data text-xs uppercase tracking-wider",
    socialButtonsBlockButtonText: "text-foreground font-semibold",
    formFieldLabel: "font-semibold text-foreground",
    footerActionLink: "text-primary font-bold hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    logoBox: "flex items-center justify-center",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border-border hover:bg-muted transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity",
    formFieldInput: "bg-background border-border text-foreground",
    footerAction: "flex items-center gap-2",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 text-destructive border-destructive/20",
    otpCodeFieldInput: "bg-background border-border text-foreground",
    formFieldRow: "gap-2",
    main: "w-full",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

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

function AppRoutes({ includeClerkCacheInvalidator = false }: { includeClerkCacheInvalidator?: boolean }) {
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
      {includeClerkCacheInvalidator && <ClerkQueryClientCacheInvalidator />}
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const appearance = {
    ...clerkAppearance,
    variables: {
      ...clerkAppearance.variables,
      ...(theme === "dark" ? {
        colorPrimary: 'hsl(164, 61%, 35%)',
        colorForeground: 'hsl(42, 33%, 96%)',
        colorMutedForeground: 'hsl(218, 13%, 68%)',
        colorBackground: 'hsl(221, 26%, 16%)',
        colorInput: 'hsl(221, 20%, 29%)',
        colorInputForeground: 'hsl(42, 33%, 96%)',
        colorNeutral: 'hsl(221, 20%, 25%)',
      } : {}),
    },
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Make your next move with clarity" } },
        signUp: { start: { title: "Build your career advantage", subtitle: "Start with the truth about your next move" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <AppAuthProvider>
        <AppRoutes includeClerkCacheInvalidator />
      </AppAuthProvider>
    </ClerkProvider>
  );
}

function E2eProviderWithRoutes() {
  return (
    <TestAppAuthProvider>
      <AppRoutes />
    </TestAppAuthProvider>
  );
}

function App() {
  const authAvailable = Boolean(clerkPubKey);
  return (
    <WouterRouter base={basePath}>
      {isE2e || !authAvailable ? <E2eProviderWithRoutes /> : <ClerkProviderWithRoutes />}
    </WouterRouter>
  );
}

export default App;