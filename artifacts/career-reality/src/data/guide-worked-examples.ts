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
};
