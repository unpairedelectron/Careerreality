import { Link, useLocation } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { PublicPage } from "@/components/shared/public-shell";
import library from "@/data/rules-library.json";
import { rulesLibraryContent } from "@/data/rules-library-content";

export function RulesLibraryPage() {
  const [location] = useLocation();
  const page = library.pages.find((entry) => entry.path.replace(/\/+$/, "") === location.replace(/\/+$/, ""));
  if (!page) {
    return <PublicPage eyebrow="CareerReality / rules and data" title="Rules and Data Library" intro="A small reference library built from official sources opened for this release. Pages state what was verified, when it was checked, and where the rule may depend on individual or state-specific facts." seo={{ title: "Rules and Data Library | CareerReality", description: "Official-source summaries with verification dates, scope limits, tools, and related guides.", path: "/rules" }}>
      <ul className="mx-auto max-w-4xl space-y-4">{library.pages.map((item) => <li key={item.path} className="rounded-2xl border border-border p-5"><Link className="font-display text-2xl text-primary underline underline-offset-4" href={item.path}>{item.title}</Link><p className="mt-2 text-sm leading-6">{item.description}</p></li>)}</ul>
    </PublicPage>;
  }
  const copy = rulesLibraryContent[page.path];
  return (
    <PublicPage eyebrow="CareerReality / rules and data" title={page.title} intro={page.description} seo={{ title: `${page.title} | CareerReality`, description: page.description, path: page.path }}>
      <article className="mx-auto max-w-4xl space-y-8">
        <p className="text-lg leading-8">{page.intro}</p>
        <p className="text-xs text-muted-foreground sm:hidden">Scroll horizontally to see all columns.</p>
        <div className="overflow-x-auto rounded-2xl border border-border" role="region" aria-label="Scrollable rules summary table" tabIndex={0}>
          <table className="w-full min-w-[580px] border-collapse text-left text-sm">
            <caption className="p-4 text-left font-semibold">Rule summary · verified {page.verified}</caption>
            <tbody>{page.rows.map(([label, value]) => <tr key={label} className="border-t border-border"><th scope="row" className="w-1/3 p-4 align-top font-semibold">{label}</th><td className="p-4 leading-6">{value}</td></tr>)}</tbody>
          </table>
        </div>
        <section className="rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="font-display text-2xl">What changed since last year</h2>
          <p className="mt-3 text-sm leading-7">{page.change}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl">In plain language</h2>
          <p className="mt-3 text-sm leading-7">{page.plainLanguage}</p>
        </section>
        {copy?.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl">{section.heading}</h2>
            <p className="mt-3 text-sm leading-7">{section.body}</p>
          </section>
        ))}
        {copy?.faqs.length ? (
          <section>
            <h2 className="font-display text-2xl">Questions to check</h2>
            <dl className="mt-3 space-y-4">{copy.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold">{faq.question}</dt>
                <dd className="mt-1 text-sm leading-7">{faq.answer}</dd>
              </div>
            ))}</dl>
          </section>
        ) : null}
        <section>
          <h2 className="font-display text-2xl">Official sources</h2>
          <ul className="mt-3 space-y-3">{page.sources.map((source) => <li key={source.url}><a className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowUpRight size={14} aria-hidden="true" /></a><span className="block text-xs text-muted-foreground">Opened and verified 10 October 2026.</span></li>)}</ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Related tools and guides</h2>
          <ul className="mt-3 flex flex-wrap gap-4">{page.related.map((item) => <li key={item.url}><Link className="font-semibold text-primary underline underline-offset-4" href={item.url}>{item.label}</Link></li>)}</ul>
        </section>
      </article>
    </PublicPage>
  );
}
