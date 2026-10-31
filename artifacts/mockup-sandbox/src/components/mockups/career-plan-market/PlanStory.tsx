import { ArrowRight, CalendarDays, CheckCircle2, Compass, Sparkles, TrendingUp } from "lucide-react";
import "./_group.css";

const signals = [
  { label: "ROLE DEMAND", value: "Selective", source: "Live role evidence · fresh", tone: "positive" },
  { label: "COMPENSATION", value: "₹38.5L median", source: "Scoped benchmark · high confidence", tone: "positive" },
  { label: "DIRECTION", value: "Scope is the proof gap", source: "CareerReality brief · medium confidence", tone: "accent" },
];

export function PlanStory() {
  return (
    <main className="career-plan-market cr-story">
      <div className="cr-shell">
        <header className="cr-header">
          <div className="cr-header-copy">
            <span className="cr-eyebrow">CAREER PLAN · THIS WEEK</span>
            <h1>Turn signals into moves.</h1>
          </div>
          <div className="cr-story-orb"><Compass size={19} /></div>
        </header>

        <section className="cr-intro">
          <div className="cr-label">WHAT SHOULD I DO NEXT?</div>
          <h2>A plan that moves with your market.</h2>
          <p>See the evidence, understand the implication, then schedule one move you can actually finish.</p>
          <div className="cr-intro-footer"><span><Sparkles size={12} /> Researched brief</span><span>Updated 18 Jun</span></div>
        </section>

        <section className="cr-card cr-flow cr-story-flow">
          <div className="cr-flow-top">
            <div><div className="cr-label">DECISION ENGINE</div><h3 className="cr-flow-title">Signals → meaning → move</h3></div>
            <span className="cr-pill positive">High confidence</span>
          </div>
          <svg viewBox="0 0 340 78" role="img" aria-label="Four evidence signals flow into one planned move">
            <defs><linearGradient id="planWave" x1="0" x2="1"><stop offset="0" stopColor="#245f55" /><stop offset="1" stopColor="#d97867" /></linearGradient></defs>
            <path d="M20 54 C72 22 85 22 116 43 S161 62 188 35 S236 16 268 39 S301 56 320 27" fill="none" stroke="url(#planWave)" strokeWidth="3" strokeLinecap="round" />
            {[20, 116, 188, 268].map((x, index) => <circle key={x} cx={x} cy={index % 2 ? 43 : index === 0 ? 54 : 35} r="7" fill={index === 3 ? "#d97867" : "#245f55"} stroke="#fbf8f1" strokeWidth="3" />)}
            <path d="M20 66 H320" stroke="#e7e1d4" strokeWidth="2" />
          </svg>
          <div className="cr-flow-labels">
            <div><span>EVIDENCE</span><strong>4 sources</strong></div>
            <div><span>READ</span><strong>High confidence</strong></div>
            <div><span>NEXT</span><strong>1 move</strong></div>
          </div>
        </section>

        <div className="cr-section-head"><h2 className="cr-section-title">Market read → next moves</h2><span className="cr-section-action">3 signals</span></div>
        <section className="cr-card cr-change">
          <div className="cr-label">SERVER-RESEARCHED MARKET CONTEXT</div>
          <strong>Choose the response you can test, not the story you can only worry about.</strong>
          <p className="cr-muted">Salary, company, watch, and live role-demand evidence stay labeled by freshness and confidence.</p>
        </section>

        {signals.map((signal, index) => (
          <article className="cr-card cr-move cr-story-move" key={signal.label}>
            <div className="cr-move-head"><span className={`cr-move-label ${signal.tone}`}>{signal.label}</span><span className="cr-pill">{index === 0 ? "High" : "Medium"} confidence</span></div>
            <h3 className="cr-move-value">{signal.value}</h3>
            <p>{index === 0 ? "Make one outcome legible in your next conversation." : index === 1 ? "Use the range to choose what to verify, not what to assume." : "Ask for cross-functional scope and capture the proof point."}</p>
            <div className="cr-move-meta"><span>{signal.source}</span><button className="cr-button secondary">Add to Plan <CalendarDays size={14} /></button></div>
          </article>
        ))}

        <section className="cr-card cr-story-next">
          <div className="cr-story-next-icon"><TrendingUp size={18} /></div>
          <div><div className="cr-label">THE NEXT USEFUL ACTION</div><h3>Ask for one cross-functional outcome.</h3><p className="cr-muted">A small, observable proof point is more useful than another private readiness score.</p></div>
          <ArrowRight size={18} />
        </section>
        <div className="cr-disclaimer"><CheckCircle2 size={14} /><span>Known, meaning, unknown, next action. Unknown is a valid result.</span></div>
      </div>
    </main>
  );
}