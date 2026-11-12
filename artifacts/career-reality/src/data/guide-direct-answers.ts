/**
 * The short answer shown at the top of each guide, in the page and in its crawler snapshot.
 *
 * Rules (enforced by tests/guide-direct-answers.test.ts and the snapshot verifier):
 * - one per published guide: a short reader question and a 20–90 word plain-text answer;
 * - restate only what the guide itself establishes: no new figures, rates, dates or legal claims;
 * - written fresh, not copied from a paragraph elsewhere on the page.
 */
export type GuideDirectAnswer = { question: string; answer: string };

export const guideDirectAnswers: Record<string, GuideDirectAnswer> = {
  "read-the-offer-beyond-ctc": {
    question: "Is CTC the same as the salary I take home?",
    answer: "No. CTC bundles fixed pay, a variable target that may not be paid in full, and employer-side costs such as PF and gratuity. Estimate monthly cash from the fixed-pay lines first, treat the bonus as upside, and check the estimate against your first payslip.",
  },
  "runway-debt-and-big-decisions": {
    question: "Can I afford this career move?",
    answer: "A move is affordable when your accessible cash covers bills and loan payments for longer than the gap you expect, with room for delays. Count money you can reach without an employer or a sale; unvested shares and annual-package figures do not pay this month's rent.",
  },
  "independent-work-without-romanticising-it": {
    question: "Should I quit to freelance?",
    answer: "Test freelancing with one small paid project before you give up a salary. If you can win the work, scope it, deliver it in the time you actually have and get paid on the agreed terms, you have evidence. Enthusiasm alone is not.",
  },
  "career-switches-and-education": {
    question: "Should I switch careers through a course or degree?",
    answer: "Choose the route that produces proof of the work you want to do, at a cost and time you can carry. Name the target tasks, learn how newcomers show competence in them, and build a small work sample before paying for a long course or leaving your current role.",
  },
  "getting-hired-through-evidence-and-conversations": {
    question: "How should I prepare for an interview?",
    answer: "Prepare a few specific work examples: what you did, how you decided, and what changed. Keep confidential details out, use the interview to question the role as much as to answer, and rely on the written offer rather than a referral or a friendly conversation.",
  },
  "performance-reviews-and-career-choices": {
    question: "What should I get from my performance review?",
    answer: "Go in with documented impact and leave with three things in writing: who decides the promotion, what evidence they will look at, and when it will be reviewed again. A good rating on its own does not tell you any of these.",
  },
  "engineering-careers-without-the-title-trap": {
    question: "Individual contributor or manager: which engineering path?",
    answer: "Pick the role whose day-to-day decisions and consequences you want to own, whatever the title says. Compare the actual scope, approval rights, mentoring load and on-call work in each option; individual-contributor and manager labels mean different things at different employers.",
  },
  "ai-at-work-questions-to-ask": {
    question: "What should I learn because of AI at work?",
    answer: "Pick one real task, try the AI tool on it under your employer's rules, and check how good the output is, who reviews it and what data it touches. Learn the skills that test exposes. A demo or headline cannot tell you whether your whole job will change.",
  },
  "data-science-career-claims": {
    question: "Is a data-science job what the title suggests?",
    answer: "Ask what a junior hire will actually clean, measure, explain or maintain in the first months, and check how recent the hiring claim is. The title alone does not promise modelling work, so show your reasoning with a reproducible sample rather than a polished chart.",
  },
  "cybersecurity-and-green-work": {
    question: "Are cybersecurity and green jobs a safe bet?",
    answer: "Treat both as families of very different jobs, not guaranteed careers. Before buying a certificate, check one specific role: its daily tasks, entry requirements, who funds it and what authority it carries. A sector growth headline is not a forecast about your own job.",
  },
  "layoff-recovery-and-employment-documents": {
    question: "What do I sort out first after a layoff?",
    answer: "Split everything into four lists: pay that is confirmed, amounts still unresolved, documents you need such as the relieving letter, and decisions you can postpone. Check each item against your contract and the employer's records, and ask for anything missing in writing.",
  },
  "notice-period-and-return-to-office": {
    question: "What should I check before resigning or relocating?",
    answer: "Read the current written terms for notice, buyout, leave, attendance and exit documents, then ask HR to confirm any conflict or adjustment in writing. A colleague's experience or a verbal assurance does not change your own contract.",
  },
  "cross-border-and-remote-pay": {
    question: "How do I compare a remote or overseas offer?",
    answer: "Compare the offer only after you know which entity employs you, where you will legally work, which currency the contract pays in and which tax questions need an expert. Converting the gross figure into rupees does not give you a take-home estimate.",
  },
  "senior-engineering-and-operations-work": {
    question: "Is this senior engineering role worth taking?",
    answer: "Judge a senior role by what it owns: which systems, how many incidents land on it, whether it has authority to fix recurring causes, and how much time is left for deep work. The title and salary do not show whether that load is sustainable.",
  },
  "skills-passion-and-career-constraints": {
    question: "How do I pick a career change that fits my life?",
    answer: "Start from the time, money and responsibilities you actually have, then choose the smallest experiment that lets you try the work you are drawn to. Keep interest, evidence and affordability as separate questions so that enthusiasm does not stand in for proof.",
  },
  "culture-fit-and-product-management": {
    question: "How do I test a product manager role and its culture?",
    answer: "Ask who proposes, approves and communicates priorities, who owns the outcome, and what evidence has changed a decision recently. Those answers describe the real product role and culture far better than a title or a sense that you would fit in.",
  },
  "workplace-culture-and-boundaries": {
    question: "How can I tell what a team's culture is really like?",
    answer: "Look for patterns across ordinary weeks: how workload is set, how disagreement is handled and whether boundaries are respected. A single joke, a hard week or a polished interview is a signal to explore with specific questions, not a verdict on the team.",
  },
  "how-to-read-salary-and-hiring-claims": {
    question: "Can I trust a salary figure I read online?",
    answer: "Before you use it, find who published it, when, for which level and location, from what sample, and whether it means base pay or CTC. Use it as market context only; your own written offer is the only number that applies to you.",
  },
  "notice-period-buyout-india": {
    question: "Can I buy out my notice period?",
    answer: "Only when your signed terms or the employer's current written policy provide for it, on the conditions they set, which may include employer approval. Get a dated written answer on the waiver, the payment basis and the exit documents before you commit to a new joining date.",
  },
  "gratuity-four-years-eight-months": {
    question: "Does 4 years 8 months count as 5 years for gratuity?",
    answer: "In the arithmetic, the Ministry FAQ counts a part year exceeding six months, so eight months beyond four completed years is counted in the calculation. That does not settle eligibility: whether you qualify at all depends on your continuous service and coverage, which you still need to confirm.",
  },
  "first-24-hours-after-layoff": {
    question: "What should I do in the first 24 hours after a layoff?",
    answer: "Save your personal records, confirm the key dates and payments in writing, secure access to the accounts you will need, and write down your open questions. Do not sign anything beyond a receipt until you understand it.",
  },
  "severance-notice-leave-after-layoff": {
    question: "Are severance, notice pay and leave the same thing?",
    answer: "No, they are separate items. Ask for an itemised statement and match severance, notice pay, earned salary, leave and any deductions to the clause or rule behind each one. Do not assume severance is owed in every case, and mark anything unconfirmed for follow-up.",
  },
  "pf-withdrawal-after-job-loss": {
    question: "Can I withdraw my PF after losing my job?",
    answer: "Check your account and service record, the claim route that applies and current EPFO guidance before you file. An online balance is not an approved claim, and the amount and timing depend on the rule in force when you apply.",
  },
  "form-130-salary-tds-certificate-india": {
    question: "Is Form 130 the new Form 16?",
    answer: "Yes. For salary from tax year 2026–27 under the Income-tax Act, 2025, Form 130 is the certificate that takes over from Form 16; salary paid up to 31 March 2026 stays on Form 16. Either way, match it against your payslips and annual tax statement before filing.",
  },
  "old-vs-new-tax-regime-salaried-india": {
    question: "Which tax regime is better for me?",
    answer: "Neither regime is better for everyone. Estimate your tax under both for AY 2026–27 with the official year-specific rules, counting only deductions you can actually claim. What your employer withholds during the year is separate from the option you finally choose in your return.",
  },
  "offer-letter-red-flags-india": {
    question: "What are the red flags in an offer letter?",
    answer: "Look for gaps between what you were told and what is written: vague fixed pay, conditional bonuses, deductions, notice and buyout, location and recovery clauses. A red flag is a reason to ask a precise question and get the answer in writing before signing, not proof of bad faith.",
  },
  "negotiate-salary-offer-with-numbers": {
    question: "How do I negotiate a salary offer?",
    answer: "Put your current package and the offer on the same yearly basis, separate guaranteed cash from targets and one-time amounts, and ask for one specific change you can justify by the role's scope. Confirm whatever is agreed in a revised written offer.",
  },
  "labour-codes-and-layoffs-india": {
    question: "Do the Labour Codes decide what I get after a layoff?",
    answer: "Not by themselves. The outcome can depend on your worker category, the establishment, the state, the dates, your contract and the rules currently notified. Use the Ministry FAQs for orientation, then check those facts for your own case.",
  },
  "90-day-post-layoff-job-search": {
    question: "How should I plan a job search after a layoff?",
    answer: "Use the 90 days as a review window rather than a deadline. Protect cash first, choose a few realistic role targets, review applications and conversations every week, and adjust the pace to your runway, health and responsibilities.",
  },
};

export function getGuideDirectAnswer(slug: string): GuideDirectAnswer | undefined {
  return guideDirectAnswers[slug];
}
