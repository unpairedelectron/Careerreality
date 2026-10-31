import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  FileCheck2,
  Info,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import "./_group.css";
import "./_variant.css";

const signals = [
  {
    label: "Role demand",
    text: "Senior product roles are hiring selectively; proof of measurable outcomes is carrying more weight.",
    source: "LinkedIn Jobs · 2 days ago",
    confidence: "High confidence",
    tone: "teal",
  },
  {
    label: "Compensation",
    text: "Your current position is close to the center of the scoped Bengaluru product market.",
    source: "Salary benchmark · 14 Jun",
    confidence: "High confidence",
    tone: "teal",
  },
  {
    label: "Direction",
    text: "Moving toward Head of Product is plausible, but scope and manager sponsorship are still unproven.",
    source: "CareerReality brief · Fresh",
    confidence: "Medium confidence",
    tone: "coral",
  },
] as const;

const tools = [
  {
    icon: TrendingUp,
    title: "Promotion readiness",
    question: "Are you ready for Head of Product?",
    body: "Rate scope, impact, skills, and manager sponsorship. Save the proof point you can defend.",
  },
  {
    icon: ShieldCheck,
    title: "Manager + team risk",
    question: "What is the environment around your work?",
    body: "Separate manager patterns, team conditions, and evidence gaps before making a big move.",
  },
  {
    icon: MapPin,
    title: "Relocation comparison",
    question: "Would a move actually improve your position?",
    body: "Compare transparent city assumptions before you treat relocation as the answer.",
  },
  {
    icon: UsersRound,
    title: "Network intelligence",
    question: "What is the next specific ask?",
    body: "Separate warm evidence from wishful thinking before you ask for access.",
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="cv-section-heading">
      <div>
        {eyebrow && <span className="cv-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {detail && <span className="cv-section-detail">{detail}</span>}
    </div>
  );
}

function SignalRow({
  label,
  text,
  source,
  confidence,
  tone,
}: (typeof signals)[number]) {
  return (
    <article className={`cv-signal cv-signal-${tone}`}>
      <span className="cv-signal-mark" aria-hidden="true" />
      <div className="cv-signal-copy">
        <div className="cv-signal-topline">
          <span className="cv-signal-label">{label}</span>
          <span className="cv-confidence">{confidence}</span>
        </div>
        <p>{text}</p>
        <span className="cv-source">{source}</span>
      </div>
    </article>
  );
}

export function Variant() {
  const [savedToPlan, setSavedToPlan] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main className="career-home career-home-variant">
      <div className="cv-shell">
        <header className="cv-header">
          <div className="cv-header-copy">
            <span className="cv-date">WEDNESDAY · 18 JUN 2025</span>
            <p className="cv-kicker">CAREERREALITY / PRIVATE BRIEFING</p>
            <h1>Good evening, Aisha.</h1>
          </div>
          <button
            className="cv-icon-button"
            type="button"
            aria-label="Open notifications"
            onClick={() => announce("You are all caught up.")}
          >
            <Bell size={17} strokeWidth={1.8} />
            <span className="cv-notification-dot" aria-hidden="true" />
          </button>
        </header>

        <section className="cv-opening" aria-labelledby="opening-title">
          <div className="cv-opening-topline">
            <span className="cv-opening-mark">
              <Activity size={16} strokeWidth={2.2} />
            </span>
            <span className="cv-status cv-status-known">
              <span className="cv-status-dot" aria-hidden="true" />
              Read is grounded
            </span>
          </div>
          <span className="cv-eyebrow cv-opening-eyebrow">THE SHORT READ</span>
          <h2 id="opening-title">
            Your next move is credible. Now make it easier to defend.
          </h2>
          <p>
            You have the product depth for a bigger remit. The clearest gap is
            not ambition; it is a cross-functional outcome and a promotion story
            your manager can stand behind.
          </p>
          <div className="cv-opening-foot">
            <span>
              <FileCheck2 size={13} /> 3 source-backed signals
            </span>
            <span>
              <Clock3 size={13} /> Checked 2 days ago
            </span>
          </div>
        </section>

        <section className="cv-meaning-card" aria-labelledby="meaning-title">
          <div className="cv-card-label-row">
            <span className="cv-eyebrow">WHAT THIS MEANS</span>
            <span className="cv-brief-number">01 / 04</span>
          </div>
          <h2 id="meaning-title">
            Move toward a bigger remit, not away from your current role.
          </h2>
          <p className="cv-card-intro">
            The market read is encouraging, but a title change alone is not the
            evidence. Build one visible piece of scope first.
          </p>
          <div className="cv-read-list">
            <div className="cv-read-item">
              <span className="cv-read-icon cv-read-icon-known">
                <Check size={14} />
              </span>
              <div>
                <strong>Known so far</strong>
                <span>Strong product depth and measurable outcomes.</span>
              </div>
            </div>
            <div className="cv-read-item">
              <span className="cv-read-icon cv-read-icon-open">
                <Target size={14} />
              </span>
              <div>
                <strong>Still to prove</strong>
                <span>Cross-functional scope and manager sponsorship.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="cv-context-card" aria-labelledby="context-title">
          <div className="cv-context-avatar" aria-hidden="true">
            <UserRound size={18} />
          </div>
          <div className="cv-context-copy">
            <span className="cv-eyebrow">YOUR CONTEXT</span>
            <h2 id="context-title">Senior Product Manager</h2>
            <p>Razorpay <span aria-hidden="true">·</span> Bengaluru <span aria-hidden="true">·</span> 6 years</p>
          </div>
          <button
            className="cv-text-button"
            type="button"
            onClick={() => announce("Context editing will be available from your profile.")}
          >
            Edit
          </button>
        </section>

        <section className="cv-section cv-market-section">
          <SectionHeading
            eyebrow="KNOWN EVIDENCE"
            title="Your position in the market"
            detail="Source-backed"
          />
          <div className="cv-market-grid">
            <article className="cv-market-stat cv-market-stat-primary">
              <div className="cv-stat-topline">
                <span>Compensation</span>
                <TrendingUp size={16} />
              </div>
              <strong>₹38.5L</strong>
              <span className="cv-stat-caption">median, scoped Bengaluru market</span>
              <span className="cv-stat-source">n=124 · checked 14 Jun</span>
            </article>
            <article className="cv-market-stat">
              <div className="cv-stat-topline">
                <span>Company signal</span>
                <ShieldCheck size={16} />
              </div>
              <strong>Stable</strong>
              <span className="cv-stat-caption">momentum in the current read</span>
              <span className="cv-stat-source">Source-backed · fresh</span>
            </article>
          </div>
          <article className="cv-range-card">
            <div className="cv-range-heading">
              <div>
                <span className="cv-eyebrow">COMPENSATION POSITION</span>
                <h3>₹31.2L — ₹48.7L</h3>
              </div>
              <span className="cv-status cv-status-directional">Directional</span>
            </div>
            <div className="cv-range-track" aria-label="Your input sits above the market median">
              <span className="cv-range-fill" />
              <span className="cv-range-marker" />
            </div>
            <div className="cv-range-labels">
              <span>25th · ₹31.2L</span>
              <span>Median · ₹38.5L</span>
              <span>75th · ₹48.7L</span>
            </div>
            <div className="cv-input-callout">
              <span>Your input</span>
              <strong>₹42L <em>at or above median</em></strong>
            </div>
            <p className="cv-source cv-range-source">
              CareerReality salary benchmark · n=124 · checked 14 Jun
            </p>
          </article>
        </section>

        <section className="cv-section">
          <SectionHeading
            eyebrow="EVIDENCE LOG"
            title="What the evidence says"
            detail="3 signals"
          />
          <div className="cv-signal-list">
            {signals.map((signal) => (
              <SignalRow key={signal.label} {...signal} />
            ))}
          </div>
        </section>

        <section className="cv-section">
          <SectionHeading
            eyebrow="INTERPRETATION"
            title="What this means for you"
            detail="Personal read"
          />
          <article className="cv-interpretation-card">
            <span className="cv-interpretation-mark">
              <Sparkles size={16} />
            </span>
            <div>
              <h3>Your leverage is real, but it is still concentrated.</h3>
              <p>
                Right now, your evidence reads as excellent execution. One
                cross-functional outcome would make the larger-leadership story
                much easier to defend.
              </p>
              <span className="cv-source">CareerReality brief · High confidence</span>
            </div>
          </article>
        </section>

        <section className="cv-proof-card" aria-labelledby="proof-title">
          <div className="cv-proof-top">
            <div className="cv-proof-icon">
              <CircleHelp size={17} />
            </div>
            <div>
              <span className="cv-eyebrow">EVIDENCE TO GATHER</span>
              <h2 id="proof-title">The unanswered parts are deliberate.</h2>
            </div>
          </div>
          <p>
            We will not turn missing context into a made-up score. These areas
            need your experience, not a guess from the market.
          </p>
          <div className="cv-open-areas">
            <span>Promotion readiness</span>
            <span>Manager patterns</span>
            <span>Switch readiness</span>
          </div>
          <button
            className="cv-secondary-button"
            type="button"
            onClick={() => {
              setShowEvidence((visible) => !visible);
              announce(showEvidence ? "Evidence prompts hidden." : "Evidence prompts opened.");
            }}
            aria-expanded={showEvidence}
          >
            {showEvidence ? "Hide evidence prompts" : "Add one proof point"}
            <ChevronDown size={16} className={showEvidence ? "cv-chevron-open" : ""} />
          </button>
          {showEvidence && (
            <div className="cv-evidence-prompt">
              <span className="cv-prompt-number">NEXT</span>
              <p>
                Write down one outcome where you aligned another team, changed a
                decision, or moved a measurable result.
              </p>
              <button
                className="cv-inline-action"
                type="button"
                onClick={() => announce("Proof point saved as a draft.")}
              >
                Save a draft <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </section>

        <section className="cv-section cv-plan-section">
          <SectionHeading eyebrow="NEXT ACTION" title="One thing to do this week" detail="Low effort · high signal" />
          <article className={`cv-plan-card ${savedToPlan ? "is-saved" : ""}`}>
            <div className="cv-plan-icon">
              {savedToPlan ? <Check size={18} /> : <Target size={18} />}
            </div>
            <div className="cv-plan-copy">
              <h3>Turn one capability into a proof point</h3>
              <p>
                Choose a small, observable action that shows cross-functional
                ownership. Then add the result to your promotion story.
              </p>
            </div>
            <div className="cv-plan-footer">
              <span className="cv-impact">Expected impact <strong>High</strong></span>
              <button
                className="cv-plan-button"
                type="button"
                onClick={() => {
                  setSavedToPlan((saved) => !saved);
                  announce(savedToPlan ? "Removed from Plan." : "Added to Plan.");
                }}
              >
                {savedToPlan ? "Saved to Plan" : "Add to Plan"}
                {savedToPlan ? <Check size={14} /> : <ArrowUpRight size={14} />}
              </button>
            </div>
          </article>
        </section>

        <section className="cv-section cv-tools-section">
          <SectionHeading
            eyebrow="WHEN THE QUESTION CHANGES"
            title="Keep this brief close"
            detail="Decision tools"
          />
          <div className="cv-tool-list">
            {tools.map(({ icon: Icon, title, question, body }) => {
              const isOpen = openTool === title;
              return (
                <article className={`cv-tool ${isOpen ? "is-open" : ""}`} key={title}>
                  <button
                    type="button"
                    className="cv-tool-trigger"
                    onClick={() => setOpenTool(isOpen ? null : title)}
                    aria-expanded={isOpen}
                  >
                    <span className="cv-tool-icon"><Icon size={17} /></span>
                    <span className="cv-tool-title">
                      <small>{title}</small>
                      <strong>{question}</strong>
                    </span>
                    <ChevronRight size={17} className="cv-tool-chevron" />
                  </button>
                  {isOpen && (
                    <div className="cv-tool-detail">
                      <p>{body}</p>
                      <button
                        className="cv-inline-action"
                        type="button"
                        onClick={() => announce(`${title} opened.`)}
                      >
                        Open decision tool <ArrowUpRight size={14} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="cv-copilot-card">
          <div className="cv-copilot-icon"><MessageCircle size={18} /></div>
          <div>
            <span className="cv-eyebrow">CAREER COPILOT</span>
            <h2>Ask for the next move.</h2>
            <p>Get assumptions, evidence, uncertainty, and one practical next action.</p>
          </div>
          <button
            className="cv-copilot-button"
            type="button"
            onClick={() => announce("Copilot is ready for your question.")}
            aria-label="Open Career Copilot"
          >
            <ArrowUpRight size={16} />
          </button>
        </section>

        <footer className="cv-footer">
          <Info size={14} />
          <p>
            Every conclusion is scoped to its source, freshness, confidence,
            and missing context. Unknown is a valid result.
          </p>
          <button type="button" onClick={() => announce("Evidence notes opened.")} aria-label="Learn about evidence notes">
            <ChevronRight size={15} />
          </button>
        </footer>
      </div>
      <div className={`cv-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>
    </main>
  );
}