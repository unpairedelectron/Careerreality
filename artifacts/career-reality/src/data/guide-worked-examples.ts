import { ctcWorkedExampleResults } from "../lib/ctc-calculator";
import { calculateSalaryDrop, calculateEscapePlanHours, compareCtcAmounts } from "../lib/application-models";

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const ctc20 = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
if (!ctc20) throw new Error("The 20 LPA CTC tool example is missing.");

const salaryDrop = (current: string, next: string, variable: string, costs: string, months: string) => {
  const result = calculateSalaryDrop({
    currentCtc: current, newCtc: next, variablePayPercent: variable,
    monthlyCostBaseline: costs, bufferMonths: months,
  });
  if (!result.ok) throw new Error(result.error);
  return result.calculation;
};
const plannedHours = (hours: string, weeks: string) => {
  const result = calculateEscapePlanHours(hours, weeks);
  if (!result.ok) throw new Error(result.error);
  return result.totalHours;
};
const comparison = (current: string, offer: string) => {
  const result = compareCtcAmounts(current, offer);
  if (!result.ok) throw new Error(result.error);
  return result;
};
const example20 = ctc20.result;
const runwayScenario = salaryDrop("2000000", "1400000", "15", "90000", "6");
const freelanceTest = plannedHours("4", "8");
const courseTest = plannedHours("5", "8");
const offerCompare = comparison("1200000", "1500000");
const reviewCompare = comparison("1800000", "2000000");
const engineeringPlan = plannedHours("3", "12");
const aiTest = plannedHours("2", "4");
const dataSamplePlan = plannedHours("4", "8");
const cyberPlan = plannedHours("3", "8");
const seniorOpsPlan = plannedHours("4", "12");
const constraintPlan = plannedHours("3", "8");
const productPlan = plannedHours("2", "4");
const culturePlan = plannedHours("2", "8");
const salaryCheck = comparison("1800000", "2100000");
const remoteCompare = comparison("2400000", "2000000");
const layoffScenario = salaryDrop("1800000", "1200000", "15", "70000", "3");
const exitPlan = plannedHours("2", "4");
const negotiationCompare = comparison("1800000", "2100000");
const jobSearchPlan = plannedHours("4", "4");

export const guideWorkedExamples = {
  "read-the-offer-beyond-ctc": {
    directAnswer: `For this ₹20,00,000 CTC package, the calculator estimates ${money(example20.monthlyInHandAtZeroVariable)} per month at zero variable pay, or ${money(example20.monthlyInHandAtTargetAverage)} per month averaged across the year if the full target bonus pays. These are modeled outcomes, not a market average or guaranteed monthly payslip.`,
    caption: "Tax Year 2026–27 model: resident salaried individual below 60, default/new regime, ₹75,000 standard deduction, 12% employee and employer PF on the statutory ceiling (assuming PF employment began 1 April 2026), ₹0 professional tax, no gratuity or other employer costs, no other income, and no extra deductions or exemptions.",
    headers: ["Scenario", "Gross cash/year", "Variable paid/year", "Estimated take-home/year", "Monthly take-home average"],
    rows: [
      ["Full target variable", money(example20.annualGrossAtTarget), money(example20.inputs.annualVariablePay), money(example20.annualTakeHomeAtTarget), money(example20.monthlyInHandAtTargetAverage)],
      ["Zero variable payout", money(example20.annualGrossAtZeroVariable), money(0), money(example20.annualTakeHomeAtZeroVariable), money(example20.monthlyInHandAtZeroVariable)],
    ],
    checks: ["Match fixed and variable amounts to the signed offer and bonus plan.", "Confirm employee and employer PF amounts from payroll; the example does not infer a contribution base.", "Compare the first payslip with these assumptions before using the target scenario in a budget."],
    tool: { label: "Open the CTC calculator", href: "/salary-calculator" },
    comparison: [["Target bonus paid", "Uses full target variable pay; not guaranteed"], ["Zero bonus", "Excludes target variable pay; conservative cash scenario"]],
  },
  "runway-debt-and-big-decisions": {
    caption: "Salary-change scenario from the site's salary-change model: ₹20L to ₹14L CTC, with 15% variable pay, ₹90,000 monthly cost baseline, and a six-month buffer.",
    headers: ["Measure", "Computed value"],
    rows: [["Monthly assumed fixed-cash change", money(runwayScenario.monthlyCashDelta)], ["Annual assumed fixed-cash change", money(runwayScenario.annualCashDelta)], ["Six-month cost buffer", money(runwayScenario.selectedBufferAmount)]],
    checks: ["Replace the example's CTC and variable share with the written offers.", "Separate liquid savings from employer equity and unvested benefits.", "Use actual essential expenses and loan schedules; this is not a recommendation to borrow or resign."],
    tool: { label: "Model a salary change", href: "/salary-drop" },
    comparison: [["Monthly fixed-cash view", "Removes the stated variable-pay share before comparison"], ["Headline CTC", "Does not equal spendable monthly cash"]],
  },
  "independent-work-without-romanticising-it": {
    caption: "A bounded freelance-market test using the site's career-planning time calculator: four hours a week for eight weeks.",
    headers: ["Weekly time budget", "Duration", "Total planned hours"],
    rows: [["4 hours", "8 weeks", `${freelanceTest} hours`]],
    checks: ["Define one small paid deliverable and the customer evidence that would count as demand.", "Write scope, payment milestones, revision limits, and ownership before starting.", "Review after eight weeks; do not treat hours spent as proof of future income."],
    tool: { label: "Build a bounded career plan", href: "/escape-plan" },
  },
  "career-switches-and-education": {
    caption: "A time-budget scenario from the site's career-planning calculator: five hours a week for eight weeks.",
    headers: ["Weekly time budget", "Duration", "Total planned hours"],
    rows: [["5 hours", "8 weeks", `${courseTest} hours`]],
    checks: ["Name the target tasks and ask practitioners what evidence they use to assess entrants.", "Compare the full course cost and time away from paid work with a small work-sample experiment.", "At week eight, review external feedback before committing to a longer program."],
    tool: { label: "Plan a career experiment", href: "/escape-plan" },
    comparison: [["Short experiment", "Eight weeks; produces a work sample and feedback"], ["Long course", "Larger time and money commitment; verify outcomes and terms first"]],
  },
  "getting-hired-through-evidence-and-conversations": {
    caption: "Headline CTC arithmetic from the site's offer-comparison model. It does not estimate take-home pay or validate either offer.",
    headers: ["Current CTC", "Offer CTC", "Annual headline difference"],
    rows: [[money(offerCompare.currentCtc), money(offerCompare.offerCtc), money(offerCompare.annualDifference)]],
    checks: ["Ask for the component-wise offer breakup, payout conditions, and joining date in writing.", "Show a work sample that identifies your contribution and its limits.", "Use the comparison only after confirming the two CTC figures use comparable definitions."],
    tool: { label: "Compare offer amounts", href: "/offer-comparison" },
  },
  "performance-reviews-and-career-choices": {
    caption: "Headline CTC arithmetic from the site's offer-comparison model; no judgement about promotion, scope, or job quality is implied.",
    headers: ["Current CTC", "New offer CTC", "Annual headline difference"],
    rows: [[money(reviewCompare.currentCtc), money(reviewCompare.offerCtc), money(reviewCompare.annualDifference)]],
    checks: ["Ask which specific work outcome would demonstrate readiness for the next scope.", "Record the reviewer’s criteria and the date for reassessment.", "Compare actual authority, manager support, and pay components before treating a title change as equivalent."],
    tool: { label: "Compare offer amounts", href: "/offer-comparison" },
    comparison: [["Review path", "Verify scope, criteria, support, and review date"], ["External offer", "Verify written responsibilities, manager, and component-wise pay"]],
  },
  "engineering-careers-without-the-title-trap": {
    caption: "A 12-week evidence plan computed by the site's career-planning time calculator.",
    headers: ["Weekly time budget", "Duration", "Total planned hours"],
    rows: [["3 hours", "12 weeks", `${engineeringPlan} hours`]],
    checks: ["Choose one system decision to document, including constraints and failure trade-offs.", "Ask the manager which technical decisions the role owns and which need approval.", "Use feedback and demonstrated scope—not the title alone—to assess readiness."],
    tool: { label: "Plan a career experiment", href: "/escape-plan" },
  },
  "ai-at-work-questions-to-ask": {
    caption: "A four-week AI workflow test budget computed by the site's career-planning time calculator.",
    headers: ["Weekly time budget", "Duration", "Total planned hours"],
    rows: [["2 hours", "4 weeks", `${aiTest} hours`]],
    checks: ["Select one real task and record input, review, accuracy, privacy, and who remains accountable.", "Compare the result with the current process using the same quality criteria.", "Treat time spent as an experiment budget, not evidence of job exposure or future demand."],
    tool: { label: "Plan a bounded experiment", href: "/escape-plan" },
  },
  "data-science-career-claims": {
    caption: "A work-sample budget computed by the career-planning calculator; this estimates time, not employability.",
    headers: ["Weekly practice", "Window", "Planned hours"],
    rows: [["4 hours", "8 weeks", `${dataSamplePlan} hours`]],
    checks: ["Use a public or synthetic dataset.", "Record cleaning, assumptions, validation and limitations.", "Ask a practitioner to review the reasoning, not just the chart."],
    tool: { label: "Plan a work-sample experiment", href: "/escape-plan" },
  },
  "cybersecurity-and-green-work": {
    caption: "A bounded research plan computed by the career-planning calculator; it does not forecast job openings.",
    headers: ["Weekly research", "Window", "Planned hours"],
    rows: [["3 hours", "8 weeks", `${cyberPlan} hours`]],
    checks: ["Select a named role and employer.", "Verify required tasks and training from primary materials.", "Keep market-growth claims separate from this personal investigation."],
    tool: { label: "Plan a career experiment", href: "/escape-plan" },
  },
  "layoff-recovery-and-employment-documents": {
    caption: "A salary-change scenario from the site model illustrates a lower-income case; it does not calculate severance or legal entitlement.",
    headers: ["Illustrative input", "Computed result"],
    rows: [["₹18L to ₹12L CTC; 15% variable; ₹70,000 monthly baseline", `Monthly fixed-cash change: ${money(layoffScenario.monthlyCashDelta)}`]],
    checks: ["Reconcile actual final pay against the written terms.", "Keep an income-gap plan separate from amounts still disputed.", "Use the estimator only for the inputs it supports."],
    tool: { label: "Plan a cash runway", href: "/layoff-runway" },
  },
  "notice-period-and-return-to-office": {
    caption: "A four-week preparation budget computed by the career-planning calculator; exit dates and final pay come from the actual contract and employer records.",
    headers: ["Weekly preparation", "Window", "Planned hours"],
    rows: [["2 hours", "4 weeks", `${exitPlan} hours`]],
    checks: ["Save the current written policy and signed terms.", "Ask HR to reconcile dates and documents in writing.", "Enter leave and pay inputs in the estimator only when verified."],
    tool: { label: "Open the notice and leave-pay worksheet", href: "/final-pay-estimator" },
  },
  "cross-border-and-remote-pay": {
    caption: "Same-currency headline comparison from the offer-comparison model; it is not an exchange-rate or cross-border tax calculation.",
    headers: ["Current CTC", "Offer CTC", "Headline difference"],
    rows: [[money(remoteCompare.currentCtc), money(remoteCompare.offerCtc), money(remoteCompare.annualDifference)]],
    checks: ["Standardize currency, period and worker status first.", "Request the employing entity and payroll location in writing.", "Get qualified advice for residency and tax questions."],
    tool: { label: "Compare salary tax regimes", href: "/tax-regime-comparison" },
  },
  "senior-engineering-and-operations-work": {
    caption: "A twelve-week incident-improvement evidence budget computed by the career-planning calculator.",
    headers: ["Weekly review", "Window", "Planned hours"],
    rows: [["4 hours", "12 weeks", `${seniorOpsPlan} hours`]],
    checks: ["Track planned work displaced by interruptions.", "Choose one repeat incident and document its cause and owner.", "Ask whether the role can fund and authorize the proposed fix."],
    tool: { label: "Plan a bounded career experiment", href: "/escape-plan" },
  },
  "skills-passion-and-career-constraints": {
    caption: "A learning experiment budget computed by the career-planning calculator, before any course purchase.",
    headers: ["Weekly time available", "Window", "Planned hours"],
    rows: [["3 hours", "8 weeks", `${constraintPlan} hours`]],
    checks: ["Choose an artifact that fits the available schedule.", "Include care, work and recovery time in the real plan.", "Use feedback to decide whether a larger commitment is justified."],
    tool: { label: "Build a career experiment plan", href: "/escape-plan" },
  },
  "culture-fit-and-product-management": {
    caption: "A short role-investigation budget computed by the career-planning calculator; time spent does not prove team fit.",
    headers: ["Weekly inquiry", "Window", "Planned hours"],
    rows: [["2 hours", "4 weeks", `${productPlan} hours`]],
    checks: ["Ask for a recent prioritization decision.", "Compare manager and peer accounts of decision rights.", "Write down evidence that would change your view."],
    tool: { label: "Plan a career experiment", href: "/escape-plan" },
  },
  "workplace-culture-and-boundaries": {
    caption: "A bounded observation plan computed by the career-planning calculator; it is not a workplace score.",
    headers: ["Weekly observation", "Window", "Planned hours"],
    rows: [["2 hours", "8 weeks", `${culturePlan} hours`]],
    checks: ["Record repeated practices rather than isolated anecdotes.", "Note how workload requests and disagreement are handled.", "Keep personal notes private and factual."],
    tool: { label: "Plan a bounded career experiment", href: "/escape-plan" },
  },
  "how-to-read-salary-and-hiring-claims": {
    caption: "Offer arithmetic from the comparison model; these hypothetical figures are not a market benchmark.",
    headers: ["Current offer", "Other offer", "Headline difference"],
    rows: [[money(salaryCheck.currentCtc), money(salaryCheck.offerCtc), money(salaryCheck.annualDifference)]],
    checks: ["Do not infer market rates from these illustrative offer inputs.", "Record each claim's source, date, sample and definition.", "Use written offer terms for an individual decision."],
    tool: { label: "Compare written offer amounts", href: "/offer-comparison" },
  },
  "notice-period-buyout-india": {
    caption: "Calendar arithmetic for a hypothetical 60-day notice period and a proposed start date 45 days away. Contract terms, employer approval, and any buyout amount are not inferred.",
    headers: ["Written notice", "Proposed start", "Date gap to resolve"],
    rows: [["60 days", "45 days from today", "15 days"]],
    checks: ["Check whether the contract permits notice pay, a waiver, or another arrangement.", "Ask the employer to confirm the last working day and any amount in writing.", "Do not assume a buyout is available or that the employee can choose it unilaterally."],
    tool: { label: "Review notice and final-pay inputs", href: "/final-pay-estimator" },
  },
  "gratuity-four-years-eight-months": {
    caption: "A timeline check only: the stated service is 4 years and 8 months (56 months). This does not determine eligibility, qualifying service, or gratuity payable.",
    headers: ["Stated service", "What the example establishes", "What still needs checking"],
    rows: [["4 years, 8 months", "A timeline to compare with the employment record", "Applicable rule, service dates, wage base, and eligibility"]],
    checks: ["Reconcile joining and exit dates with employer records.", "Check the official rule that applies to this employment and date.", "Do not treat the six-month phrase alone as a final eligibility decision."],
    tool: { label: "Open the limited gratuity worksheet", href: "/gratuity-estimator" },
  },
  "first-24-hours-after-layoff": {
    caption: "A short document-and-question checklist for the first day; it makes no legal or financial entitlement calculation.",
    headers: ["Step", "Example action", "Record to keep"],
    rows: [
      ["1", "Save the notice and signed employment terms you may lawfully retain.", "Original documents and dates"],
      ["2", "Ask for the last working day and final-pay breakdown in writing.", "Written response or unanswered question"],
      ["3", "Separate received amounts from amounts still being reconciled.", "A dated list of confirmed and open items"],
    ],
    checks: ["Protect confidential employer and customer information.", "Avoid signing a release before understanding its terms.", "Use qualified advice for a dispute or an unclear legal position."],
    tool: { label: "Plan a cash runway", href: "/layoff-runway" },
  },
  "severance-notice-leave-after-layoff": {
    caption: "A separation statement split into distinct items so each can be checked against written terms; no entitlement or amount is assumed.",
    headers: ["Item", "Document to compare", "Status in this example"],
    rows: [
      ["Notice pay", "Contract, notice letter, and final settlement", "Confirm the applicable dates and basis"],
      ["Leave balance", "Leave statement and applicable policy or law", "Reconcile days and calculation basis"],
      ["Severance or other payment", "Written offer, policy, and applicable rule", "Do not combine with undisputed pay"],
    ],
    checks: ["Ask for an itemised statement rather than one unexplained total.", "Keep disputed amounts separate from amounts already received.", "Verify the rule and contract that apply to the specific employment."],
    tool: { label: "Review notice and leave-pay inputs", href: "/final-pay-estimator" },
  },
  "pf-withdrawal-after-job-loss": {
    caption: "A records checklist for an EPFO withdrawal question; the example does not decide eligibility or calculate a withdrawal amount.",
    headers: ["Record", "Example check", "Why it matters"],
    rows: [
      ["Employment dates", "Confirm the last working date in the service record.", "The timeline may affect the applicable process."],
      ["Account details", "Check the member account and service history.", "Correct records help identify missing or mismatched entries."],
      ["Current EPFO guidance", "Use the official process and current form instructions.", "Rules and available options can depend on the case."],
    ],
    checks: ["Use official EPFO guidance for the current process.", "Do not share account credentials or authentication codes.", "Check tax treatment and eligibility before acting."],
    tool: { label: "Review official EPF sources", href: "/rules/employee-pf" },
  },
  "form-130-salary-tds-certificate-india": {
    caption: "Illustrative reconciliation of a salary TDS certificate against payslips; the figures are an example, not a tax calculation.",
    headers: ["Line", "Payslips", "Certificate", "What explains a gap"],
    rows: [
      ["Gross salary", "₹18,00,000 (12 regular payslips)", "₹18,60,000", "₹60,000 March bonus on an off-cycle payslip"],
      ["Tax deducted", "Sum of monthly TDS lines", "Total TDS shown", "Compare with the tax credit statement on the portal"],
      ["Regime used", "Declaration given to payroll", "Regime shown for withholding", "Return choice is checked separately"],
    ],
    checks: ["Collect every payslip, including off-cycle bonus or arrears slips.", "Match tax deducted with the tax credit shown against your PAN.", "Ask payroll in writing to correct any line you cannot explain."],
    tool: { label: "Estimate salary and tax cash flow", href: "/salary-calculator" },
  },
  "old-vs-new-tax-regime-salaried-india": {
    caption: "A like-for-like comparison setup for AY 2026–27; enter the same verified income details in the official calculator before comparing its results.",
    headers: ["Input", "Old regime", "New regime"],
    rows: [
      ["Assessment year", "AY 2026–27", "AY 2026–27"],
      ["Income details", "Use the same verified figures", "Use the same verified figures"],
      ["Deductions and exemptions", "Enter only amounts supported by records and rules", "Apply only items allowed under this regime"],
    ],
    checks: ["Compare the official results for the same assessment year.", "Check which deductions the chosen regime permits.", "Do not treat a generic example as a personal tax calculation."],
    tool: { label: "Compare official tax results", href: "/tax-regime-comparison" },
  },
  "offer-letter-red-flags-india": {
    caption: "A document-review example that turns vague or conditional language into questions; it does not determine whether a clause is lawful.",
    headers: ["Offer wording to inspect", "Question to ask", "Evidence to retain"],
    rows: [
      ["Target bonus included in headline CTC", "What conditions govern payment and when?", "Bonus plan and payout terms"],
      ["Employer-side contribution included", "Which components are included in the stated CTC?", "Component-wise compensation breakup"],
      ["Unclear notice or recovery clause", "Which dates, amounts, and exceptions apply?", "Signed offer and referenced policy"],
    ],
    checks: ["Request clarification in writing before accepting.", "Compare the final signed document with the draft.", "Get qualified advice on a disputed or unclear clause."],
    tool: { label: "Compare offer amounts", href: "/offer-comparison" },
  },
  "negotiate-salary-offer-with-numbers": {
    caption: `Hypothetical headline comparison from the offer-comparison model: ₹18L current CTC versus ₹21L offer CTC, a ${money(negotiationCompare.annualDifference)} annual difference. This is not a market benchmark or take-home estimate.`,
    headers: ["Current CTC", "Offer CTC", "Headline difference"],
    rows: [[money(negotiationCompare.currentCtc), money(negotiationCompare.offerCtc), money(negotiationCompare.annualDifference)]],
    checks: ["Compare fixed cash, variable conditions, and employer-side components separately.", "Choose one specific written term to negotiate.", "Use role scope and verifiable evidence; do not present hypothetical figures as market data."],
    tool: { label: "Compare written offer amounts", href: "/offer-comparison" },
  },
  "labour-codes-and-layoffs-india": {
    caption: "A source-check workflow for a layoff-related question; the example does not decide which labour provision applies to an individual.",
    headers: ["Question", "Evidence to collect", "Next verification"],
    rows: [
      ["What event occurred?", "Notice, contract, and dated employer communication", "Match the event to the terms used in the relevant rule."],
      ["Which location and employment details matter?", "Work location, role, dates, and available records", "Check the applicable official source and current date."],
      ["What remains disputed?", "A short list of facts and unresolved amounts", "Ask a qualified adviser about the specific case."],
    ],
    checks: ["Separate legal rules from contract, policy, and employer practice.", "Read the publication date and transition language of official guidance.", "Do not infer an individual entitlement from a general summary."],
    tool: { label: "Review official source links", href: "/sources" },
  },
  "90-day-post-layoff-job-search": {
    caption: `A four-week planning window computed by the career-planning model: four hours per week gives ${jobSearchPlan} planned hours. It is a time budget, not a hiring forecast.`,
    headers: ["Weekly time budget", "Review window", "Planned hours"],
    rows: [["4 hours", "4 weeks", `${jobSearchPlan} hours`]],
    checks: ["Choose one or two role hypotheses based on evidence you can share lawfully.", "Review responses and adjust the search process without treating silence as a measure of personal worth.", "Change the pace to fit finances, care responsibilities, health, and local opportunities."],
    tool: { label: "Plan a bounded career experiment", href: "/escape-plan" },
  },
} as const;

export const guideToolLinks: Record<string, { href: string; label: string }> = {
  "read-the-offer-beyond-ctc": { href: "/salary-calculator", label: "CTC calculator" },
  "runway-debt-and-big-decisions": { href: "/layoff-runway", label: "cash-runway planner" },
  "independent-work-without-romanticising-it": { href: "/escape-plan", label: "career experiment planner" },
  "career-switches-and-education": { href: "/escape-plan", label: "career experiment planner" },
  "getting-hired-through-evidence-and-conversations": { href: "/offer-comparison", label: "offer comparison" },
  "performance-reviews-and-career-choices": { href: "/resign-or-stay", label: "resign-or-stay worksheet" },
  "engineering-careers-without-the-title-trap": { href: "/escape-plan", label: "career experiment planner" },
  "ai-at-work-questions-to-ask": { href: "/ai", label: "AI task prompts" },
  "data-science-career-claims": { href: "/offer-comparison", label: "offer comparison" },
  "cybersecurity-and-green-work": { href: "/offer-comparison", label: "offer comparison" },
  "layoff-recovery-and-employment-documents": { href: "/layoff-runway", label: "cash-runway planner" },
  "notice-period-and-return-to-office": { href: "/final-pay-estimator", label: "notice and leave pay worksheet" },
  "cross-border-and-remote-pay": { href: "/tax-regime-comparison", label: "official tax result comparison" },
  "senior-engineering-and-operations-work": { href: "/resign-or-stay", label: "resign-or-stay worksheet" },
  "skills-passion-and-career-constraints": { href: "/escape-plan", label: "career experiment planner" },
  "culture-fit-and-product-management": { href: "/resign-or-stay", label: "resign-or-stay worksheet" },
  "workplace-culture-and-boundaries": { href: "/resign-or-stay", label: "resign-or-stay worksheet" },
  "how-to-read-salary-and-hiring-claims": { href: "/offer-comparison", label: "offer comparison" },
  "notice-period-buyout-india": { href: "/final-pay-estimator", label: "notice and final-pay worksheet" },
  "gratuity-four-years-eight-months": { href: "/gratuity-estimator", label: "gratuity worksheet" },
  "first-24-hours-after-layoff": { href: "/layoff-runway", label: "cash-runway planner" },
  "severance-notice-leave-after-layoff": { href: "/final-pay-estimator", label: "notice and leave-pay worksheet" },
  "pf-withdrawal-after-job-loss": { href: "/rules/employee-pf", label: "official EPF guidance" },
  "form-130-salary-tds-certificate-india": { href: "/salary-calculator", label: "salary and tax estimator" },
  "old-vs-new-tax-regime-salaried-india": { href: "/tax-regime-comparison", label: "tax-regime comparison" },
  "offer-letter-red-flags-india": { href: "/offer-comparison", label: "offer comparison" },
  "negotiate-salary-offer-with-numbers": { href: "/offer-comparison", label: "offer comparison" },
  "labour-codes-and-layoffs-india": { href: "/sources", label: "official source register" },
  "90-day-post-layoff-job-search": { href: "/escape-plan", label: "career experiment planner" },
};
