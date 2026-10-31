import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  Gauge,
  LockKeyhole,
  MoveRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import "./CareerRealityCompass.css";

type DecisionKey = "offer" | "move" | "stay";

type Decision = {
  key: DecisionKey;
  number: string;
  title: string;
  detail: string;
  score: number;
  read: string;
  signals: Array<{ label: string; value: string; width: string; tone?: "coral" | "gold" }>;
};

const decisions: Decision[] = [
  {
    key: "offer",
    number: "01",
    title: "Should I take this offer?",
    detail: "₹24.8L at a product company",
    score: 78,
    read: "Promising, with one expensive caveat.",
    signals: [
      { label: "Cash upside", value: "+14.2%", width: "82%" },
      { label: "Stability", value: "64 / 100", width: "64%", tone: "coral" },
      { label: "Role fit", value: "Strong", width: "76%", tone: "gold" },
    ],
  },
  {
    key: "move",
    number: "02",
    title: "Is now the right time?",
    detail: "Make a move in the next 90 days",
    score: 61,
    read: "The window is open, but don't rush the proof.",
    signals: [
      { label: "Market timing", value: "Good", width: "68%" },
      { label: "Switch friction", value: "Medium", width: "53%", tone: "coral" },
      { label: "Leverage", value: "Building", width: "61%", tone: "gold" },
    ],
  },
  {
    key: "stay",
    number: "03",
    title: "What if I stay put?",
    detail: "Protect learning and optionality",
    score: 69,
    read: "Quietly useful if you set a six-month checkpoint.",
    signals: [
      { label: "Learning curve", value: "Healthy", width: "73%" },
      { label: "Pay momentum", value: "Slow", width: "46%", tone: "coral" },
      { label: "Exit optionality", value: "Strong", width: "79%", tone: "gold" },
    ],
  },
];

const evidence = [
  {
    icon: BarChart3,
    title: "The money is real",
    text: "Your decoded take-home lands 14.2% above the median for this role and city.",
    meta: "salary reports · 18,432 signals",
  },
  {
    icon: Gauge,
    title: "Stability needs a question",
    text: "Hiring slowed this quarter. Ask what the team is measured on before you sign.",
    meta: "company filings · updated 14 jun",
  },
  {
    icon: TrendingUp,
    title: "Your timing is decent",
    text: "Similar moves are taking 3–5 weeks longer than last year. Keep two paths warm.",
    meta: "market movement · confidence high",
  },
];

function CareerRealityCompass() {
  const [selected, setSelected] = useState<DecisionKey>("offer");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState(48);
  const [saved, setSaved] = useState(false);

  const decision = decisions.find((item) => item.key === selected) ?? decisions[0];

  const saveSnapshot = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="cr-compass">
      <div className="cr-shell">
        <aside className="cr-rail" aria-label="Workspace navigation">
          <div className="cr-mark" aria-label="CareerReality">R</div>
          <nav className="cr-rail-nav" aria-label="Career desk sections">
            <button className="cr-rail-button is-active" aria-label="Decision room" title="Decision room">
              <Compass size={19} strokeWidth={1.8} />
            </button>
            <button className="cr-rail-button" aria-label="Saved snapshots" title="Saved snapshots">
              <FileText size={18} strokeWidth={1.8} />
            </button>
            <button className="cr-rail-button" aria-label="Notifications" title="Notifications">
              <Bell size={18} strokeWidth={1.8} />
            </button>
          </nav>
          <span className="cr-rail-label">Career desk / India</span>
        </aside>

        <main className="cr-main">
          <header className="cr-topbar">
            <div className="cr-breadcrumb">
              <span className="cr-eyebrow">Your decision room</span>
              <span className="cr-breadcrumb-separator">/</span>
              <span className="cr-muted" style={{ fontSize: 11 }}>A private working read</span>
            </div>
            <div className="cr-top-actions">
              <button className="cr-top-action" onClick={saveSnapshot}>
                <LockKeyhole size={13} /> Save snapshot
              </button>
              <button className="cr-top-action" aria-label="Help">
                <CircleHelp size={14} />
              </button>
              <span className="cr-avatar" aria-label="Profile initials">AK</span>
            </div>
          </header>

          <section className="cr-body">
            <div className="cr-hero">
              <div className="cr-eyebrow">One question at a time · 04 signals</div>
              <h1 className="cr-display">Make the next move<br /><em>make sense.</em></h1>
              <p className="cr-hero-copy">
                A calmer way to work through a high-stakes career decision. Choose the question you actually have; we will put the useful evidence around it.
              </p>

              <div className="cr-decision-strip" role="tablist" aria-label="Choose a career decision">
                {decisions.map((item) => (
                  <button
                    key={item.key}
                    className={`cr-choice ${selected === item.key ? "is-selected" : ""}`}
                    onClick={() => setSelected(item.key)}
                    role="tab"
                    aria-selected={selected === item.key}
                  >
                    <span className="cr-choice-number">{item.number}</span>
                    <span className="cr-choice-title">{item.title}</span>
                    <span className="cr-choice-detail">{item.detail}</span>
                  </button>
                ))}
              </div>

              <section className="cr-readout" aria-live="polite">
                <div className="cr-score-column">
                  <div>
                    <div className="cr-score-label">Context score</div>
                    <div className="cr-score">{decision.score}</div>
                    <div className="cr-score-denom">out of 100</div>
                  </div>
                  <div className="cr-score-status">
                    <Sparkles size={12} /> grounded read
                  </div>
                </div>
                <div className="cr-readout-main">
                  <div className="cr-readout-head">
                    <h2 className="cr-readout-title">{decision.read}</h2>
                    <span className="cr-updated">UPDATED 14 JUN</span>
                  </div>
                  <div className="cr-readout-line" />
                  {decision.signals.map((signal) => (
                    <div className="cr-signal" key={signal.label}>
                      <span className="cr-signal-name">{signal.label}</span>
                      <span className="cr-signal-track"><span className={`cr-signal-fill ${signal.tone ?? ""}`} style={{ width: signal.width }} /></span>
                      <span className="cr-signal-value">{signal.value}</span>
                    </div>
                  ))}
                  <div className="cr-readout-footer">
                    <span><strong>Read the trade-off.</strong> A score is a starting point, not a verdict.</span>
                    <button className="cr-breakdown-button" onClick={() => setDetailsOpen((open) => !open)}>
                      {detailsOpen ? "Hide breakdown" : "Show breakdown"} <ChevronDown size={13} style={{ transform: detailsOpen ? "rotate(180deg)" : undefined, transition: "transform .2s ease" }} />
                    </button>
                  </div>
                  <div className={`cr-detail-panel ${detailsOpen ? "is-open" : ""}`}>
                    <div className="cr-detail-inner">
                      <div className="cr-detail-content">
                        We weigh cash upside, company movement, role fit, and the friction of getting from today to the next version of your work. The inputs stay visible so you can disagree with the read.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="cr-aside">
              <div className="cr-aside-card">
                <div className="cr-aside-head">
                  <div>
                    <div className="cr-eyebrow">The evidence wall</div>
                    <h2 className="cr-aside-title" style={{ marginTop: 10 }}>What changed<br />the read?</h2>
                  </div>
                  <span className="cr-aside-count">03 / 04</span>
                </div>
                <div className="cr-evidence">
                  {evidence.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article className="cr-evidence-item" key={item.title}>
                        <span className="cr-evidence-icon"><Icon size={14} /></span>
                        <div>
                          <div className="cr-evidence-title">{item.title}</div>
                          <p className="cr-evidence-text">{item.text}</p>
                          <div className="cr-evidence-meta"><span /> {item.meta}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="cr-aside-cta">
                  <div><strong>Want the source trail?</strong> Unlock company-level detail.</div>
                  <button aria-label="Open source trail"><ArrowRight size={15} /></button>
                </div>
              </div>
            </aside>
          </section>

          <section className="cr-lower" aria-label="Next steps">
            <div className="cr-lower-card is-warm">
              <div className="cr-lower-top"><span>Next useful move</span><MoveRight size={15} /></div>
              <div className="cr-lower-title">Ask the hiring manager what slowed hiring this quarter.</div>
              <div className="cr-mini-meter" aria-label="Action confidence: 3 of 4"><span className="is-on" /><span className="is-on" /><span className="is-on" /><span /></div>
            </div>
            <div className="cr-lower-card">
              <div className="cr-lower-top"><span>Make it yours</span><WalletCards size={15} /></div>
              <div className="cr-range-wrap">
                <div className="cr-range-label"><span>Notice period in days</span><strong>{noticePeriod}</strong></div>
                <input className="cr-range" type="range" min="15" max="90" value={noticePeriod} onChange={(event) => setNoticePeriod(Number(event.target.value))} style={{ background: `linear-gradient(90deg, var(--cr-teal) 0 ${((noticePeriod - 15) / 75) * 100}%, #cfc7ba ${((noticePeriod - 15) / 75) * 100}%)` }} aria-label="Notice period in days" />
              </div>
              <div className="cr-saved-note"><ShieldCheck size={13} /> Personal inputs stay in your workspace</div>
            </div>
          </section>
        </main>
      </div>

      {saved && <div className="cr-toast"><Check size={15} color="#9fe0bf" /> Snapshot saved to your desk</div>}
    </div>
  );
}

export default CareerRealityCompass;