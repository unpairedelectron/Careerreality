import { getPageHeading } from "@/data/page-headings";
import "./interview-guide-chooser.css";

export type GuideRoleSummary = {
  id: string;
  title: string;
  count: number;
  index: string;
  note: string;
};

type InterviewGuideChooserProps = {
  roles: GuideRoleSummary[];
};

export function InterviewGuideChooser({ roles }: InterviewGuideChooserProps) {
  return (
    <div className="ig-extracted ig-redesign">
      <main className="ig-shell ig-main">
        <section className="ig-intro" aria-labelledby="ig-heading">
          <div>
            <p className="ig-eyebrow">A practical place to begin</p>
            <h1 className="ig-keyword-title" id="ig-heading">{getPageHeading("/interview-guides")?.h1}</h1>
            <p className="ig-title" data-testid="page-subhead">Choose your<br /><em>interview guide.</em></p>
            <p className="ig-deck">
              Explore role-specific questions and see what each guide covers. Choose a role to prepare at your own pace.
            </p>
          </div>
          <aside className="ig-edition" aria-label="About these guides">
            <strong>Useful context, not certainty.</strong>
            These guides are educational resources—not predictions of hiring outcomes.{" "}
            <span>Owner-reviewed; independent SME review is not claimed.</span>
          </aside>
        </section>

        <section aria-labelledby="ig-directory-heading">
          <div className="ig-directory-head">
            <h2 className="ig-directory-title" id="ig-directory-heading">Browse by role</h2>
            <span className="ig-directory-meta">{roles.length} guides&nbsp; · &nbsp;Question counts shown</span>
          </div>
          <ul className="ig-role-list">
            {roles.map((role) => (
              <li className="ig-role-item" key={role.id}>
                <a
                  className="ig-role-link"
                  href={`/interview-guides/${role.id}`}
                  data-testid={`link-interview-guide-${role.id}`}
                >
                  <span className="ig-role-index" aria-hidden="true">{role.index}</span>
                  <span className="ig-role-copy">
                    <span className="ig-role-name">{role.title}</span>
                    <span className="ig-role-note">{role.note}</span>
                  </span>
                  <span className="ig-role-tail">
                    <span className="ig-count" aria-label={`${role.count} questions`}>
                      <b>{role.count}</b><small>questions</small>
                    </span>
                    <svg className="ig-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M3.5 10h12m-4.7-4.7 4.7 4.7-4.7 4.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="ig-foot">
          <p className="ig-disclaimer">
            <strong>A note on the material:</strong> Use the questions to structure your preparation; hiring decisions depend on the role, employer and conversation.
          </p>
          <span className="ig-foot-mark">Built for considered preparation</span>
        </footer>
        <div className="ig-bottom" aria-hidden="true">
          <span>CareerReality</span><span className="ig-bottom-rule" /><span>Role directory · India</span>
        </div>
      </main>
    </div>
  );
}
