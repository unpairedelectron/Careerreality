import { ArrowUpRight, Calculator } from 'lucide-react';
import { Link } from 'wouter';
import { AppNav } from '@/components/shared/app-nav';
import { PublicFooter } from '@/components/shared/public-shell';
import { useSeo } from '@/lib/seo';

export default function NotFound() {
  useSeo({
    title: 'Page not found | CareerReality',
    description: 'This CareerReality route could not be found.',
    path: typeof window === 'undefined' ? '/' : window.location.pathname,
    noIndex: true,
  });

  return (
    <div className="grain min-h-[100dvh] overflow-x-hidden">
      <AppNav />
      <main className="mx-auto flex max-w-[1240px] items-center px-5 py-20 sm:min-h-[640px] sm:px-8 sm:py-24">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_.75fr] lg:items-center lg:gap-24">
          <div className="animate-enter">
            <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary">The desk / 404</p>
            <h1 className="mt-5 max-w-[680px] break-words font-display text-[clamp(2.75rem,15vw,5.75rem)] leading-[.9] tracking-[-.05em]">This page took a wrong turn.</h1>
            <p className="mt-7 max-w-[500px] text-[15px] leading-[1.75] text-muted-foreground">The route is missing, the page moved, or the signal has not made it into the current desk catalogue yet.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/salary-calculator" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[12px] font-bold text-primary-foreground"><Calculator size={15} /> Open the CTC calculator <ArrowUpRight size={14} /></Link>
              <Link href="/tools" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-[12px] font-bold">View active pages</Link>
            </div>
          </div>
          <div className="paper-grid surface-lift rounded-[22px] border border-border p-7 sm:p-10">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-primary">What remains available</span><Calculator size={18} className="text-primary" /></div>
            <p className="mt-10 font-display text-4xl leading-[.98] tracking-[-.04em]">Use the calculator to check an offer against its assumptions.</p>
            <Link href="/salary-calculator" className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold text-primary">Open the CTC calculator <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
