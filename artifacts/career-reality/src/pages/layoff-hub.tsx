import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, Clipboard, Clock3, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import {
  useConfirmLayoffAlertSubscription,
  useUnsubscribeLayoffAlerts,
} from '@workspace/api-client-react';
import { AppNav } from '@/components/shared/app-nav';
import { LayoffAlertSignup } from '@/components/shared/layoff-alert-signup';
import { LayoffResponsePlanner } from '@/components/shared/layoff-response-planner';
import { LayoffRunwayCalculator } from '@/components/shared/layoff-runway-calculator';
import { PublicFooter } from '@/components/shared/public-footer';
import { useSeo } from '@/lib/seo';
import eventData from '@/data/layoff-events.json';
import './layoff-hub.css';

export type LayoffEvent = {
  slug: string;
  company: string;
  date: string;
  scale: string;
  status: 'Confirmed' | 'Reported' | 'Rumour';
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  updatedAt: string;
  geography: string;
  sector?: string;
  coverageNote: string;
  readerCheck: string;
  updateNote: string;
  sourceUpdates?: {
    sourceLabel: string;
    sourceUrl: string;
    sourcePublishedAt: string;
    summary: string;
  }[];
};

const events = eventData as LayoffEvent[];

const firstDayItems = [
  { id: 'save-documents', title: 'Save the documents you already have', detail: 'Keep your offer, employment terms, payslips, appraisal records and any written separation communication in a personal, secure place.' },
  { id: 'ask-in-writing', title: 'Ask for the terms in writing', detail: 'Request the effective date, notice or pay in lieu, severance calculation, benefits end date and the process for final settlement.' },
  { id: 'protect-access', title: 'Check personal account access', detail: 'Update recovery details for personal accounts and save personal files only. Do not copy confidential company or customer data.' },
  { id: 'record-questions', title: 'Make a short question list', detail: 'Write down what is confirmed, what is still unclear, and who can answer each question. Keep a record of dates and responses.' },
  { id: 'pause-decisions', title: 'Pause before signing or posting', detail: 'Read any release, settlement or confidentiality document carefully. Ask for time and independent advice if something is unclear.' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function StatusTag({ status, id }: { status: LayoffEvent['status']; id?: string }) {
  return <span className={`layoff-status layoff-status-${status.toLowerCase()}`} data-testid={`status-event-${id ?? status.toLowerCase()}`}>{status}</span>;
}

function HubShell({ children }: { children: ReactNode }) {
  return <div className="layoff-page"><AppNav />{children}<PublicFooter /></div>;
}

function EventTracker() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [year, setYear] = useState('All');
  const [sector, setSector] = useState('All');
  const years = useMemo(() => [...new Set(events.map((event) => event.date.slice(0, 4)))].sort().reverse(), []);
  const sectors = useMemo(() => [...new Set(events.map((event) => event.sector).filter((value): value is string => Boolean(value)))].sort(), []);
  const filtered = useMemo(() => events.filter((event) => {
    const matchesSearch = `${event.company} ${event.geography} ${event.summary}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch
      && (status === 'All' || event.status === status)
      && (year === 'All' || event.date.startsWith(year))
      && (sector === 'All' || event.sector === sector);
  }).sort((a, b) => b.date.localeCompare(a.date)), [query, status, year, sector]);
  const lastUpdated = events.reduce((latest, event) => event.updatedAt > latest ? event.updatedAt : latest, events[0]?.updatedAt ?? '');

  return (
    <section className="layoff-section layoff-events" id="event-tracker" aria-labelledby="events-heading">
      <div className="layoff-section-head">
        <div><p className="layoff-eyebrow">The evidence desk / 04</p><h2 id="events-heading">Company events,<br /><em>with the source attached.</em></h2></div>
        <p>Historical reports are not predictions. Each record keeps its date, geography, status and original source visible.</p>
      </div>
      <div className="event-tools">
        <label className="event-search">
          <span className="sr-only">Search company events</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or detail" data-testid="input-event-search" />
        </label>
        <div className="event-filters" role="group" aria-label="Filter event status">
          {['All', 'Confirmed', 'Reported', 'Rumour'].map((item) => (
            <button key={item} type="button" onClick={() => setStatus(item)} aria-pressed={status === item} className={status === item ? 'is-selected' : ''} data-testid={`filter-event-${item.toLowerCase()}`}>{item}</button>
          ))}
        </div>
      </div>
      <div className="event-select-filters">
        <label>Year
          <select value={year} onChange={(event) => setYear(event.target.value)} data-testid="filter-event-year">
            <option value="All">All years</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>Sector
          <select value={sector} onChange={(event) => setSector(event.target.value)} data-testid="filter-event-sector">
            <option value="All">All sectors</option>
            {sectors.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <p data-testid="text-events-last-updated">Record copy updated {lastUpdated ? formatDate(lastUpdated) : '—'} · outcomes are not refreshed by this date.</p>
      </div>
      <p className="event-state-note" data-testid="text-event-state-note">Rumour means unverified. We do not treat it as fact or advice to act.</p>
      <div className="event-list" aria-live="polite" data-testid="list-layoff-events">
        {filtered.length ? filtered.map((event) => (
          <article className="event-row" key={event.slug} data-testid={`card-event-${event.slug}`}>
            <div className="event-date"><span>{formatDate(event.date)}</span><small>{event.geography}</small></div>
            <div className="event-main">
              <div className="event-title-row"><h3>{event.company}</h3><StatusTag status={event.status} id={event.slug} /></div>
              <p className="event-scale">{event.scale}</p>
              <p className="event-summary">{event.summary}</p>
              <div className="event-source-line"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Source: {event.sourceLabel} · published {formatDate(event.sourcePublishedAt)}</a><span>{event.sector ?? 'Sector not specified'}</span><span>Record reviewed {formatDate(event.updatedAt)}</span></div>
            </div>
            <Link href={`/layoffs/${event.slug}/`} className="event-open" data-testid={`link-event-${event.slug}`}>Read record <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </article>
        )) : (
          <div className="event-empty" data-testid="empty-event-results">
            <span className="event-empty-mark">—</span>
            <div><h3>No matching sourced records.</h3><p>Try another company or status. An empty result is better than an unverified claim.</p></div>
          </div>
        )}
      </div>
      <p className="event-disclaimer">This archive is selective and time-stamped; absence from the list is not evidence that no change occurred.</p>
    </section>
  );
}

export function LayoffHub() {
  const [checked, setChecked] = useState<string[]>(() => {
    const valid = new Set(firstDayItems.map((item) => item.id));
    return (new URLSearchParams(window.location.search).get('tasks') ?? '').split(',').filter((item) => valid.has(item));
  });
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  useEffect(() => {
    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);
  useSeo({
    title: 'Layoff Hub: Practical next steps | CareerReality',
    description: 'A calm, evidence-led layoff support hub for Indian professionals: first-day checklist, money runway planner, rights context and a 90-day plan.',
    path: '/layoffs/',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Layoff Hub', path: '/layoffs/' }],
  });
  function toggleTask(id: string) {
    setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createShareLink() {
    const url = new URL('/layoffs/', window.location.origin);
    if (checked.length) url.searchParams.set('tasks', checked.join(','));
    setShareUrl(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage('Checklist link copied. It contains checklist choices only.');
    } catch {
      setShareMessage('Your checklist link is ready below. Copy it to share.');
    }
  }

  return (
    <HubShell>
      <main className="layoff-hub">
        <section className="layoff-hero" aria-labelledby="layoff-title">
          <div className="layoff-hero-top"><span className="layoff-eyebrow">CareerReality / Field guide 07</span><span className="layoff-location">India · Your next step, not a verdict</span></div>
          <div className="layoff-hero-grid">
            <div className="layoff-hero-copy">
              <p className="layoff-kicker"><span /> A clear place to begin</p>
              <h1 id="layoff-title">When work<br />changes, <em>steady</em><br /><em>the ground.</em></h1>
              <p className="layoff-hero-deck">A layoff can make every decision feel urgent. Separate what is known from what needs checking, then take the next useful step.</p>
              <div className="layoff-hero-actions"><a href="#first-24-hours" className="layoff-primary-action" data-testid="link-first-day">Start with the first 24 hours <ArrowDown size={16} aria-hidden="true" /></a><a href="#event-tracker" className="layoff-secondary-action" data-testid="link-event-tracker">Check sourced company events</a></div>
              <div className="layoff-promise"><span>Evidence</span><span>Estimates</span><span>Unknowns</span><span>Next steps</span></div>
            </div>
            <aside className="layoff-ledger" aria-label="How to read this guide">
              <div className="ledger-head"><span>READ THE SIGNAL</span><span>01—04</span></div>
              <div className="ledger-line"><span className="ledger-index">01</span><div><strong>Confirmed</strong><small>Supported by a primary source or direct communication.</small></div><span className="ledger-dot ledger-dot-confirmed" /></div>
              <div className="ledger-line"><span className="ledger-index">02</span><div><strong>Reported</strong><small>Published by a named source; details can change.</small></div><span className="ledger-dot ledger-dot-reported" /></div>
              <div className="ledger-line"><span className="ledger-index">03</span><div><strong>Rumour</strong><small>Unverified. Not a basis for decisions.</small></div><span className="ledger-dot ledger-dot-rumour" /></div>
              <div className="ledger-foot"><span>DATE EVERY CLAIM</span><span>LINK THE SOURCE</span></div>
            </aside>
          </div>
          <div className="layoff-hero-bottom"><span>Take what is useful. Leave what is not yet known.</span><span>INR / INDIA</span></div>
        </section>

        <section className="layoff-section layoff-firstday" id="first-24-hours" aria-labelledby="firstday-heading">
          <div className="layoff-section-head">
            <div><p className="layoff-eyebrow">First, protect your footing / 01</p><h2 id="firstday-heading">The first 24 hours.<br /><em>One thing at a time.</em></h2></div>
            <div className="layoff-section-aside"><Clock3 size={18} aria-hidden="true" /><p>You do not need to solve the next three months today. Pick the steps that fit your situation.</p></div>
          </div>
          <div className="checklist-layout">
            <div className="checklist-items">
              <p className="checklist-progress" data-testid="text-checklist-progress">{checked.length} of {firstDayItems.length} steps marked</p>
              {firstDayItems.map((item, index) => (
                <label className={`checklist-item ${checked.includes(item.id) ? 'is-checked' : ''}`} key={item.id} data-testid={`checklist-row-${item.id}`}>
                  <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggleTask(item.id)} data-testid={`checkbox-${item.id}`} />
                  <span className="checklist-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="checklist-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <span className="check-indicator"><Check size={14} aria-hidden="true" /></span>
                </label>
              ))}
            </div>
            <aside className="share-plan-card">
              <div className="share-icon"><Clipboard size={18} aria-hidden="true" /></div>
              <p className="layoff-eyebrow">Keep your choices / private by design</p>
              <h3>Share the checklist.<br /><em>Not your numbers.</em></h3>
              <p>The link includes only which checklist items you selected. Money planner inputs are never added.</p>
              <button className="layoff-button" type="button" onClick={createShareLink} data-testid="button-share-plan">Copy checklist link <ArrowUpRight size={15} aria-hidden="true" /></button>
              {shareMessage && <p className="layoff-feedback" role="status" data-testid="status-share-plan">{shareMessage}</p>}
              {shareUrl && <label className="share-url-label">Shareable link<input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} data-testid="output-share-url" /></label>}
            </aside>
          </div>
        </section>

        <section className="layoff-money" aria-labelledby="money-heading">
          <div className="money-wrap">
            <div className="money-intro">
              <p className="layoff-eyebrow"><Wallet size={14} aria-hidden="true" /> A working estimate / 02</p>
              <h2 id="money-heading">How much<br />room do you<br /><em>have to move?</em></h2>
              <p>A month-by-month cash-flow estimate can help you sequence decisions. Change an assumption to see how income timing and essential costs affect the next year. Every number stays in this browser session.</p>
              <div className="money-caveat"><span>ESTIMATE, NOT PROMISE</span><p>Confirm final pay, tax treatment, benefits and payment dates with the relevant documents or a qualified adviser.</p></div>
            </div>
            <LayoffRunwayCalculator />
          </div>
        </section>

        <section className="layoff-section rights-section" aria-labelledby="rights-heading">
          <div className="layoff-section-head">
            <div><p className="layoff-eyebrow">Check the terms, not hearsay / 03</p><h2 id="rights-heading">Rights depend on<br /><em>the details.</em></h2></div>
            <p>In India, the applicable rules can vary with role, contract, establishment, state and the circumstances of separation. Treat this as a document checklist, not legal advice.</p>
          </div>
          <div className="rights-ledger">
            <article><span>01 / DOCUMENTS</span><h3>Start with your terms</h3><p>Review your appointment letter, applicable policies, amendments and written separation notice. Note the notice period and any stated pay in lieu.</p><a href="https://labour.gov.in/" target="_blank" rel="noreferrer" data-testid="link-rights-labour">Ministry of Labour & Employment <ExternalLink size={13} aria-hidden="true" /></a></article>
            <article><span>02 / FINAL PAY</span><h3>Ask for the calculation</h3><p>Request an itemised final settlement and the expected payment date. Check salary due, leave treatment, deductions, variable pay and benefit end dates against your terms.</p><a href="https://www.epfindia.gov.in/" target="_blank" rel="noreferrer" data-testid="link-rights-epfo">EPFO official information <ExternalLink size={13} aria-hidden="true" /></a></article>
            <article><span>03 / GET ADVICE</span><h3>Escalate with context</h3><p>If a term seems inconsistent or a payment is disputed, keep a dated record and consult a qualified employment lawyer or the relevant state labour office.</p><a href="https://samadhan.labour.gov.in/" target="_blank" rel="noreferrer" data-testid="link-rights-samadhan">Labour grievance portal <ExternalLink size={13} aria-hidden="true" /></a></article>
          </div>
          <div className="rights-note">
            <p><strong>Dated official legal references:</strong> Ministry of Labour and Employment, <a href="https://labour.gov.in/en/faqs-labour-codes" target="_blank" rel="noreferrer">FAQs on Labour Codes, published 30 December 2025</a>, and <a href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noreferrer">Additional FAQs on Labour Codes, dated 16 March 2026</a>. These publications do not establish that any specific provision applies to every IT employee; verify the applicable law, role, employer, state and facts.</p>
          </div>
          <p className="rights-note"><ShieldCheck size={15} aria-hidden="true" /> Do not rely on a general guide for a legal conclusion. Verify current rules and your own documents.</p>
        </section>

        <section className="layoff-ninety" aria-labelledby="ninety-heading">
          <div className="ninety-inner">
            <div className="ninety-intro"><p className="layoff-eyebrow">A sequence, not a deadline / 04</p><h2 id="ninety-heading">Build a next<br /><em>90 days.</em></h2><p>Adjust the pace to your health, finances and responsibilities. This is a scaffold, not a scorecard.</p></div>
            <div className="ninety-timeline">
              <article><div className="ninety-time">DAYS 01—07</div><div><h3>Stabilise the basics</h3><p>Collect written terms. Check cash flow and essential commitments. Confirm access, benefits and the final-pay timeline. Tell one trusted person.</p></div></article>
              <article><div className="ninety-time">DAYS 08—30</div><div><h3>Choose a workable direction</h3><p>Refresh your role narrative and evidence of impact. Reconnect with a small circle. Set a weekly application rhythm that leaves room to recover.</p></div></article>
              <article><div className="ninety-time">DAYS 31—60</div><div><h3>Test the market</h3><p>Compare real role scopes and compensation structures. Practise interviews using specific examples. Revisit your runway assumptions as facts change.</p></div></article>
              <article><div className="ninety-time">DAYS 61—90</div><div><h3>Review, then adjust</h3><p>Look at what is producing useful conversations. Consider adjacent roles or a different search pace. Seek qualified support where a decision needs expertise.</p></div></article>
            </div>
          </div>
        </section>

        <EventTracker />

        <section className="layoff-alerts" aria-labelledby="alerts-heading">
          <div className="alerts-copy"><p className="layoff-eyebrow">Updates, only if you ask / 05</p><h2 id="alerts-heading">Follow sourced<br /><em>company events.</em></h2><p>Choose an optional city and sector, or leave both open for all sourced events. Email alerts require confirmation, and only Confirmed or Reported events are sent.</p></div>
          <LayoffAlertSignup />
        </section>

        <div className="layoff-back-home"><Link href="/" data-testid="link-layoff-home"><ArrowLeft size={14} aria-hidden="true" /> Back to CareerReality</Link><span>Evidence dated. Estimates labelled. Unknowns left open.</span></div>
      </main>
    </HubShell>
  );
}

function LayoffEventDetail() {
  const params = useParams<{ slug: string }>();
  const event = events.find((item) => item.slug === params.slug);
  useSeo({
    title: event ? `${event.company} layoff record | CareerReality` : 'Company event record | CareerReality',
    description: event ? `${event.status} layoff reporting for ${event.company}, with publication date, geography and source.` : 'Sourced company event record from CareerReality.',
    path: `/layoffs/${params.slug ?? ''}/`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Layoff Hub', path: '/layoffs/' }, { name: event?.company ?? 'Event record', path: `/layoffs/${params.slug ?? ''}/` }],
    ...(event ? { article: {
      headline: `${event.company} workforce report`,
      description: event.summary,
      datePublished: event.sourcePublishedAt,
      dateModified: event.updatedAt,
      section: 'Layoff reporting',
      keywords: [event.company, 'India', 'workforce report'],
      citations: [{ name: event.sourceLabel, url: event.sourceUrl }],
    } } : {}),
  });
  if (!event) {
    return <HubShell><main className="layoff-detail layoff-detail-missing"><p className="layoff-eyebrow">Record not found</p><h1>This event has no<br /><em>verified record here.</em></h1><p>Try the event tracker for available dated sources. We do not fill gaps with guesses.</p><Link href="/layoffs/#event-tracker" className="layoff-button" data-testid="link-missing-event-back">Return to the event tracker <ArrowLeft size={15} aria-hidden="true" /></Link></main></HubShell>;
  }
  return (
    <HubShell>
      <main className="layoff-detail">
        <div className="detail-breadcrumb"><Link href="/layoffs/" data-testid="link-detail-hub"><ArrowLeft size={14} aria-hidden="true" /> Layoff Hub</Link><span>Company event record / India</span></div>
        <header className="detail-header">
          <p className="layoff-eyebrow">DATED RECORD / {formatDate(event.date)}</p>
          <div className="detail-title-row"><h1 data-testid="heading-event-detail">{event.company}<br /><em>workforce report.</em></h1><StatusTag status={event.status} id="detail" /></div>
          <p className="detail-lead">{event.summary}</p>
        </header>
        <div className="detail-facts">
          <div><span>REPORTED SCALE</span><strong data-testid="text-event-scale">{event.scale}</strong></div>
          <div><span>GEOGRAPHY</span><strong data-testid="text-event-geography">{event.geography}</strong></div>
          <div><span>EVENT DATE</span><strong>{formatDate(event.date)}</strong></div>
          <div><span>COPY UPDATED</span><strong>{formatDate(event.updatedAt)}</strong></div>
        </div>
        <aside className="detail-method" data-testid="text-event-update-note"><strong>Page update</strong><p>{event.updateNote}</p></aside>
        <section className="detail-source" aria-labelledby="detail-source-heading">
          <div className="detail-source-icon"><ExternalLink size={18} aria-hidden="true" /></div>
          <div><p className="layoff-eyebrow">Primary reporting / {event.sourceLabel}</p><h2 id="detail-source-heading">Go back to what was published.</h2><p>Source published {formatDate(event.sourcePublishedAt)}. The scale and summary above are attributed to this report. A reported plan is not proof of a completed count or present-day company conditions.</p><a href={event.sourceUrl} target="_blank" rel="noreferrer" data-testid="link-event-source">Read the original source <ArrowUpRight size={15} aria-hidden="true" /></a></div>
        </section>
        {event.sourceUpdates?.length ? (
          <section className="detail-method" aria-labelledby="event-updates-heading">
            <strong id="event-updates-heading">Later reporting and clarifications</strong>
            {event.sourceUpdates.map((update) => (
              <p key={update.sourceUrl}>
                <strong>{update.sourceLabel} · {formatDate(update.sourcePublishedAt)}:</strong> {update.summary}{' '}
                <a href={update.sourceUrl} target="_blank" rel="noreferrer">Read this report</a>
              </p>
            ))}
          </section>
        ) : null}
        <aside className="detail-method" data-testid="text-event-method"><strong>How to read this record</strong><p>{event.status === 'Confirmed' ? 'Confirmed means the linked reporting describes a direct company confirmation. This does not establish a final affected-role count.' : event.status === 'Reported' ? 'Reported means the information was published by a named media source. It is not represented here as a direct company confirmation.' : 'Rumour means the claim remains unverified. Do not use it as a basis for decisions.'} Dates make this record auditable; they do not make it current.</p></aside>
        <section className="detail-method" aria-labelledby="event-coverage-heading">
          <strong id="event-coverage-heading">What this report does not establish</strong>
          <p>{event.coverageNote}</p>
          <strong>What to verify for your situation</strong>
          <p>{event.readerCheck}</p>
        </section>
        <LayoffResponsePlanner
          company={event.company}
          geography={event.geography}
          status={event.status}
          summary={event.summary}
          coverageNote={event.coverageNote}
        />
        <div className="detail-next"><Link href="/layoffs/#event-tracker" data-testid="link-detail-more-events">Back to all sourced records <ArrowLeft size={14} aria-hidden="true" /></Link><Link href="/layoffs/#first-24-hours" data-testid="link-detail-support">Need practical next steps? <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
      </main>
    </HubShell>
  );
}

function LayoffAlertAction({ kind }: { kind: 'confirm' | 'unsubscribe' }) {
  const confirmation = useConfirmLayoffAlertSubscription();
  const unsubscribe = useUnsubscribeLayoffAlerts();
  const started = useRef(false);
  const [message, setMessage] = useState('Checking your request…');
  const [failed, setFailed] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setFailed(true);
      setMessage('This email link is missing its verification token.');
      return;
    }
    const run = async () => {
      try {
        const result = kind === 'confirm'
          ? await confirmation.mutateAsync({ data: { token } })
          : await unsubscribe.mutateAsync({ params: { token } });
        setMessage(result.message);
      } catch {
        setFailed(true);
        setMessage(kind === 'confirm'
          ? 'This confirmation link is invalid, expired, or already used.'
          : 'We could not process this unsubscribe link. Try again or contact support.');
      }
    };
    void run();
  }, [confirmation.mutateAsync, kind, token, unsubscribe.mutateAsync]);

  return (
    <HubShell>
      <main className="layoff-detail" aria-labelledby="alert-action-title">
        <p className="layoff-eyebrow">CareerReality / Email preferences</p>
        <h1 id="alert-action-title">{kind === 'confirm' ? 'Confirm email alerts' : 'Unsubscribe from alerts'}</h1>
        <p role={failed ? 'alert' : 'status'} data-testid="status-layoff-alert-action">{message}</p>
        <Link href="/layoffs/" className="layoff-button" data-testid="link-alert-action-hub">Return to the Layoff Hub</Link>
      </main>
    </HubShell>
  );
}

export default function LayoffHubPage() {
  const params = useParams<{ slug?: string }>();
  const [location] = useLocation();
  if (location.startsWith('/layoffs/confirm')) return <LayoffAlertAction kind="confirm" />;
  if (location.startsWith('/layoffs/unsubscribe')) return <LayoffAlertAction kind="unsubscribe" />;
  if (params.slug && params.slug !== 'confirm' && params.slug !== 'unsubscribe') return <LayoffEventDetail />;
  return <LayoffHub />;
}
