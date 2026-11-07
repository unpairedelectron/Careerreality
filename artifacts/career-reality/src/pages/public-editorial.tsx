import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Redirect, useParams } from "wouter";
import { ArrowLeft, ArrowUpRight, BadgeCheck, BookOpen, CircleAlert, Database, FileCheck2, LockKeyhole, MessageSquare, Scale, Search, ShieldCheck } from "lucide-react";
import { ArticleCard, FreshnessBadge, PublicBreadcrumbs, PublicPage } from "@/components/shared/public-shell";
import { PublicFooter } from "@/components/shared/public-footer";
import { SaveDecisionButton } from "@/components/shared/public-actions";
import { AppNav } from "@/components/shared/app-nav";
import { articleCategories, articles, getArticle, toolsCatalog } from "@/data/public-content";
import { getArticleHeroImage } from "@/data/article-hero-images";
import routeRegistry from "@/data/route-registry";
import { getLegacyArticleReplacement } from "@/data/legacy-routes";
import { trackEvent, trackNextAction } from "@/lib/analytics";
import { useSeo } from "@/lib/seo";

export function TopicClustersPage() {
  const [selected, setSelected] = useState("all");
  if (window.location.pathname.replace(/\/+$/, "").endsWith("/topic-clusters")) return <Redirect to="/guides" />;
  const featured = selected === "all" ? articles : articles.filter((article) => article.category === selected);
  return <PublicPage eyebrow="Editorial / discovery" title="Follow a question, not an algorithm." intro="CareerReality's editorial desk is organised around the decisions people are actually making: money, momentum, skill, risk, and what comes next.">
    <div className="flex flex-wrap gap-2">{[["all", "All clusters"], ...articleCategories.map((item) => [item.value, item.label])].map(([value, label]) => <button key={value} aria-pressed={selected === value} onClick={() => setSelected(value)} className={`rounded-full border px-4 py-2 text-[11px] font-bold transition-colors ${selected === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{label}</button>)}</div>
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featured.slice(0, 12).map((article) => <ArticleCard key={article.slug} article={article} />)}</div>
    <div className="mt-10 rounded-[20px] border border-border bg-secondary/35 p-6 sm:p-8"><div className="flex items-start gap-4"><BookOpen className="mt-1 text-primary" size={20} /><div><p className="font-display text-3xl">Start with the offer in front of you.</p><p className="mt-3 max-w-[680px] text-[12px] leading-[1.7] text-muted-foreground">Use the CTC calculator for an input-based estimate, then review its assumptions and limits. Company and salary-market data remain withheld.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/salary-calculator" onClick={() => trackNextAction("salary-calculator")} className="text-[11px] font-bold text-primary">1. Estimate CTC <ArrowUpRight size={13} /></Link><Link href="/methodology" onClick={() => trackNextAction("methodology")} className="text-[11px] font-bold text-primary">2. Check assumptions <ArrowUpRight size={13} /></Link><Link href="/sources" onClick={() => trackNextAction("sources")} className="text-[11px] font-bold text-primary">3. Review sources <ArrowUpRight size={13} /></Link></div></div></div></div>
  </PublicPage>;
}

export function ArticlesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  if (window.location.pathname.replace(/\/+$/, "").endsWith("/articles")) return <Redirect to="/guides" />;
  const filtered = articles.filter((article) => `${article.title} ${article.excerpt} ${article.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (category === "all" || article.category === category));
  const isDefaultDesk = !query && category === "all";
  return (
    <PublicPage eyebrow="Editorial / all reads" title="The reality desk." intro="Sharp, useful writing for the parts of a career that do not fit neatly into a job description.">
      <div className="articles-toolbar">
        <label className="articles-toolbar-search flex items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search size={16} className="text-muted-foreground" />
          <span className="sr-only">Search articles</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by question, role, or signal" className="h-12 w-full bg-transparent text-sm outline-none" />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-card px-4 text-[11px] font-bold md:w-auto">
            <option value="all">All categories</option>
            {articleCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="articles-toolbar-note flex items-center justify-between gap-4 font-data text-[9px] uppercase tracking-[.14em] text-muted-foreground">
          <span>{filtered.length} {filtered.length === 1 ? "read" : "reads"} in the desk</span>
          <span className="hidden sm:inline">Updated with the question, not the headline</span>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="mt-7 rounded-[18px] border border-border p-12 text-center">
          <p className="font-display text-3xl">That search is quiet.</p>
          <p className="mt-2 text-[12px] text-muted-foreground">Try a role, a money question, or a category.</p>
        </div>
      ) : (
        <div className="article-grid mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => <ArticleCard key={article.slug} article={article} featured={isDefaultDesk && index === 0} />)}
        </div>
      )}
    </PublicPage>
  );
}

function EditorialFigure({ article }: { article: (typeof articles)[number] }) {
  const { visual } = article.editorial;
  return (
    <figure className="article-figure paper-grid mt-12 rounded-[22px] border border-border bg-card p-5 sm:p-8" aria-labelledby={`figure-title-${article.slug}`} data-testid={`figure-editorial-${article.slug}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">{visual.label}</p>
          <h2 id={`figure-title-${article.slug}`} className="mt-2 font-display text-[31px] leading-[.98] tracking-[-.035em]">{visual.title}</h2>
        </div>
        <span data-testid={`figure-kind-${article.slug}`} className="rounded-full border border-primary/25 bg-primary/[.06] px-3 py-1.5 font-data text-[9px] uppercase tracking-[.12em] text-primary">{visual.kind.replace("-", " ")}</span>
      </div>
      <p data-testid={`figure-measurement-${article.slug}`} className="mt-4 font-data text-[9px] uppercase tracking-[.14em] text-muted-foreground">
        {visual.measurement === "source-backed" ? "Values sourced and scoped below" : "Qualitative framework · not a market measurement"}
      </p>
      {visual.variant === "ctc-breakdown" ? (
        <div className="editorial-visual editorial-visual-ctc-breakdown mt-7" data-testid={`figure-breakdown-${article.slug}`}>
          {visual.items.map((item, index) => (
            <div key={item.label} className="editorial-visual-breakdown-step">
              <span className="font-data text-[9px] uppercase tracking-[.12em] text-primary">0{index + 1}</span>
              <strong className="mt-2 font-display text-2xl leading-none tracking-[-.04em] text-foreground">{item.value}</strong>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{item.label}</span>
              <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">{item.detail}</p>
              {index < visual.items.length - 1 && <span className="editorial-visual-flow-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      ) : visual.variant === "humour-matrix" && visual.matrix ? (
        <div className="mt-7" data-testid={`figure-matrix-${article.slug}`}>
          <div className="editorial-humour-matrix" role="img" aria-label="A qualitative matrix comparing power difference and whether workplace humour is shared or one-way.">
            <span className="editorial-matrix-y-axis">{visual.matrix.yAxis.high}</span>
            <div className="editorial-matrix-grid">
              {visual.matrix.quadrants.map((quadrant) => (
                <div key={quadrant.label} className={`editorial-matrix-cell editorial-matrix-${quadrant.tone}`}>
                  <strong className="font-display text-xl leading-none tracking-[-.03em]">{quadrant.label}</strong>
                  <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">{quadrant.detail}</p>
                </div>
              ))}
            </div>
            <div className="editorial-matrix-axis-labels">
              <span>{visual.matrix.xAxis.low}</span>
              <span>{visual.matrix.xAxis.high}</span>
            </div>
            <span className="editorial-matrix-y-axis editorial-matrix-y-axis-low">{visual.matrix.yAxis.low}</span>
          </div>
        </div>
      ) : (
        <div className={`editorial-visual editorial-visual-${visual.kind} ${visual.variant ? `editorial-visual-${visual.variant}` : ""} mt-7`}>
          {visual.items.map((item, index) => (
            <div key={item.label} className="editorial-visual-item">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">{item.label}</span>
                <strong className="font-display text-2xl leading-none tracking-[-.04em] text-foreground">{item.value}</strong>
              </div>
              {visual.measurement === "source-backed" ? (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                  <span className="block h-full rounded-full bg-primary transition-transform" style={{ width: `${Math.max(18, ((Number.parseInt(item.value, 10) || index + 1) / Math.max(...visual.items.map((entry) => Number.parseInt(entry.value, 10) || 0), 1)) * 100)}%` }} />
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-data text-[8px] uppercase tracking-[.12em] text-muted-foreground">lens</span>
                </div>
              )}
              <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      )}
      {visual.callouts && visual.callouts.length > 0 && (
        <div className="editorial-visual-callouts mt-7" data-testid={`figure-callouts-${article.slug}`}>
          {visual.callouts.map((callout) => {
            const source = article.editorial.sources.find((item) => item.publisher === callout.sourcePublisher);
            return (
              <div key={callout.label} className="editorial-visual-callout">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-data text-[9px] uppercase tracking-[.12em] text-primary">{callout.label}</span>
                  <strong className="font-display text-2xl leading-none tracking-[-.04em]">{callout.value}</strong>
                </div>
                <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">{callout.detail}</p>
                {source && <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-[10px] font-bold text-primary underline-offset-4 hover:underline">{source.publisher} · {source.date} <ArrowUpRight size={12} className="ml-1" /></a>}
              </div>
            );
          })}
        </div>
      )}
      {visual.guide && visual.guide.length > 0 && (
        <div className="editorial-visual-guide mt-7" data-testid={`figure-guide-${article.slug}`}>
          <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Power and risk check</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {visual.guide.map((step) => (
              <div key={step.question} className="rounded-xl border border-border bg-card/70 p-4">
                <p className="font-semibold text-[11px]">{step.question}</p>
                <p className="mt-2 font-display text-lg leading-tight">{step.answer}</p>
                <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <table className="mt-7 w-full border-collapse text-left text-[11px] sm:hidden">
        <caption className="mb-2 text-left font-data text-[9px] uppercase tracking-[.14em] text-muted-foreground">Text equivalent</caption>
        <tbody>
          {visual.items.map((item) => <tr key={item.label} className="border-t border-border"><th scope="row" className="py-2 pr-3 font-semibold">{item.label}</th><td className="py-2 text-muted-foreground">{item.value} — {item.detail}</td></tr>)}
        </tbody>
      </table>
      <figcaption className="mt-6 border-t border-border pt-4 text-[11px] leading-[1.7] text-muted-foreground">{visual.caption}</figcaption>
    </figure>
  );
}

function ReferenceRail({ article }: { article: (typeof articles)[number] }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Article context and references">
      <div className="rounded-[18px] border border-primary/25 bg-primary/[.07] p-5">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Key takeaway</p>
        <p className="mt-3 font-display text-[23px] leading-[1.08] tracking-[-.025em]">{article.editorial.takeaway}</p>
      </div>
      <div className="rounded-[18px] border border-border bg-card p-5">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">References</p>
        <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">Context sources for this brief. They are not claims of original reporting by CareerReality.</p>
        <div className="mt-4 grid gap-4">
          {article.editorial.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="group rounded-sm border-t border-border pt-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" data-testid={`link-source-${article.slug}-${source.publisher.replaceAll(" ", "-").toLowerCase()}`}>
              <span className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">{source.role === "claim" ? "Claim source" : "Context source"} · {source.publisher} · {source.date}</span>
              <span className="mt-1 block text-[12px] font-bold leading-[1.45] text-foreground group-hover:text-primary">{source.title} <ArrowUpRight className="inline" size={12} /></span>
              <span className="mt-2 block text-[11px] leading-[1.55] text-muted-foreground">Supports <strong className="font-semibold text-foreground">{source.section}</strong>: {source.supports}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="rounded-[18px] border border-border bg-secondary/35 p-5">
        <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">What to verify next</p>
        <ol className="mt-3 grid gap-3">
          {article.editorial.verifyQuestions.map((question, index) => <li key={question} className="flex gap-3 text-[11px] leading-[1.65] text-muted-foreground"><span className="font-data text-primary">0{index + 1}</span><span>{question}</span></li>)}
        </ol>
      </div>
    </aside>
  );
}

function firstSentence(value: string): string {
  return value.match(/.*?[.!?](?:\s|$)/)?.[0].trim() ?? value;
}

function ArticleRealityCheck({ article }: { article: (typeof articles)[number] }) {
  const riskSection = article.sections.find((section) => section.heading === "What the headline leaves out");
  return (
    <>
      <section className="mt-10 rounded-[20px] border border-primary/25 bg-primary/[.07] p-5 sm:p-7" aria-labelledby={`reality-check-${article.slug}`} data-testid={`reality-check-${article.slug}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">Reality check</p>
        <span className="font-data text-[9px] uppercase tracking-[.12em] text-muted-foreground">Read before acting</span>
      </div>
      <h2 id={`reality-check-${article.slug}`} className="mt-3 font-display text-3xl leading-[.98] tracking-[-.035em]">The useful answer has edges.</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Bottom line</p>
          <p className="mt-2 text-[12px] leading-[1.7]">{article.editorial.takeaway}</p>
        </div>
        <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Who this matters to</p>
          <p className="mt-2 text-[12px] leading-[1.7]">People weighing {article.editorial.primaryIntent} and deciding which evidence to check next.</p>
        </div>
        <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Biggest risk</p>
          <p className="mt-2 text-[12px] leading-[1.7]">{riskSection?.body.trim() ? firstSentence(riskSection.body) : "The headline may hide important context that changes the decision."}</p>
        </div>
        <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
          <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">What to verify</p>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-[1.6]">
            {article.editorial.verifyQuestions.slice(0, 3).map((question) => <li key={question} className="flex gap-2"><span className="text-primary">•</span><span>{question}</span></li>)}
          </ul>
        </div>
      </div>
      </section>
      {article.editorialEnhancement && (
        <section className="mt-8 rounded-[18px] border border-primary/20 bg-primary/[.05] p-5 sm:p-7" aria-labelledby={`editorial-scope-${article.slug}`} data-testid={`editorial-scope-${article.slug}`}>
          <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">Editorial scope</p>
          <h2 id={`editorial-scope-${article.slug}`} className="mt-3 font-display text-3xl leading-[1.02] tracking-[-.03em]">What this page adds</h2>
          <p className="mt-4 text-[13px] leading-[1.75]">{article.editorialEnhancement.angle}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
              <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Reader outcome</p>
              <p className="mt-2 text-[12px] leading-[1.7]">{article.editorialEnhancement.readerOutcome}</p>
            </div>
            <div className="rounded-[14px] border border-primary/15 bg-background/35 p-4">
              <p className="font-data text-[9px] uppercase tracking-[.14em] text-primary">Evidence boundary</p>
              <p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">{article.editorialEnhancement.evidenceBoundary}</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ArticleDecisionSummary({ article }: { article: (typeof articles)[number] }) {
  const decisionSection = article.sections.find((section) => section.heading === "The decision this changes");
  return (
    <section className="mt-14 border-t border-border pt-8" aria-labelledby={`decision-summary-${article.slug}`} data-testid={`decision-summary-${article.slug}`}>
      <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">Decision summary</p>
      <h2 id={`decision-summary-${article.slug}`} className="mt-3 font-display text-4xl leading-[.95] tracking-[-.04em]">What changes after you read this?</h2>
      <p className="mt-4 max-w-[760px] text-[13px] leading-[1.8] text-muted-foreground">{decisionSection?.body.trim() ? decisionSection.body : article.editorial.takeaway}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/category/${article.category}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold hover:border-primary">Read the wider topic <ArrowUpRight size={13} /></Link>
        <Link href="/compass" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">Open the Compass <ArrowUpRight size={13} /></Link>
        {article.slug === "what-20-lpa-actually-feels-like-india-purchasing-power" && <Link href="/salary-calculator" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[.06] px-4 py-2.5 text-[11px] font-bold text-primary">Use the salary calculator <ArrowUpRight size={13} /></Link>}
        {(article.slug === "tech-lead-trap-responsibility-authority" || article.slug === "manager-vs-ic-career-path-india") && <Link href="/salary-calculator" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[.06] px-4 py-2.5 text-[11px] font-bold text-primary">Decode the pay mix behind an offer <ArrowUpRight size={13} /></Link>}
        {(article.slug === "tech-lead-trap-responsibility-authority" || article.slug === "manager-vs-ic-career-path-india") && <Link href="/article/what-20-lpa-actually-feels-like-india-purchasing-power" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[.06] px-4 py-2.5 text-[11px] font-bold text-primary">Read the ₹20 LPA take-home illustration <ArrowUpRight size={13} /></Link>}
      </div>
    </section>
  );
}

export function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const article = getArticle(slug);
  const archivedArticle = routeRegistry.drafts.articles.some((record) => record.slug === slug);
  const archivedHeroImage = archivedArticle ? getArticleHeroImage(slug) : undefined;
  const redirect = routeRegistry.redirects.find((entry) => entry.from.replace(/\/+$/, "") === `/article/${slug}`);
  const legacyReplacement = getLegacyArticleReplacement(slug);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Articles", path: "/articles" },
    { name: article?.editorial.h1 ?? legacyReplacement?.title ?? "Story not found", path: article ? `/article/${article.slug}` : `/article/${slug}` },
  ];
  useSeo({
    title: article?.editorial.seoTitle ?? legacyReplacement?.title ?? "Story not found",
    description: article?.editorial.metaDescription ?? legacyReplacement?.description ?? "Explore CareerReality's editorial desk for practical, evidence-aware career decisions in India.",
    path: article ? `/article/${article.slug}` : `/article/${slug}`,
    noIndex: article || archivedArticle ? true : !legacyReplacement,
    breadcrumbs,
    article: article
      ? {
        headline: article.editorial.h1,
        description: article.editorial.metaDescription,
        datePublished: article.editorial.datePublished,
        dateModified: article.editorial.dateModified,
        section: article.category,
        keywords: [article.editorial.primaryIntent, ...article.tags],
         citations: article.editorial.sources.map((source) => ({ name: source.title, url: source.url })),
      }
      : undefined,
  });

  if (redirect) return <Redirect to={redirect.to} />;

  if (!article && archivedArticle) return <PublicPage eyebrow="Editorial / unavailable" title="This article is not published." intro="This article remains at its original URL while editorial review is incomplete. Its text is withheld until its sources, authorship, dates, and approvals are verified.">
    {archivedHeroImage && <figure className="mt-7 overflow-hidden rounded-[20px] border border-border bg-card">
      <img src={archivedHeroImage.src} alt={archivedHeroImage.alt} className="aspect-[16/8] w-full object-cover" loading="eager" decoding="async" />
      <figcaption className="px-4 py-2.5 text-[10px] text-muted-foreground">AI-generated editorial illustration; not documentary photography.</figcaption>
    </figure>}
    <Link href="/tools" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">View current tools <ArrowUpRight size={14} /></Link>
  </PublicPage>;

  if (!article && legacyReplacement) {
    return <PublicPage seo={{ title: legacyReplacement.title, description: legacyReplacement.description, path: `/article/${slug}` }} eyebrow={legacyReplacement.eyebrow} title={legacyReplacement.title} intro={legacyReplacement.description}><div className="grid gap-5 lg:grid-cols-[1fr_.72fr]"><div className="rounded-[20px] border border-primary/25 bg-primary/[.07] p-6 sm:p-8"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Indexed route retained</p><p className="mt-7 max-w-[620px] font-display text-3xl leading-[1.05] tracking-[-.03em]">The story moved, but the question still has a place here.</p><p className="mt-5 max-w-[620px] text-[13px] leading-[1.75] text-muted-foreground">{legacyReplacement.summary}</p></div><div className="rounded-[20px] border border-border bg-card p-6 sm:p-8"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Closest current feature</p><Link href={legacyReplacement.destination} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">{legacyReplacement.destinationLabel}<ArrowUpRight size={14} /></Link></div></div></PublicPage>;
  }

  if (!article) return <Redirect to="/guides" />;
    return (
      <div className="grain min-h-[100dvh]">
        <AppNav />
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="pt-5">
            <Link href="/tools" className="inline-flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground" data-testid="link-all-articles">
              <ArrowLeft size={14} /> Current tools
            </Link>
          </div>
        </div>
        <main className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-20">
          <PublicBreadcrumbs items={breadcrumbs} />
          <header className="animate-enter grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-data text-[9px] uppercase tracking-[.16em] text-primary">{article.category.replaceAll("-", " ")}</span>
                {article.editorial.datePublished
                  ? <FreshnessBadge label={`Published ${article.editorial.datePublished}`} confidence="Medium" />
                  : <span className="rounded-full border border-border px-3 py-1 font-data text-[9px] uppercase tracking-[.1em] text-muted-foreground">Publication and substantive update dates not verified</span>}
              </div>
              <h1 data-testid={`heading-article-${article.slug}`} className="mt-6 max-w-[900px] font-display text-[52px] leading-[.9] tracking-[-.05em] sm:text-[80px]">{article.editorial.h1}</h1>
            </div>
            <div>
              <p className="max-w-[540px] text-[16px] leading-[1.75] text-muted-foreground">{article.editorial.metaDescription}</p>
              {article.slug === "what-20-lpa-actually-feels-like-india-purchasing-power" && (
                <Link href="/salary-calculator" data-testid="link-salary-calculator-hero" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Use the salary calculator <ArrowUpRight size={14} />
                </Link>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="font-data text-[10px] text-muted-foreground">{article.readTime} · Author and reviewer details not verified</span>
                <SaveDecisionButton slug={article.slug} title={article.title} />
              </div>
            </div>
          </header>
          <aside
            className="mt-8 rounded-[18px] border border-amber-500/30 bg-amber-500/[.06] p-5 text-[12px] leading-[1.75]"
            role="status"
            data-testid={`article-review-hold-${article.slug}`}
          >
            <p className="font-data text-[9px] uppercase tracking-[.16em] text-amber-700">Staging draft · noindex</p>
            <p className="mt-2 font-bold">This article is not approved for publication.</p>
            <p className="mt-2 text-muted-foreground">
              Its URL is retained while claim-level sourcing, originality, authorship, and publication history are reviewed. The content and existing links are not being silently deleted or redirected.
            </p>
          </aside>
          {article.heroImage && (
            <figure className="mt-8 overflow-hidden rounded-[22px] border border-border bg-card">
              <img
                src={article.heroImage.src}
                alt={article.heroImage.alt}
                className="aspect-[16/8] w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <figcaption className="px-4 py-2.5 text-[10px] text-muted-foreground">
                AI-generated editorial illustration; not documentary photography.
              </figcaption>
            </figure>
          )}
          <EditorialFigure article={article} />
          <ArticleRealityCheck article={article} />
          <div className="mt-10 rounded-[18px] border border-primary/25 bg-primary/[.07] p-5 text-[12px] leading-[1.7]">
            <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Editorial format</p>
            <p className="mt-3">This is a long-form editorial article, not a claim of original reporting. It preserves the original CareerReality desk brief, adds practical context, and keeps uncertainty visible. <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary">Open the lead context source <ArrowUpRight className="inline" size={13} /></a></p>
          </div>
          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,780px)_320px] lg:items-start">
            <article className="prose prose-stone max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:tracking-[-.03em] prose-headings:text-foreground prose-p:text-[15px] prose-p:leading-[1.9] prose-p:text-foreground/80 prose-a:text-primary">
              <p className="lead">{article.excerpt}</p>
              {article.sections.map((section) => {
                const supportingSources = article.editorial.sources.filter((source) => source.section === section.heading);
                if (!section.body.trim() && supportingSources.length === 0) return null;
                return (
                  <section key={section.heading} className="mt-12">
                    <h2>{section.heading}</h2>
                    {section.body.trim() && <p>{section.body}</p>}
                    {supportingSources.length > 0 && (
                      <p className="mt-3 border-l-2 border-primary/35 pl-3 text-[11px] leading-[1.6] text-muted-foreground">
                        <strong className="font-semibold text-foreground">Source context:</strong>{" "}
                        {supportingSources.map((source, index) => (
                          <span key={source.url}>
                            {index > 0 ? " · " : ""}
                            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} ({source.date})</a> — {source.supports}
                          </span>
                        ))}
                      </p>
                    )}
                  </section>
                );
              })}
            </article>
            <ReferenceRail article={article} />
          </div>
          <ArticleDecisionSummary article={article} />
          <div className="mt-14 border-t border-border pt-8">
            <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Keep reading</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {article.editorial.relatedSlugs.map((slug) => {
                const item = getArticle(slug);
                return item ? <ArticleCard key={item.slug} article={item} /> : null;
              })}
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
}

export function CategoryPage() {
  const params = useParams<{ slug: string }>();
  if (window.location.pathname.includes("/category/")) return <Redirect to="/guides" />;
  const slug = params.slug ?? "career-reality-checks";
  const category = articleCategories.find((item) => item.value === slug) ?? articleCategories[0];
  const filtered = articles.filter((article) => article.category === category.value);
  return <PublicPage eyebrow="Editorial / category" title={category.label} intro="A focused archive of reads for the questions inside this part of working life."><div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5"><p className="text-[12px] text-muted-foreground">{filtered.length} reads in this desk · publication dates not verified</p></div><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((article) => <ArticleCard key={article.slug} article={article} />)}</div></PublicPage>;
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const toolResults = normalized
    ? toolsCatalog.filter((tool) => tool.slug === "ctc-calculator" && `${tool.title} ${tool.description}`.toLowerCase().includes(normalized))
    : [];
  useEffect(() => {
    if (normalized) {
      trackEvent("search_results_viewed", {
        route: "/search",
        article_results: 0,
        tool_results: toolResults.length,
      });
    }
  }, [normalized, toolResults.length]);
  return <PublicPage eyebrow="Search active pages" title="Search the active directory." intro="This page searches only currently featured tools. Quarantined articles and unverified company records are excluded. No account is needed."><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3"><Search size={17} className="text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search active tools and pages" placeholder="Try CTC, tax, PF, or offer" className="h-14 w-full bg-transparent text-base outline-none" /></div>{!normalized ? <div className="mt-8 border-l-2 border-primary pl-5"><p className="font-display text-3xl">Search what is available now.</p><p className="mt-3 max-w-[620px] text-base leading-7 text-muted-foreground">The current catalogue contains the CTC calculator. Other tools remain unfeatured until their methods and data pass review.</p></div> : toolResults.length === 0 ? <div className="mt-8 border-l-2 border-border pl-5"><p className="font-display text-3xl">No active page matches.</p><p className="mt-2 text-base text-muted-foreground">Try “CTC”, “tax”, “PF”, or “offer”.</p></div> : <div className="mt-8"><p className="text-sm font-semibold text-primary">Active tools · {toolResults.length}</p><div className="mt-4 grid gap-3">{toolResults.map((tool) => <Link key={tool.slug} href={tool.href} onClick={() => trackEvent("tool_discovered", { catalog_slug: tool.slug, route: "/search" })} className="border-b border-border bg-card py-4 transition-colors hover:border-primary/50"><span className="text-xs font-semibold text-primary">{tool.label}</span><p className="mt-2 font-display text-2xl">{tool.title}</p><p className="mt-1 text-base leading-7 text-muted-foreground">{tool.description}</p></Link>)}</div></div>}</PublicPage>;
}

type TrustKind = "about" | "editorial" | "privacy" | "terms" | "contact";

type TrustPageMeta = {
  eyebrow: string;
  title: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  breadcrumbs: { name: string; path: string }[];
};

const trustPageMeta: Record<TrustKind, TrustPageMeta> = {
  about: {
    eyebrow: "The desk / about",
    title: "CareerReality: current release-candidate scope.",
    intro: "The local release candidate features a CTC calculator. Editorial articles and unsupported company and market records are withheld; operating details remain unverified.",
    seoTitle: "About CareerReality | Current Scope",
    seoDescription: "See what this local release candidate contains, what remains withheld, and which operating details have not been verified.",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "About CareerReality", path: "/about" }],
  },
  editorial: {
    eyebrow: "Trust / editorial standards",
    title: "Editorial rules for a future publication.",
    intro: "These are proposed evidence and disclosure rules for future content, not proof of past authoring, review, or correction practices.",
    seoTitle: "Editorial Standards and Sources | CareerReality",
    seoDescription: "Read the publication rules for sourcing and uncertainty; archived articles remain withheld because their authorship and review record are unverified.",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Editorial standards", path: "/editorial" }],
  },
  privacy: {
    eyebrow: "Trust / privacy",
    title: "Privacy practices are not fully verified.",
    intro: "This page records limited observations about the local code. It is not an owner-approved privacy policy or a statement of all production data practices.",
    seoTitle: "Privacy Information | CareerReality",
    seoDescription: "Review limited code-level observations and the production privacy, retention, vendor, and contact details that remain unverified.",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Privacy policy", path: "/privacy-policy" }],
  },
  terms: {
    eyebrow: "Terms / status",
    title: "Approved terms are not available.",
    intro: "The operating entity and approved legal terms have not been verified. This route is a status notice, not a contract or legal notice.",
    seoTitle: "Terms Status | CareerReality",
    seoDescription: "Approved legal terms and operating-entity details have not been verified for this release candidate.",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Terms of use", path: "/terms" }],
  },
  contact: {
    eyebrow: "The desk / contact",
    title: "No verified public inbox.",
    intro: "A monitored contact channel for corrections, privacy requests, or account questions has not been verified for this release candidate.",
    seoTitle: "Contact Status | CareerReality",
    seoDescription: "No monitored public contact channel has been verified for this release candidate. Do not send private or confidential information to addresses in older copy.",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }],
  },
};

const trustFaqs: Record<TrustKind, { question: string; answer: string }[]> = {
  about: [
    { question: "Do I need an account to use the CTC calculator?", answer: "No account is required to use the public calculator. Articles and unsupported company and market records are withheld in this local release candidate." },
    { question: "Is the CTC estimate payroll or tax advice?", answer: "No. It is an estimate based on the inputs and assumptions shown. Verify the offer and applicable tax and payroll treatment with a qualified professional." },
  ],
  editorial: [
    { question: "Are archived articles reviewed and ready to publish?", answer: "No. The 44 article records remain quarantined. The supplied records do not establish real authors, publication dates, or human review." },
    { question: "How can I challenge a claim?", answer: "No monitored public correction channel was verified for this review. This page does not provide a working submission route." },
  ],
  privacy: [
    { question: "Is this an owner-approved privacy policy?", answer: "No. These are limited observations about the local code, not verified production practices or an approved policy." },
    { question: "Where can I send a privacy request?", answer: "Use the contact form and select Privacy request. The form stores your message; a receipt does not confirm review, action, or a response time." },
  ],
  terms: [
    { question: "Are approved terms available?", answer: "No. The operating entity and approved legal terms were not verified for this release candidate. This page is not a contract or legal notice." },
    { question: "Is the calculator a guarantee?", answer: "No. It is an estimate, not a guarantee or professional advice." },
  ],
  contact: [
    { question: "Can I submit a correction here?", answer: "Yes. The contact form stores correction requests and confirms storage only. A monitored review process or response time has not been verified." },
    { question: "What does the receipt confirm?", answer: "It confirms the form stored your message and receipt time. It does not confirm that someone has reviewed or acted on it." },
  ],
};

function TrustSection({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-9 sm:pt-12">
      {eyebrow && <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">{eyebrow}</p>}
      <h2 className="mt-3 max-w-[760px] font-display text-[34px] leading-[.98] tracking-[-.035em] sm:text-[46px]">{title}</h2>
      <div className="mt-5 max-w-[790px] text-[13px] leading-[1.85] text-muted-foreground">{children}</div>
    </section>
  );
}

function TrustIndex({ kind }: { kind: TrustKind }) {
  const links: Record<TrustKind, { href: string; label: string }[]> = {
    about: [
      { href: "#purpose", label: "Current release scope" },
      { href: "#product", label: "Available product" },
      { href: "#evidence", label: "What is and is not verified" },
      { href: "#boundaries", label: "Operator and commercial status" },
    ],
    editorial: [
      { href: "#hierarchy", label: "Evidence hierarchy" },
      { href: "#labels", label: "Labels and calculations" },
      { href: "#process", label: "Corrections and challenge" },
      { href: "#ai", label: "AI assistance" },
    ],
    privacy: [
      { href: "#surfaces", label: "Current scope" },
      { href: "#data", label: "Data not verified" },
      { href: "#controls", label: "Retention and requests" },
      { href: "#security", label: "Security status" },
    ],
    terms: [
      { href: "#status", label: "Approved terms status" },
      { href: "#calculator", label: "Calculator boundary" },
      { href: "#owner-review", label: "Owner review" },
    ],
    contact: [
      { href: "#routes", label: "Active route status" },
      { href: "#useful", label: "Required before launch" },
      { href: "#dont-send", label: "What not to send" },
      { href: "#response", label: "Response status" },
    ],
  };
  return (
    <nav aria-label="On this page" className="border-y border-border py-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-data text-[9px] uppercase tracking-[.18em] text-primary">On this page</span>
        {links[kind].map((link) => <a key={link.href} href={link.href} className="text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground" data-testid={`link-trust-${link.href.slice(1)}`}>{link.label}</a>)}
      </div>
    </nav>
  );
}

function TrustAside({ kind }: { kind: TrustKind }) {
  const aside = {
    about: { icon: ShieldCheck, label: "The operating idea", title: "Useful context, not false certainty.", body: "Every answer should show what it knows, how fresh it is, and what you should verify next.", href: "/career-reality-index", link: "Read the index methodology" },
    editorial: { icon: FileCheck2, label: "Current status", title: "The archived articles are withheld.", body: "The local release candidate does not publish the archived article corpus. The operating history and human review record remain unverified.", href: "/sources", link: "Review source status" },
    privacy: { icon: LockKeyhole, label: "Privacy posture", title: "Collect less. Explain more.", body: "Public utility should not require a profile. Signed-in continuity should be intentional and visible.", href: "/workspace", link: "See the private workspace" },
    terms: { icon: Scale, label: "Current status", title: "Approved terms are unavailable.", body: "The operating entity and approved legal terms were not verified for this release candidate.", href: "/about", link: "Review current scope" },
    contact: { icon: MessageSquare, label: "Contact status", title: "No monitored inbox is verified.", body: "Do not send private, salary, account, or confidential information to an address found in older page copy.", href: "/about", link: "Review current scope" },
  }[kind];
  const Icon = aside.icon;
  return (
    <aside className="paper-grid rounded-[20px] border border-border p-6 sm:p-8">
      <Icon className="text-primary" size={23} aria-hidden="true" />
      <p className="mt-6 font-data text-[9px] uppercase tracking-[.18em] text-primary">{aside.label}</p>
      <h2 className="mt-3 font-display text-3xl leading-[1.02] tracking-[-.03em]">{aside.title}</h2>
      <p className="mt-4 text-[12px] leading-[1.75] text-muted-foreground">{aside.body}</p>
      <Link href={aside.href} className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold text-primary" data-testid={`link-trust-aside-${kind}`}>{aside.link} <ArrowUpRight size={13} /></Link>
    </aside>
  );
}

function TrustFaq({ kind }: { kind: TrustKind }) {
  return (
    <TrustSection id="faq" eyebrow="Questions we hear" title="The short answers.">
      <div className="grid gap-3 sm:grid-cols-2">
        {trustFaqs[kind].map((faq, index) => (
          <details key={faq.question} className="group rounded-[16px] border border-border bg-card p-5" open={index === 0}>
            <summary className="cursor-pointer list-none pr-5 text-[12px] font-bold text-foreground marker:hidden">{faq.question}<span className="float-right text-primary transition-transform group-open:rotate-45">+</span></summary>
            <p className="mt-3 text-[12px] leading-[1.75] text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </TrustSection>
  );
}

function AboutTrust() {
  return (
    <div className="space-y-10">
      <TrustSection id="purpose" eyebrow="Why this exists" title="A decision desk for the part after the headline.">
        <p>This local release candidate exposes a CTC calculator and a set of decision prompts. The archived editorial corpus, company signals, and unsupported market records are withheld because their evidence and provenance have not been established for publication.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] border border-primary/20 bg-primary/[.06] p-5"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Available here</p><p className="mt-3 text-[12px] leading-[1.7] text-foreground">A user-entered CTC estimate, with visible assumptions and limits.</p></div>
          <div className="rounded-[16px] border border-border bg-card p-5"><p className="font-data text-[9px] uppercase tracking-[.16em] text-muted-foreground">Not established</p><p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">A verified company score, market salary benchmark, published article, or employment forecast.</p></div>
        </div>
      </TrustSection>
      <TrustSection id="product" eyebrow="Current product scope" title="One calculator; other claims stay withheld.">
        <p>The <Link href="/salary-calculator" className="font-bold text-primary">CTC calculator</Link> estimates cash from offer details entered by the user. <Link href="/offer-comparison" className="font-bold text-primary">Offer comparison</Link> is the destination for side-by-side compensation comparisons; no market salary benchmark is published. The <Link href="/layoff-radar" className="font-bold text-primary">Layoff Radar</Link> publishes no company records in this build. Decision prompts are not predictions or evidence about the labour market.</p>
        <p className="mt-4">Archived articles are not linked from this page. Account, membership, support, and privacy practices require owner verification before they can be described as established services.</p>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {[["01", "Enter", "Use written offer components; leave unknown amounts unknown."], ["02", "Check", "Read the calculator assumptions and official sources."], ["03", "Verify", "Ask a qualified payroll or tax professional about your specific case."]].map(([number, label, body]) => <div key={number} className="border-l-2 border-primary/35 pl-4"><p className="font-data text-[10px] text-primary">{number} / {label}</p><p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">{body}</p></div>)}
        </div>
      </TrustSection>
      <TrustSection id="india" eyebrow="India-first, not India-only by accident" title="The context changes the answer.">
        <p>The CTC calculator distinguishes cash from offer components such as variable pay, employer PF, gratuity, and other entered costs. It does not publish role-, city-, or experience-based market salary ranges. State professional tax and PF remain user-entered rather than inferred.</p>
        <p className="mt-4">A single estimate cannot establish an individual payroll outcome. Check the offer, the applicable rules, and any employer-specific treatment.</p>
      </TrustSection>
      <TrustSection id="evidence" eyebrow="What the desk can know" title="A useful answer has edges.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["It can show", "Calculator inputs, assumptions, and source links that are present in this build."],
            ["It cannot show", "A verified salary benchmark, company score, layoff signal, or future employment outcome."],
            ["Data status", "Archived article and unsupported company and market records remain suppressed."],
            ["Your decision", "The calculator is an estimate, not payroll approval or professional advice."],
          ].map(([label, body]) => <div key={label} className="rounded-[16px] border border-border bg-card p-5"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">{label}</p><p className="mt-3 text-[12px] leading-[1.75] text-muted-foreground">{body}</p></div>)}
        </div>
        <p className="mt-5">See <Link href="/sources" className="font-bold text-primary">Sources and data status</Link> for checked materials and withheld records.</p>
      </TrustSection>
      <TrustSection id="boundaries" eyebrow="Independence" title="Commercial boundaries are part of the product.">
        <p>The operator, ownership, funding, and commercial relationships have not been verified for this review. No independence or conflict-of-interest claim is made here. Membership is not offered in this local release candidate.</p>
      </TrustSection>
      <TrustSection id="start" eyebrow="A practical starting point" title="Start with the decision in front of you.">
        <div className="flex flex-wrap gap-3">
          <Link href="/salary-calculator" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground" data-testid="link-about-calculator">Estimate an offer <ArrowUpRight size={14} /></Link>
          <Link href="/methodology" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold" data-testid="link-about-methodology">Read assumptions <ArrowUpRight size={14} /></Link>
        </div>
      </TrustSection>
      <TrustFaq kind="about" />
    </div>
  );
}

function EditorialTrust() {
  return (
    <div className="space-y-10">
      <TrustSection id="hierarchy" eyebrow="01 / Evidence hierarchy" title="Not all signals deserve the same weight.">
        <p>We begin with primary and accountable public material where possible: company filings and statements, official policy or regulatory sources, documented announcements, and direct evidence tied to a date. Reputable reporting and specialist research can add context. Aggregated community input can reveal a pattern, but it is treated as a signal to investigate, not proof on its own.</p>
        <div className="mt-7 grid gap-3">
          {[["01", "Primary and accountable", "Official filings, company statements, regulator or government publications, and dated documents."], ["02", "Independent reporting and research", "Reporting with named sources, clear methodology, or specialist analysis that can be checked."], ["03", "Aggregated community signal", "Structured, privacy-aware contributions that may show direction or a question worth testing."], ["04", "Editorial interpretation", "Our framing, comparison, or practical explanation. It is labelled as interpretation rather than presented as a reported fact."]].map(([number, label, body]) => <div key={number} className="grid gap-2 border-b border-border pb-4 sm:grid-cols-[48px_220px_1fr]"><span className="font-data text-[10px] text-primary">{number}</span><strong className="text-[12px] text-foreground">{label}</strong><span className="text-[12px] leading-[1.7] text-muted-foreground">{body}</span></div>)}
        </div>
      </TrustSection>
      <TrustSection id="labels" eyebrow="02 / Labels travel with the claim" title="Fact, interpretation, calculation: three different things.">
        <p>A <strong className="text-foreground">reported fact</strong> is a statement supported by a named source or clearly described dataset. An <strong className="text-foreground">interpretation</strong> is the desk's explanation of what that evidence may mean in context. A <strong className="text-foreground">directional calculation</strong> is an output generated from supplied inputs and stated assumptions, such as an estimated monthly cash figure or runway.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[["Freshness", "How recently the relevant evidence or dataset was checked or refreshed. Fresh does not automatically mean correct."], ["Confidence", "Our view of evidence strength, consistency, and relevance. It is not a probability of an outcome."], ["Unavailable", "A live dataset or source could not be used reliably. We do not quietly convert absence into a reassuring answer."]].map(([label, body]) => <div key={label} className="rounded-[16px] border border-border bg-secondary/25 p-5"><p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">{label}</p><p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">{body}</p></div>)}
        </div>
        <p className="mt-5">The <Link href="/career-reality-index" className="font-bold text-primary">Career Reality Index methodology</Link> shows how satisfaction responses become a directional diagnosis. A source freshness label does not remove the need to verify a current offer or employment policy.</p>
      </TrustSection>
      <TrustSection id="community" eyebrow="03 / Community signals" title="Patterns can open a question; they do not close it.">
        <p>No verified public community-contribution workflow or review record was supplied for this release candidate. No community-derived salary or workplace signal is published here.</p>
      </TrustSection>
      <TrustSection id="india" eyebrow="04 / Context changes interpretation" title="An Indian signal needs its operating context.">
        <p>We account for the distinctions that materially affect career decisions in India: CTC versus fixed cash, variable and deferred pay, joining bonuses, notice periods, city and sector differences, public versus private employers, and the gap between an announced plan and an implemented one.</p>
        <p className="mt-4">A market-wide statement can still be wrong for a specific role, city, level, or employment arrangement. When the evidence cannot support that level of detail, we say so.</p>
      </TrustSection>
      <TrustSection id="ai" eyebrow="05 / AI assistance" title="AI can help with the desk. It does not become the source.">
        <p>The supplied project records do not establish whether AI tools were used for the quarantined articles, or whether a human reviewed them. No claim about historical authorship, AI use, or human review is made. The article corpus remains withheld.</p>
      </TrustSection>
      <TrustSection id="process" eyebrow="06 / Corrections and challenge" title="A correction is part of the record, not an embarrassment.">
        <p>The records supplied for this review do not establish a complete public correction history or a monitored correction channel. Do not treat this standards page as proof that a correction workflow is operating.</p>
      </TrustSection>
      <TrustSection id="independence" eyebrow="07 / Conflicts" title="Paid distribution should not buy a conclusion.">
        <p>Commercial relationships, subscriptions, or product placement should not determine an editorial finding. If a conflict could reasonably affect the work, it should be disclosed, managed, or the work should not proceed. We also avoid presenting employer marketing, anonymous allegations, or a single dramatic data point as a complete company verdict.</p>
      </TrustSection>
      <TrustFaq kind="editorial" />
    </div>
  );
}

function PrivacyTrust() {
  return (
    <div className="space-y-10">
      <TrustSection id="surfaces" eyebrow="01 / Two ways to use the desk" title="Public utility first. Signed-in continuity when you choose it.">
        <p>The CTC calculator and decision-prompt routes are available without an account. The wider codebase includes sign-in and workspace features, but this review did not verify production storage, retention, or privacy practices for signed-in data.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] border border-border bg-card p-5"><Database className="text-primary" size={19} /><p className="mt-4 text-[12px] font-bold">Public surfaces</p><p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">The CTC calculator works without an account. The archived articles and unsupported company and market records are withheld.</p></div>
          <div className="rounded-[16px] border border-border bg-card p-5"><LockKeyhole className="text-primary" size={19} /><p className="mt-4 text-[12px] font-bold">Account surfaces</p><p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">Sign-in and workspace routes are present in code. Their production data practices have not been verified for this review.</p></div>
        </div>
      </TrustSection>
      <TrustSection id="data" eyebrow="02 / What a feature needs" title="The input and the reason should be clear.">
        <div className="space-y-4">
          <div><h3 className="text-[13px] font-bold text-foreground">Tool inputs</h3><p className="mt-2">Calculators may need values such as role, city, experience, CTC components, expenses, notice period, or runway. Public tool use is designed to be useful without an account. Do not enter confidential employer information, credentials, or personal information about someone else.</p></div>
            <div><h3 className="text-[13px] font-bold text-foreground">Saved data</h3><p className="mt-2">The codebase contains signed-in workspace routes and a resume-processing route that is disabled by default. Resume uploads are not available through the application API. Data inventory, retention, deletion, backups, access controls, and production configuration for other account data were not verified.</p></div>
           <div><h3 className="text-[13px] font-bold text-foreground">Contributions</h3><p className="mt-2">No verified public contribution workflow was established for this review. No contribution-derived company or salary data is published in this release candidate.</p></div>
        </div>
      </TrustSection>
      <TrustSection id="analytics" eyebrow="03 / Product measurement" title="Analytics should describe the product, not your private life.">
        <p>In the inspected CTC calculator code, event calls contain event names and route or catalogue labels, not entered salary amounts. Deployment-level analytics configuration, event destinations, retention, and any wider site measurement were not verified.</p>
      </TrustSection>
      <TrustSection id="storage" eyebrow="04 / Browser storage and services" title="Small pieces of storage, stated plainly.">
        <p>The codebase includes Clerk authentication and API/database-backed routes. This code-level observation does not identify the production operator, all service providers, infrastructure logs, or the actual production data flows.</p>
      </TrustSection>
      <TrustSection id="controls" eyebrow="05 / Access, deletion, and retention" title="Keep the request human and specific.">
        <p>You can submit an access, correction, or deletion question through the contact form. It stores your name, email, topic, message, and server receipt time. Its receipt confirms storage only—not review, action, or a response time. No complete account export or account-wide deletion control, retention period, or request-fulfilment procedure has been verified.</p>
        <Link href="/contact?topic=privacy" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="link-privacy-request">Submit a privacy request <ArrowUpRight size={15} /></Link>
      </TrustSection>
      <TrustSection id="security" eyebrow="06 / Security and boundaries" title="Reasonable safeguards are not an absolute guarantee.">
        <p>This review did not establish the deployed security controls, security incident process, or an operating privacy contact. Do not submit credentials, payment details, confidential documents, or another person's personal information to this site.</p>
      </TrustSection>
      <TrustSection id="changes" eyebrow="07 / Changes to this policy" title="The policy should move when the product meaningfully changes.">
        <p>These code-level notes are not an owner-approved privacy policy. The site owner must verify the actual production practices and provide an accountable, monitored channel before publishing a complete policy.</p>
      </TrustSection>
      <TrustFaq kind="privacy" />
    </div>
  );
}

function TermsTrust() {
  return (
    <div className="space-y-10">
      <TrustSection id="status" eyebrow="Terms / status" title="Approved legal terms are not available.">
        <p>The project records reviewed do not establish the legal operating entity, approved terms, governing law, dispute process, or a monitored legal contact. This route is a status notice, not a contract, legal notice, or complete terms of service.</p>
      </TrustSection>
      <TrustSection id="calculator" eyebrow="Use boundary" title="The CTC result is an estimate.">
        <p>The calculator uses values entered by the visitor and assumptions described on its methodology and sources pages. It is not a payroll determination, tax filing, or professional advice. Confirm individual treatment with a qualified professional.</p>
      </TrustSection>
      <TrustSection id="owner-review" eyebrow="Required before release" title="The owner must approve the terms.">
        <p>Before publication, the verified operator must supply and approve legally reviewed terms that match the actual product, data practices, user-submission workflow, jurisdiction, and contact process. None of those missing details are inferred here.</p>
      </TrustSection>
      <TrustFaq kind="terms" />
    </div>
  );
}

function ContactTrust() {
  return (
    <div className="space-y-10">
      <TrustSection id="routes" eyebrow="Contact status" title="The form stores messages; response handling is unverified.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Corrections", "Email hello@careerreality.in. The site does not promise review or a response time."],
            ["Privacy requests", "The contact form accepts and stores a request, but its receipt does not confirm review or fulfilment."],
            ["Account questions", "The account-support owner and channel were not verified."],
            ["Contact email", "Email hello@careerreality.in or use the contact form; a receipt confirms storage only."],
          ].map(([label, body]) => <div key={label} className="rounded-[16px] border border-border bg-card p-5"><p className="text-[12px] font-bold">{label}</p><p className="mt-2 text-[12px] leading-[1.7] text-muted-foreground">{body}</p></div>)}
        </div>
      </TrustSection>
      <TrustSection id="useful" eyebrow="Required owner check" title="Confirm who reviews and handles submissions.">
        <p>The contact form accepts and stores messages, but the reviewer, response process, retention period, and response time have not been verified. The site owner must confirm those details before promising that a request will be handled.</p>
      </TrustSection>
      <TrustSection id="dont-send" eyebrow="03 / Protect yourself and others" title="What not to send.">
        <div className="flex gap-3 rounded-[16px] border border-destructive/20 bg-destructive/[.05] p-5"><CircleAlert className="mt-0.5 shrink-0 text-destructive" size={18} /><div className="text-[12px] leading-[1.75] text-muted-foreground"><p>Do not send passwords, authentication codes, payment details, government identifiers, personal contact details, confidential employer documents, private HR messages, or another person's personal information through an unverified channel.</p></div></div>
      </TrustSection>
      <TrustSection id="response" eyebrow="What happens next" title="A stored message is not a completed request.">
        <p>The contact form submits and stores a message when it returns a receipt. No monitored response workflow or response time was verified, so do not treat storage as confirmation that a request has been reviewed or completed.</p>
      </TrustSection>
      <TrustSection id="next" eyebrow="Useful next steps" title="You can also start with the public desk.">
        <div className="flex flex-wrap gap-3">
          <Link href="/editorial" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold" data-testid="link-contact-editorial">Read editorial standards <ArrowUpRight size={13} /></Link>
          <Link href="/sources" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold" data-testid="link-contact-sources">Read source status <ArrowUpRight size={13} /></Link>
          <Link href="/privacy-policy" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold" data-testid="link-contact-privacy">Read privacy status <ArrowUpRight size={13} /></Link>
        </div>
      </TrustSection>
      <TrustFaq kind="contact" />
    </div>
  );
}

function TrustBody({ kind }: { kind: TrustKind }) {
  if (kind === "about") return <AboutTrust />;
  if (kind === "editorial") return <EditorialTrust />;
  if (kind === "privacy") return <PrivacyTrust />;
  if (kind === "terms") return <TermsTrust />;
  return <ContactTrust />;
}

type PublishedTrustKind = TrustKind | "corrections" | "methodology" | "sources" | "team" | "accessibility" | "security";

const publishedTrustMeta: Record<PublishedTrustKind, TrustPageMeta & { path: string }> = {
  about: {
    eyebrow: "About / the work",
    title: "CareerReality, made for consequential decisions.",
    intro: "CareerReality publishes career decision tools and guides. It is operated by Doffysoft pvt. Limited.",
    seoTitle: "About CareerReality",
    seoDescription: "Learn what CareerReality publishes and find its contact email.",
    path: "/about",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "About CareerReality", path: "/about" }],
  },
  team: {
    eyebrow: "Team / affiliation",
    title: "People behind CareerReality.",
    intro: "Shiv Mishra is the founder, product builder, and lead author of CareerReality.in.",
    seoTitle: "Team and Affiliation | CareerReality",
    seoDescription: "Meet CareerReality founder and lead author Shiv Mishra, and see the limits of the pending payroll review attribution.",
    path: "/team",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Team", path: "/team" }],
  },
  editorial: {
    eyebrow: "Editorial / evidence policy",
    title: "Evidence, limits, and uncertainty.",
    intro: "CareerReality separates source-backed claims from editorial interpretation, user-entered assumptions, and questions that remain unresolved.",
    seoTitle: "Editorial Standards | CareerReality",
    seoDescription: "Review how CareerReality handles source context, attribution, dates, and uncertainty.",
    path: "/editorial",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Editorial standards", path: "/editorial" }],
  },
  corrections: {
    eyebrow: "Corrections / updates",
    title: "Tell us what needs correcting.",
    intro: "Email hello@careerreality.in to report an error or request a correction. No response-time promise is made.",
    seoTitle: "Corrections and Updates | CareerReality",
    seoDescription: "How to report an error and see material corrections to CareerReality content.",
    path: "/corrections",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Corrections", path: "/corrections" }],
  },
  contact: {
    eyebrow: "Contact / CareerReality Editorial",
    title: "Contact CareerReality Editorial.",
    intro: "Use hello@careerreality.in for general queries, corrections, privacy requests, security reports, press, or complaints. No response-time promise is made.",
    seoTitle: "Contact CareerReality",
    seoDescription: "Contact CareerReality by email for general queries, corrections, privacy requests, security reports, press, or complaints.",
    path: "/contact",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }],
  },
  methodology: {
    eyebrow: "Methodology / tools",
    title: "How the tools calculate.",
    intro: "Each tool states what it calculates, what inputs it uses, and what it cannot establish.",
    seoTitle: "Tools and Calculation Methods | CareerReality",
    seoDescription: "Review each tool's inputs, formulas, dated assumptions, and limitations.",
    path: "/methodology",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Methodology", path: "/methodology" }],
  },
  sources: {
    eyebrow: "Sources / data provenance",
    title: "Follow the source trail.",
    intro: "Official sources support legal, tax, and payroll references. Guide pages keep source links from their archived notes attached to relevant sections.",
    seoTitle: "Sources and Data | CareerReality",
    seoDescription: "Browse official and primary materials used for calculations and editorial guides.",
    path: "/sources",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Sources and data", path: "/sources" }],
  },
  privacy: {
    eyebrow: "Privacy / data practices",
    title: "Privacy and data handling.",
    intro: "This notice explains information handled when you use CareerReality's tools, contact the team, or sign in. For privacy requests, email hello@careerreality.in.",
    seoTitle: "Privacy Information: Data Use and Deletion | CareerReality",
    seoDescription: "Learn how CareerReality handles information from public tools, contact messages, and sign-in, and how to make privacy requests.",
    path: "/privacy-policy",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy-policy" }],
  },
  terms: {
    eyebrow: "Terms / limits of use",
    title: "Limits and use of CareerReality.",
    intro: "CareerReality is operated by Doffysoft pvt. Limited. The tools and guides provide general educational information. Governing law is India.",
    seoTitle: "Terms of Use | CareerReality",
    seoDescription: "Understand the limits of CareerReality's educational tools and what to verify independently.",
    path: "/terms",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }],
  },
  accessibility: {
    eyebrow: "Accessibility / known limits",
    title: "Accessibility information.",
    intro: "Accessibility checks cover automated page rules and keyboard navigation on selected public pages. These checks are not a WCAG conformance audit.",
    seoTitle: "Accessibility Statement | CareerReality",
    seoDescription: "Read about accessibility checks on CareerReality and report a barrier by email.",
    path: "/accessibility",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Accessibility", path: "/accessibility" }],
  },
  security: {
    eyebrow: "Security / vulnerability reporting",
    title: "Report a security concern.",
    intro: "Send a concise report to hello@careerreality.in. Do not include real user data, credentials, or exploit payloads. No response-time or safe-harbor commitment is made.",
    seoTitle: "Security Reporting | CareerReality",
    seoDescription: "Report a security concern to CareerReality by email, review safe reporting steps, and see current disclosure limits.",
    path: "/security",
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Security", path: "/security" }],
  },
};

function PublishedTrustBody({ kind }: { kind: PublishedTrustKind }) {
  return (
    <div className="space-y-8">
      {kind === "about" && <>
        <TrustSection id="scope" title="Current public scope">
          <p>The public site includes career decision tools, an employer due-diligence checklist, and editorial guides. The checklist creates no employer score, and the salary evidence worksheet creates no private-sector benchmark.</p>
        </TrustSection>
        <TrustSection id="identity" title="Operator details">
          <p>CareerReality is operated by Doffysoft pvt. Limited. Address: Hinjewadi Phase 3, Pune. Contact hello@careerreality.in.</p>
        </TrustSection>
      </>}
      {kind === "team" && <>
        <TrustSection id="authors" title="Founder and lead author">
          <p><strong>Shiv Mishra</strong> — Founder, Product Builder &amp; Lead Author; CareerReality.in. Qualification: Bachelor of Technology (B.Tech.).</p>
          <p className="mt-4">Shiv is a technology enthusiast and founder of CareerReality.in. He leads product vision, architecture, development, product research, user experience and editorial planning. His work includes interactive career decision tools, salary comparison systems, compensation calculators and practical employment resources.</p>
          <p className="mt-4">His stated authorship scope includes product vision, original explanatory content, technical development, research, feature validation and internal quality assurance. Individual article authorship is identified only where that article credits him. Internal product checks are not independent specialist review.</p>
        </TrustSection>
        <TrustSection id="reviewer" title="Payroll review attribution">
          <p><strong>Aman Mishra</strong> is identified by the site owner as the reviewer for Indian payroll calculation methodology and related test cases. The owner reports that Aman inspected the calculation logic and tests and agreed to be identified. The supplied documentation lists a Chartered Accountant and HR/Payroll Professional designation, an independent personal-capacity affiliation, and a review date of 05 November 2026.</p>
          <p className="mt-4">The supplied reviewer document does not record a confirmed implementation/version, evidence list, findings, outcome, limitations, or final credential wording. A separate owner-prepared QA record dated 7 November 2026 reports internal tests as passed but explicitly says independent payroll review is not formally completed or documented. No completed review conclusion or independent certification is claimed here.</p>
        </TrustSection>
      </>}
      {kind === "editorial" && <>
        <TrustSection id="evidence" title="Evidence before conclusion">
          <p>Legal, tax, payroll, and market claims require a relevant source, an access date when known, and a clear statement of scope. When a source does not support a claim, the claim is removed, qualified, or withheld.</p>
        </TrustSection>
        <TrustSection id="attribution" title="Authorship and assembly">
          <p>Authorship, review, publication dates, and substantive updates are identified where available. Source links identify references used; they do not by themselves mean a source author reviewed the page.</p>
        </TrustSection>
        <TrustSection id="uncertainty" title="Interpretation and uncertainty">
          <p>Editorial framing, checklists, and prompts are not reported facts. A source date appears only when stated in the preserved note. A missing result is not evidence of safety, demand, or a future outcome.</p>
        </TrustSection>
      </>}
      {kind === "corrections" && <>
        <TrustSection id="log" title="Available correction record">
          <p>When a material correction is made, the affected claim, change, and supporting evidence are described here.</p>
        </TrustSection>
        <TrustSection id="request" title="What to include">
          <p>Email hello@careerreality.in. Identify the page and claim, explain what appears wrong, and include a supporting public source where possible. Do not send credentials or confidential documents. A public entry will identify a verified change and its evidence.</p>
          <p className="mt-4"><Link href="/contact" className="font-bold text-primary">Send a correction request <ArrowUpRight size={13} className="inline" /></Link></p>
        </TrustSection>
      </>}
      {kind === "contact" && <>
        <TrustSection id="email" title="Email and operator">
          <p><a className="font-bold text-primary underline" href="mailto:hello@careerreality.in">hello@careerreality.in</a></p>
          <p className="mt-4">Operator: Doffysoft pvt. Limited. Address: Hinjewadi Phase 3, Pune.</p>
        </TrustSection>
        <TrustSection id="contact-purpose" title="Contact by purpose">
          <ul className="list-disc space-y-2 pl-5">
            <li>General queries and press: <a className="font-bold text-primary underline" href="mailto:hello@careerreality.in">hello@careerreality.in</a></li>
            <li>Corrections, privacy requests, and complaints: the same email address.</li>
            <li>Security reports: the same email address; see <Link className="font-bold text-primary underline" href="/security">security reporting guidance</Link>.</li>
          </ul>
          <p className="mt-4">Email is the only published contact route. No response-time promise is made. Do not send passwords, credentials, resumes, or confidential work documents.</p>
        </TrustSection>
      </>}
      {kind === "methodology" && <>
        <TrustSection id="ctc" title="CTC reconciliation">
          <p>The calculator starts with fixed pay and target variable pay from the offer. It subtracts employer PF only when the user marks it as inside CTC, and subtracts gratuity or other employer costs only when those amounts are entered. Any remainder stays labelled unallocated; a breakdown larger than the entered CTC is shown as an unreconciled shortfall.</p>
          <p className="mt-4">The fixed-cash result assumes zero variable pay. The target result assumes the full target is paid and divides the annual estimate by 12; it is not a guaranteed payslip. The old-regime comparison accepts values copied from the official Income Tax Department calculator and does not assume a local tax schedule.</p>
          <p className="mt-4"><Link href="/salary-calculator" className="font-bold text-primary">Open the CTC calculator <ArrowUpRight size={13} className="inline" /></Link></p>
        </TrustSection>
        <TrustSection id="gratuity" title="Gratuity">
          <p>The limited monthly-rate worksheet uses the 15/26 formula and displays the ₹20 lakh maximum stated as current in the Ministry’s Labour Codes FAQ published 30 December 2025. The March 2026 FAQ states that the revised wage definition applies from 21 November 2025. This worksheet does not cover fixed-term, deceased-employee, piece-rated, or seasonal calculations, establish eligibility or wage base, or account for later rule changes.</p>
          <p className="mt-4"><Link href="/gratuity-estimator" className="font-bold text-primary">Open the gratuity worksheet <ArrowUpRight size={13} className="inline" /></Link></p>
        </TrustSection>
        <TrustSection id="other-tools" title="Other worksheets and checklist">
          <p>The notice and leave worksheet uses the daily-rate divisor and days entered by the visitor. The runway planner predicts no re-employment date. The home-loan stress test uses standard EMI arithmetic. The resign-or-stay worksheet displays visitor-entered weighted values without a recommendation. The employer checklist does not create a score or safety claim.</p>
          <p className="mt-4"><Link href="/tools" className="font-bold text-primary">Browse all tools <ArrowUpRight size={13} className="inline" /></Link></p>
        </TrustSection>
      </>}
      {kind === "sources" && <>
        <TrustSection id="official" title="Official sources for tools and due diligence">
          <ul className="list-disc space-y-3 pl-5">
            <li><a className="font-bold text-primary underline" href="https://www.incometaxindia.gov.in/w/section-202-78" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025, Section 202</a> — new-regime slab rates and restrictions on deductions.</li>
            <li><a className="font-bold text-primary underline" href="https://www.incometaxindia.gov.in/w/section-19-206" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025, Section 19</a> — standard deduction amounts and employment-tax deduction provisions.</li>
            <li><a className="font-bold text-primary underline" href="https://www.incometaxindia.gov.in/w/section-156-88" target="_blank" rel="noopener noreferrer">Income-tax Act, 2025, Section 156</a> — rebate ceiling and marginal relief above ₹12 lakh.</li>
            <li><a className="font-bold text-primary underline" href="https://www.incometaxindia.gov.in/documents/81799/11848482/memo-2026.pdf" target="_blank" rel="noopener noreferrer">Finance Bill 2026 memorandum</a> — tax-year 2026–27 surcharge, marginal relief, and 4% Health and Education Cess.</li>
            <li><a className="font-bold text-primary underline" href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment press release</a> — revised ₹25,000 EPFO ceiling and contribution split.</li>
            <li><a className="font-bold text-primary underline" href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">Employees' Provident Fund Organisation wage-ceiling FAQ</a>.</li>
            <li><a className="font-bold text-primary underline" href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: Additional FAQs on Labour Codes (16 March 2026)</a>.</li>
            <li><a className="font-bold text-primary underline" href="https://www.indiacode.nic.in/indiacode/bitstream/123456789/16823/1/aA2020-36.pdf" target="_blank" rel="noopener noreferrer">India Code: Code on Social Security, 2020</a>.</li>
            <li><a className="font-bold text-primary underline" href="https://www.mca.gov.in/content/mca/global/en/mca/master-data.html" target="_blank" rel="noopener noreferrer">Ministry of Corporate Affairs: master-data services</a>.</li>
            <li><a className="font-bold text-primary underline" href="https://www.nseindia.com/companies-listing/corporate-filings-announcements" target="_blank" rel="noopener noreferrer">National Stock Exchange: corporate filings and announcements</a>.</li>
          </ul>
          <p className="mt-4">The CTC calculator's official tax and EPFO references were checked 9 October 2026. Links are starting points and do not establish that a source applies to an individual employment relationship.</p>
          <p className="mt-4"><a className="font-bold text-primary underline" href="/sources.json">Download the machine-readable trust sources register</a>.</p>
        </TrustSection>
        <TrustSection id="guide-sources" title="Sources in the guides">
          <p>Each guide shows links carried forward from archived article notes. A stated year appears only when the preserved note includes one. The references provide context; the editorial framing is not presented as original reporting.</p>
          <p className="mt-4"><Link href="/guides" className="font-bold text-primary">Browse the guides <ArrowUpRight size={13} className="inline" /></Link></p>
        </TrustSection>
      </>}
      {kind === "privacy" && <>
        <TrustSection id="calculator" title="Public calculator inputs">
          <p>Pure calculation worksheets run on your device. In the salary-calculator checks, entered amounts were not sent off the device or placed in the web address. Account and live-data features may send information to the services they need.</p>
        </TrustSection>
        <TrustSection id="interview-guide-progress" title="Interview-guide study progress">
          <p>The interview guides store your selected Core questions, revised markers, and readiness checks in this browser's local storage. Those values are not sent to CareerReality's servers and are not tied to your account. You can export or import a JSON backup from a role guide, or clear the saved progress there. Exported files are saved wherever your browser normally downloads files; protect or delete those files yourself. Search text, answer reveals, and practice-session position are temporary page state. Do not enter confidential interview material or personal information into the guides.</p>
        </TrustSection>
        <TrustSection id="contact-record" title="Contact message records">
          <p>The contact form is closed; use email instead. The former form stored a name, email address, topic, message, and submission time. The production records checked on 2 November 2026 contained no contact submissions. No retention period is established for any copies in backups or logs.</p>
        </TrustSection>
        <TrustSection id="layoff-alerts" title="Layoff alert subscriptions">
          <p>If you request layoff alerts, the subscription database stores your email address, an email hash, your optional city and sector preferences, confirmation status, and the timestamps and token hashes needed to manage confirmation and unsubscribe links. Resend is used to deliver confirmation and alert emails. Alerts begin only after double opt-in and include Confirmed or Reported events, never Rumours. Unsubscribing changes the record to an unsubscribed status so it is no longer eligible for alerts; the record is retained in the database, and a separate retention period has not been established.</p>
        </TrustSection>
        <TrustSection id="account" title="Account and resume features">
          <p>Clerk provides sign-in and session authentication on sign-in, sign-up, and account-required pages. The public pages reviewed here did not load Clerk. When you sign in, your browser contacts Clerk through CareerReality's website; this involves account identity and session information. Signed-in features store profile fields and career-brief history in CareerReality's systems. “Clear saved intelligence” clears profile fields and current account-scoped device insights but does not clear prior brief history. Resume uploads and submitted job-link processing are not offered as public services.</p>
        </TrustSection>
        <TrustSection id="analytics" title="Analytics and technical requests">
          <p>Fonts are served from CareerReality's own site. The six public pages checked did not load Google Fonts or an analytics provider. The site host sets a cookie named GAESA that expires after 30 days. CareerReality does not read this cookie, and its purpose is not identified here. Layoff-alert email is delivered by Resend after double opt-in.</p>
        </TrustSection>
        <TrustSection id="dpdp" title="India data-protection law status">
          <p>As of 2 November 2026, the DPDP Act and Rules have staged commencement. Core notice, consent, rights, grievance, breach, and child-data provisions in Act sections 3–17 and Rules 3, 5–16, 22–23 are scheduled to commence on 13 May 2027. Rule 4 and Act section 6(9) / section 27(1)(d) are scheduled for 13 November 2026. Rules 1, 2, and 17–21 took effect on 13 November 2025. This is a date-based summary, not legal advice.</p>
        </TrustSection>
        <TrustSection id="rights-requests" title="Privacy requests and retention">
          <p>Email hello@careerreality.in to ask about access, correction, or deletion. There is no self-service request form or promised response time. No retention period is established for contact-form backups or unsubscribed alert records. Unsubscribed alert records remain in the database so they are not reactivated accidentally.</p>
        </TrustSection>
      </>}
      {kind === "terms" && <>
        <TrustSection id="tools" title="Tools and guides">
          <p>Calculations use the inputs and assumptions shown on each page. Results may not reflect your complete tax, payroll, legal, financial, or employment situation. No tool predicts hiring, job security, market pay, or a guaranteed outcome.</p>
        </TrustSection>
        <TrustSection id="verify" title="Verify before acting">
          <p>Check written offer terms, current official rules, and source dates that apply to your case. Do not treat a target bonus, employer checklist, guide, or worksheet as a promise or professional recommendation.</p>
        </TrustSection>
        <TrustSection id="legal-operator" title="Operator details">
          <p>Operator: Doffysoft pvt. Limited. Address: Hinjewadi Phase 3, Pune. Governing law: India. Contact hello@careerreality.in. These terms do not create a professional advisory relationship.</p>
        </TrustSection>
      </>}
      {kind === "accessibility" && <>
        <TrustSection id="approach" title="What we aim to support">
          <p>On 2 November 2026, axe-core 4.10.3 checked 11 public trust pages at 1440 × 900 and 390 × 844 against WCAG 2.0, 2.1, and 2.2 A/AA rules. It found no automated violations; one check per page needs manual review. Keyboard Tab navigation showed a visible focus indicator on the first link on each page. These checks do not assess every success criterion, screen-reader behavior, or native mobile use. No conformance level is claimed.</p>
        </TrustSection>
        <TrustSection id="known-issues" title="Known issues from these checks">
          <p>No automated violations were found in the checks described above. Manual review and assistive-technology testing remain incomplete.</p>
        </TrustSection>
        <TrustSection id="report" title="Report an accessibility barrier">
          <p>Email <a className="font-bold text-primary underline" href="mailto:hello@careerreality.in">hello@careerreality.in</a> with the page, device/browser, assistive technology if relevant, and the barrier. Do not include sensitive personal information. No response deadline is promised.</p>
        </TrustSection>
      </>}
      {kind === "security" && <>
        <TrustSection id="scope" title="Responsible reporting">
          <p>Report suspected vulnerabilities to <a className="font-bold text-primary underline" href="mailto:hello@careerreality.in">hello@careerreality.in</a>. Include affected URL, impact, and safe reproduction steps. Do not access, alter, or retain another person's data; avoid service disruption, social engineering, and destructive testing. Stop testing once the issue is demonstrated.</p>
        </TrustSection>
        <TrustSection id="limits" title="Disclosure terms">
          <p>This page does not promise a response time, bounty, safe harbor, or authorization beyond the published scope. Do not send credentials, live exploit payloads, or personal data. Public disclosure should wait until coordination with the operator.</p>
          <p className="mt-4"><a className="font-bold text-primary underline" href="/.well-known/security.txt">Machine-readable security contact</a></p>
        </TrustSection>
      </>}
    </div>
  );
}

export function TrustPage({ kind }: { kind: PublishedTrustKind }) {
  const page = publishedTrustMeta[kind];
  const siteOrigin = (import.meta.env.VITE_SITE_URL || "https://www.careerreality.in").replace(/\/+$/, "");
  const organizationId = `${siteOrigin}/#organization`;
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Doffysoft pvt. Limited.",
      alternateName: "CareerReality",
      url: siteOrigin,
      email: "hello@careerreality.in",
      address: { "@type": "PostalAddress", addressLocality: "Hinjewadi Phase 3, Pune", addressCountry: "IN" },
      publishingPrinciples: `${siteOrigin}/editorial`,
      correctionsPolicy: `${siteOrigin}/corrections`,
      privacyPolicy: `${siteOrigin}/privacy-policy`,
      contactPoint: { "@type": "ContactPoint", contactType: "general, corrections, privacy, security, press, and complaints", email: "hello@careerreality.in" },
    },
    ...(kind === "about" ? [{ "@type": "AboutPage", "@id": `${siteOrigin}/about#webpage`, name: page.title, about: { "@id": organizationId }, url: `${siteOrigin}/about` }] : []),
    ...(kind === "contact" ? [{ "@type": "ContactPage", "@id": `${siteOrigin}/contact#webpage`, name: page.title, about: { "@id": organizationId }, url: `${siteOrigin}/contact`, mainEntity: { "@id": organizationId } }] : []),
    ...(kind === "team" ? [{ "@type": "Person", "@id": `${siteOrigin}/team#shiv-mishra`, name: "Shiv Mishra", jobTitle: "Founder, Product Builder & Lead Author", description: "B.Tech graduate and founder of CareerReality.in; leads product vision, technical development, research, user experience and editorial planning.", affiliation: { "@id": organizationId } }] : []),
  ];
  return (
    <PublicPage
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      seo={{
        title: page.seoTitle,
        description: page.seoDescription,
        path: page.path,
        noIndex: false,
        breadcrumbs: page.breadcrumbs,
      }}
    >
      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p><strong>Information updated:</strong> {kind === "team" ? "7 November 2026." : "2 November 2026."}</p>
      </div>
      <PublishedTrustBody kind={kind} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }} />
    </PublicPage>
  );
}
