import { createContext, useContext, useMemo, useState } from "react";

export type AppUser = {
  imageUrl?: string;
  firstName?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
};

export type AppAuthValue = {
  isLoaded: boolean;
  userId: string | null;
  isSignedIn: boolean;
  user: AppUser | null;
  signIn: () => void;
  signOut: (options?: { redirectUrl?: string }) => Promise<void>;
};

export const AppAuthContext = createContext<AppAuthValue | null>(null);

export function PublicAppAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AppAuthValue>(
    () => ({
      isLoaded: true,
      userId: null,
      isSignedIn: false,
      user: null,
      signIn: () => undefined,
      signOut: async () => undefined,
    }),
    [],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function TestAppAuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() =>
    window.localStorage.getItem("career-reality-e2e-auth") === "signed-in"
      ? "e2e_user"
      : null,
  );
  const value = useMemo<AppAuthValue>(
    () => ({
      isLoaded: true,
      userId,
      isSignedIn: Boolean(userId),
      user: userId
        ? {
            firstName: "Test",
            fullName: "Test User",
            primaryEmailAddress: { emailAddress: "test@example.com" },
          }
        : null,
      signIn: () => {
        window.localStorage.setItem("career-reality-e2e-auth", "signed-in");
        setUserId("e2e_user");
      },
      signOut: async (options) => {
        window.localStorage.removeItem("career-reality-e2e-auth");
        setUserId(null);
        if (options?.redirectUrl) window.location.assign(options.redirectUrl);
      },
    }),
    [userId],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth(): AppAuthValue {
  const auth = useContext(AppAuthContext);
  if (!auth) throw new Error("useAppAuth must be used within an app auth provider");
  return auth;
}
