import { useMemo } from "react";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { AppAuthContext, type AppAuthValue } from "./app-auth-context";

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const value = useMemo<AppAuthValue>(
    () => ({
      isLoaded: auth.isLoaded,
      userId: auth.userId ?? null,
      isSignedIn: auth.isSignedIn === true,
      user: user
        ? {
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            fullName: user.fullName,
            primaryEmailAddress: {
              emailAddress: user.primaryEmailAddress?.emailAddress,
            },
          }
        : null,
      signIn: () => undefined,
      signOut: async (options) => {
        await clerk.signOut(options);
      },
    }),
    [auth.isLoaded, auth.isSignedIn, auth.userId, clerk, user],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}