import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Filter,
  Layers3,
  ListChecks,
  Play,
  Search,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { InterviewGuideProps, InterviewGuideTab, InterviewGuideQuestion } from "./types";
import { StudyModules } from "./StudyModules";
import { getPageHeading } from "@/data/page-headings";
import "./interview-guide.css";

const tabs: Array<{ id: InterviewGuideTab; label: string; icon: typeof BookOpen }> = [
  { id: "guide", label: "Question guide", icon: BookOpen },
  { id: "readiness", label: "Readiness", icon: ListChecks },
  { id: "study", label: "Study plan", icon: Layers3 },
  { id: "mocks", label: "Mock practice", icon: Play },
  { id: "flashcards", label: "Flashcards", icon: RotateCcw },
  { id: "modules", label: "Study toolkit", icon: CalendarDays },
];

const readinessItems = [
  { id: "foundations", label: "I can explain the core concepts without notes", note: "Start with the why, then define the moving parts." },
  { id: "tradeoffs", label: "I can compare at least two approaches and their trade-offs", note: "Name the constraint that changes your choice." },
  { id: "evidence", label: "I can connect an answer to a project or concrete example", note: "Use your own evidence; avoid memorised claims." },
  { id: "followups", label: "I can handle a follow-up by reasoning out loud", note: "Clarify assumptions before jumping to a solution." },
];

const readableType: Record<string, string> = {
  concept: "Concept",
  "trade-off": "Trade-off",
  scenario: "Scenario",
  debugging: "Debugging",
  coding: "Coding",
  design: "System design",
  "behavioural-technical": "Technical experience",
};

function useLocalOrControlled<T>(controlled: T | undefined, initial: T) {
  const [local, setLocal] = useState<T>(initial);
  return [controlled === undefined ? local : controlled, setLocal] as const;
}

function FieldList({ title, values, tone }: { title: string; values: string[]; tone?: "good" | "caution" }) {
  return (
    <section className={`ig-field-list ${tone ? `ig-field-list-${tone}` : ""}`}>
      <h4>{title}</h4>
      <ul>{values.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}</ul>
    </section>
  );
}

function QuestionCard({
  item,
  index,
  core,
  complete,
  onCore,
  onComplete,
}: {
  item: InterviewGuideQuestion;
  index: number;
  core: boolean;
  complete: boolean;
  onCore: () => void;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`ig-question ${open ? "is-open" : ""}`} data-testid={`question-card-${item.id}`}>
      <div className="ig-question-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
      <div className="ig-question-main">
        <div className="ig-question-meta">
          <span>{item.topic}</span><i aria-hidden="true" />
          <span>{item.subtopic}</span><i aria-hidden="true" />
          <span>{item.level}</span>
          <span className="ig-type-tag">{readableType[item.type] ?? item.type}</span>
        </div>
        <h3>{item.question}</h3>
        <p className="ig-assessed"><span>Assesses</span>{item.what_is_assessed}</p>
        <div className="ig-question-foot">
          <span><Clock3 size={14} aria-hidden="true" /> {item.estimated_reading_minutes} min read · {item.estimated_practice_minutes} min practice</span>
          <span className="ig-priority">Priority {item.priority}</span>
        </div>
        {open && (
          <div className="ig-answer" id={`answer-${item.id}`}>
            <div className="ig-short-answer">
              <span className="ig-answer-label">In brief</span>
              <p>{item.short_answer}</p>
            </div>
            <section className="ig-explanation">
              <h4>Reason it through</h4>
              <p>{item.deep_explanation}</p>
            </section>
            {item.answer_tiers.fresher_level && <section className="ig-tier"><h4>Early-career framing</h4><p>{item.answer_tiers.fresher_level}</p></section>}
            {item.answer_tiers.senior_level && <section className="ig-tier"><h4>Senior-level framing</h4><p>{item.answer_tiers.senior_level}</p></section>}
            <div className="ig-signal-grid">
              <FieldList title="Strong answer signals" values={item.strong_answer_signals} tone="good" />
              <FieldList title="Watch for" values={item.weak_answer_signals} tone="caution" />
            </div>
            <FieldList title="Common mistakes" values={item.common_mistakes} />
            {item.follow_ups.length > 0 && (
              <section className="ig-follow-ups">
                <h4>Possible follow-ups</h4>
                {item.follow_ups.map((followUp, followIndex) => (
                  <div key={`${followIndex}-${followUp.question}`}><strong>{followUp.question}</strong><p>{followUp.short_answer}</p></div>
                ))}
              </section>
            )}
            {item.references.length > 0 && (
              <section className="ig-references">
                <h4>References</h4>
                <ul>{item.references.map((reference) => (
                  <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer" data-testid={`link-reference-${item.id}-${reference.url.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase()}`}>{reference.title}<ExternalLink size={12} aria-hidden="true" /></a><span>{reference.publisher}</span></li>
                ))}</ul>
              </section>
            )}
          </div>
        )}
        <div className="ig-question-actions">
          <button type="button" className="ig-text-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`answer-${item.id}`} data-testid={`button-answer-${item.id}`}>
            {open ? "Hide answer" : "Reveal answer"} <ChevronDown size={15} className={open ? "ig-chevron-up" : ""} aria-hidden="true" />
          </button>
          <button type="button" className={`ig-icon-button ${core ? "is-selected" : ""}`} onClick={onCore} aria-pressed={core} aria-label={`${core ? "Remove" : "Mark"} ${item.question} ${core ? "from" : "as"} Core`} data-testid={`button-core-${item.id}`}>
            <Bookmark size={15} aria-hidden="true" /> <span>{core ? "Core" : "Mark Core"}</span>
          </button>
          <button type="button" className={`ig-icon-button ${complete ? "is-selected" : ""}`} onClick={onComplete} aria-pressed={complete} data-testid={`button-complete-${item.id}`}>
            {complete ? <CheckCircle2 size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />} <span>{complete ? "Revised" : "Mark revised"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function InterviewGuide({
  roleTitle,
  roleSlug,
  topics,
  questions,
  coreQuestionIds: controlledCore,
  completedQuestionIds: controlledCompleted,
  readinessChecks: controlledReadiness,
  onCoreQuestionIdsChange,
  onCompletedQuestionIdsChange,
  onReadinessChecksChange,
  onEntryPoint,
}: InterviewGuideProps) {
  const [activeTab, setActiveTab] = useState<InterviewGuideTab>("guide");
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const [coreIds, setCoreIds] = useLocalOrControlled(controlledCore, questions.filter((question) => question.core).map((question) => question.id));
  const [completedIds, setCompletedIds] = useLocalOrControlled(controlledCompleted, []);
  const [readiness, setReadiness] = useLocalOrControlled(controlledReadiness, []);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashRevealed, setFlashRevealed] = useState(false);
  const [mockStarted, setMockStarted] = useState(false);
  const [mockDone, setMockDone] = useState(false);

  const topicNames = useMemo(() => Array.from(new Set([...topics.map((topic) => topic.name), ...questions.map((question) => question.topic)])).sort(), [topics, questions]);
  const filteredQuestions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesSearch = !needle || [question.question, question.topic, question.subtopic, question.what_is_assessed].some((value) => value.toLowerCase().includes(needle));
      return matchesSearch && (topicFilter === "all" || question.topic === topicFilter) && (levelFilter === "all" || question.level === levelFilter) && (!coreOnly || coreIds.includes(question.id));
    });
  }, [questions, search, topicFilter, levelFilter, coreOnly, coreIds]);
  const completedCount = completedIds.filter((id) => questions.some((question) => question.id === id)).length;
  const progress = questions.length ? Math.round((completedCount / questions.length) * 100) : 0;
  const studyQuestion = questions[studyIndex % Math.max(questions.length, 1)];
  const flashQuestion = questions[flashIndex % Math.max(questions.length, 1)];
  const totalReading = questions.reduce((sum, item) => sum + item.estimated_reading_minutes, 0);
  const totalPractice = questions.reduce((sum, item) => sum + item.estimated_practice_minutes, 0);

  const changeIds = (ids: string[], id: string, callback?: (ids: string[]) => void, setter?: (value: string[]) => void) => {
    const next = ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
    setter?.(next);
    callback?.(next);
  };
  const switchTab = (tab: InterviewGuideTab) => {
    setActiveTab(tab);
    if (tab === "study" || tab === "mocks" || tab === "flashcards") onEntryPoint?.(tab === "mocks" ? "mock" : tab);
  };
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "Question guide";

  return (
    <main className="interview-guide" data-testid={`interview-guide-${roleSlug}`}>
      <header className="ig-header">
        <div className="ig-topline"><a className="ig-library-link" href="/interview-guides" data-testid="link-interview-guides">All role guides <ArrowRight size={13} aria-hidden="true" /></a><span className="ig-live-label"><i /> Evidence-led study</span></div>
        <div className="ig-hero">
          <div>
            <p className="ig-eyebrow">COMPLETE INTERVIEW GUIDE <span>·</span> ROLE STUDY</p>
            <h1 className="ig-keyword-title">{getPageHeading(`/interview-guides/${roleSlug}`)?.h1 ?? `${roleTitle} interview guide`}</h1>
            <p className="ig-display" data-testid="page-kicker">{roleTitle}<br /><em>interview guide</em></p>
            <p className="ig-intro">Build a clear understanding, practise explaining your reasoning, and keep track of what you have revised.</p>
          </div>
          <aside className="ig-hero-aside">
            <span className="ig-aside-kicker">A useful boundary</span>
            <p>This guide teaches concepts and practice habits. It does not predict hiring outcomes.</p>
            <span className="ig-aside-rule" />
            <span className="ig-aside-foot">ROLE FILE <b>{roleSlug.toUpperCase().replaceAll("-", " / ")}</b></span>
          </aside>
        </div>
        <div className="ig-review-notice" role="note" data-testid="status-expert-review">
          <span className="ig-review-icon"><Sparkles size={16} aria-hidden="true" /></span>
          <p><strong>Owner review is complete.</strong> Independent SME review is not claimed; use cited references to verify fast-moving details.</p>
          <span className="ig-review-status">OWNER REVIEWED</span>
        </div>
      </header>

      <section className="ig-overview" aria-label="Guide summary">
        <div className="ig-overview-title"><span>YOUR STUDY DESK</span><h2>Progress, not prediction.</h2></div>
        <div className="ig-stat ig-progress-stat">
          <div className="ig-stat-top"><span>Revised</span><strong>{completedCount}<small> / {questions.length}</small></strong></div>
          <div className="ig-progress-track" role="progressbar" aria-label="Questions revised" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={questions.length || 1}><span style={{ width: `${progress}%` }} /></div>
          <small>{progress}% of this question set marked revised</small>
        </div>
        <div className="ig-stat"><span>QUESTION SET</span><strong>{questions.length}</strong><small>{topics.length} study topics</small></div>
        <div className="ig-stat"><span>ESTIMATED TIME</span><strong>{totalReading + totalPractice}<small> min</small></strong><small>{totalReading} read · {totalPractice} practise</small></div>
      </section>

      <nav className="ig-tabs" role="tablist" aria-label="Interview guide workspace">
        {tabs.map(({ id, label, icon: Icon }, index) => (
          <button key={id} type="button" role="tab" tabIndex={activeTab === id ? 0 : -1} aria-selected={activeTab === id} aria-controls={`ig-panel-${id}`} id={`ig-tab-${id}`} className={`ig-tab ${activeTab === id ? "is-active" : ""}`} onClick={() => switchTab(id)} onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
            const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
            const nextTab = tabs[nextIndex];
            if (nextTab) {
              switchTab(nextTab.id);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
            }
          }} data-testid={`tab-${id}`}>
            <span className="ig-tab-number">0{index + 1}</span><Icon size={16} aria-hidden="true" /><span>{label}</span>{activeTab === id && <ArrowDownRight size={14} aria-hidden="true" />}
          </button>
        ))}
      </nav>

      <div className="ig-tab-panel" role="tabpanel" id={`ig-panel-${activeTab}`} aria-labelledby={`ig-tab-${activeTab}`}>
        {activeTab === "guide" && (
          <div className="ig-guide-layout">
            <aside className="ig-topic-rail">
              <div className="ig-rail-heading"><span>THE SYLLABUS</span><span>{topics.length} TOPICS</span></div>
              <button type="button" className={`ig-topic-option ${topicFilter === "all" ? "is-active" : ""}`} onClick={() => setTopicFilter("all")} data-testid="filter-topic-all"><span>All questions</span><b>{questions.length}</b></button>
              {topicNames.map((topic) => {
                const count = questions.filter((question) => question.topic === topic).length;
                return <button type="button" key={topic} className={`ig-topic-option ${topicFilter === topic ? "is-active" : ""}`} onClick={() => setTopicFilter(topic)} data-testid={`filter-topic-${topic.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`}><span>{topic}</span><b>{count}</b></button>;
              })}
              <div className="ig-rail-note"><span className="ig-note-line" /><p>Move through topics at your own pace. The order is a study aid, not a hiring rubric.</p></div>
            </aside>
            <section className="ig-question-list" aria-label="Interview questions">
              <div className="ig-list-header">
                <div><p className="ig-section-label">QUESTION BANK <span>/</span> {activeTabLabel.toUpperCase()}</p><h2>Think it through.</h2><p className="ig-list-description">Read the prompt first. Reveal the explanation when you are ready to compare your reasoning.</p></div>
                <div className="ig-list-count"><strong>{filteredQuestions.length.toString().padStart(2, "0")}</strong><span>items shown</span></div>
              </div>
              <div className="ig-filters">
                <label className="ig-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search questions</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search concepts, prompts, signals…" data-testid="input-question-search" /></label>
                <label className="ig-select-wrap"><Filter size={14} aria-hidden="true" /><span className="sr-only">Filter by level</span><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} data-testid="select-level"><option value="all">All levels</option><option value="L1">L1 · Foundation</option><option value="L2">L2 · Applied</option><option value="L3">L3 · Advanced</option><option value="L4">L4 · Expert</option></select></label>
                <button type="button" className={`ig-core-filter ${coreOnly ? "is-active" : ""}`} onClick={() => setCoreOnly(!coreOnly)} aria-pressed={coreOnly} data-testid="filter-core"><Bookmark size={14} aria-hidden="true" /> Core only</button>
              </div>
              {filteredQuestions.length ? <div className="ig-questions">
                {filteredQuestions.map((item, index) => <QuestionCard key={item.id} item={item} index={index} core={coreIds.includes(item.id)} complete={completedIds.includes(item.id)} onCore={() => changeIds(coreIds, item.id, onCoreQuestionIdsChange, setCoreIds)} onComplete={() => changeIds(completedIds, item.id, onCompletedQuestionIdsChange, setCompletedIds)} />)}
              </div> : <div className="ig-empty" role="status"><Search size={20} aria-hidden="true" /><h3>No questions match those filters.</h3><p>Try a broader search or clear the level and Core filters.</p><button type="button" onClick={() => { setSearch(""); setTopicFilter("all"); setLevelFilter("all"); setCoreOnly(false); }} data-testid="button-clear-filters">Clear filters</button></div>}
            </section>
          </div>
        )}

        {activeTab === "readiness" && (
          <section className="ig-tool-view" aria-labelledby="readiness-title">
            <div className="ig-tool-heading"><div><p className="ig-section-label">SELF-CHECK <span>/</span> NO SCORE</p><h2 id="readiness-title">A clearer sense of what to practise.</h2><p>Mark the habits you can demonstrate today. This is a reflection aid, not an assessment of your likelihood of getting hired.</p></div><div className="ig-readiness-mark"><strong>{readiness.length}<small> / {readinessItems.length}</small></strong><span>habits checked</span></div></div>
            <div className="ig-readiness-list">{readinessItems.map((item, index) => <label key={item.id} className={`ig-readiness-item ${readiness.includes(item.id) ? "is-checked" : ""}`} data-testid={`readiness-item-${item.id}`}><input type="checkbox" checked={readiness.includes(item.id)} onChange={() => changeIds(readiness, item.id, onReadinessChecksChange, setReadiness)} data-testid={`checkbox-readiness-${item.id}`} /><span className="ig-check-ui">{readiness.includes(item.id) && <Check size={13} aria-hidden="true" />}</span><span className="ig-readiness-num">0{index + 1}</span><span className="ig-readiness-copy"><strong>{item.label}</strong><small>{item.note}</small></span><ArrowRight size={16} aria-hidden="true" /></label>)}</div>
            <div className="ig-tool-footer"><span>Keep the evidence personal: use examples from your own work and learning.</span><button type="button" onClick={() => switchTab("study")} data-testid="button-readiness-study">Build a study session <ArrowRight size={15} aria-hidden="true" /></button></div>
          </section>
        )}

        {activeTab === "study" && (
          <section className="ig-tool-view ig-study-view" aria-labelledby="study-title">
            <div className="ig-tool-heading"><div><p className="ig-section-label">STUDY SESSION <span>/</span> LOCAL ONLY</p><h2 id="study-title">One question at a time.</h2><p>A simple guided loop: attempt, compare, then mark the question revised when it feels useful to you.</p></div><div className="ig-session-index"><span>SESSION</span><strong>{questions.length ? String((studyIndex % questions.length) + 1).padStart(2, "0") : "00"}<small> / {String(questions.length).padStart(2, "0")}</small></strong></div></div>
            {studyQuestion ? <div className="ig-study-card"><div className="ig-study-card-top"><span>{studyQuestion.topic} <i /> {studyQuestion.level}</span><span><Clock3 size={13} aria-hidden="true" /> {studyQuestion.estimated_practice_minutes} min practise</span></div><h3>{studyQuestion.question}</h3><p className="ig-study-nudge">Before revealing: state your assumptions, outline your reasoning, and name one trade-off.</p><details className="ig-study-details"><summary data-testid="toggle-study-answer">Compare with the short answer <ChevronDown size={16} aria-hidden="true" /></summary><p>{studyQuestion.short_answer}</p></details><div className="ig-study-actions"><button type="button" className="ig-secondary-button" onClick={() => setStudyIndex((studyIndex + 1) % Math.max(questions.length, 1))} data-testid="button-study-next">Next question <ArrowRight size={15} aria-hidden="true" /></button><button type="button" className="ig-primary-button" onClick={() => changeIds(completedIds, studyQuestion.id, onCompletedQuestionIdsChange, setCompletedIds)} data-testid="button-study-revised">{completedIds.includes(studyQuestion.id) ? "Remove revised mark" : "Mark revised"} <Check size={15} aria-hidden="true" /></button></div></div> : <div className="ig-empty"><p>Add questions to this role guide to start a study session.</p></div>}
          </section>
        )}

        {activeTab === "mocks" && (
          <section className="ig-tool-view ig-mock-view" aria-labelledby="mock-title">
            <div className="ig-tool-heading"><div><p className="ig-section-label">PRACTICE OUT LOUD <span>/</span> SELF-DIRECTED</p><h2 id="mock-title">A small rehearsal, on your terms.</h2><p>Choose a prompt, give yourself space to think, and reflect on the evidence in your answer. No score or hiring prediction is produced.</p></div><div className="ig-mock-stamp"><span>MOCK</span><strong>01</strong><small>SELF-PACED</small></div></div>
            <div className="ig-mock-stage">
              {mockDone ? <div className="ig-mock-finished" role="status"><CheckCircle2 size={25} aria-hidden="true" /><h3>Practice session complete.</h3><p>Take a note of one idea to strengthen and one thing you explained clearly.</p><button type="button" onClick={() => { setMockDone(false); setMockStarted(false); }} data-testid="button-mock-reset">Start another practice</button></div> :
                <><div className="ig-mock-stage-meta"><span>{mockStarted ? "YOUR PROMPT" : "READY WHEN YOU ARE"}</span><span>{questions.length} prompts in this role guide</span></div><h3>{mockStarted && questions.length ? questions[(studyIndex + 1) % questions.length].question : "Talk through a technical decision you made. What constraints mattered, what alternatives did you consider, and what would you change now?"}</h3><p>{mockStarted ? "Take a moment to structure your answer. You can speak it aloud or write a few notes privately." : "A 10-minute rehearsal is enough to practise a clear opening, a reasoned middle, and an honest reflection."}</p><div className="ig-mock-prompts"><span>TRY THIS SHAPE</span><b>Context <i>→</i> Decision <i>→</i> Evidence <i>→</i> Reflection</b></div><div className="ig-mock-actions">{!mockStarted ? <button type="button" className="ig-primary-button" onClick={() => setMockStarted(true)} data-testid="button-mock-start">Begin rehearsal <Play size={14} aria-hidden="true" /></button> : <button type="button" className="ig-primary-button" onClick={() => setMockDone(true)} data-testid="button-mock-finish">Finish rehearsal <Check size={15} aria-hidden="true" /></button>}</div></>}
            </div>
          </section>
        )}

        {activeTab === "flashcards" && (
          <section className="ig-tool-view ig-flash-view" aria-labelledby="flash-title">
            <div className="ig-tool-heading"><div><p className="ig-section-label">RECALL PRACTICE <span>/</span> QUICK REVIEW</p><h2 id="flash-title">Prompt first. Recall before reveal.</h2><p>Use these as a light retrieval-practice tool. Answers are cues to study, not scripts to memorise.</p></div><div className="ig-flash-count"><span>CARD</span><strong>{questions.length ? String((flashIndex % questions.length) + 1).padStart(2, "0") : "00"}<small> / {String(questions.length).padStart(2, "0")}</small></strong></div></div>
            {flashQuestion ? <div className={`ig-flashcard ${flashRevealed ? "is-revealed" : ""}`}><div className="ig-flashcard-top"><span><Layers3 size={14} aria-hidden="true" /> {flashQuestion.topic}</span><span>{flashQuestion.level} · {readableType[flashQuestion.type]}</span></div><div className="ig-flashcard-content"><span>{flashRevealed ? "RECALL CUE" : "PROMPT"}</span><h3>{flashRevealed ? flashQuestion.short_answer : flashQuestion.question}</h3></div><div className="ig-flashcard-bottom"><button type="button" className="ig-text-button" onClick={() => setFlashRevealed(!flashRevealed)} data-testid="button-flash-reveal">{flashRevealed ? "Show question" : "Reveal cue"} <ChevronDown size={15} aria-hidden="true" /></button><div><button type="button" className="ig-secondary-button" onClick={() => { setFlashIndex((flashIndex + Math.max(questions.length, 1) - 1) % Math.max(questions.length, 1)); setFlashRevealed(false); }} data-testid="button-flash-previous">Previous</button><button type="button" className="ig-primary-button" onClick={() => { setFlashIndex((flashIndex + 1) % Math.max(questions.length, 1)); setFlashRevealed(false); }} data-testid="button-flash-next">Next card <ArrowRight size={14} aria-hidden="true" /></button></div></div></div> : <div className="ig-empty">No questions available for flashcards yet.</div>}
          </section>
        )}
        {activeTab === "modules" && (
          <StudyModules roleTitle={roleTitle} questions={questions} coreIds={coreIds} />
        )}
      </div>

      <footer className="ig-footer"><div><span className="ig-footer-mark">CR</span><p><strong>CareerReality</strong><br />A study workspace, not a hiring forecast.</p></div><span>YOUR SELECTED PROGRESS STAYS IN THIS BROWSER.</span></footer>
    </main>
  );
}

export default InterviewGuide;
