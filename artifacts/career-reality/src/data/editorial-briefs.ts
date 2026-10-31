import { ctcWorkedExampleResults } from "../lib/ctc-calculator";

const ctc20lpaExample = ctcWorkedExampleResults.find((example) => example.id === "20lpa");
if (!ctc20lpaExample) throw new Error("The shared ₹20L CTC worked example is missing.");

function articleRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export type EditorialBrief = {
  dek: string;
  sections: Array<{ heading: string; body: string }>;
};

export const editorialBriefs: Record<string, EditorialBrief> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": {
    dek: "Portfolio-first hiring rewards visible judgement, not certificates. In India, show ownership, constraints, and outcomes—not a pile of courses.",
    sections: [
      { heading: "The signal", body: "Mid-level hiring is increasingly asking candidates to show what they shipped, measured, or changed. The artefact can be a system note, a case study, an evaluation harness, or a growth experiment; the format matters less than the evidence of judgement." },
      { heading: "What the headline leaves out", body: "A public portfolio is not the same thing as a stable gig career. Specialist consulting can bring better upside, but it also brings uneven cash flow, tax complexity, and the need to keep finding the next piece of work." },
      { heading: "The decision this changes", body: "Do not respond to portfolio-first hiring by collecting more tutorials. Pick one real problem, document the constraint, show the trade-off, and make the result easy for a hiring manager to understand in four minutes." },
      { heading: "Questions worth asking next", body: "Which artefact best proves the role you want? Can you explain the baseline, the decision you made, and what changed? If the work is confidential, what can you recreate without exposing a customer or employer?" },
    ],
  },
  "green-careers-esg-renewable-sustainability-india-2026": {
    dek: "Green careers span reporting, carbon accounting, renewable operations, and compliance. The work is often more operational than inspirational.",
    sections: [
      { heading: "The signal", body: "Demand is forming around people who can translate environmental goals into auditable numbers, procurement decisions, and operating plans. ESG roles sit between policy, finance, operations, and data rather than inside one neat job family." },
      { heading: "What the headline leaves out", body: "Many roles use sustainability language while still requiring spreadsheet discipline, evidence collection, and stakeholder persistence. A certificate helps less than the ability to trace a claim back to a method and a source." },
      { heading: "The decision this changes", body: "Treat a green-career switch as a domain move plus a proof-of-work move. A small emissions inventory, supplier scorecard, or regulatory briefing can show more readiness than a broad list of courses." },
      { heading: "Questions worth asking next", body: "Who owns the data? Is the role building a programme or only producing a report? What would you be able to measure after six months, and how much of the work is analysis versus coordination?" },
    ],
  },
  "cybersecurity-privacy-careers-beyond-tech-india-2026": {
    dek: "Cybersecurity and privacy roles are spreading beyond tech. Strong career paths explain technical risk in business language.",
    sections: [
      { heading: "The signal", body: "Security hiring is not limited to penetration testing or incident response. Governance, risk, compliance, privacy operations, identity, and vendor assurance create routes for people who can connect controls to real business exposure." },
      { heading: "What the headline leaves out", body: "A tool list is not a security career. Teams still need people who can prioritise a finding, negotiate a remediation plan, and explain what a control protects when an executive asks for the short version." },
      { heading: "The decision this changes", body: "Choose a lane before adding another certification. A portfolio of threat models, privacy notices, tabletop exercises, or control reviews makes the direction legible and exposes where your technical depth needs work." },
      { heading: "Questions worth asking next", body: "Is the role a builder, an assessor, or a coordinator? Who receives the findings? What is the escalation path when a business owner does not accept the recommended risk treatment?" },
    ],
  },
  "joining-bonus-clawback-offer-letter-traps-2026": {
    dek: "A joining bonus can be useful cash or a repayment obligation disguised as compensation. The repayment trigger and timeline matter more than the headline amount.",
    sections: [
      { heading: "The signal", body: "Clawbacks commonly sit in the offer letter, a separate undertaking, or a policy incorporated by reference. The practical question is not whether a bonus exists; it is what event turns it into a debt." },
      { heading: "What the headline leaves out", body: "A repayment clause may cover resignation, termination for cause, non-joining, or a partial period after joining. Tax treatment, payroll deductions, and the definition of the retention period can materially change the cash value." },
      { heading: "The decision this changes", body: "Compare the net bonus with the downside you would carry if the role changes or the employer ends the relationship. A smaller clean offer can be worth more than a larger amount with a broad clawback." },
      { heading: "Questions worth asking next", body: "Is the bonus guaranteed or discretionary? Does the amount reduce monthly or only on an anniversary date? Who can approve a waiver, and is that waiver written into the offer rather than promised verbally?" },
    ],
  },
  "staff-engineer-promotion-freeze-india-2026": {
    dek: "Staff-level promotions can slow even when senior engineers are doing more work. When the slot is frozen, scope without authority becomes a career risk.",
    sections: [
      { heading: "The signal", body: "Promotion decisions are constrained by headcount plans, levelling budgets, and the number of staff roles an organisation is willing to carry. Strong performance can still produce a longer wait when the next level is structurally limited." },
      { heading: "What the headline leaves out", body: "The problem is not only a title delay. Engineers may absorb cross-team ownership, incident load, and mentoring without a written mandate, decision rights, or compensation that reflects the expanded surface area." },
      { heading: "The decision this changes", body: "Ask for a level rubric, a sponsor, and a dated review checkpoint. If the organisation cannot name the evidence or the decision-maker, treat the promotion promise as an aspiration rather than part of your offer value." },
      { heading: "Questions worth asking next", body: "What staff-level behaviour is missing? Which decisions are you authorised to make today? Is there a budgeted slot, and what happens to your scope if the slot does not open?" },
    ],
  },
  "gcc-return-to-office-hybrid-reality-india-2026": {
    dek: "GCC office mandates can change an offer's economics even when CTC stays fixed. Include commute, time, and team location.",
    sections: [
      { heading: "The signal", body: "Captive centres may pay a premium while requiring three or four office days. The combination can still be attractive, but only if the role, manager, and commute make the premium usable rather than theoretical." },
      { heading: "What the headline leaves out", body: "Hybrid language often hides the difference between a team norm, a badge policy, and a manager preference. A future office mandate can also arrive after the offer, when your negotiation leverage is lower." },
      { heading: "The decision this changes", body: "Price the commute as a recurring cost in time and money. Ask for the expected cadence in writing, then compare the real monthly benefit with a local or genuinely remote alternative." },
      { heading: "Questions worth asking next", body: "How many days does this specific team attend? What happens during parent-company visits or audits? Is the location fixed, and can the policy change without a role or compensation review?" },
    ],
  },
  "relieving-letter-hostage-notice-period-india-2026": {
    dek: "Notice-period friction is often a process problem before it becomes a legal one. Keep the exit trail written, specific, and separate from emotional escalation.",
    sections: [
      { heading: "The signal", body: "Long notice periods, buyout ambiguity, handover dependencies, and delayed paperwork can narrow your next options. The risk increases when important instructions are verbal or when multiple HR systems disagree." },
      { heading: "What the headline leaves out", body: "A relieving letter is not the only useful record. Resignation acknowledgement, last working day, handover status, payslips, tax documents, and the employment contract each answer a different future question." },
      { heading: "The decision this changes", body: "Before resigning, model the cash cost of the notice period and the date your next employer actually needs. After resigning, communicate in short factual updates and preserve every acknowledgement." },
      { heading: "Questions worth asking next", body: "What does the contract say about buyout and early release? Who owns the final approval? Which documents will be issued automatically, and which require a separate request after the last working day?" },
    ],
  },
  "gcc-gold-rush-india-captive-center-reality": {
    dek: "India's GCC expansion can create better roles, but a captive centre is not automatically a better employer. Local execution risk remains.",
    sections: [
      { heading: "The signal", body: "GCCs are building engineering, product, analytics, finance, and security capability in India. The most durable roles usually own a meaningful slice of a global system rather than serving as a low-context delivery extension." },
      { heading: "What the headline leaves out", body: "Global brand, local manager, and actual decision rights can diverge. A role can carry a premium while still being measured by a distant team, constrained by approvals, or exposed to a local restructuring cycle." },
      { heading: "The decision this changes", body: "Evaluate the mandate, not just the logo. Ask what ships from India, which roadmap decisions happen locally, and whether the team is building a durable capability or staffing a temporary programme." },
      { heading: "Questions worth asking next", body: "Who is the product or engineering customer? Which decisions can the India team make without escalation? What happened to the team in the last planning cycle?" },
    ],
  },
  "indian-it-layoff-cycle-2026": {
    dek: "Layoff risk is more than one headline: hiring pauses, utilisation pressure, project changes, and narrower approvals can reduce leverage.",
    sections: [
      { heading: "The signal", body: "A useful radar watches for repeated changes rather than a single rumour: fewer backfills, longer approvals, bench movement, cancelled programmes, and role descriptions that quietly disappear." },
      { heading: "What the headline leaves out", body: "A company-level number can hide large differences between business units and skills. The same employer may freeze one function while hiring aggressively for a capability tied to its next revenue plan." },
      { heading: "The decision this changes", body: "Build optionality before anxiety becomes a resignation. Keep your work evidence current, understand your cash runway, and compare an offer's stability signal with its salary premium." },
      { heading: "Questions worth asking next", body: "Is this role a backfill or new headcount? How many quarters of funded work sit behind it? What happens if the named project moves, and which adjacent teams could absorb the role?" },
    ],
  },
  "what-20-lpa-actually-feels-like-india-purchasing-power": {
    dek: `This ₹20L CTC model estimates ${articleRupees(ctc20lpaExample.result.monthlyInHandAtZeroVariable)}/month at zero variable or ${articleRupees(ctc20lpaExample.result.monthlyInHandAtTargetAverage)}/month averaged at full target, under stated Tax Year 2026–27 assumptions.`,
    sections: [
      { heading: "The signal", body: `Illustration, not a market average: ₹20,00,000 CTC is split into ${articleRupees(ctc20lpaExample.inputs.annualFixedPay)} fixed gross cash and ${articleRupees(ctc20lpaExample.inputs.annualVariablePay)} target variable pay. Estimated employer PF of ${articleRupees(ctc20lpaExample.result.annualEmployerPf)} is included in the package, leaving ${articleRupees(ctc20lpaExample.result.annualUnallocatedCtc)} unallocated by the stated lines. The shared calculator estimates ${articleRupees(ctc20lpaExample.result.monthlyInHandAtZeroVariable)} monthly at zero variable pay and ${articleRupees(ctc20lpaExample.result.monthlyInHandAtTargetAverage)} monthly on an annual-average basis if the full target pays. The latter is not a guaranteed monthly payslip.` },
      { heading: "What the headline leaves out", body: `At full target, gross cash is ${articleRupees(ctc20lpaExample.result.annualGrossAtTarget)}. The Tax Year 2026–27 new-regime estimate applies the ₹75,000 standard deduction, giving taxable income of ${articleRupees(ctc20lpaExample.result.taxAtTarget.taxableIncome)} and estimated annual income tax of ${articleRupees(ctc20lpaExample.result.annualTaxAtTarget)}. Estimated employee PF is ${articleRupees(ctc20lpaExample.result.annualEmployeePf)} at target and ${articleRupees(ctc20lpaExample.result.annualEmployeePfAtZeroVariable)} at fixed pay, using a statutory-ceiling schedule and an assumed PF start date of 1 April 2026. The example assumes a resident salaried individual below 60, the default/new regime, ₹0 professional tax, no gratuity or other employer costs, no other income, and no unentered exemptions or deductions. It does not establish employer-specific PF eligibility, guarantee variable pay, or replace payroll review.` },
      { heading: "The decision this changes", body: "Decode the offer before negotiating the headline. Separate fixed cash, conditional pay, statutory deductions, and the recurring cost of accepting the role in its actual location." },
      { heading: "Questions worth asking next", body: "What reaches the bank account in month one? Which components are guaranteed? What changes if the bonus pays at 50% of target, and how much runway remains after the move?" },
    ],
  },
  "manager-vs-ic-career-path-india": {
    dek: "Manager versus individual contributor is not a prestige ladder. It is a choice about the kind of leverage, ambiguity, and accountability you want to carry.",
    sections: [
      { heading: "The signal", body: "Management compounds through people systems, prioritisation, and organisational trust. IC careers compound through technical judgement, scope, and the ability to make complex systems legible to others." },
      { heading: "What the headline leaves out", body: "A manager title can mean coordination without authority. An IC title can mean deep work without a clear promotion lane. The quality of the operating environment matters more than the label on the org chart." },
      { heading: "The decision this changes", body: "Choose the work you want to repeat. If you get energy from coaching, staffing, and trade-offs across people, management may fit. If you want to own hard technical decisions and influence through expertise, an IC path may fit better." },
      { heading: "Questions worth asking next", body: "What does success look like in this path? Who controls the roadmap and the people decisions? Can you move between tracks without losing level, pay, or credibility?" },
    ],
  },
  "layoff-recovery-timeline-india": {
    dek: "Layoff recovery is financial and emotional, not a motivational montage. The next role may need a different search strategy.",
    sections: [
      { heading: "The signal", body: "The first weeks are about paperwork and stabilising cash. Later months reveal whether your previous title, brand, and compensation still map cleanly to the roles available in your target city and domain." },
      { heading: "What the headline leaves out", body: "Fast recovery stories often include a referral, a warm pipeline, or work started before the layoff. A slower search is not proof of lower ability, but it does require a more deliberate runway and channel mix." },
      { heading: "The decision this changes", body: "Use the first month to secure documents and references, then build a focused pipeline instead of rewriting the same résumé indefinitely. Track response rates by channel and adjust the target role when the evidence says to." },
      { heading: "Questions worth asking next", body: "What is your minimum acceptable runway? Which former managers can make a specific introduction? Which adjacent role preserves your strongest evidence without forcing a large unexplained reset?" },
    ],
  },
  "ai-upskilling-trap-india-api-wrapper-reality": {
    dek: "AI upskilling is expensive entertainment if every course ends at a demo. Look for evaluation discipline, domain context, and outcome ownership.",
    sections: [
      { heading: "The signal", body: "Many people can assemble a model call or a RAG prototype. Fewer can define a useful metric, measure failure modes, control cost, and explain where a human must remain in the loop." },
      { heading: "What the headline leaves out", body: "Tool familiarity expires quickly. A portfolio that only shows a polished screenshot does not reveal whether the system is reliable, safe, or useful under real constraints." },
      { heading: "The decision this changes", body: "Choose one workflow you understand and test it honestly. Show the baseline, the evaluation set, the trade-offs, and the cases where you decided not to automate." },
      { heading: "Questions worth asking next", body: "What decision does the system improve? How will you know it is wrong? What is the cost per useful outcome, and who is accountable when the output causes harm?" },
    ],
  },
  "ux-salary-myth-design-careers-plateau": {
    dek: "Design salary plateaus are often a scope problem before they are a talent problem. More screens are not the same as more leverage.",
    sections: [
      { heading: "The signal", body: "Commodity interface work is easier to compare and easier to compress. Designers who can frame a problem, test a decision, and connect the work to a business outcome create a wider surface for progression." },
      { heading: "What the headline leaves out", body: "A visually impressive portfolio can still hide weak product judgement. Hiring teams want to see constraints, failed directions, research quality, and what changed after the design entered the system." },
      { heading: "The decision this changes", body: "Move the portfolio from gallery to evidence. Pick two projects and make the trade-offs, collaboration, and measurable consequence impossible to miss." },
      { heading: "Questions worth asking next", body: "What decision did your work unlock? Which metric or behaviour changed? What would you do differently with another week, and what did you deliberately leave out?" },
    ],
  },
  "pm-prestige-trap-escape-from-engineering": {
    dek: "Product management is not a softer version of engineering. It requires coordination and decisions, often without owning every outcome lever.",
    sections: [
      { heading: "The signal", body: "The strongest PM transitions carry evidence of problem framing, prioritisation, customer learning, and shipping. A title change alone does not prove that you can make those decisions." },
      { heading: "What the headline leaves out", body: "PM work can be less predictable, more political, and more dependent on influence than the role descriptions suggest. The prestige of the title is a poor proxy for the quality of the mandate." },
      { heading: "The decision this changes", body: "Test the work before making the identity leap. Run a discovery project, write a product brief, or own a cross-functional launch with a measurable outcome." },
      { heading: "Questions worth asking next", body: "Who decides the roadmap? What customer access will you have? Which outcome belongs to the PM, and what authority exists when engineering, sales, or leadership disagree?" },
    ],
  },
  "senior-developer-salary-ceiling-india": {
    dek: "Senior developer pay can flatten when execution is rewarded but broader ownership is needed. The next band is a scope conversation.",
    sections: [
      { heading: "The signal", body: "Salary movement slows when work is hard but local: one service, one team, or one delivery lane. The higher bands reward judgement that reduces risk across teams and survives beyond a single project." },
      { heading: "What the headline leaves out", body: "A market median cannot tell you whether your current company has a credible path for the scope you already carry. Nor can a bigger CTC compensate for a role with no decision rights or learning surface." },
      { heading: "The decision this changes", body: "Benchmark the role you are actually performing, then decide whether to deepen, broaden, or move. Keep an evidence file of incidents prevented, systems simplified, and people made more effective." },
      { heading: "Questions worth asking next", body: "What is the next level paid to own? Which cross-team problem could you take on? Is the company willing to price that scope, or is a market move the only available route?" },
    ],
  },
  "startup-equity-esop-reality-india": {
    dek: "Startup equity is not cash compensation. Value depends on the instrument, vesting, exercise cost, liquidity, dilution, and time.",
    sections: [
      { heading: "The signal", body: "An equity grant can align you with a long-term outcome, but the outcome is uncertain and the timeline is usually outside your control. Treat it as a separate risk bucket from fixed salary." },
      { heading: "What the headline leaves out", body: "The percentage alone is not enough. You need the number of shares, the fully diluted denominator, the strike price, vesting schedule, exercise window, and the company's approach to future dilution." },
      { heading: "The decision this changes", body: "Make the decision work without the equity. If the fixed cash is weak, calculate how much optionality you are selling and whether the personal upside is worth the probability-weighted downside." },
      { heading: "Questions worth asking next", body: "What exactly is being granted? When can you exercise? What happens if you leave? Which recent liquidity events or secondary transactions, if any, provide evidence rather than hope?" },
    ],
  },
  "remote-work-salary-trap-india": {
    dek: "Remote work can raise nominal pay while quietly shifting equipment, isolation, time-zone, and location-adjustment costs onto the worker.",
    sections: [
      { heading: "The signal", body: "A remote offer may be benchmarked to a global market, a local market, or a company-wide band. Those are different promises, especially when the employer can change the location policy later." },
      { heading: "What the headline leaves out", body: "The premium can disappear into tax, currency movement, unpaid setup time, internet and workspace costs, or a calendar that stretches across time zones. Flexibility also depends on the manager and team, not only the contract." },
      { heading: "The decision this changes", body: "Compare remote offers using net cash and weekly life cost. Ask whether the company pays for equipment, travel, coworking, and the occasional in-person requirement before treating the headline as a raise." },
      { heading: "Questions worth asking next", body: "Which time zone owns the team? How often is travel expected? Can the location policy change, and would a change trigger a compensation or relocation conversation?" },
    ],
  },
  "salary-transparency-india-2026-number-in-room": {
    dek: "Global pay-transparency rules expose more salary ranges, but Indian offers still need a careful reading of fixed pay, variable pay, level, and location.",
    sections: [
      { heading: "The signal", body: "The OECD’s 2026 review points to faster adoption of pay-gap reporting and pre-employment transparency tools, with the EU directive accelerating the change. That is a global direction, not an Indian salary guarantee." },
      { heading: "What the headline leaves out", body: "A published range can still contain impossible targets, variable pay, or several different jobs under one title. Transparency helps only when scope, level, and conditions are explained with the number." },
      { heading: "The decision this changes", body: "Ask what is fixed, what is conditional, and what the range buys in ordinary life. Separate the role’s value from your previous salary before you negotiate." },
      { heading: "Questions worth asking next", body: "Which level is this role? What distinguishes the top of the band? What happens to pay after joining, and which location, attendance, or review assumptions are built into the offer?" },
    ],
  },
  "ai-job-market-2026-india-show-your-working": {
    dek: "India’s AI market spans model-building, evaluation, domain work, security, and operations. Hiring rewards ownership when tools fail.",
    sections: [
      { heading: "The signal", body: "2026 hiring coverage points to stronger demand for AI-related and AI-supported roles, skills-first hiring, and more opportunity beyond the usual metros. The durable signal is not a tool list; it is evidence of judgement." },
      { heading: "What the headline leaves out", body: "AI expansion is arriving alongside contract and outsourced hiring, workforce redesign, and mismatches between salary, location, and skill expectations. Opportunity does not automatically mean permanence." },
      { heading: "The decision this changes", body: "Build one bounded project that shows the baseline, evaluation, failure cases, human owner, and cost. Then choose roles where you can see the full loop from data to decision." },
      { heading: "Questions worth asking next", body: "What does the system do when it is wrong? Who owns the result? What will a junior person own after 90 days, and is the role permanent, contracted, or still an experiment?" },
    ],
  },
  "humour-in-workplace-culture-2026-joke-is-on-promotion": {
    dek: "Workplace humour can connect people, but power, identity, and psychological safety can turn banter into career risk.",
    sections: [
      { heading: "The signal", body: "New research describes a workplace connection deficit even as AI can reduce burnout. Humour can help people feel recognised, but only when it opens conversation instead of making a target absorb the room’s discomfort." },
      { heading: "What the headline leaves out", body: "Affiliative humour, self-irony, sarcasm, and punching down are not interchangeable. A fun culture claim is weak evidence if people cannot disagree, set a boundary, or stay serious without losing status." },
      { heading: "The decision this changes", body: "Read humour as a culture signal rather than a culture score. Notice who gets to joke, who pays the risk, and whether laughter makes the next decision clearer." },
      { heading: "Questions worth asking next", body: "How does the team handle a joke that lands badly? Can a junior person correct a manager? Does the team have real connection practices beyond forced games and cheerful careers-page copy?" },
    ],
  },
};

/**
 * Explicit staging deks for articles without a complete editorial brief.
 * These are drafts for human review, not approval to publish or index.
 */
export const editorialDeks: Record<string, string> = {
  "junior-data-scientist-reality-india": "A decision guide to test what an entry-level data-science role asks for, what evidence to gather in interviews, and whether the work supports your next step.",
  "home-loan-trap-dream-house-financial-prison": "Test a home loan against monthly cash flow, job uncertainty, and the options you give up before treating an EMI as affordable.",
  "10x-developer-myth-productivity-killing-careers": "Examine productivity claims, team context, and the risks of comparing engineers by output instead of the work their systems make possible.",
  "data-science-bubble-excel-work-reality": "Distinguish a data role’s promise from its day-to-day work, test the value of the role, and choose evidence before committing to a career path.",
  "career-switch-illusion-changing-jobs-not-career": "Decide whether a new employer changes your work, authority, or learning—or only changes the company name on your résumé.",
  "engineering-career-ceiling-peak-at-35": "Assess whether an engineering role still offers learning, influence, and scope, and what evidence to test before considering a career move.",
  "self-learning-trap-online-courses-expensive-entertainment": "Judge whether another course closes a real skill gap, when to build proof instead, and how to avoid treating course completion as progress.",
  "broke-at-30-money-mistakes-nobody-warned": "Review money habits, buffers, and trade-offs that can shape career choices in your thirties without treating one budget as universal.",
  "indian-education-trap-degree-career-mistake": "Compare a degree’s cost, signal, and opportunity trade-offs with your target work, existing experience, and other routes to qualification.",
  "work-life-balance-myth-high-performers": "Test how a high-performance role defines workload, recovery, and availability before deciding whether its trade-offs fit your life.",
  "passion-luxury-not-strategy-india": "Compare interest, income needs, and job options so a career decision does not rest on passion alone or dismiss it entirely.",
  "hr-conversations-what-matters-india": "Prepare clear questions about role scope, evaluation, compensation, and next steps for an HR conversation without assuming one script fits every employer.",
  "culture-fit-trap-hiring-reality": "Translate vague culture-fit language into observable work expectations and fair hiring questions, separating team norms from personal similarity.",
  "job-hopping-stops-working-after-35": "Assess when changing employers adds scope or learning, when continuity matters, and which evidence to check before making another move.",
  "performance-review-reality-ratings-india": "Separate review outcomes from assumptions about performance, prepare evidence of impact, and ask clearer questions about how the process works.",
  "tech-lead-trap-responsibility-authority": "Check whether a tech-lead role includes the authority, time, and support needed for its responsibilities before accepting broader scope.",
  "devops-sre-reality-india-oncall": "Examine on-call expectations, recovery, escalation, and team coverage before assessing whether an SRE or DevOps role fits your constraints.",
  "freelancing-reality-india-freedom-myth": "Compare freelance freedom with employment by examining scope, income gaps, client boundaries, and unpaid work.",
  "networking-reality-india-introverts": "Build professional relationships through specific asks, useful follow-ups, and consistent contact without forcing a performative networking style.",
  "side-hustle-myth-india-reality": "Test a side project against time, energy, income, and employment constraints before letting a second job become a second life.",
  "mba-reality-india-worth-it-2026": "Compare an MBA’s cost, opportunity cost, target roles, and alternatives before deciding whether the program fits your career plan.",
  "american-dream-indian-engineers": "Compare international compensation with taxes, relocation costs, visa limits, family needs, and career options you may leave behind.",
  "why-upskilling-stops-working-career-trap": "Test whether a new skill changes the work you can do, distinguish practice from credentials, and choose a bounded proof project before studying more.",
};

/**
 * The primary query each article is written to answer. Keep this catalogue
 * explicit: it is used by the SEO metadata, article schema, and catalogue QA
 * rather than being inferred from a slug at build time.
 */
export const editorialPrimaryIntents: Record<string, string> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": "portfolio-first hiring in India's gig economy",
  "green-careers-esg-renewable-sustainability-india-2026": "green careers in India",
  "cybersecurity-privacy-careers-beyond-tech-india-2026": "cybersecurity and privacy careers in India",
  "joining-bonus-clawback-offer-letter-traps-2026": "joining bonus clawback in India",
  "staff-engineer-promotion-freeze-india-2026": "staff engineer promotion freeze",
  "gcc-return-to-office-hybrid-reality-india-2026": "GCC return to office in India",
  "relieving-letter-hostage-notice-period-india-2026": "relieving letter during notice period",
  "ai-upskilling-trap-india-api-wrapper-reality": "AI upskilling trap",
  "gcc-gold-rush-india-captive-center-reality": "GCC careers in India",
  "indian-it-layoff-cycle-2026": "India IT layoff cycle 2026",
  "junior-data-scientist-reality-india": "junior data scientist jobs in India",
  "home-loan-trap-dream-house-financial-prison": "home loan affordability in India",
  "ux-salary-myth-design-careers-plateau": "UX designer salary in India",
  "pm-prestige-trap-escape-from-engineering": "product manager career switch from engineering",
  "10x-developer-myth-productivity-killing-careers": "10x developer myth",
  "data-science-bubble-excel-work-reality": "data science career reality",
  "career-switch-illusion-changing-jobs-not-career": "career switch strategy",
  "engineering-career-ceiling-peak-at-35": "engineering career after 35",
  "self-learning-trap-online-courses-expensive-entertainment": "online course career upskilling",
  "broke-at-30-money-mistakes-nobody-warned": "money mistakes in your 30s",
  "indian-education-trap-degree-career-mistake": "degree career mistake in India",
  "work-life-balance-myth-high-performers": "work life balance for high performers",
  "passion-luxury-not-strategy-india": "passion career strategy in India",
  "hr-conversations-what-matters-india": "what to ask HR before accepting a job",
  "culture-fit-trap-hiring-reality": "culture fit interview meaning",
  "job-hopping-stops-working-after-35": "job hopping after 35",
  "performance-review-reality-ratings-india": "performance review ratings in India",
  "tech-lead-trap-responsibility-authority": "tech lead responsibility without authority",
  "devops-sre-reality-india-oncall": "DevOps and SRE careers in India",
  "senior-developer-salary-ceiling-india": "senior developer salary in India",
  "freelancing-reality-india-freedom-myth": "freelancing career reality in India",
  "networking-reality-india-introverts": "networking for introverts in India",
  "layoff-recovery-timeline-india": "layoff recovery timeline in India",
  "manager-vs-ic-career-path-india": "manager vs IC career path",
  "startup-equity-esop-reality-india": "startup equity and ESOP in India",
  "side-hustle-myth-india-reality": "side hustle in India",
  "remote-work-salary-trap-india": "remote work salary in India",
  "mba-reality-india-worth-it-2026": "MBA worth it in India 2026",
  "american-dream-indian-engineers": "US careers for Indian engineers",
  "what-20-lpa-actually-feels-like-india-purchasing-power": "20 LPA take home salary in India",
  "why-upskilling-stops-working-career-trap": "why upskilling stops working",
  "salary-transparency-india-2026-number-in-room": "salary transparency in India 2026",
  "ai-job-market-2026-india-show-your-working": "AI job market 2026 India",
  "humour-in-workplace-culture-2026-joke-is-on-promotion": "humour in workplace culture",
};