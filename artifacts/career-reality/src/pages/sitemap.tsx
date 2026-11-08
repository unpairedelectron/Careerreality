import { ArrowUpRight, FileText, ShieldCheck, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "@/components/shared/app-link";
import { PublicPage } from "@/components/shared/public-shell";
import { sitemapSections } from "@/data/site-map";

const icons = [Wrench, FileText, FileText, FileText, ShieldCheck];

export default function SitemapPage() {
  const [location] = useLocation();
  const isSitemapRoute = location.replace(/\/+$/, "") === "/sitemap";
  const seo = isSitemapRoute
    ? {
        title: "CareerReality Sitemap",
        description: "Browse the indexable tools, guides, hubs, and trust pages in CareerReality's route registry.",
        noIndex: true,
      }
    : {
        title: "CareerReality Sitemap",
        description: "Browse indexable tools, guides, hubs, and trust pages.",
      };

  return (
    <PublicPage
      eyebrow="CareerReality directory"
      title="Browse tools, guides, and trust information."
      intro="This directory is generated from the route registry. It lists pages marked indexable and eligible for the public sitemap."
      seo={seo}
    >
      <div className="rounded-[22px] border border-primary/20 bg-primary/[.06] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-primary">CareerReality / directory</p>
            <h2 className="mt-3 max-w-[610px] font-display text-4xl leading-[.98] tracking-[-.04em] sm:text-5xl">Find the page that matches your question.</h2>
          </div>
            <Wrench className="text-primary" size={25} />
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/tools" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground">Browse tools <ArrowUpRight size={14} /></Link>
          <Link href="/guides" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold">Browse guides <ArrowUpRight size={14} /></Link>
        </div>
      </div>

      {!isSitemapRoute && (
        <section className="mt-8 border-y border-border py-7" aria-labelledby="tool-hub-context">
          <h2 id="tool-hub-context" className="font-display text-3xl tracking-[-.03em]">How to use this directory</h2>
          <p className="mt-3 max-w-[760px] text-base leading-7 text-muted-foreground">
            Start with a worksheet when you have figures or documents to check. Use the guides for source context and questions to take into a conversation. The employer checklist points to official records without scoring companies.
          </p>
          <div className="mt-5 grid gap-5 border-l-2 border-primary pl-5 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Tools</h3>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                Pure calculation worksheets run in the browser. Each worksheet explains its own limits and does not generate employment forecasts or unsupported benchmarks.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Guides and trust pages</h3>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                Guide source links are retained from archived article notes, with dates shown only when those notes provide them. Trust pages explain current product behavior and visible information gaps.
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-[760px] text-sm leading-6 text-muted-foreground">
            This list includes only routes marked indexable and sitemap-eligible in the route registry. Account-only and utility routes are not listed.
          </p>
        </section>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {sitemapSections.map((section, index) => {
          const Icon = icons[index] ?? FileText;
          return (
            <section key={section.label} className="surface-lift rounded-[20px] border border-border bg-card p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={17} /></span>
                  <h2 className="font-display text-3xl tracking-[-.03em]">{section.label}</h2>
                </div>
                <span className="font-data text-[9px] text-muted-foreground">{String(section.items.length).padStart(2, "0")} pages</span>
              </div>
              <div className="mt-2">
                {section.items.map((item) => (
                  <Link key={item.path} href={item.path} className="group flex items-start justify-between gap-4 border-b border-border/70 py-4 last:border-0">
                    <span>
                      <span className="block text-[12px] font-bold group-hover:text-primary">{item.title}</span>
                      {item.description && <span className="mt-1 block max-w-[360px] text-[10px] leading-[1.55] text-muted-foreground">{item.description}</span>}
                    </span>
                    <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

    </PublicPage>
  );
}