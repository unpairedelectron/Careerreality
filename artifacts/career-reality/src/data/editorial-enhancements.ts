export type EditorialEnhancement = {
  angle: string;
  readerOutcome: string;
  evidenceBoundary: string;
};

/**
 * These are deliberately scoped to the non-indexed editorial candidates from
 * the September 2026 coverage review. Indexed routes keep their existing
 * content and rendering path unchanged.
 */
export const editorialEnhancements: Record<string, EditorialEnhancement> = {
  "ai-upskilling-trap-india-api-wrapper-reality": {
    angle: "The useful question is not whether a course mentions AI. It is whether the work it enables can be tested, reviewed, and improved in a real operating context.",
    readerOutcome: "Leave with a small proof-of-work test: name the workflow, build an artefact, document its limits, and ask someone close to the work to challenge it.",
    evidenceBoundary: "This is an editorial synthesis about evaluating learning signals; it is not a ranking of courses or a promise about a specific employer.",
  },
  "career-switch-illusion-changing-jobs-not-career": {
    angle: "A new employer is not automatically a new career. The decision becomes clearer when the target capability, evidence bridge, and accepted trade-offs are named separately.",
    readerOutcome: "Use the page to compare a job change with a genuine capability change before spending money, runway, or reputation on the move.",
    evidenceBoundary: "The framework is directional. It cannot predict an individual outcome without the role scope, compensation, runway, and constraints in front of that person.",
  },
  "engineering-career-ceiling-peak-at-35": {
    angle: "The age-ceiling story hides the more useful test: whether an engineer is gaining judgement, authority, and scope that transfer beyond the current title.",
    readerOutcome: "Turn a vague fear about seniority into three checks on decision ownership, leverage, and the next proof of scope.",
    evidenceBoundary: "This is a qualitative career framework, not a claim that engineers face one universal age or promotion threshold.",
  },
  "culture-fit-trap-hiring-reality": {
    angle: "Culture language becomes useful only when it is translated into observable work: how disagreement is handled, how decisions are made, and what behaviour is rewarded.",
    readerOutcome: "Use the interview questions and verification prompts to test the lived operating environment instead of accepting a culture slogan at face value.",
    evidenceBoundary: "A public description cannot establish what every team or manager is like. Verify the specific role, reporting line, and recent examples.",
  },
  "remote-work-salary-trap-india": {
    angle: "Remote work is a bundle of flexibility, pay mix, visibility, support, and progression—not a single perk that can be compared without context.",
    readerOutcome: "Compare the remote offer against fixed cash, expected availability, location constraints, manager practice, and the evidence of future mobility.",
    evidenceBoundary: "The article offers a decision lens, not a universal remote-work premium or a salary benchmark for every Indian role.",
  },
  "american-dream-indian-engineers": {
    angle: "An overseas engineering move combines career opportunity with immigration conditions, cash-flow risk, support systems, and a credible return path.",
    readerOutcome: "Build a side-by-side move assessment that includes the work, permission to stay, total cost, family context, and what remains reversible.",
    evidenceBoundary: "Immigration rules, compensation, and personal circumstances change. Confirm current legal and employment details before acting.",
  },
  "salary-transparency-india-2026-number-in-room": {
    angle: "A published salary range is a starting signal, not the offer. The useful comparison separates band, level, fixed cash, variable pay, and the conditions behind each number.",
    readerOutcome: "Use the article to prepare better compensation questions and to record what is known, promised, conditional, or still missing.",
    evidenceBoundary: "The page explains how to interrogate a salary signal; it does not present a universal market range or guarantee disclosure by an employer.",
  },
  "ai-job-market-2026-india-show-your-working": {
    angle: "As AI makes first drafts cheaper, the durable hiring signal shifts toward showing how a person frames a problem, evaluates output, and owns the result.",
    readerOutcome: "Translate an AI-related career goal into a visible work sample with assumptions, failure cases, review notes, and an outcome someone else can inspect.",
    evidenceBoundary: "The article is a directional interpretation of changing task signals, not a forecast of every role or hiring market.",
  },
  "humour-in-workplace-culture-2026-joke-is-on-promotion": {
    angle: "Workplace humour can reveal power, belonging, and risk, but the same joke does not mean the same thing in every team or hierarchy.",
    readerOutcome: "Read humour as one signal among many, then verify who can disagree, who receives credit, and what happens when a boundary is crossed.",
    evidenceBoundary: "The framework is interpretive. It should not be used to diagnose an individual colleague or label a workplace from one anecdote.",
  },
};