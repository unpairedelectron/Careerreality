import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bookmark, Check, ArrowUpRight } from "lucide-react";
import {
  getGetWorkspaceSummaryQueryKey,
  getListSavedDecisionsQueryKey,
  getListWatchlistQueryKey,
  useCreateSavedDecision,
  useCreateWatchlistItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent, trackNextAction } from "@/lib/analytics";
import { useAppAuth } from "@/lib/app-auth-context";

export function SaveDecisionButton({
  slug,
  title,
  summary = `Saved editorial read: ${slug}`,
  signal = "Editorial context to revisit",
  nextHref = "/workspace",
  nextLabel = "Open private workspace",
  nextCatalogSlug = "workspace",
  kind = "company",
  eventName = "article_saved",
  idleLabel = "Save to workspace",
  savedLabel = "Saved to workspace",
  className = "",
  confidenceBand: _confidenceBand,
}: {
  slug: string;
  title: string;
  summary?: string;
  signal?: string;
  nextHref?: string;
  nextLabel?: string;
  nextCatalogSlug?: string;
  kind?: "salary" | "company" | "risk" | "ai";
  eventName?: string;
  idleLabel?: string;
  savedLabel?: string;
  className?: string;
  confidenceBand?: string;
}) {
  const { isSignedIn } = useAppAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const save = useCreateSavedDecision();
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    if (!isSignedIn) {
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setErrorMessage("");
    save.mutate({ data: { kind, title, summary, signal } }, {
      onSuccess: () => {
        setSaved(true);
        trackEvent(eventName, { content_kind: kind, route: window.location.pathname });
        queryClient.invalidateQueries({ queryKey: getListSavedDecisionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: (error) => {
        const status = typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;
        setErrorMessage(status === 409
          ? "This read is already in your workspace. Open the workspace to check it."
          : "Could not save this read. Your context is still here; try again.");
      },
    });
  };

  return (
    <div>
      <button onClick={handleSave} disabled={save.isPending || saved} className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[.04] disabled:cursor-default disabled:opacity-75 ${className}`}>
        {saved ? <Check size={14} className="text-primary" /> : <Bookmark size={14} />}
        {saved ? savedLabel : save.isPending ? "Saving…" : idleLabel}
      </button>
      {saved && <Link href={nextHref} onClick={() => trackNextAction(nextCatalogSlug)} className="ml-3 text-[11px] font-bold text-primary">{nextLabel} <ArrowUpRight size={13} /></Link>}
      {errorMessage && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-destructive" role="status">
          <span>{errorMessage}</span>
          <button type="button" onClick={handleSave} className="font-bold underline underline-offset-2" data-testid="button-retry-save">Try again</button>
        </div>
      )}
    </div>
  );
}

export function WatchlistButton({
  company,
  signal,
  note = "Track this company while you decide.",
  nextHref = "/workspace",
  analyticsLocation = "public_surface",
  catalogSlug: _catalogSlug,
  nextCatalogSlug = "workspace",
  className = "",
}: {
  company: string;
  signal: string;
  note?: string;
  nextHref?: string;
  analyticsLocation?: string;
  catalogSlug?: string;
  nextCatalogSlug?: string;
  className?: string;
}) {
  const { isSignedIn } = useAppAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const add = useCreateWatchlistItem();
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleWatch = () => {
    if (!isSignedIn) {
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setErrorMessage("");
    add.mutate({ data: { company, signal, note } }, {
      onSuccess: () => {
        setSaved(true);
        trackEvent("company_added_to_watchlist", {
          location: analyticsLocation,
          route: window.location.pathname,
        });
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceSummaryQueryKey() });
      },
      onError: (error) => {
        const status = typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;
        setErrorMessage(status === 409
          ? "This company is already on your watchlist. Open the workspace to check it."
          : "Could not add this company. Your context is still here; try again.");
      },
    });
  };

  return (
    <div>
      <button onClick={handleWatch} disabled={add.isPending || saved} className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[.04] disabled:cursor-default disabled:opacity-75 ${className}`}>
        {saved ? <Check size={14} className="text-primary" /> : <Bookmark size={14} />}
        {saved ? "Watching in workspace" : add.isPending ? "Adding…" : "Watch this company"}
      </button>
      {saved && <Link href={nextHref} onClick={() => trackNextAction(nextCatalogSlug)} className="ml-3 text-[11px] font-bold text-primary">Open watchlist <ArrowUpRight size={13} /></Link>}
      {errorMessage && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-destructive" role="status">
          <span>{errorMessage}</span>
          <button type="button" onClick={handleWatch} className="font-bold underline underline-offset-2" data-testid="button-retry-watchlist">Try again</button>
        </div>
      )}
    </div>
  );
}
