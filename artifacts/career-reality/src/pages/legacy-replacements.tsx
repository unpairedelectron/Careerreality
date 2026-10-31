import { ArrowRight, ArrowUpRight, CircleAlert } from "lucide-react";
import { Link, useParams } from "wouter";
import { PublicPage } from "@/components/shared/public-shell";
import {
  getLegacyAiReplacement,
  getLegacyCompanyReplacement,
  type LegacyReplacement,
} from "@/data/legacy-routes";

function ReplacementPage({
  replacement,
  path,
}: {
  replacement: LegacyReplacement;
  path: string;
}) {
  return (
    <PublicPage
      eyebrow={replacement.eyebrow}
      title={replacement.title}
      intro={replacement.description}
      seo={{
        title: replacement.title,
        description: replacement.description,
        path,
        noIndex: true,
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_.72fr]">
        <div className="rounded-[20px] border border-primary/25 bg-primary/[.07] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-primary">
            <CircleAlert size={19} />
            <p className="font-data text-[9px] uppercase tracking-[.16em]">Indexed route retained</p>
          </div>
          <p className="mt-7 max-w-[620px] font-display text-3xl leading-[1.05] tracking-[-.03em]">
            The page moved, but the question still has a place here.
          </p>
          <p className="mt-5 max-w-[620px] text-[13px] leading-[1.75] text-muted-foreground">
            {replacement.summary}
          </p>
        </div>
        <div className="rounded-[20px] border border-border bg-card p-6 sm:p-8">
          <p className="font-data text-[9px] uppercase tracking-[.16em] text-primary">Next useful step</p>
          <Link
            href={replacement.destination}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground"
          >
            {replacement.destinationLabel}
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/contact"
            className="mt-5 flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            Request a focused update
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </PublicPage>
  );
}

export function LegacyCompanyPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const replacement = getLegacyCompanyReplacement(slug);
  if (!replacement) return null;
  return <ReplacementPage replacement={replacement} path={`/companies/${slug}`} />;
}

export function LegacyAiPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const replacement = getLegacyAiReplacement(slug);
  if (!replacement) return null;
  return <ReplacementPage replacement={replacement} path={`/ai/${slug}`} />;
}