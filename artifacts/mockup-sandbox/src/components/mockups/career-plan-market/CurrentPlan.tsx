import { Activity, Calendar, Check, ChevronRight, Clock, Compass, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import "./_group.css";

const moves = [
  ["SALARY", "Test your current CTC against the market median", "Compare two offers or ask for the range in your next recruiter call.", "Salary benchmark · 14 Jun"],
  ["ROLE DEMAND", "Turn one product outcome into a proof point", "Write the before/after story a hiring manager can defend.", "LinkedIn Jobs · 2 days ago"],
] as const;

type Action = { title: string; body: string; date: string; source: string; done?: boolean };
const initialActions: Action[] = [
  { title: "Ask your manager for cross-functional scope", body: "Request ownership of the next launch and define one measurable outcome.", date: "Today", source: "Personal plan" },
  { title: "Write the promotion proof point", body: "Capture the decision, result, and stakeholders from your last product launch.", date: "24 Jun", source: "Market change · LinkedIn Jobs" },
  { title: "Update your portfolio narrative", body: "Add the outcome story to your next interview narrative.", date: "Closed", source: "Personal plan", done: true },
];

export function CurrentPlan() {
  const [actions, setActions] = useState(initialActions);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const toggle = (index: number) => setActions(items => items.map((item, i) => i === index ? { ...item, done: !item.done, date: item.done ? "Today" : "Closed" } : item));
  return <main className="career-plan-market"><div className="cr-shell">
    <header className="cr-header"><div className="cr-header-copy"><span className="cr-eyebrow">CAREER PLAN</span><h1>Turn signals into moves.</h1></div></header>
    <section className="cr-intro"><span className="cr-label">WHAT SHOULD I DO NEXT?</span><h2>A plan that moves with your market.</h2><p>Schedule one concrete next move, then close the loop when it is done.</p></section>
    <section className="cr-card cr-flow"><div className="cr-flow-top"><div><span className="cr-label">DECISION ENGINE</span><div className="cr-flow-title">Signals → meaning → move</div></div><span className="cr-pill positive">High confidence</span></div><svg viewBox="0 0 320 58" preserveAspectRatio="none"><path d="M8 43 C60 43 61 20 112 20 S160 43 208 43 S260 20 312 20" fill="none" stroke="var(--cr-primary)" strokeWidth="3"/><circle cx="8" cy="43" r="5" fill="var(--cr-primary)"/><circle cx="112" cy="20" r="5" fill="var(--cr-primary)"/><circle cx="208" cy="43" r="5" fill="var(--cr-primary)"/><circle cx="312" cy="20" r="5" fill="var(--cr-accent)"/></svg><div className="cr-flow-labels"><div><span>EVIDENCE</span><strong>3 sources</strong></div><div><span>READ</span><strong>High confidence</strong></div><div><span>NEXT</span><strong>1 move</strong></div></div></section>
    <section className="cr-card cr-change"><span className="cr-label">BRIEF CHANGE</span><strong>Market demand is selective, not stalled.</strong><span className="cr-muted">LinkedIn Jobs · Fresh · Senior product roles are prioritising measurable outcomes.</span></section>
    <div className="cr-section-head"><h2 className="cr-section-title">Market read → next moves</h2><span className="cr-section-action">2 signals</span></div>
    <section className="cr-card cr-change"><strong>Server-researched market context</strong><span className="cr-muted">These moves come from the same personalised decision engine as Home. Choose the response you can test, not the story you can only worry about.</span></section>
    {moves.map(([label, titleText, text, source]) => <article className="cr-card cr-move" key={label}><div className="cr-move-head"><span className="cr-move-label"><Compass size={14} /> {label}</span><span className="cr-pill positive">High confidence</span></div><h3 className="cr-move-value">{titleText}</h3><p>{text}</p><span className="cr-muted">{source}</span><button className="cr-button secondary" onClick={() => setActions(items => [...items, { title: titleText, body: text, date: "Today", source: `Market change · ${source}` }])}><Calendar size={15}/> Add this move to Plan</button></article>)}
    <div className="cr-section-head"><h2 className="cr-section-title">Add a move</h2><span className="cr-section-action">Private</span></div>
    <section className="cr-card cr-input-card"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="What will you do?" /><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Make it concrete: interview a manager, compare two offers..." /><input type="date" /><button className="cr-button" onClick={() => { if (title.trim() && body.trim()) { setActions(items => [...items, { title, body, date: "Today", source: "Personal plan" }]); setTitle(""); setBody(""); } }}><Plus size={16}/> Add to plan</button></section>
    <div className="cr-section-head"><h2 className="cr-section-title">Needs attention</h2><span className="cr-section-action">{actions.filter(a => !a.done).length} open</span></div>
    {actions.map((action, index) => <article className={`cr-card cr-action ${action.done ? "done" : ""}`} key={`${action.title}-${index}`}><div className="cr-action-main" onClick={() => toggle(index)}><span className={`cr-check ${action.done ? "done" : ""}`}>{action.done ? <Check size={14}/> : null}</span><div className="cr-action-copy"><strong className="cr-action-title">{action.title}</strong><span className="cr-action-body">{action.body}</span><div className="cr-action-meta"><span className={`cr-pill ${action.done ? "positive" : ""}`}>{action.date}</span><span className="cr-action-source">{action.source}</span></div></div></div>{!action.done && action.source.includes("Market") ? <div className="cr-action-foot"><Clock size={14}/> Snooze · Skip for now</div> : null}</article>)}
  </div></main>;
}