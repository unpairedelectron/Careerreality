import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { AlertCircle, ArrowLeft, Check, Loader2, X } from "lucide-react";
import {
  getListCatalogSuggestionsQueryKey,
  useListCatalogSuggestions,
  useReviewCatalogSuggestion,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppNav } from "@/components/shared/app-nav";
import { PublicFooter } from "@/components/shared/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppAuth } from "@/lib/app-auth-context";
import { trackEvent } from "@/lib/analytics";
import { useSeo } from "@/lib/seo";

export default function CatalogReviewPage() {
  const { isLoaded, userId } = useAppAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const suggestionsQuery = useListCatalogSuggestions({ status: "pending", limit: 100 });
  const reviewMutation = useReviewCatalogSuggestion();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useSeo({
    title: "Catalog review | CareerReality",
    description: "Private review queue for CareerReality community catalog suggestions.",
    path: "/workspace/catalog",
    noIndex: true,
  });

  useEffect(() => {
    trackEvent("catalog_review_opened", { route: "/workspace/catalog" });
  }, []);

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!userId) return <Redirect to="/sign-in" />;

  const review = (id: string, moderationStatus: "approved" | "rejected") => {
    reviewMutation.mutate(
      {
        id,
        data: {
          moderationStatus,
          reviewNote: reviewNotes[id]?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: moderationStatus === "approved" ? "Suggestion approved" : "Suggestion rejected",
            description: moderationStatus === "approved"
              ? "It is now available as catalog context."
              : "It will remain out of the public catalog.",
          });
          setReviewNotes((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
          queryClient.invalidateQueries({ queryKey: getListCatalogSuggestionsQueryKey({ status: "pending", limit: 100 }) });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Review could not be saved",
            description: "The suggestion may have changed in another session. Refresh and try again.",
          });
        },
      },
    );
  };

  return (
    <div className="grain min-h-[100dvh] flex flex-col bg-muted/20">
      <AppNav />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <Link href="/workspace" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to workspace
        </Link>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary">Private area / catalog desk</p>
            <h1 className="mt-3 font-display text-5xl tracking-[-.04em]">Review what is missing.</h1>
            <p className="mt-3 max-w-[640px] text-sm leading-7 text-muted-foreground">
              Approve only names that can be useful as catalog context. Approval does not create market evidence or a salary signal.
            </p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/[.06] px-3 py-1.5 font-data text-[9px] uppercase tracking-[.12em] text-primary">
            {suggestionsQuery.data?.data.length ?? 0} pending
          </div>
        </div>

        {suggestionsQuery.isPending ? (
          <div className="mt-10 grid gap-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : suggestionsQuery.isError ? (
          <div className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
            <div className="flex items-center gap-2 font-semibold"><AlertCircle size={16} /> Catalog review is unavailable</div>
            <p className="mt-2 text-sm leading-6">This area is restricted to configured catalog editors, or the review service did not respond.</p>
            <Button variant="outline" size="sm" className="mt-4 border-destructive/30 text-destructive" onClick={() => suggestionsQuery.refetch()}>Try again</Button>
          </div>
        ) : suggestionsQuery.data?.data.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-14 text-center">
            <Check className="mx-auto text-primary" size={24} />
            <h2 className="mt-4 font-display text-3xl">The queue is clear.</h2>
            <p className="mt-2 text-sm text-muted-foreground">New community suggestions will appear here after they pass the public submission checks.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {suggestionsQuery.data?.data.map((suggestion) => {
              const isReviewing = reviewMutation.isPending && reviewMutation.variables?.id === suggestion.id;
              return (
                <Card key={suggestion.id} className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-data text-[9px] uppercase tracking-[.16em] text-primary">
                          <span>{suggestion.entityType}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{suggestion.sector}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{suggestion.jobFunction}</span>
                        </div>
                        <CardTitle className="mt-2 font-display text-3xl">{suggestion.name}</CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(suggestion.createdAt))}</span>
                    </div>
                    <CardDescription className="mt-2">
                      Normalized match key: <span className="font-data text-[11px]">{suggestion.normalizedName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={reviewNotes[suggestion.id] ?? ""}
                      onChange={(event) => setReviewNotes((current) => ({ ...current, [suggestion.id]: event.target.value }))}
                      maxLength={500}
                      placeholder="Optional review note for the audit trail"
                      aria-label={`Review note for ${suggestion.name}`}
                      className="min-h-20 resize-y"
                    />
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button variant="outline" disabled={isReviewing} onClick={() => review(suggestion.id, "rejected")}>
                        <X size={14} className="mr-2" /> Reject
                      </Button>
                      <Button disabled={isReviewing} onClick={() => review(suggestion.id, "approved")}>
                        {isReviewing ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Check size={14} className="mr-2" />}
                        Approve for catalog
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}