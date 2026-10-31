import { Redirect } from "wouter";
import {
  getCheckReadinessDeskAccessQueryKey,
  useCheckReadinessDeskAccess,
} from "@workspace/api-client-react";
import { useAppAuth } from "@/lib/app-auth-context";
import ApplicationReadinessDashboard from "./application-readiness-dashboard";

export default function ApplicationReadinessRoute() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const accessQuery = useCheckReadinessDeskAccess({
    query: {
      queryKey: getCheckReadinessDeskAccessQueryKey(),
      enabled: isLoaded && isSignedIn,
      retry: false,
    },
  });

  if (!isLoaded) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">Checking sign-in…</main>;
  }
  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect_url=${encodeURIComponent("/admin/application-readiness")}`} />;
  }
  if (accessQuery.isLoading) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">Checking reviewer access…</main>;
  }
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
