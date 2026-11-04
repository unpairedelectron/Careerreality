import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import type { InterviewGuideQuestion } from "./types";

const durations = [1, 7, 14, 30] as const;

export function StudyModules({ roleTitle, questions, coreIds }: {
  roleTitle: string;
  questions: InterviewGuideQuestion[];
  coreIds: string[];
}) {
  const [days, setDays] = useState<number>(7);
  const ordered = useMemo(() => [...questions].sort((a, b) =>
    Number(coreIds.includes(b.id)) - Number(coreIds.includes(a.id)) ||
    a.priority - b.priority || a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id)
  ), [questions, coreIds]);
  const plan = Array.from({ length: days }, (_, index) => ordered.filter((_, itemIndex) => itemIndex % days === index));
  const practice = questions.filter((q) => q.type === "scenario" || q.type === "design");
  const executedCode = questions.filter((q) => q.code?.executed);
  const core = ordered.filter((q) => coreIds.includes(q.id));
  const topics = [...new Set(questions.map((q) => q.topic))];

  return (
    <section className="ig-tool-view" aria-labelledby="modules-title">
      <div className="ig-tool-heading">
        <div><p className="ig-section-label">STUDY TOOLKIT <span>/</span> PERSONAL PACE</p>
          <h2 id="modules-title">A plan for {roleTitle} you can adjust.</h2>
          <p>These are practice suggestions, not a hiring timeline. Your Core shortlist is based only on questions you selected.</p></div>
        <button type="button" className="ig-secondary-button" onClick={() => window.print()} data-testid="button-print-pack"><Printer size={15} aria-hidden="true" /> Print revision pack</button>
      </div>

      <section className="ig-module-section" aria-labelledby="plan-heading">
        <h3 id="plan-heading">Choose a study window</h3>
        <label className="ig-select-wrap">Study plan length
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} data-testid="select-study-days">
            {durations.map((duration) => <option key={duration} value={duration}>{duration} {duration === 1 ? "day" : "days"}</option>)}
          </select>
        </label>
        <div className="ig-plan-grid">{plan.map((items, index) => <article className="ig-plan-day" key={index}>
          <h4>{days === 1 ? "Session" : `Day ${index + 1}`}</h4>
          {items.length ? <ul>{items.map((q) => <li key={q.id}><b>{q.topic}</b><span>{q.question}</span></li>)}</ul> : <p>Use this day for review or rest.</p>}
        </article>)}</div>
      </section>

      <section className="ig-module-section" aria-labelledby="stages-heading">
        <h3 id="stages-heading">Common interview stages</h3>
        <p>Processes vary by employer and role; confirm the actual format with your recruiter.</p>
        <ol className="ig-stage-list">
          {["Role and experience conversation", "Technical foundations", "Applied scenario or system design", "Project and collaboration examples", "Your questions and next steps"].map((stage, i) => <li key={stage}><b>0{i + 1}</b><span>{stage}</span></li>)}
        </ol>
      </section>

      <section className="ig-module-section" aria-labelledby="scenario-heading">
        <h3 id="scenario-heading">Scenario and design walkthroughs</h3>
        <p>For each prompt, state the goal, clarify constraints, compare options, explain your choice, then say how you would validate it.</p>
        {practice.length ? <ul className="ig-module-prompts">{practice.map((q) => <li key={q.id}><b>{q.type === "design" ? "Design" : "Scenario"} · {q.topic}</b><p>{q.question}</p><details><summary>Review answer signals</summary><ul>{q.strong_answer_signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></details></li>)}</ul> : <p role="status">No scenario or design questions are in this role bank yet.</p>}
      </section>

      <section className="ig-module-section" aria-labelledby="quick-heading">
        <h3 id="quick-heading">Quick-reference notes</h3>
        {topics.length ? <dl className="ig-quick-reference">{topics.map((topic) => {
          const q = questions.find((item) => item.topic === topic);
          return q ? <div key={topic}><dt>{topic}</dt><dd>{q.short_answer}</dd></div> : null;
        })}</dl> : <p>No topic notes are available yet.</p>}
      </section>

      <section className="ig-module-section" aria-labelledby="core-heading">
        <h3 id="core-heading">Your Core path</h3>
        <p>Core is your personal shortlist, not an editorial ranking or interview prediction.</p>
        {core.length ? <ol>{core.map((q) => <li key={q.id}><b>{q.topic}</b> — {q.question}</li>)}</ol> : <p>Select questions as Core in the question guide to build this path.</p>}
      </section>

      <section className="ig-module-section" aria-labelledby="code-heading">
        <h3 id="code-heading">Tested coding practice</h3>
        <p>Only exercises with recorded execution and expected output appear here.</p>
        {executedCode.length ? <ul>{executedCode.map((q) => <li key={q.id}><b>{q.question}</b><pre><code>{q.code?.sample}</code></pre><p>Expected output: {q.code?.output}</p></li>)}</ul> : <p role="status">No code exercise in this bank is marked executed yet; no mock exercise is shown as tested.</p>}
      </section>
    </section>
  );
}

export default StudyModules;
