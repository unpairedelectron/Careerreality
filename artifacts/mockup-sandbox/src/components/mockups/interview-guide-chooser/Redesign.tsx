import "./_group.css";

const roles = [
  { id: "data-engineer", title: "Data Engineer", count: 76, index: "01", note: "Pipelines, platforms & data quality" },
  { id: "data-scientist", title: "Data Scientist", count: 75, index: "02", note: "Statistics, experimentation & impact" },
  { id: "ai-ml-engineer", title: "AI/ML Engineer", count: 75, index: "03", note: "Models, systems & production ML" },
  { id: "gen-ai-engineer", title: "Generative AI Engineer", count: 67, index: "04", note: "LLMs, retrieval & evaluation" },
  { id: "agentic-ai-engineer", title: "Agentic AI Engineer", count: 65, index: "05", note: "Agents, tools & orchestration" },
] as const;

export function Redesign() {
  return (
    <div className="ig-extracted ig-redesign">
      <style>{`
        .ig-redesign {
          --ink: hsl(var(--foreground));
          --paper: hsl(var(--background));
          --teal: hsl(var(--primary));
          --quiet: hsl(var(--muted-foreground));
          --line: hsl(var(--border));
          min-height: 100dvh;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 94% 3%, hsl(var(--primary) / .075), transparent 28rem),
            var(--paper);
        }
        .ig-redesign * { box-sizing: border-box; }
        .ig-shell { width: min(1120px, calc(100% - 64px)); margin: 0 auto; }
        .ig-topbar {
          height: 78px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid hsl(var(--border) / .8);
        }
        .ig-brand { display: inline-flex; gap: 11px; align-items: center; color: var(--ink); text-decoration: none; }
        .ig-brand-mark {
          width: 30px; height: 30px; border: 1px solid hsl(var(--primary) / .45);
          border-radius: 9px; display: grid; place-items: center; color: var(--teal);
          font: 600 9px/1 var(--app-font-mono); letter-spacing: -.07em;
        }
        .ig-brand-name { font-size: 13px; font-weight: 800; letter-spacing: -.035em; }
        .ig-top-note { font: 10px var(--app-font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--quiet); }
        .ig-main { padding: 60px 0 42px; }
        .ig-intro {
          display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 72px;
          align-items: end; margin-bottom: 48px;
        }
        .ig-eyebrow { margin: 0 0 18px; color: var(--teal); font: 11px var(--app-font-mono); letter-spacing: .13em; text-transform: uppercase; }
        .ig-title {
          max-width: 690px; margin: 0; font: 500 clamp(48px, 6.5vw, 76px)/.98 var(--app-font-serif);
          letter-spacing: -.055em;
        }
        .ig-title em { color: var(--teal); font-weight: 400; }
        .ig-deck { max-width: 610px; margin: 24px 0 0; color: var(--quiet); font-size: 15px; line-height: 1.75; }
        .ig-edition {
          border-left: 1px solid hsl(var(--accent) / .55); padding: 4px 0 4px 19px;
          color: var(--quiet); font-size: 12px; line-height: 1.7;
        }
        .ig-edition strong { display: block; margin-bottom: 7px; color: var(--ink); font-size: 12px; }
        .ig-edition span { color: hsl(var(--accent)); font-weight: 700; }
        .ig-directory-head {
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
          border-top: 1px solid var(--line); padding: 16px 2px 13px;
        }
        .ig-directory-title { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .01em; }
        .ig-directory-meta { color: var(--quiet); font: 10px var(--app-font-mono); letter-spacing: .08em; text-transform: uppercase; }
        .ig-role-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ig-role-item:last-child { grid-column: 1 / -1; }
        .ig-role-link {
          min-height: 124px; display: grid; grid-template-columns: 43px minmax(0, 1fr) auto;
          align-items: center; gap: 18px; padding: 22px 24px; position: relative;
          border: 1px solid var(--line); border-radius: 3px;
          color: var(--ink); text-decoration: none;
          background: hsl(var(--card) / .78);
          transition: transform .2s ease, border-color .2s ease, background-color .2s ease;
        }
        .ig-role-link:hover { transform: translateY(-2px); border-color: hsl(var(--primary) / .55); background: hsl(var(--card)); }
        .ig-role-link:focus-visible { outline: 3px solid hsl(var(--ring) / .42); outline-offset: 3px; }
        .ig-role-index { align-self: start; padding-top: 4px; color: hsl(var(--accent)); font: 11px var(--app-font-mono); }
        .ig-role-copy { min-width: 0; }
        .ig-role-name { display: block; margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -.035em; }
        .ig-role-note { display: block; margin: 7px 0 0; color: var(--quiet); font-size: 12px; line-height: 1.5; }
        .ig-role-tail { display: flex; align-items: center; gap: 16px; color: var(--teal); }
        .ig-count { text-align: right; white-space: nowrap; }
        .ig-count b { display: block; font: 500 21px/1 var(--app-font-serif); }
        .ig-count small { display: block; margin-top: 5px; color: var(--quiet); font: 9px var(--app-font-mono); text-transform: uppercase; letter-spacing: .08em; }
        .ig-arrow { width: 18px; height: 18px; transition: transform .2s ease; }
        .ig-role-link:hover .ig-arrow { transform: translateX(3px); }
        .ig-foot {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 26px;
          margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--line);
        }
        .ig-disclaimer { max-width: 680px; margin: 0; color: var(--quiet); font-size: 11px; line-height: 1.7; }
        .ig-disclaimer strong { color: var(--ink); font-weight: 700; }
        .ig-foot-mark { flex: none; color: hsl(var(--accent)); font: 10px var(--app-font-mono); letter-spacing: .07em; text-transform: uppercase; }
        .ig-bottom { display: flex; align-items: center; justify-content: space-between; padding: 17px 0 24px; color: var(--quiet); font: 9px var(--app-font-mono); letter-spacing: .08em; text-transform: uppercase; }
        .ig-bottom-rule { height: 1px; flex: 1; margin: 0 18px; background: hsl(var(--border) / .7); }
        @media (max-width: 760px) {
          .ig-shell { width: min(100% - 36px, 560px); }
          .ig-topbar { height: 66px; }
          .ig-top-note { font-size: 8px; letter-spacing: .08em; }
          .ig-main { padding-top: 42px; }
          .ig-intro { display: block; margin-bottom: 34px; }
          .ig-title { font-size: clamp(48px, 13vw, 67px); }
          .ig-deck { font-size: 14px; margin-top: 19px; }
          .ig-edition { margin-top: 25px; max-width: 430px; }
          .ig-directory-head { align-items: flex-end; }
          .ig-directory-meta { max-width: 130px; text-align: right; line-height: 1.6; }
          .ig-role-list { grid-template-columns: 1fr; gap: 9px; }
          .ig-role-item:last-child { grid-column: auto; }
          .ig-role-link { min-height: 104px; padding: 18px 16px; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 12px; }
          .ig-role-name { font-size: 15px; }
          .ig-role-note { font-size: 11px; }
          .ig-role-tail { gap: 9px; }
          .ig-count b { font-size: 19px; }
          .ig-foot { display: block; margin-top: 25px; }
          .ig-foot-mark { margin-top: 15px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ig-role-link, .ig-arrow { transition: none; }
        }
      `}</style>

      <header className="ig-shell ig-topbar">
        <a className="ig-brand" href="/interview-guides" aria-label="CareerReality interview guides">
          <span className="ig-brand-mark" aria-hidden="true">CR</span>
          <span className="ig-brand-name">CareerReality</span>
        </a>
        <span className="ig-top-note">Interview guide library&nbsp; / &nbsp;India</span>
      </header>

      <main className="ig-shell ig-main">
        <section className="ig-intro" aria-labelledby="ig-heading">
          <div>
            <p className="ig-eyebrow">A practical place to begin</p>
            <h1 className="ig-title" id="ig-heading">Choose your<br /><em>interview guide.</em></h1>
            <p className="ig-deck">Explore role-specific questions for the work you do. Choose a guide to see what it covers and prepare at your own pace.</p>
          </div>
          <aside className="ig-edition">
            <strong>Useful context, not certainty.</strong>
            These guides are educational resources—not predictions of hiring outcomes. <span>Independent expert review is pending.</span>
          </aside>
        </section>

        <section aria-labelledby="ig-directory-heading">
          <div className="ig-directory-head">
            <h2 className="ig-directory-title" id="ig-directory-heading">Browse by role</h2>
            <span className="ig-directory-meta">5 guides&nbsp; · &nbsp;Question counts shown</span>
          </div>
          <ul className="ig-role-list">
            {roles.map((role) => (
              <li className="ig-role-item" key={role.id}>
                <a className="ig-role-link" href={`/interview-guides/${role.id}`}>
                  <span className="ig-role-index" aria-hidden="true">{role.index}</span>
                  <span className="ig-role-copy">
                    <span className="ig-role-name">{role.title}</span>
                    <span className="ig-role-note">{role.note}</span>
                  </span>
                  <span className="ig-role-tail">
                    <span className="ig-count"><b>{role.count}</b><small>questions</small></span>
                    <svg className="ig-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h12m-4.7-4.7 4.7 4.7-4.7 4.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="ig-foot">
          <p className="ig-disclaimer"><strong>A note on the material:</strong> Use the questions to structure your preparation; hiring decisions depend on the role, employer and conversation.</p>
          <span className="ig-foot-mark">Built for considered preparation</span>
        </footer>
        <div className="ig-bottom" aria-hidden="true">
          <span>CareerReality</span><span className="ig-bottom-rule" /><span>Role directory · India</span>
        </div>
      </main>
    </div>
  );
}
