import { Link } from "wouter";
import { ArrowUpRight, CircleAlert } from "lucide-react";
import { AppNav } from "@/components/shared/app-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { useSeo } from "@/lib/seo";

export default function ProPage() {
  useSeo({
    title: "Membership Availability | CareerReality",
    description: "Membership pricing, service details, and delivery have not been verified for this release candidate. No membership is offered here.",
    path: "/pro",
    noIndex: true,
  });

  return (
    <div className="grain min-h-[100dvh]">
      <AppNav />
      <main className="mx-auto max-w-[920px] px-5 py-16 sm:px-8 sm:py-24">
        <span className="font-data text-[10px] uppercase tracking-[.2em] text-primary">Membership / unavailable</span>
        <h1 className="mt-5 max-w-[800px] font-display text-[48px] leading-[.96] tracking-[-.045em] sm:text-[72px]">
          Membership is not available in this release candidate.
        </h1>
        <p className="mt-7 max-w-[680px] text-[15px] leading-[1.75] text-muted-foreground">
          Pricing, included features, terms, payment, and delivery have not been verified. This page has no checkout, subscription, or request form.
        </p>

        <section className="mt-10 rounded-[18px] border border-border bg-card p-6 sm:p-8" aria-labelledby="membership-review-heading">
          <div className="flex gap-3">
            <CircleAlert className="mt-1 shrink-0 text-primary" size={20} aria-hidden="true" />
            <div>
              <h2 id="membership-review-heading" className="font-display text-2xl">What remains unverified</h2>
              <ul className="mt-5 list-disc space-y-2 pl-5 text-[13px] leading-[1.7] text-muted-foreground">
                <li>The operating entity and a monitored support channel.</li>
                <li>Any membership price, contract terms, payment flow, or fulfilment.</li>
                <li>Which paid features, if any, are available and supported.</li>
                <li>Owner-approved privacy and data-handling information.</li>
              </ul>
            </div>
          </div>
        </section>

        <Link href="/salary-calculator" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[12px] font-bold text-primary-foreground">
          Use the CTC calculator <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
