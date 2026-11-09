import { ArrowUpRight } from "lucide-react";
import { TOOL_METHOD_HEADING, type ToolContentBlock } from "@/data/tool-page-content";
import { TOOL_FAQ_HEADING, type ToolFaq } from "@/data/tool-faqs";

function ContentBlock({ block }: { block: ToolContentBlock }) {
  return (
    <section id={block.id} className="min-w-0 rounded-[18px] border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-2xl leading-[1.05] tracking-[-.03em]">{block.heading}</h2>
      {block.body && <p className="mt-3 text-[12px] leading-[1.75] text-muted-foreground">{block.body}</p>}
      {block.list && <ul className="mt-3 grid gap-2 text-[12px] leading-[1.6] text-muted-foreground">{block.list.map((item) => <li key={item} className="border-l-2 border-primary/35 pl-3">{item}</li>)}</ul>}
      {block.groups && <div className="mt-3 grid gap-4">{block.groups.map((group) => (
        <div key={group.title}>
          <h3 className="text-[12px] font-bold text-foreground">{group.title}</h3>
          <ul className="mt-2 grid gap-1.5 text-[12px] leading-[1.6] text-muted-foreground">{group.items.map((item) => <li key={item} className="border-l-2 border-primary/35 pl-3">{item}</li>)}</ul>
        </div>
      ))}</div>}
      {block.table && <div className="mt-3">
        {block.table.intro && <p className="text-[12px] leading-[1.75] text-muted-foreground">{block.table.intro}</p>}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-left text-[11px]">
            <caption className="pb-2 text-left font-semibold text-foreground">{block.table.caption}</caption>
            <thead><tr>{block.table.columns.map((column) => <th key={column} scope="col" className="border-b border-border px-2 py-2 font-semibold">{column}</th>)}</tr></thead>
            <tbody>{block.table.rows.map((row) => (
              <tr key={row[0]}>{row.map((cell, index) => index === 0 && block.table?.rowHeaders
                ? <th key={index} scope="row" className="border-b border-border/70 px-2 py-2 font-semibold">{cell}</th>
                : <td key={index} className="border-b border-border/70 px-2 py-2 text-muted-foreground">{cell}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>}
      {block.links && <ul className="mt-3 grid gap-2 text-[12px] leading-[1.6]">{block.links.map((link) => (
        <li key={link.href + link.label}><a href={link.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">{link.label} <ArrowUpRight size={12} className="inline" /></a>{link.note && <span className="text-muted-foreground"> — {link.note}</span>}</li>
      ))}</ul>}
      {block.note && <p className="mt-3 text-[12px] leading-[1.75] text-muted-foreground">{block.note}</p>}
      {block.qa && <dl className="mt-3 grid gap-3 text-[12px] leading-[1.65]">{block.qa.map((item) => (
        <div key={item.question}><dt className="font-bold text-foreground">{item.question}</dt><dd className="mt-1 text-muted-foreground">{item.answer}</dd></div>
      ))}</dl>}
    </section>
  );
}

/** Renders the shared method, limits and source blocks for a tool route. */
export function ToolMethodSection({ blocks }: { blocks: ToolContentBlock[] }) {
  if (!blocks.length) return null;
  return (
    <div className="mt-10" data-testid="tool-method-section">
      <p className="font-data text-[10px] uppercase tracking-[.18em] text-primary">{TOOL_METHOD_HEADING}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {blocks.map((block) => <ContentBlock key={block.heading} block={block} />)}
      </div>
    </div>
  );
}

/** Renders the shared tool FAQ. The same list feeds the snapshot and FAQPage JSON-LD. */
export function ToolFaqSection({ faqs }: { faqs: ToolFaq[] }) {
  if (!faqs.length) return null;
  return (
    <section className="mt-10 rounded-[22px] border border-border bg-card p-6 sm:p-8" aria-labelledby="tool-faq-heading" data-testid="tool-faq-section">
      <h2 id="tool-faq-heading" className="font-display text-3xl leading-[1] tracking-[-.04em]">{TOOL_FAQ_HEADING}</h2>
      <div className="mt-5 grid gap-2">
        {faqs.map((faq) => (
          <details key={faq.question} className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <summary className="cursor-pointer text-[12px] font-bold">{faq.question}</summary>
            <p className="mt-3 max-w-[760px] text-[11px] leading-[1.7] text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
