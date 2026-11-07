import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { useLocation } from "wouter";
import { Link, withTrailingSlash } from "@/components/shared/app-link";
import { ArrowUpRight, BookOpenText } from "lucide-react";
import { PublicPage } from "@/components/shared/public-shell";
import type guideCatalog from "@/data/generated-pillar-guides.json";
import routeRegistry from "@/data/route-registry";
import { guideWorkedExamples, guideToolLinks } from "@/data/guide-worked-examples";

type GuideSource = { url: string; label: string; year?: string };
type GuideRecord = (typeof guideCatalog.guides)[number];
type Guide = Omit<GuideRecord, "sources" | "sections"> & {
  lastVerified?: string;
  sources: GuideSource[];
  sections: Array<Omit<GuideRecord["sections"][number], "sourceLinks"> & { sourceLinks: GuideSource[] }>;
  faqs?: Array<{ question: string; answer: string }>;
  relatedLinks?: GuideSource[];
};

const guideLoaders = import.meta.glob<GuideRecord>(
  "../data/generated-pillar-guides/by-slug/*.json",
  { import: "default" },
);
const guidePageComponents = new Map<string, LazyExoticComponent<ComponentType>>();

function getGuidePageComponent(slug: string) {
  const existing = guidePageComponents.get(slug);
  if (existing) return existing;

  const loadGuide = guideLoaders[`../data/generated-pillar-guides/by-slug/${slug}.json`];
  if (!loadGuide) return null;

  const GuidePage = lazy(async () => {
    const guide = await loadGuide();
    return {
      default: () => <PillarGuideContent slug={slug} guide={guide as Guide} />,
    };
  });
  guidePageComponents.set(slug, GuidePage);
  return GuidePage;
}

export function PillarGuidePage() {
  const [location] = useLocation();
  const slug = location.replace(/\/+$/, "").split("/").at(-1) ?? "";
  const GuidePage = getGuidePageComponent(slug);
  if (!GuidePage) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">This guide is not available.</main>;
  }
  return <GuidePage />;
}

function PillarGuideContent({ slug, guide }: { slug: string; guide: Guide }) {
  const route = routeRegistry.routes.find((item) => item.kind === "guide" && item.guideSlug === slug);
  const workedExample = slug ? guideWorkedExamples[slug as keyof typeof guideWorkedExamples] : undefined;
  const toolLink = slug ? guideToolLinks[slug] : undefined;

  if (!route) {
    return <main className="p-8 text-sm text-muted-foreground" role="status">This guide is not available.</main>;
  }

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: guide.title, path: guide.path },
  ];

  return (
    <PublicPage
      eyebrow="CareerReality Editorial / practical guide"
      title={route.title}
      intro={route.description}
      seo={{
        title: `${route.title} | CareerReality`,
        description: route.description,
        path: guide.path,
        breadcrumbs: crumbs,
        article: {
          headline: route.title,
          description: route.description,
          datePublished: guide.datePublished ?? null,
          dateModified: guide.dateModified ?? null,
          section: "Career guidance",
          keywords: [route.title, "career decisions", "India"],
        },
        faqs: guide.faqs,
      }}
    >
      <article className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 font-semibold">
            <BookOpenText size={14} className="text-primary" aria-hidden="true" />
            Practical guide
          </span>
          {guide.datePublished && <span>Published {guide.datePublished}</span>}
          {guide.lastVerified && <span>Last verified {guide.lastVerified}</span>}
          {!guide.lastVerified && guide.dateModified && <span>Substantively updated {guide.dateModified}</span>}
          <span>See <Link href="/editorial" className="font-semibold text-primary underline underline-offset-4">editorial standards</Link>.</span>
        </div>

        <p className="text-lg leading-8 text-foreground">{guide.editorialFrame}</p>
        {guide.lead && <p className="mt-5 text-sm leading-7 text-muted-foreground">{guide.lead}</p>}

        {workedExample && <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="worked-example-title">
          <h2 id="worked-example-title" className="font-display text-2xl">Worked example</h2>
          {"directAnswer" in workedExample && <p className="mt-3 text-base font-medium leading-7 text-foreground" data-testid="guide-worked-example-direct-answer">{workedExample.directAnswer}</p>}
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{workedExample.caption}</p>
          <p className="mt-4 text-xs text-muted-foreground sm:hidden">Scroll horizontally to see all columns.</p>
          <div className="mt-2 overflow-x-auto" role="region" aria-label="Scrollable worked example table" tabIndex={0}>
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead><tr>{workedExample.headers.map((header) => <th key={header} scope="col" className="border-b border-border p-3">{header}</th>)}</tr></thead>
              <tbody>{workedExample.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3 align-top leading-6">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {"comparison" in workedExample && workedExample.comparison && <div className="mt-5"><h3 className="font-semibold">Compare the scenarios</h3><ul className="mt-2 space-y-2 text-sm leading-6">{workedExample.comparison.map(([label, detail]) => <li key={label}><strong>{label}:</strong> {detail}</li>)}</ul></div>}
          <h3 className="mt-5 font-semibold">Check this on your own offer or documents</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">{workedExample.checks.map((step) => <li key={step}>{step}</li>)}</ol>
          <Link className="mt-5 inline-flex items-center font-semibold text-primary underline underline-offset-4" href={workedExample.tool.href}>{workedExample.tool.label}<ArrowUpRight size={14} className="ml-1" aria-hidden="true" /></Link>
        </section>}

        <div className="mt-10 space-y-12">
          {guide.sections.filter((section) => section.heading !== "Questions to work through").map((section, index) => (
            <section key={`${section.sourceSlug}-${section.heading}-${index}`} className="border-t border-border pt-7">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">
                CareerReality Editorial
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight">{section.heading}</h2>
              <div className="mt-5 space-y-5 font-serif text-[17px] leading-8 text-foreground/90">
                {section.content.split(/\n{2,}/).filter(Boolean).map((paragraph, paragraphIndex) => (
                  <p key={`${section.sourceSlug}-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
              {section.sourceNotes.length > 0 && (
                <p className="mt-5 border-l-2 border-primary/40 pl-4 text-xs leading-6 text-muted-foreground">
                  {section.sourceNotes.join(" · ")}
                </p>
              )}
              {section.sourceLinks.length > 0 && (
                <ul className="mt-4 space-y-2 text-xs">
                  {section.sourceLinks.map((source) => (
                    <li key={source.url}>
                      <a href={withTrailingSlash(source.url)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
                        {source.label}
                      </a>
                      <span className="text-muted-foreground"> · {source.year ? `source year stated as ${source.year}` : "date not stated in the archived source note"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {guide.nextSteps.length > 0 && <section className="mt-14 rounded-[24px] border border-primary/20 bg-primary/[.04] p-6 sm:p-8" aria-labelledby="guide-next-title">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Use this in your next conversation</p>
          <h2 id="guide-next-title" className="mt-2 font-display text-3xl">Questions to carry forward</h2>
          <ul className="mt-5 space-y-3">
            {guide.nextSteps.map((step) => <li key={step} className="flex gap-3 text-sm leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span>{step}</span></li>)}
          </ul>
        </section>}

        {guide.faqs && guide.faqs.length > 0 && <section className="mt-14 border-t border-border pt-8" aria-labelledby="guide-faq-title">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Practical answers</p>
          <h2 id="guide-faq-title" className="mt-2 font-display text-3xl">Frequently asked questions</h2>
          <div className="mt-6 space-y-7">
            {guide.faqs.map((faq) => <div key={faq.question}>
              <h3 className="font-semibold leading-7">{faq.question}</h3>
              <p className="mt-2 font-serif text-[17px] leading-8 text-foreground/90">{faq.answer}</p>
            </div>)}
          </div>
        </section>}

        {guide.relatedLinks && guide.relatedLinks.length > 0 && <nav className="mt-10 border-t border-border pt-7" aria-label="Related guides and tools">
          <h2 className="font-display text-2xl">Related guides and tools</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {guide.relatedLinks.map((related) => <li key={related.url}>
              <Link href={related.url} className="font-semibold text-primary underline underline-offset-4">{related.label}<ArrowUpRight size={14} className="ml-1 inline" aria-hidden="true" /></Link>
            </li>)}
          </ul>
        </nav>}

        {guide.sources.length > 0 && <aside className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-xs leading-6 text-muted-foreground" aria-label="Sources">
          <strong className="text-foreground">Sources</strong>
          <ul className="mt-4 space-y-2">
            {guide.sources.map((source) => (
              <li key={source.url}>
                <a href={withTrailingSlash(source.url)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">{source.label}</a>
                <span> · {source.year ? `source year stated as ${source.year}` : "date not stated in the archived source note"}</span>
              </li>
            ))}
          </ul>
        </aside>}
      </article>

      <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6 text-sm" aria-label="Related CareerReality pages">
        <Link href="/guides" className="font-bold text-primary">Browse all guides <ArrowUpRight size={14} className="inline" /></Link>
        <Link href="/tools" className="font-bold text-primary">Use a decision tool <ArrowUpRight size={14} className="inline" /></Link>
        <Link href="/rules" className="font-bold text-primary">Rules and data library <ArrowUpRight size={14} className="inline" /></Link>
        {toolLink && <Link href={toolLink.href} className="font-bold text-primary">Open the {toolLink.label} <ArrowUpRight size={14} className="inline" /></Link>}
        <Link href="/editorial" className="font-bold text-primary">Editorial standards <ArrowUpRight size={14} className="inline" /></Link>
      </nav>
    </PublicPage>
  );
}
