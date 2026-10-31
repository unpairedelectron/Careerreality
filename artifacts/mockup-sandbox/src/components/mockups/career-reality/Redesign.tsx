import { ArrowUpRight, Eye, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import './_group.css';

const evidence = [
  ['01', 'Collect', 'Salary, company, movement, role input.'],
  ['02', 'Calibrate', 'Freshness, source, confidence.'],
  ['03', 'Compare', 'Trade-offs, not a single verdict.'],
  ['04', 'Act', 'One useful question for this week.'],
];

function Redesign() {
  return (
    <div className="career-reality-redesign">
      <header className="cr-redesign-nav">
        <div className="cr-redesign-logo"><span>CR</span> Career<span>Reality</span></div>
        <div className="cr-redesign-nav-links"><a href="#desk">The desk</a><a href="#method">Our method</a><a href="#journal">Journal</a></div>
        <a href="#desk" className="cr-redesign-nav-cta">Open Compass <ArrowUpRight size={14} /></a>
      </header>
      <main>
        <section className="cr-redesign-hero">
          <div className="cr-redesign-hero-copy">
            <p className="cr-redesign-kicker"><span /> Career intelligence for India</p>
            <h1>Make your next <i>move</i><br />make sense<span>.</span></h1>
            <p className="cr-redesign-lede">Salary, company, risk, and AI signals in one honest frame. Less hunch. More context.</p>
            <div className="cr-redesign-actions"><a href="#desk" className="cr-redesign-primary">Start with your decision <ArrowUpRight size={15} /></a><a href="#method" className="cr-redesign-secondary">How we think <span>→</span></a></div>
            <div className="cr-redesign-trust"><ShieldCheck size={14} /> Evidence before opinion <span>·</span><Eye size={14} /> Private by default</div>
          </div>
          <div className="cr-redesign-board">
            <div className="cr-redesign-board-top"><span>DECISION SURFACE / SAMPLE</span><b>● LIVE SAMPLE</b></div>
            <h2>One move.<br /><em>Four signals.</em></h2>
            {[
              ['Compensation', '₹24.8L', '78%', '#e5b755'],
              ['Company stability', '64 / 100', '64%', '#e97862'],
              ['Resignation risk', 'Low–medium', '48%', '#e5b755'],
              ['AI exposure', 'Moderate', '56%', '#8bd1ba'],
            ].map(([label, value, width, color]) => <div className="cr-redesign-signal" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="cr-redesign-track"><i style={{ width, background: color }} /></div></div>)}
            <div className="cr-redesign-board-foot">ILLUSTRATIVE SAMPLE <span>● EXAMPLE SIGNAL MIX</span></div>
          </div>
        </section>
        <section id="method" className="cr-redesign-method">
          <div><p className="cr-redesign-kicker"><span /> Our method / no folklore</p><h2>A clearer way to be <i>uncertain.</i></h2><p className="cr-redesign-method-copy">A career can’t be reduced to one score. We show the evidence, the confidence, and the trade-off — then leave the call to you.</p></div>
          <div className="cr-redesign-evidence">{evidence.map(([n, title, body]) => <article key={n}><div><span>{n}</span><Sparkles size={15} /></div><h3>{title}</h3><p>{body}</p></article>)}</div>
        </section>
        <section id="desk" className="cr-redesign-desk"><p className="cr-redesign-kicker"><span /> The desk / live tools</p><h2>The whole picture,<br /><em>not just the headline.</em></h2><a href="#method" className="cr-redesign-primary">See the evidence <ArrowUpRight size={14} /></a></section>
      </main>
    </div>
  );
}

export { Redesign };