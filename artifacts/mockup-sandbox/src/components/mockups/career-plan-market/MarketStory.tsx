import { Activity, ArrowUpRight, Building2, CircleHelp, MapPin, ShieldCheck, TrendingUp } from "lucide-react";
import "./_group.css";

const tabs = ["Salary", "Company", "AI exposure"];
const companies = [
  { name: "Mirova Systems", score: 78, momentum: "Steady" },
  { name: "Northstar Labs", score: 64, momentum: "Building" },
];

export function MarketStory() {
  return (
    <main className="career-plan-market cr-story">
      <div className="cr-shell">
        <header className="cr-header">
          <div className="cr-header-copy"><span className="cr-eyebrow">MARKET INTELLIGENCE</span><h1>Read the market.</h1></div>
          <div className="cr-story-orb"><Activity size={19} /></div>
        </header>
        <div className="cr-tabs">{tabs.map((tab, index) => <button className={index === 0 ? "active" : ""} key={tab}>{tab}</button>)}</div>

        <section className="cr-card cr-market-hero">
          <div className="cr-market-hero-top"><div className="cr-story-icon"><MapPin size={16} /></div><span className="cr-pill positive">Fresh · scoped</span></div>
          <div className="cr-label">YOUR MARKET POSITION</div>
          <h2>₹31.2L — ₹48.7L</h2>
          <p>Senior product roles in Bengaluru · 5–8 years</p>
          <div className="cr-track cr-market-track"><i /></div>
          <div className="cr-range-labels"><span>25th · ₹31.2L</span><span>Median · ₹38.5L</span><span>75th · ₹48.7L</span></div>
          <div className="cr-market-insight"><span>YOUR INPUT</span><strong>₹42L · above median</strong></div>
        </section>

        <div className="cr-section-head"><h2 className="cr-section-title">What the evidence says</h2><span className="cr-section-action">3 lenses</span></div>
        <section className="cr-card cr-evidence-grid">
          <div className="cr-evidence-node"><span className="cr-evidence-dot positive" /><div><strong>Compensation</strong><p>Positioned above the scoped median.</p></div><TrendingUp size={16} /></div>
          <div className="cr-evidence-node"><span className="cr-evidence-dot" /><div><strong>Company</strong><p>Momentum is steady, not a forecast.</p></div><ShieldCheck size={16} /></div>
          <div className="cr-evidence-node"><span className="cr-evidence-dot accent" /><div><strong>AI exposure</strong><p>Task map only; no resilience score.</p></div><CircleHelp size={16} /></div>
        </section>

        <div className="cr-section-head"><h2 className="cr-section-title">Company signal map</h2><span className="cr-section-action">Public sources</span></div>
        {companies.map((company) => <section className="cr-card cr-company cr-story-company" key={company.name}>
          <div className="cr-company-top"><div className="cr-mark">{company.name.slice(0, 1)}</div><div className="cr-company-copy"><div className="cr-company-name">{company.name}</div><small>Public stability signal</small></div><div className="cr-score">{company.score}</div></div>
          <div className="cr-company-wave"><svg viewBox="0 0 340 50" role="img" aria-label={`${company.name} public stability signal ${company.score} out of 100`}><path d="M10 26 C68 8 104 40 160 25 S250 10 330 26" fill="none" stroke="#245f55" strokeOpacity=".55" strokeWidth="2" /><line x1="10" y1="26" x2="330" y2="26" stroke="#e7e1d4" strokeWidth="6" strokeLinecap="round" /><circle cx={10 + 3.2 * company.score} cy="26" r="7" fill="#245f55" stroke="#fbf8f1" strokeWidth="3" /></svg><div className="cr-company-axis"><span>Watch</span><span>Signal position · {company.score}</span><span>Steady</span></div></div>
          <div className="cr-company-bottom"><span className="cr-pill positive">{company.momentum}</span><small>Live source · refreshed today</small></div>
        </section>)}

        <section className="cr-card cr-note cr-market-note"><Building2 size={17} color="#245f55" /><div><strong>Company signals are not forecasts</strong><p>Use them to decide what to verify next—not to predict layoffs or outcomes.</p></div><ArrowUpRight size={16} color="#245f55" /></section>
      </div>
    </main>
  );
}