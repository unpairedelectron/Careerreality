import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bookmark, Check, ChevronRight, Clock3, ArrowUpRight } from "lucide-react";
import {
  getGetWorkspaceSummaryQueryKey,
  getListSavedDecisionsQueryKey,
  getListWatchlistQueryKey,
  useCreateSavedDecision,
  useCreateWatchlistItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Article } from "@/data/public-content";
import { AppNav, Logo } from "@/components/shared/app-nav";
import { trackEvent, trackNextAction } from "@/lib/analytics";
import { useAppAuth } from "@/lib/app-auth-context";
import { publicSiteMap } from "@/data/site-map";
import routeRegistry from "@/data/route-registry";
import { getRouteSeo, useSeo, type Breadcrumb, type SeoConfig } from "@/lib/seo";
import { ToolGuideSection, toolGuides } from "@/components/shared/tool-guide";
import "./public-chrome.css";

const toolRelatedPages: Record<string, Array<{ href: string; label: string }>> = {
  "/salary-calculator": [{ href: "/guides/read-the-offer-beyond-ctc", label: "Read a CTC offer" }, { href: "/rules/employee-pf", label: "EPF wage-ceiling rules" }, { href: "/rules/gratuity-wages", label: "Gratuity wage rules" }],
  "/offer-comparison": [{ href: "/guides/read-the-offer-beyond-ctc", label: "Read a CTC offer" }, { href: "/guides/notice-period-and-return-to-office", label: "Check notice-period terms" }, { href: "/rules/employee-pf", label: "EPF wage-ceiling rules" }],
  "/tax-regime-comparison": [{ href: "/guides/cross-border-and-remote-pay", label: "Understand location and tax questions" }, { href: "/guides/how-to-read-salary-and-hiring-claims", label: "Check salary claims" }],
  "/gratuity-estimator": [{ href: "/rules/gratuity-wages", label: "Official gratuity wage rules" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "Check exit documents" }],
  "/final-pay-estimator": [{ href: "/guides/notice-period-and-return-to-office", label: "Notice-period exit steps" }, { href: "/rules/leave-encashment", label: "Leave encashment rules" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "After a layoff" }],
  "/layoff-runway": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "Layoff pay and documents" }],
  "/home-loan-stress-test": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/career-switches-and-education", label: "Compare a career-change cost" }],
  "/resign-or-stay": [{ href: "/guides/notice-period-and-return-to-office", label: "Notice-period exit steps" }, { href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }],
  "/companies": [{ href: "/guides/getting-hired-through-evidence-and-conversations", label: "Prepare hiring questions" }, { href: "/guides/notice-period-and-return-to-office", label: "Check written job terms" }],
  "/compass": [{ href: "/guides/performance-reviews-and-career-choices", label: "Compare review and move options" }, { href: "/guides/career-switches-and-education", label: "Assess a career change" }],
  "/salary-drop": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/read-the-offer-beyond-ctc", label: "Separate fixed and variable pay" }],
  "/escape-plan": [{ href: "/guides/career-switches-and-education", label: "Test a career switch" }, { href: "/guides/independent-work-without-romanticising-it", label: "Test freelance work" }],
  "/career-reality-index": [{ href: "/guides/skills-passion-and-career-constraints", label: "Match a plan to your constraints" }, { href: "/guides/workplace-culture-and-boundaries", label: "Check workplace boundaries" }],
  "/ai": [{ href: "/guides/ai-at-work-questions-to-ask", label: "Ask about AI at work" }, { href: "/guides/data-science-career-claims", label: "Check data-science role claims" }],
};

export function FreshnessBadge({ label, confidence }: { label: string; confidence: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">
      <span className="pulse-dot size-1.5 rounded-full bg-primary" /> {label} · {confidence} confidence
    </span>
  );
}

export function PublicBreadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-8 min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] font-semibold text-muted-foreground">
        {items.map((item, index) => (
          <li
            key={`${item.path}-${item.name}`}
            className={`flex items-center gap-1.5 ${index === items.length - 1 ? "min-w-0 flex-1" : "shrink-0"}`}
          >
            {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {index === items.length - 1 ? (
              <span aria-current="page" className="min-w-0 whitespace-normal break-words text-foreground">{item.name}</span>
            ) : (
              <Link href={item.path} className="whitespace-nowrap transition-colors hover:text-primary">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="cr-public-footer">
      <div className="cr-footer-main">
        <div className="cr-footer-identity">
          <svg className="cr-footer-illustration" viewBox="0 0 320 210" aria-hidden="true">
            <path d="M27 177c34-37 63-50 98-39 31 10 40 39 76 35 29-3 47-21 92-8v33H27z" fill="#dce8df" />
            <path d="M27 191c47-27 80-22 112-10 41 15 72 12 154-10v37H27z" fill="#c5d9ce" />
            <circle cx="235" cy="52" r="27" fill="#e9d9b7" />
            <path d="M75 158c23-9 42-9 65-3 21 6 31 12 48 7 17-5 24-19 44-19" fill="none" stroke="#b9864f" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 13" />
            <path d="M160 154c-2-18 1-33 8-46" fill="none" stroke="#1f716a" strokeWidth="5" strokeLinecap="round" />
            <path d="M166 122c-20 0-30-10-30-26 17 0 29 8 30 26Z" fill="#1f716a" />
            <path d="M166 112c1-19 13-29 30-28 0 17-11 28-30 28Z" fill="#3f9180" />
            <path d="M166 96c-13-8-15-21-7-34 13 8 17 20 7 34Z" fill="#76a88e" />
            <path d="M159 156c-14-10-25-8-33 4 12 10 25 9 33-4Z" fill="#8eae94" />
            <path d="M172 148c13-12 25-12 35-2-10 13-23 15-35 2Z" fill="#5e9a80" />
            <path d="M57 84h18m-9-9v18M268 113h14m-7-7v14" stroke="#1f716a" strokeWidth="2" strokeLinecap="round" opacity=".7" />
            <circle cx="103" cy="63" r="3" fill="#b9864f" />
            <circle cx="250" cy="145" r="3" fill="#b9864f" />
          </svg>
          <Logo />
          <p className="cr-footer-pun">Don’t leaf your next move to chance.</p>
          <span className="cr-footer-tagline">Rooted in evidence. Growing on your terms.</span>
          <span className="cr-footer-place">A career desk for India&nbsp; / &nbsp;₹</span>
        </div>
        <nav aria-label="Public CareerReality navigation" className="cr-footer-directory">
          {publicSiteMap.map((section) => (
            <section key={section.label} className="cr-footer-directory-section" data-section={section.label.toLowerCase()}>
              <h2 className="cr-footer-directory-heading">{section.label}</h2>
              <ul className="cr-footer-directory-links">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="cr-footer-directory-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <div className="cr-footer-bottom">
        <span>© 2026 CareerReality&nbsp; / &nbsp;India</span>
        <span>Useful evidence. Human judgment.</span>
      </div>
      <p className="cr-footer-disclaimer">CareerReality provides educational tools and editorial guidance, not individual legal, tax, or financial advice.</p>
    </footer>
  );
}

export function PublicPage({
  eyebrow,
  title,
  intro,
  children,
  seo,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  seo?: Partial<SeoConfig>;
}) {
  const currentPath = typeof window === "undefined" ? "/" : window.location.pathname;
  const routeSeo = getRouteSeo(currentPath);
  const rawGuideKey = currentPath.replace(/\/+$/, "") || "/";
  const guideKey = ({ "/tools/ctc": "/salary-calculator", "/tools/risk": "/resign-or-stay", "/tools/layoffs": "/layoff-runway" } as Record<string, string>)[rawGuideKey] ?? rawGuideKey;
  const routeDefinition = routeRegistry.routes.find((route) => route.path === guideKey);
  const breadcrumbs = seo?.breadcrumbs ?? (
    guideKey === "/companies"
      ? [
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "Employer check", path: currentPath },
        ]
      : [
          { name: "Home", path: "/" },
          { name: routeDefinition?.title ?? title, path: currentPath },
        ]
  );
  const pageIntro = routeDefinition && (routeDefinition.kind === "tool" || routeDefinition.kind === "guide")
    ? routeDefinition.description
    : intro;
  const toolGuide = toolGuides[guideKey] ?? (guideKey.startsWith("/companies/") ? toolGuides["/companies"] : undefined);
  const relatedPages = routeDefinition?.kind === "tool" ? toolRelatedPages[guideKey] : undefined;
  useSeo({
    title: seo?.title ?? routeSeo.title ?? title,
    description: seo?.description ?? routeSeo.description ?? intro ?? "Career intelligence for consequential decisions in India.",
    path: seo?.path ?? currentPath,
    noIndex: seo?.noIndex ?? routeSeo.noIndex,
    breadcrumbs,
    article: seo?.article,
    faqs: seo?.faqs ?? toolGuide?.faqs,
  });

  return (
    <div className="grain min-h-[100dvh] overflow-x-hidden">
      <AppNav />
      <main className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
        <PublicBreadcrumbs items={breadcrumbs} />
        <div className="reveal relative">
          <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-secondary/45 blur-3xl" />
          <p className="relative font-data text-[10px] uppercase tracking-[.2em] text-primary">{eyebrow}</p>
          <h1 className="relative mt-4 max-w-[820px] font-display text-[52px] leading-[.92] tracking-[-.05em] sm:text-[78px]">{title}</h1>
          {pageIntro && <p className="mt-6 max-w-[640px] text-[14px] leading-[1.75] text-muted-foreground">{pageIntro}</p>}
        </div>
        <div className="reveal reveal-3 mt-12">{children}</div>
        {relatedPages && <nav className="mt-10 rounded-2xl border border-border bg-card p-5" aria-label="Related guides and rules"><h2 className="font-display text-2xl">Related guides and rules</h2><ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-sm">{relatedPages.map((page) => <li key={page.href}><Link href={page.href} className="font-semibold text-primary underline underline-offset-4">{page.label}</Link></li>)}</ul></nav>}
        {toolGuide && <ToolGuideSection guide={toolGuide} />}
      </main>
      <PublicFooter />
    </div>
  );
}

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const visual = article.editorial.visual;
  const leadItem = visual.items[0];
  const treatment = visual.kind === "comparison"
    ? "bg-secondary/45"
    : visual.kind === "timeline"
      ? "bg-primary/[.06]"
      : visual.kind === "decision-map"
        ? "bg-accent/[.08]"
        : "bg-card";
  return (
    <Link
      href={`/article/${article.slug}`}
      onClick={() => trackEvent("article_discovered", { catalog_slug: article.slug, route: window.location.pathname })}
      data-testid={`link-article-card-${article.slug}`}
      className={`article-card surface-lift group flex h-full flex-col rounded-[18px] border border-border p-5 hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${featured ? "article-card-featured" : ""} ${treatment}`}
    >
      <div className="article-card-topline flex items-center justify-between gap-3"><span className="font-data text-[9px] uppercase tracking-[.14em] text-primary">{article.category.replaceAll("-", " ")}</span><span className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">{visual.kind.replace("-", " ")}</span></div>
      <div className="article-card-signal mt-6 flex items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div><p className="font-data text-[8px] uppercase tracking-[.16em] text-muted-foreground">{visual.label}</p><p className="mt-1 font-display text-3xl leading-none tracking-[-.04em]">{leadItem.value}</p></div>
        <Clock3 size={14} className="mb-1 text-muted-foreground" />
      </div>
      <h3 data-testid={`text-article-title-${article.slug}`} className="mt-6 font-display text-[27px] leading-[.98] tracking-[-.03em]">{article.title}</h3>
      <p className="mt-4 line-clamp-3 text-[12px] leading-[1.7] text-muted-foreground">{article.excerpt}</p>
      <p className="mt-4 line-clamp-2 border-l-2 border-primary/35 pl-3 text-[11px] leading-[1.6] text-foreground/70">{article.editorial.takeaway}</p>
       <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-[10px] text-muted-foreground"><span>{article.date ? `${article.date} · ` : "Date not verified · "}{article.readTime}</span><ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
    </Link>
  );
}

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
        trackEvent(eventName, {
          content_kind: kind,
          route: window.location.pathname,
        });
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
    add.mutate(
      { data: { company, signal, note } },
      {
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
      },
    );
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
