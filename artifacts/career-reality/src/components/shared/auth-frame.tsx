import { ArrowUpRight, LockKeyhole, Sparkles, Waypoints } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/shared/app-nav";

export function AuthFrame({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <header className="flex h-[72px] items-center justify-between border-b border-border/80 bg-background/80 px-5 backdrop-blur-md sm:px-8">
        <Logo />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to desk <ArrowUpRight size={13} />
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-72px)] w-full max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-20 lg:py-14">
        <section className="relative hidden min-h-[520px] overflow-hidden rounded-[2rem] border border-border bg-card p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary/15" />
          <div className="pointer-events-none absolute -right-8 top-16 h-44 w-44 rounded-full bg-accent/10 blur-2xl" />
          <div className="relative max-w-md">
            <p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-[-.045em]">{title}</h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
          </div>

          <div className="relative space-y-4">
            <p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">A quieter way to move forward</p>
            <div className="grid gap-3">
              <TrustLine icon={<LockKeyhole size={15} />} text="Private by design. Your decisions stay yours." />
              <TrustLine icon={<Waypoints size={15} />} text="Evidence before advice. No empty confidence." />
              <TrustLine icon={<Sparkles size={15} />} text="A sharper next move, not more career noise." />
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col items-center">
          <div className="mb-6 max-w-[440px] text-center lg:hidden">
            <p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl leading-none tracking-[-.04em]">{title}</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {children}
          <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Your private career operating system
          </div>
        </section>
      </main>
    </div>
  );
}

function TrustLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}