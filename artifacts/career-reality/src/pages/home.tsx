import { ArrowDown, ArrowUpRight, Calculator, Check, CircleHelp, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { AppNav } from '@/components/shared/app-nav';
import { LazyLayoffAlertSignup } from '@/components/shared/lazy-layoff-alert-signup';
import { PublicFooter } from '@/components/shared/public-footer';
import { useSeo } from '@/lib/seo';
import layoffEvents from '@/data/layoff-events.json';
import './home.css';

const latestLayoffEvents = layoffEvents
  .filter((event) => event.status === 'Confirmed' || event.status === 'Reported')
  .sort((a, b) => b.date.localeCompare(a.date) || b.sourcePublishedAt.localeCompare(a.sourcePublishedAt))
  .slice(0, 3);

function CtcEntry() {
  return (
    <div className="home-entry-form" data-testid="form-home-ctc">
      <Link href="/salary-calculator" className="home-submit" data-testid="button-home-calculator">
        Open the CTC calculator <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
      <p className="home-form-help" id="home-ctc-help">
        Enter the offer break-up in the calculator. This page does not collect or pass salary amounts.
      </p>
    </div>
  );
}

export default function Home() {
  useSeo({
      title: 'Career Decisions in Context | CareerReality',
      description: 'Compare written offers, estimate take-home pay under stated tax assumptions, and use editorial guides to check the next career decision.',
    path: '/',
    breadcrumbs: [{ name: 'Home', path: '/' }],
  });

  return (
    <div className="home-page">
      <AppNav />
      <main>
        <section className="home-opening" aria-labelledby="home-title">
          <div className="home-opening-inner">
            <div className="home-kicker"><span /> Career decisions, in context</div>
            <div className="home-hero-grid">
              <div className="home-copy">
                <p className="home-overline">Career decisions, in context</p>
                <h1 id="home-title">Make your next move<br />make sense.</h1>
                <p className="home-deck">
                  CareerReality helps Indian professionals look beyond an offer headline—at money, the work, the evidence, and the life around it. Start with what you can check.
                </p>
                <a className="home-text-link" href="#start-here">
                  Start with what you can check <ArrowDown size={15} aria-hidden="true" />
                </a>
                <Link href="/layoffs/" className="home-layoff-link" data-testid="link-home-layoff-hub">
                  Facing a layoff? Open the Layoff Hub <ShieldAlert size={15} aria-hidden="true" />
                </Link>
              </div>

              <aside className="home-note" aria-label="A way to read an offer">
                <div className="home-note-topline">
                  <span>FIELD NOTE&nbsp; / &nbsp;01</span>
                  <span className="home-note-mark">CR</span>
                </div>
                <p className="home-note-heading">An offer is a set of questions.</p>
                <div className="home-note-list">
                  <div><span>01</span><p>What is the annual CTC?</p><Check size={15} aria-hidden="true" /></div>
                  <div><span>02</span><p>What might reach my account?</p><CircleHelp size={15} aria-hidden="true" /></div>
                  <div><span>03</span><p>What should I clarify next?</p><CircleHelp size={15} aria-hidden="true" /></div>
                </div>
                <div className="home-note-foot"><span>YOUR DECISION</span><span>YOUR QUESTIONS</span></div>
              </aside>
            </div>
            <div className="home-bottom-rule">
              <span>Practical tools. Editorial guides. Your own context.</span>
              <span>India&nbsp; / &nbsp;₹</span>
            </div>
          </div>
        </section>

        <section className="home-layoff-alerts" aria-labelledby="home-layoff-alerts-title">
          <div className="home-layoff-alerts-inner">
            <div>
              <p className="home-overline">Sourced updates, by request</p>
              <h2 id="home-layoff-alerts-title">If work changes,<br /><em>start with evidence.</em></h2>
              <p>Recent dated reports are historical source records, not a current headcount, job-safety signal, prediction, or advice to act.</p>
              <div className="home-layoff-actions">
                <Link href="/layoffs/" className="home-layoff-alerts-link">Open the Layoff Hub <ArrowUpRight size={15} aria-hidden="true" /></Link>
                <Link href="/layoff-runway/" className="home-layoff-alerts-link">Plan a cash runway <ArrowUpRight size={15} aria-hidden="true" /></Link>
              </div>
              <h3 className="home-layoff-latest-title">Latest sourced event records</h3>
              <div className="home-layoff-latest">
                {latestLayoffEvents.map((event) => (
                  <article className="home-layoff-event" key={event.slug} data-testid={`card-layoff-event-${event.slug}`}>
                    <div className="home-layoff-event-meta">
                      <span>{event.status}</span>
                      <time dateTime={event.date}>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${event.date}T00:00:00Z`))}</time>
                    </div>
                    <h4><Link href={`/layoffs/${event.slug}/`} data-testid={`link-layoff-event-${event.slug}`}>{event.company}</Link></h4>
                    <p data-testid={`text-layoff-event-summary-${event.slug}`}>{event.summary}</p>
                    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-layoff-event-source-${event.slug}`}>{event.sourceLabel} source <ArrowUpRight size={12} aria-hidden="true" /></a>
                  </article>
                ))}
              </div>
              <p className="home-layoff-disclaimer">Reports can be incomplete or outdated. Rumours are excluded. Check the source date and record context before drawing conclusions.</p>
            </div>
            <LazyLayoffAlertSignup />
          </div>
        </section>

        <section id="start-here" className="home-start-section" aria-labelledby="home-start-title">
          <div className="home-start-layout">
            <div className="home-start-intro">
              <p className="home-overline"><Calculator size={14} aria-hidden="true" /> First, make the offer concrete</p>
              <h2 id="home-start-title">Put your CTC<br /><em>in perspective.</em></h2>
              <p>Open the CTC calculator and enter the offer break-up there. Treat the result as an estimate to review—not a promise or a verdict.</p>
            </div>
            <div className="home-entry-card">
              <div className="home-entry-heading">
                <div>
                  <span className="home-step">A practical first step</span>
                  <h3>Start with the offer.</h3>
                </div>
                <span className="home-entry-icon"><Calculator size={19} aria-hidden="true" /></span>
              </div>
              <CtcEntry />
            </div>
          </div>
        </section>

        <section className="home-examples" aria-labelledby="home-examples-title">
          <div className="home-examples-inner">
            <div className="home-examples-heading">
              <p className="home-overline">Question-led tools / examples, not promises</p>
              <h2 id="home-examples-title">Make the number<br /><em>show its work.</em></h2>
              <p>Each example uses round inputs to show the arithmetic. Your situation, documents and tax treatment may differ.</p>
            </div>
            <div className="home-example-grid">
              <article className="home-example-card">
                <span>01 / MONTHLY GROSS</span><h3>What does ₹18 lakh mean each month?</h3>
                <strong>₹1,50,000 <small>gross / month</small></strong>
                <details><summary>See the calculation</summary><p>₹18,00,000 annual gross ÷ 12 months. This is before tax, PF, benefits, variable pay timing or other deductions.</p></details>
                <Link href="/salary-calculator">Open the CTC calculator <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </article>
              <article className="home-example-card">
                <span>02 / CASH RUNWAY</span><h3>How long could ₹6 lakh cover essentials?</h3>
                <strong>8 <small>months</small></strong>
                <details><summary>See the calculation</summary><p>₹6,00,000 available cash ÷ ₹75,000 essential monthly costs. It assumes the same costs each month and no new income.</p></details>
                <Link href="/layoffs/">Open the Layoff Hub planner <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </article>
              <article className="home-example-card">
                <span>03 / OFFER CHANGE</span><h3>How much higher is ₹21 lakh than ₹18 lakh?</h3>
                <strong>₹3 lakh <small>more annual fixed pay</small></strong>
                <details><summary>See the calculation</summary><p>₹21 lakh − ₹18 lakh = ₹3 lakh annual difference, before tax, deductions, benefits or differences in variable pay.</p></details>
                <Link href="/salary-calculator">Compare an offer <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </article>
              <article className="home-example-card">
                <span>04 / FINAL-PAY ARITHMETIC</span><h3>What is 30 days at ₹90,000 monthly cash?</h3>
                <strong>₹90,000 <small>gross arithmetic</small></strong>
                <details><summary>See the calculation</summary><p>₹90,000 ÷ 30 days × 30 days. This does not establish that notice pay or leave encashment is owed, or which wage basis applies.</p></details>
                <Link href="/layoffs/">Review the dated rights checklist <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </article>
            </div>
          </div>
          <div className="home-trust-strip" aria-label="How CareerReality handles evidence">
            <span><Check size={14} aria-hidden="true" /> Examples show their arithmetic</span>
            <span><Check size={14} aria-hidden="true" /> Estimates are labelled</span>
            <span><Check size={14} aria-hidden="true" /> Sources stay attached</span>
            <span><Check size={14} aria-hidden="true" /> No job-security scores</span>
          </div>
        </section>

        <section className="home-questions" aria-labelledby="home-questions-title">
          <div className="home-questions-inner">
            <div className="home-questions-heading">
              <p className="home-overline">A small pause, before the big one</p>
              <h2 id="home-questions-title">Keep the next<br /><em>conversation useful.</em></h2>
            </div>
            <div className="home-question-list">
              <article className="home-question">
                <span>01</span>
                <div><h3>Look beyond the headline.</h3><p>Use the estimate as a prompt to understand how the offer is structured.</p></div>
                <ArrowUpRight size={17} aria-hidden="true" />
              </article>
              <article className="home-question">
                <span>02</span>
                <div><h3>Ask what is still unclear.</h3><p>Write down the assumptions or offer details you want to confirm.</p></div>
                <ArrowUpRight size={17} aria-hidden="true" />
              </article>
              <article className="home-question">
                <span>03</span>
                <div><h3>Make the call in your own context.</h3><p>A calculator can help with one part of a decision. The decision remains yours.</p></div>
                <ArrowUpRight size={17} aria-hidden="true" />
              </article>
            </div>
          </div>
        </section>

        <section className="home-discovery" aria-labelledby="home-discovery-title">
          <div className="home-discovery-head">
            <p className="home-overline">When the question gets wider</p>
            <h2 id="home-discovery-title">Follow the decision<br /><em>where it leads.</em></h2>
          </div>
          <div className="home-discovery-links">
            <Link href="/tools" className="home-discovery-link">
              <span className="home-discovery-index">01 / TOOLS</span>
              <span className="home-discovery-title">Make the moving parts visible.</span>
              <span className="home-discovery-desc">Compare offers, work through cash flow, or make a personal checklist.</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/guides" className="home-discovery-link">
              <span className="home-discovery-index">02 / GUIDES</span>
              <span className="home-discovery-title">Read into the question.</span>
              <span className="home-discovery-desc">Practical, sourced context for compensation, career changes, engineering, and work.</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/companies" className="home-discovery-link">
              <span className="home-discovery-index">03 / DUE DILIGENCE</span>
              <span className="home-discovery-title">Check the employer, not its reputation.</span>
              <span className="home-discovery-desc">Use official sources and role-specific questions. No ratings or scores.</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/layoffs/" className="home-discovery-link home-discovery-link-featured" data-testid="link-home-layoffs">
              <span className="home-discovery-index">04 / SUPPORT</span>
              <span className="home-discovery-title">If work changes suddenly, start here.</span>
              <span className="home-discovery-desc">A practical first-day checklist, a money runway planner, rights guidance, and a 90-day plan.</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="home-last-word" aria-label="Start with a number">
          <div className="home-last-word-inner">
            <p className="home-overline">One concrete next step</p>
            <p className="home-last-line">Start with the number<br /><em>you can check.</em></p>
            <a href="#start-here" className="home-last-link">Enter an offer <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <span className="home-last-side" aria-hidden="true">CAREERREALITY / INDIA</span>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
