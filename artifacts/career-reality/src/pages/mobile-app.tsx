import { getPageHeading } from "@/data/page-headings";
import { mobileAppFaqs } from "@/data/mobile-app-faqs";
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Building2, CircleAlert, Compass, LockKeyhole, Smartphone, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { AppNav } from "@/components/shared/app-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { useSeo } from "@/lib/seo";

const briefings = [
  {
    icon: WalletCards,
    label: "Salary",
    title: "The number behind the number.",
    body: "Keep fixed pay, variable pay, deductions, and the actual monthly picture together.",
  },
  {
    icon: Building2,
    label: "Company",
    title: "The employer behind the offer.",
    body: "Carry stability, hiring momentum, and the questions that still need verification.",
  },
  {
    icon: CircleAlert,
    label: "Risk",
    title: "The cost of moving now.",
    body: "See runway, notice friction, and uncertainty before excitement makes the call.",
  },
  {
    icon: ArrowRight,
    label: "Next step",
    title: "A move you can explain.",
    body: "Turn a loud decision into one clear next action, then take the context with you.",
  },
];

const mobileHeading = getPageHeading("/mobile-app");


export default function MobileAppPage() {
  useSeo({
    title: "CareerReality Mobile App — Coming Soon",
    description: "A calmer way to carry salary, company, risk, and next-step context through consequential career decisions in India. The CareerReality mobile app is coming soon.",
    path: "/mobile-app",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Mobile app", path: "/mobile-app" },
    ],
    faqs: mobileAppFaqs,
  });

  return (
    <div className="grain min-h-[100dvh] overflow-x-hidden">
      <AppNav />
      <main>
        <section className="mobile-app-hero relative mx-auto max-w-[1240px] px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:pb-36 lg:pt-28">
          <div className="pointer-events-none absolute -right-24 top-8 size-[28rem] rounded-full border border-primary/10 shadow-[0_0_0_3rem_hsl(var(--primary)/.025),0_0_0_7rem_hsl(var(--primary)/.018)]" />
          <div className="relative grid items-center gap-14 lg:grid-cols-[minmax(0,.9fr)_minmax(390px,.72fr)] lg:gap-20">
            <div className="reveal">
              <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-[.2em] text-primary" data-testid="status-mobile-app-coming-soon">
                <span className="pulse-dot size-1.5 rounded-full bg-primary" />
                Coming soon · mobile briefing
              </div>
              <h1 className="mt-6 font-data text-[12px] font-semibold uppercase tracking-[.14em] text-foreground" data-testid="heading-mobile-app">{mobileHeading?.h1}</h1>
              <p className="mt-4 max-w-[9ch] font-display text-[clamp(4rem,8vw,7.7rem)] leading-[.82] tracking-[-.07em]" data-testid="page-subhead">
                Take the <span className="text-primary">context</span> with you.
              </p>
              <p className="mt-8 max-w-[34rem] text-[15px] leading-[1.8] text-muted-foreground" data-testid="text-mobile-app-intro">
                Career decisions rarely happen at a desk. The CareerReality mobile app will keep the salary, company, risk, and next-step context close when the conversation moves to a call, a commute, or a late-night rethink.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/salary-calculator" className="group inline-flex h-12 items-center gap-2 rounded-[11px] bg-primary px-5 text-[12px] font-bold text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/.18)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_17px_30px_hsl(var(--primary)/.24)]" data-testid="link-mobile-app-web-calculator">
                  Use the CTC calculator
                  <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <a href="#platforms" className="inline-flex h-12 items-center gap-2 rounded-[11px] border border-border bg-card/60 px-5 text-[12px] font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-card" data-testid="link-mobile-app-platforms">
                  See platform status <ArrowDown size={14} />
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3 border-t border-border pt-5 font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">
                <LockKeyhole size={13} className="text-primary" />
                No premature downloads. No inbox to monitor.
              </div>
            </div>

            <div className="reveal reveal-3 relative mx-auto w-full max-w-[440px]" data-testid="visual-mobile-app-briefing">
              <div className="absolute -left-5 top-16 hidden -rotate-6 rounded-lg border border-border bg-card px-3 py-2 shadow-[0_12px_30px_hsl(var(--foreground)/.08)] sm:block">
                <p className="font-data text-[8px] uppercase tracking-[.15em] text-muted-foreground">Decision file</p>
                <p className="mt-1 text-[11px] font-bold">Offer · Bengaluru</p>
              </div>
              <div className="absolute -right-2 bottom-24 hidden rotate-3 rounded-lg border border-border bg-card px-3 py-2 shadow-[0_12px_30px_hsl(var(--foreground)/.08)] sm:block">
                <p className="font-data text-[8px] uppercase tracking-[.15em] text-muted-foreground">Next check</p>
                <p className="mt-1 text-[11px] font-bold text-primary">Ask about runway</p>
              </div>
              <div className="relative mx-auto max-w-[310px] rounded-[2.4rem] border-[7px] border-[#183b3b] bg-[#17302f] p-2 shadow-[0_32px_80px_hsl(var(--foreground)/.2)] dark:border-[#0c1d1e]">
                <div className="overflow-hidden rounded-[1.8rem] bg-[#eef1e9] dark:bg-[#233737]">
                  <div className="flex items-center justify-between px-5 pb-3 pt-4">
                    <span className="font-data text-[8px] font-bold text-[#153b39] dark:text-[#dfe9df]">09:41</span>
                    <span className="h-1.5 w-12 rounded-full bg-[#153b39]/20 dark:bg-[#dfe9df]/20" />
                    <span className="font-data text-[8px] text-[#153b39]/60 dark:text-[#dfe9df]/60">5G</span>
                  </div>
                  <div className="px-5 pb-7 pt-5">
                    <p className="font-data text-[8px] uppercase tracking-[.18em] text-[#9a5d4c]">Your decision brief</p>
                    <h2 className="mt-3 font-display text-[2.25rem] leading-[.88] tracking-[-.06em] text-[#153b39] dark:text-[#ecf1e9]">Stay curious.<br />Move clearly.</h2>
                    <div className="mt-7 rounded-xl border border-[#c9d3c5] bg-[#f8f8f1] p-3.5 dark:border-[#46605b] dark:bg-[#2e4442]">
                      <div className="flex items-center justify-between">
                        <span className="font-data text-[8px] uppercase tracking-[.14em] text-[#153b39]/60 dark:text-[#dfe9df]/60">Offer reality</span>
                        <BarChart3 size={14} className="text-[#9a5d4c]" />
                      </div>
                      <p className="mt-3 font-display text-2xl tracking-[-.04em] text-[#153b39] dark:text-[#ecf1e9]">₹1.18L <span className="font-sans text-[10px] tracking-normal text-[#153b39]/60 dark:text-[#dfe9df]/60">monthly in hand</span></p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dce4d6] dark:bg-[#47605c]"><div className="h-full w-[72%] rounded-full bg-[#2b8274]" /></div>
                      <p className="mt-2 text-[9px] leading-4 text-[#153b39]/65 dark:text-[#dfe9df]/65">Fixed cash looks solid. Variable pay needs one more question.</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#c9d3c5] bg-[#f8f8f1] p-3 dark:border-[#46605b] dark:bg-[#2e4442]"><p className="font-data text-[7px] uppercase tracking-[.13em] text-[#153b39]/55 dark:text-[#dfe9df]/55">Company</p><p className="mt-2 text-[10px] font-bold text-[#153b39] dark:text-[#ecf1e9]">Watchful</p></div>
                      <div className="rounded-xl border border-[#c9d3c5] bg-[#f8f8f1] p-3 dark:border-[#46605b] dark:bg-[#2e4442]"><p className="font-data text-[7px] uppercase tracking-[.13em] text-[#153b39]/55 dark:text-[#dfe9df]/55">Runway</p><p className="mt-2 text-[10px] font-bold text-[#153b39] dark:text-[#ecf1e9]">14 months</p></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#d9e8da] px-3 py-2.5 dark:bg-[#34534c]"><Compass size={13} className="text-[#2b8274]" /><p className="text-[9px] font-bold text-[#153b39] dark:text-[#ecf1e9]">Next: ask for the team plan</p></div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-center font-data text-[9px] uppercase tracking-[.16em] text-muted-foreground">A private briefing, not a notification stream</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/25" aria-labelledby="mobile-app-carry-heading">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
              <div>
                <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary">Built for the moment after the tab closes</p>
                <h2 id="mobile-app-carry-heading" className="mt-5 max-w-[8ch] font-display text-[clamp(3rem,5.3vw,5.3rem)] leading-[.87] tracking-[-.06em]" data-testid="heading-mobile-app-carry">Carry the whole decision.</h2>
              </div>
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                {briefings.map(({ icon: Icon, label, title, body }, index) => (
                  <article key={label} className={`surface-lift border-t-2 ${index % 2 === 0 ? "border-primary/55" : "border-accent/60"} pt-5`} data-testid={`card-mobile-app-briefing-${label.toLowerCase().replaceAll(" ", "-")}`}>
                    <div className="flex items-center justify-between"><span className="font-data text-[9px] uppercase tracking-[.17em] text-primary">{label}</span><Icon size={17} className="text-muted-foreground" /></div>
                    <h3 className="mt-5 max-w-[15ch] font-display text-[1.8rem] leading-[.95] tracking-[-.04em]">{title}</h3>
                    <p className="mt-4 text-[12px] leading-[1.7] text-muted-foreground">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="platforms" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="mobile-app-platforms-heading">
          <div className="grid items-end gap-8 border-b border-border pb-10 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary">Platform status</p>
              <h2 id="mobile-app-platforms-heading" className="mt-4 max-w-[10ch] font-display text-[clamp(3rem,5.5vw,5.8rem)] leading-[.85] tracking-[-.06em]" data-testid="heading-mobile-app-platforms">Not yet in your store.</h2>
            </div>
            <p className="max-w-[310px] text-[12px] leading-[1.7] text-muted-foreground">We will publish the real store destinations here when the app is ready. Until then, this page will not ask you for an email or send you to a placeholder.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { name: "iOS", detail: "App Store destination", glyph: "iOS" },
              { name: "Android", detail: "Google Play destination", glyph: "A" },
            ].map((platform) => (
              <div key={platform.name} className="group relative overflow-hidden rounded-[18px] border border-border bg-card p-6 transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_18px_44px_hsl(var(--foreground)/.08)] sm:p-8" data-testid={`status-mobile-app-${platform.name.toLowerCase()}`}>
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-secondary/70 transition-transform duration-500 group-hover:scale-125" />
                <div className="relative flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground font-data text-[11px] font-bold">{platform.glyph}</span><div><p className="font-display text-2xl tracking-[-.04em]">{platform.name}</p><p className="mt-1 font-data text-[9px] uppercase tracking-[.15em] text-muted-foreground">{platform.detail}</p></div></div>
                  <span className="rounded-full border border-accent/30 bg-accent/[.08] px-2.5 py-1 font-data text-[8px] uppercase tracking-[.13em] text-accent">Coming soon</span>
                </div>
                <div className="relative mt-10 flex items-center justify-between border-t border-border pt-4"><p className="text-[12px] text-muted-foreground">Store link will appear at launch.</p><Smartphone size={16} className="text-muted-foreground transition-colors group-hover:text-primary" /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mobile-app-web-path mx-5 mb-20 overflow-hidden rounded-[20px] bg-primary sm:mx-8 sm:mb-28" aria-labelledby="mobile-app-web-heading">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-16 lg:py-20">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary-foreground/65">The desk is open now</p>
              <h2 id="mobile-app-web-heading" className="mt-5 max-w-[12ch] font-display text-[clamp(2.8rem,5vw,5rem)] leading-[.88] tracking-[-.06em] text-primary-foreground" data-testid="heading-mobile-app-web-path">Start the decision on the web. Carry it further soon.</h2>
              <p className="mt-5 max-w-[34rem] text-[13px] leading-[1.75] text-primary-foreground/72">Use the full CareerReality desk today to decode an offer, read the company behind it, and save the questions worth taking into your next conversation.</p>
            </div>
            <Link href="/salary-calculator" className="group inline-flex h-12 w-fit items-center gap-2 rounded-[11px] bg-primary-foreground px-5 text-[12px] font-bold text-primary transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_12px_24px_hsl(var(--foreground)/.2)]" data-testid="link-mobile-app-open-calculator">
              Open the CTC calculator <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[800px] px-5 pb-20 sm:px-8 sm:pb-28" aria-labelledby="mobile-app-faq-heading">
          <p className="font-data text-[10px] uppercase tracking-[.2em] text-primary">A few honest answers</p>
          <h2 id="mobile-app-faq-heading" className="mt-4 font-display text-[clamp(2.8rem,5vw,4.5rem)] leading-[.9] tracking-[-.06em]" data-testid="heading-mobile-app-faq">Before you bookmark this.</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {mobileAppFaqs.map((faq, index) => (
              <details key={faq.question} className="group py-5" data-testid={`disclosure-mobile-app-faq-${index + 1}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[13px] font-bold marker:hidden" data-testid={`button-mobile-app-faq-${index + 1}`}>{faq.question}<span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-primary transition-transform group-open:rotate-45"><span className="text-lg font-normal leading-none">+</span></span></summary>
                <p className="max-w-[620px] pt-4 text-[12px] leading-[1.75] text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}