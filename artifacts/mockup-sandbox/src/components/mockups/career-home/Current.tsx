import {
  Activity, ArrowUpRight, Bell, HelpCircle, Info, MapPin, MessageCircle,
  Shield, SlidersHorizontal, TrendingUp, UserCheck, Users, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "./_group.css";

const signals = [
  ["Role demand", "Senior product roles are hiring selectively; proof of measurable outcomes is carrying more weight.", "LinkedIn Jobs · 2 days ago · High confidence", "positive"],
  ["Compensation", "Your current position is close to the center of the scoped Bengaluru product market.", "Salary benchmark · 14 Jun · High confidence", "positive"],
  ["Direction", "Moving toward Head of Product is plausible, but scope and manager sponsorship are still unproven.", "CareerReality brief · Fresh · Medium confidence", "accent"],
] as const;

const tools: { icon: LucideIcon; title: string; body: string; section: string; action: string }[] = [
  { icon: TrendingUp, title: "Are you ready for Head of Product?", body: "Rate scope, impact, skills, and manager sponsorship. Save the proof point you can defend.", section: "Promotion readiness", action: "Evidence, not vibes" },
  { icon: Shield, title: "Read the environment around your work", body: "Separate manager patterns, team conditions, and evidence gaps before making a big move.", section: "Manager + team risk", action: "Pattern check" },
  { icon: MapPin, title: "Would a move actually improve your position?", body: "Compare transparent city assumptions before you treat relocation as the answer.", section: "Relocation comparison", action: "Decision tool" },
  { icon: Users, title: "Turn relationships into a specific next ask", body: "Separate warm evidence from wishful thinking before you ask for access.", section: "Network + recruiter intelligence", action: "Signal check" },
  { icon: SlidersHorizontal, title: "What changes if you stay, switch, or move?", body: "Test one assumption at a time before you turn a possibility into a plan.", section: "What-if simulations", action: "Make trade-offs visible" },
  { icon: Shield, title: "Compare with a cohort, not a person", body: "See scoped salary ranges only when the peer group is large enough to protect privacy.", section: "Anonymous peer benchmarks", action: "Privacy threshold" },
];

function Section({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return <><div className="cr-section-head"><h2 className="cr-section-title">{title}</h2>{action && <span className="cr-section-action">{action}</span>}</div>{children}</>;
}

function Signal({ label, text, source, tone = "" }: { label: string; text: string; source: string; tone?: string }) {
  return <article className={`cr-card cr-signal ${tone}`}><i className="cr-dot" /><div className="cr-signal-copy"><span className="cr-signal-label">{label}</span><div className="cr-signal-text">{text}</div><span className="cr-signal-source">{source}</span></div></article>;
}

export function Current() {
  return (
    <main className="career-home">
      <div className="cr-shell">
        <header className="cr-header">
          <div className="cr-header-copy"><span className="cr-eyebrow">WEDNESDAY · 18 JUN 2025</span><h1 className="cr-title">Good evening, Aisha.</h1></div>
          <button className="cr-icon-button" aria-label="Notifications"><Bell size={18} /></button>
        </header>

        <section className="cr-hero">
          <div className="cr-hero-top"><div className="cr-hero-icon"><Activity size={19} /></div><span className="cr-pill positive">High confidence</span></div>
          <span className="cr-label">YOUR CAREER INTELLIGENCE</span>
          <h2 className="cr-hero-title">Your next move is credible, but not yet proven.</h2>
          <p className="cr-hero-body">You have the product depth for a bigger remit. The missing evidence is cross-functional scope and a promotion story your manager can defend.</p>
          <div className="cr-hero-footer"><span>3 evidence signals</span><span>Fresh · 2 days ago</span></div>
        </section>

        <section className="cr-card cr-context">
          <div className="cr-context-top"><div className="cr-context-copy"><span className="cr-label">YOUR CAREER CONTEXT</span><strong className="cr-context-role">Senior Product Manager</strong><span className="cr-context-meta">Razorpay · Bengaluru · 6 years</span></div><UserCheck size={20} color="var(--cr-primary)" /></div>
          <div className="cr-coverage"><div className="cr-context-top"><span className="cr-coverage-label">PROFILE COVERAGE</span><span className="cr-coverage-value">100%</span></div><div className="cr-progress"><i /></div><span className="cr-hint">More context makes the market read more specific. Resume evidence is optional.</span></div>
        </section>

        <Section title="Your position in the market" action="Source-backed">
          <div className="cr-metrics"><div className="cr-card cr-metric"><div className="cr-metric-top"><span>Compensation</span><TrendingUp size={15} color="var(--cr-success)" /></div><strong className="cr-metric-value">₹38.5L median</strong><span className="cr-metric-detail">High · n=124</span></div><div className="cr-card cr-metric"><div className="cr-metric-top"><span>Company signal</span><Shield size={15} color="var(--cr-success)" /></div><strong className="cr-metric-value">78/100</strong><span className="cr-metric-detail">Stable momentum</span></div></div>
        </Section>

        <section className="cr-card cr-range"><div className="cr-range-head"><div className="cr-range-copy"><span className="cr-label">COMPENSATION POSITION</span><strong className="cr-range-title">₹31.2L — ₹48.7L</strong></div><span className="cr-pill positive">High</span></div><div className="cr-track"><i /></div><div className="cr-range-labels"><span>25th · ₹31.2L</span><span>Median · ₹38.5L</span><span>75th · ₹48.7L</span></div><div className="cr-range-footer"><small>YOUR INPUT</small><strong>₹42L · at or above median</strong></div><span className="cr-range-source">CareerReality salary benchmark · n=124 · Checked 14 Jun</span></section>

        <Section title="What the evidence says" action="3 signals">{signals.map(([label, text, source, tone]) => <Signal key={label} label={label} text={text} source={source} tone={tone} />)}</Section>
        <Section title="What this means for you" action="Interpretation"><Signal label="Personal diagnosis" text="You are positioned for a larger product remit, but your current evidence still reads as excellent execution rather than organisation-level leadership." source="CareerReality brief · Fresh · High confidence" /><Signal label="Your next move" text="Turn one cross-functional outcome into a promotion-ready proof point." source="LinkedIn Jobs · directional" tone="accent" /></Section>

        <section className="cr-card cr-unknown"><div className="cr-unknown-head"><HelpCircle size={17} color="var(--cr-primary)" />Still to be measured</div><div className="cr-unknown-body">AI exposure, promotion readiness, manager risk, and switch readiness need their own evidence. They are not silently converted into a score here.</div><button className="cr-button">Add promotion evidence <ArrowUpRight size={16} /></button></section>

        <Section title="One thing to do"><section className="cr-card cr-action"><div className="cr-action-icon"><Zap size={19} /></div><strong className="cr-action-title">Turn one capability into a proof point</strong><div className="cr-action-body">Choose a small, observable action this week and add it to Plan so the signal becomes evidence.</div><div className="cr-action-footer"><span className="cr-pill positive">Expected impact · High</span><span className="cr-link">Add to plan <ArrowUpRight size={13} /></span></div></section></Section>

        {tools.map(({ icon: Icon, title, body, section, action }) => <Section key={title} title={section} action={action}><article className="cr-card cr-promo"><div className="cr-action-icon"><Icon size={18} /></div><div className="cr-promo-copy"><strong className="cr-action-title">{title}</strong><div className="cr-action-body">{body}</div></div><ArrowUpRight size={18} /></article></Section>)}

        <Section title="Career Copilot" action="Evidence-backed"><article className="cr-card cr-promo"><div className="cr-action-icon"><MessageCircle size={18} /></div><div className="cr-promo-copy"><strong className="cr-action-title">Ask for the next move</strong><div className="cr-action-body">Ask a question and get assumptions, evidence, uncertainty, and a next action.</div></div><ArrowUpRight size={18} /></article></Section>
        <div className="cr-disclaimer"><Info size={14} /><span>Every conclusion is scoped to its source, freshness, confidence, and missing context. Unknown is a valid result.</span></div>
      </div>
    </main>
  );
}