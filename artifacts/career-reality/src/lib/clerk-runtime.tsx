import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import "@clerk/themes/shadcn.css";
import type { QueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppAuthProvider } from "./app-auth";
import { queryClient } from "./query-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  clearQueryCacheOnAuthUserChange,
  createCrossTabAuthUserChangeSync,
} from "./auth-user-cache";
import { useTheme } from "./theme";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
    colorPrimary: "hsl(164, 71%, 22%)",
    colorForeground: "hsl(221, 29%, 18%)",
    colorMutedForeground: "hsl(218, 13%, 47%)",
    colorDanger: "hsl(5, 60%, 48%)",
    colorBackground: "hsl(42, 33%, 98%)",
    colorInput: "hsl(38, 22%, 82%)",
    colorInputForeground: "hsl(221, 29%, 18%)",
    colorNeutral: "hsl(38, 22%, 85%)",
    fontFamily: "Manrope, sans-serif",
    borderRadius: "0.8rem",
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
    logoBox: "flex items-center justify-center",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border-border hover:bg-muted transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity",
    formFieldInput: "bg-background border-border text-foreground",
    footerAction: "flex items-center gap-2",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 text-destructive border-destructive/20",
    alertText: "text-destructive",
    otpCodeFieldInput: "bg-background border-border text-foreground",
    formFieldRow: "gap-2",
    main: "w-full",
  },
};

function ClerkQueryClientCacheInvalidator({ queryClient }: { queryClient: QueryClient }) {
  const { addListener } = useClerk();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const crossTabSync = createCrossTabAuthUserChangeSync(queryClient);
    const unsubscribe = addListener(({ user }) => {
      if (clearQueryCacheOnAuthUserChange(queryClient, previousUserId, user?.id ?? null)) {
        crossTabSync.notify();
      }
    });
    return () => {
      unsubscribe();
      crossTabSync.dispose();
    };
  }, [addListener, queryClient]);

  return null;
}

export default function ClerkRuntime({
  children,
}: {
  children: ReactNode;
}) {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const appearance = {
    ...clerkAppearance,
    variables: {
      ...clerkAppearance.variables,
      ...(theme === "dark"
        ? {
            colorPrimary: "hsl(164, 61%, 35%)",
            colorForeground: "hsl(42, 33%, 96%)",
            colorMutedForeground: "hsl(218, 13%, 68%)",
            colorBackground: "hsl(221, 26%, 16%)",
            colorInput: "hsl(221, 20%, 29%)",
            colorInputForeground: "hsl(42, 33%, 96%)",
            colorNeutral: "hsl(221, 20%, 25%)",
          }
        : {}),
    },
  };

  const publishableKey = publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={publishableKey}
        proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}
        appearance={appearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        localization={{
          signIn: { start: { title: "Welcome back", subtitle: "Make your next move with clarity" } },
          signUp: { start: { title: "Build your career advantage", subtitle: "Start with the truth about your next move" } },
        }}
        routerPush={(to) => setLocation(to.startsWith(basePath) ? to.slice(basePath.length) || "/" : to)}
        routerReplace={(to) => setLocation(to.startsWith(basePath) ? to.slice(basePath.length) || "/" : to, { replace: true })}
      >
        <AppAuthProvider>
          <ClerkQueryClientCacheInvalidator queryClient={queryClient} />
          {children}
        </AppAuthProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
