import { Link } from "wouter";
import { ChevronRight, Clock3, ArrowUpRight } from "lucide-react";
import type { Article } from "@/data/public-content";
import { AppNav } from "@/components/shared/app-nav";
import { trackEvent } from "@/lib/analytics";
import routeRegistry from "@/data/route-registry";
import { getRouteSeo, useSeo, type Breadcrumb, type SeoConfig } from "@/lib/seo";
import { ToolGuideSection, toolGuides } from "@/components/shared/tool-guide";
import { PublicFooter } from "@/components/shared/public-footer";
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
