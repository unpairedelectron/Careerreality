import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { useLocation, Router as WouterRouter, Redirect } from "wouter";

const Home = lazy(() => import("@/pages/home"));
const RegisteredRoutes = lazy(() => import("@/components/shared/registered-routes"));
const QueryRuntime = lazy(() =>
  import("@/lib/query-runtime").then((module) => ({ default: module.QueryRuntime })),
);
const RouteUiProviders = lazy(() =>
  import("@/components/shared/route-ui-providers").then((module) => ({ default: module.RouteUiProviders })),
);
import { PublicAppAuthProvider, TestAppAuthProvider, useAppAuth } from '@/lib/app-auth-context';

const isE2e = import.meta.env.VITE_E2E === "true";
const isClerkRuntimeE2e = import.meta.env.VITE_E2E_AUTH_RUNTIME === "true";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { isSignedIn } = useAppAuth();
  return (
    isSignedIn ? <Redirect to="/compass" /> : <Home />
  );
}

function AppRoutes() {
  const [path] = useLocation();
  if (path === "/") {
    return (
      <Suspense fallback={<main className="p-8 text-sm text-muted-foreground" role="status">Loading page…</main>}>
        <HomeRedirect />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground" role="status">Loading page…</main>}>
      <RouteUiProviders><RegisteredRoutes /></RouteUiProviders>
    </Suspense>
  );
}

type ClerkRuntimeComponent = ComponentType<{
  children: React.ReactNode;
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
    if (ClerkRuntime || !immediateAuth) return;
    let active = true;
    void import("@/lib/clerk-runtime")
      .then((module) => {
        if (active) setClerkRuntime(() => module.default);
      })
      .catch((error) => {
        console.error("Authentication could not be loaded.", error);
        if (active) setAuthLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [ClerkRuntime, immediateAuth]);

  if (ClerkRuntime) {
    return <ClerkRuntime><AppRoutes /></ClerkRuntime>;
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
  const publicRoutes = <PublicAppAuthProvider><AppRoutes /></PublicAppAuthProvider>;
  if (path === "/") return publicRoutes;
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground" role="status">Loading page…</main>}>
      <QueryRuntime>{publicRoutes}</QueryRuntime>
    </Suspense>
  );
}

function App() {
  const authAvailable = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  return (
    <WouterRouter base={basePath}>
      {isE2e || (!authAvailable && !isClerkRuntimeE2e)
        ? (
          <Suspense fallback={<main className="p-8 text-sm text-muted-foreground" role="status">Loading page…</main>}>
            <QueryRuntime><TestAppAuthProvider><AppRoutes /></TestAppAuthProvider></QueryRuntime>
          </Suspense>
        )
        : <DeferredClerkRoutes />}
    </WouterRouter>
  );
}

export default App;
