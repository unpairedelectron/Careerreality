import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppAuthContext, type AppAuthValue } from "./app-auth-context";
import { queryClient } from "./query-runtime";
import {
  clearQueryCacheOnAuthUserChange,
  createCrossTabAuthUserChangeSync,
} from "./auth-user-cache";

declare global {
  interface Window {
    __careerRealityAuthTest?: {
      loadAuth: () => void;
      setUser: (userId: string | null) => void;
      seedCache: () => void;
      cachedValue: () => unknown;
      readQueryData: (queryKey: readonly unknown[]) => unknown;
      startWorkspaceQuery: () => Promise<unknown>;
    };
  }
}

export default function ClerkRuntimeTest({
  children,
}: {
  children: ReactNode;
}) {
  const [, setLocation] = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("__e2e_user"),
  );
  const previousUserId = useRef<string | null | undefined>(undefined);
  const crossTabSync = useRef<ReturnType<typeof createCrossTabAuthUserChangeSync> | null>(null);

  useEffect(() => {
    crossTabSync.current = createCrossTabAuthUserChangeSync(queryClient);
    return () => {
      crossTabSync.current?.dispose();
      crossTabSync.current = null;
    };
  }, [queryClient]);

  useEffect(() => {
    if (isLoaded) {
      if (clearQueryCacheOnAuthUserChange(queryClient, previousUserId, userId)) {
        crossTabSync.current?.notify();
      }
    }
  }, [isLoaded, queryClient, userId]);

  useEffect(() => {
    window.__careerRealityAuthTest = {
      loadAuth: () => setIsLoaded(true),
      setUser: setUserId,
      seedCache: () => queryClient.setQueryData(["auth-cache-sentinel"], "cached-user-data"),
      cachedValue: () => queryClient.getQueryData(["auth-cache-sentinel"]),
      readQueryData: (queryKey) => queryClient.getQueryData(queryKey),
      startWorkspaceQuery: () =>
        queryClient.fetchQuery({
          queryKey: ["/api/workspace/summary"],
          queryFn: async ({ signal }) => {
            const response = await fetch("/api/workspace/summary", { signal });
            if (!response.ok) throw new Error("Workspace query failed");
            return response.json();
          },
        }).catch(() => undefined),
    };
    setIsBridgeReady(true);
    return () => {
      delete window.__careerRealityAuthTest;
    };
  }, [queryClient]);

  const value = useMemo<AppAuthValue>(
    () => ({
      isLoaded,
      userId: isLoaded ? userId : null,
      isSignedIn: isLoaded && Boolean(userId),
      user: isLoaded && userId
        ? {
            firstName: "Test",
            fullName: "Test User",
            primaryEmailAddress: { emailAddress: "test@example.com" },
          }
        : null,
      signIn: () => {
        setUserId("e2e_user");
        setIsLoaded(true);
      },
      signOut: async (options) => {
        setUserId(null);
        if (options?.redirectUrl) setLocation(options.redirectUrl);
      },
    }),
    [isLoaded, setLocation, userId],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppAuthContext.Provider value={value}>
        {isBridgeReady && <span hidden data-testid="e2e-clerk-runtime-ready" />}
        {children}
      </AppAuthContext.Provider>
    </QueryClientProvider>
  );
}
