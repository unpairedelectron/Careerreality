import { useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Eye,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import './_group.css';

const signals = [
  ['Compensation', '₹24.8L', '+14.2% vs market', '78%'],
  ['Company stability', '64 / 100', 'Watch: hiring slowed', '64%'],
  ['Resignation risk', 'Low–medium', 'Notice period is a factor', '48%'],
  ['AI exposure', 'Moderate', '2 tasks likely to shift', '56%'],
];

const tools = [
  ['01 / MONEY', 'CTC decoder', 'See what your offer really means after tax, variable pay, and the cost of staying put.', '₹18.4L', 'median decoded CTC', BarChart3],
  ['02 / COMPANY', 'Company intelligence', 'A grounded view of business health, funding runway, employee movement, and signals.', '64 / 100', 'stability index', Building2],
  ['03 / TIMING', 'Resignation risk', 'Find the cost of a move before the counter-offer, notice period, and uncertainty find you.', '12.8%', 'role-level risk', TrendingDown],
  ['04 / FUTURE', 'AI pulse', 'Separate useful signal from panic. Track how AI is changing your role, not just headlines.', '3.2 / 5', 'impact on work', BrainCircuit],
] as const;

function Nav() {
  return (
    <nav className="cr-nav">
      <a href="#" className="cr-logo"><span className="cr-mark">CR</span><span>Career<span style={{ color: '#25aee4' }}>Reality</span></span></a>
      <div className="cr-nav-links"><a href="#tools">The desk</a><a href="#method">How it works</a><a href="#questions">Journal</a></div>
      <div className="cr-nav-actions"><a href="#tools" className="cr-pill cr-pill-outline">Explore</a><a href="#tools" className="cr-pill cr-pill-primary">Open Compass <ArrowUpRight size={14} /></a></div>
    </nav>
  );
}

function SignalBoard() {
  return (
    <div className="cr-signal">
      <div className="cr-signal-head">
        <div><p className="cr-signal-label">Decision surface / sample</p><h2 className="cr-display">One move.<br />Four signals.</h2></div>
        <span className="cr-live">● LIVE SAMPLE</span>
      </div>
      <div className="cr-signal-rows">
        {signals.map(([label, value, detail, width]) => (
          <div className="cr-signal-row" key={label}><span>{label}</span><span className="cr-data">{value}</span><span className="cr-signal-track"><span style={{ width }} /></span><span style={{ gridColumn: '1 / -1', color: '#9aa9a3', fontSize: 9 }}>{detail}</span></div>
        ))}
      </div>
      <div className="cr-signal-foot"><span>ILLUSTRATIVE SAMPLE</span><span style={{ color: '#83c9b4' }}>● Example signal mix</span></div>
    </div>
  );
}

function Current() {
  const [salary, setSalary] = useState('2400000');
  const [submitted, setSubmitted] = useState(false);
  const monthly = Math.round(Number(salary || 0) * 0.71 / 12);
  return (
    <div className="career-reality-current">
      <Nav />
      <main>
        <section className="cr-hero">
          <div className="cr-shell cr-hero-grid">
            <div>
              <div className="cr-label">Career intelligence for India</div>
              <h1 className="cr-display">The next move is <em>not</em> a gut feeling.</h1>
              <p className="cr-hero-copy">CareerReality brings the salary, company, risk, and AI signals into one honest frame — so your big career decisions feel less like a leap.</p>
              <div className="cr-hero-actions"><a href="#tools" className="cr-pill cr-pill-primary">Explore the tools <ArrowUpRight size={14} /></a><a href="#method" className="cr-pill cr-pill-outline">See our method <ArrowUpRight size={14} /></a></div>
              <p className="cr-note"><ShieldCheck size={14} style={{ color: '#246b5f' }} /> No account needed to start. Built for real decisions.</p>
            </div>
            <SignalBoard />
          </div>
        </section>

        <section className="cr-section cr-shell">
          <div className="cr-film">
            <div><div className="cr-label" style={{ color: '#8bd1ba' }}>Field note / 00</div><h2 className="cr-display">Before you make the move, see the <em style={{ color: '#e5b755' }}>whole board.</em></h2><p>A short film about the invisible math behind a career decision — and why a headline number never tells the whole story.</p><a href="#tools" className="cr-pill" style={{ marginTop: 22, background: '#e5b755', color: '#263138' }}>Watch the film <ArrowUpRight size={14} /></a></div>
            <div className="cr-film-window"><div>CAREERREALITY / LAUNCH FILM</div></div>
          </div>
        </section>

        <section className="cr-section cr-shell">
          <div className="cr-ctc">
            <div><div className="cr-label">Quick read / 01</div><h2 className="cr-display">What will you actually take home?</h2><p>A useful first answer before you negotiate, resign, or start counting someone else’s headline number.</p></div>
            <form className="cr-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
              <label>Offered CTC (annual)<input value={salary} onChange={(event) => { setSalary(event.target.value.replace(/\D/g, '')); setSubmitted(false); }} inputMode="numeric" /></label>
              <label>Your city<select defaultValue="Bengaluru"><option>Bengaluru</option><option>Mumbai</option><option>Delhi NCR</option><option>Hyderabad</option></select></label>
              <button type="submit" className="cr-pill cr-pill-primary">Decode <ArrowUpRight size={14} /></button>
              {submitted && <div style={{ gridColumn: '1 / -1', marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd4c4' }}><strong className="cr-display" style={{ fontSize: 30 }}>₹{monthly.toLocaleString('en-IN')}</strong><span style={{ marginLeft: 12, color: '#697274', fontSize: 11 }}>illustrative monthly take-home</span></div>}
            </form>
          </div>
        </section>

        <section id="tools" className="cr-section cr-shell">
          <div className="cr-tool-heading"><div><div className="cr-label">The desk / live tools</div><h2 className="cr-display">Start with the question<br />keeping you up.</h2></div><a href="#tools" className="cr-pill cr-pill-outline">View all tools <ArrowUpRight size={14} /></a></div>
          <div className="cr-tool-grid">{tools.map(([label, title, description, stat, statLabel, Icon]) => <article className="cr-tool" key={title}><div className="cr-tool-top"><span className="cr-tool-number">{label}</span><Icon size={18} style={{ color: '#246b5f' }} /></div><div><h3 className="cr-display">{title}</h3><p>{description}</p><div className="cr-tool-foot"><div className="cr-tool-stat">{stat}<small>{statLabel}</small></div><ArrowUpRight size={15} style={{ color: '#246b5f' }} /></div></div></article>)}</div>
        </section>

        <section id="questions" className="cr-section cr-shell">
          <div className="cr-questions"><div><div className="cr-label">The question behind the question</div><h2 className="cr-display">Good decisions get more specific.</h2><a href="#method" className="cr-pill cr-pill-outline" style={{ marginTop: 24 }}>Open the Compass <ArrowUpRight size={14} /></a></div><div className="cr-question-grid">{['Is this offer actually better?', 'Can I trust this company?', 'What would staying cost me?', 'Will AI change my role?'].map((question, index) => <div className="cr-question" key={question}><span>0{index + 1}</span><h3 className="cr-display">{question}</h3></div>)}</div></div>
        </section>

        <section id="method" className="cr-section cr-method">
          <div className="cr-shell cr-method-grid"><div><div className="cr-label" style={{ color: '#8bd1ba' }}>Our method / no folklore</div><h2 className="cr-display">A clearer way to be <em>uncertain.</em></h2><p className="cr-method-copy">We do not pretend a career can be reduced to one score. We show the evidence, the confidence, and the trade-off — then leave the call to you.</p><p className="cr-note" style={{ color: '#afbbb5' }}><Eye size={15} style={{ color: '#83c9b4' }} /> The unknowns stay visible.</p></div><div className="cr-method-list">{[{ number: '01', title: 'Collect the signal', body: 'Salary reports, public filings, employee movement, and role-level inputs — cleaned and brought into one frame.', Icon: Search }, { number: '02', title: 'Name the confidence', body: 'Every read tells you how fresh it is, where it comes from, and what we do not know yet.', Icon: Eye }, { number: '03', title: 'Surface the trade-off', body: 'A higher offer can carry more volatility. A stable company can carry a slower learning curve.', Icon: BarChart3 }, { number: '04', title: 'Give you a next step', body: 'Not a verdict. A useful question to ask, a number to verify, or a conversation to have this week.', Icon: TrendingUp }].map(({ number, title, body, Icon }) => <div className="cr-method-item" key={number}><div><span>{number}</span><Icon size={16} /></div><h3>{title}</h3><p>{body}</p></div>)}</div></div>
        </section>

        <section className="cr-shell cr-cta"><div className="cr-cta-row"><div><div className="cr-label" style={{ color: '#8bd1ba' }}>For your next big call</div><h2 className="cr-display">Bring the question.<br />We will bring the context.</h2><p>A private desk for the decisions that deserve more than a quick search and a confident opinion.</p></div><a href="#tools" className="cr-pill" style={{ background: '#e5b755', color: '#263138' }}>Explore Career Reality Pro <ArrowUpRight size={14} /></a></div></section>
      </main>
      <footer className="cr-footer"><div className="cr-shell">CAREERREALITY / CAREER INTELLIGENCE FOR INDIA</div></footer>
    </div>
  );
}

export { Current };