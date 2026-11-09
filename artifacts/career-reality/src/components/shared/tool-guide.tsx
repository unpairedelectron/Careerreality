import { ArrowUpRight } from "lucide-react";
import { Link, withTrailingSlash } from "@/components/shared/app-link";
import { trackNextAction } from "@/lib/analytics";
import { compareCtcOffers, ctcWorkedExampleResults } from "@/lib/ctc-calculator";

export type ToolGuide = {
  eyebrow: string;
  heading: string;
  summary: string;
  steps: string[];
  checks: string[];
  limitation: string;
  related: Array<{ label: string; href: string; catalogSlug: string }>;
  example?: string;
  sources?: Array<{ label: string; href: string }>;
};

const guide = (
  eyebrow: string,
  heading: string,
  summary: string,
  steps: string[],
  checks: string[],
  limitation: string,
  related: ToolGuide["related"],
): ToolGuide => ({ eyebrow, heading, summary, steps, checks, limitation, related });

export const toolGuides: Record<string, ToolGuide> = {
  "/offer-comparison": {
    eyebrow: "Method / compare written compensation",
    heading: "Compare monthly cash before counting the headline",
    summary: "This worksheet answers a narrow question: how do two written salary packages compare when fixed cash, target variable, employee PF, professional tax, employer costs, and transition expenses are shown separately? It runs both packages through the same CTC-to-in-hand model used by the salary calculator. It is not a company ranking, a job recommendation, or a promise that variable pay will be paid.",
    steps: [
      "Copy each annual CTC and fixed-pay amount from the written offer; enter target variable separately.",
      "Choose the PF basis shown by payroll, or enter the employee PF values from a current payslip and offer.",
      "Keep zero-variable take-home beside the full-target average. Do not treat target pay as guaranteed.",
      "Enter only documented bonus clawback and notice costs, then add your planned relocation and 12-month commute costs.",
    ],
    checks: [
      "Is variable pay guaranteed, target-based, or discretionary, and when can it be withheld?",
      "Does each CTC include employer PF, gratuity, insurance, or another non-cash employer cost?",
      "Does the written joining-bonus clause specify a repayment period, trigger, or gross/net amount?",
      "Are the notice, relocation, and commute figures one-time or recurring, and are they already taxed or reimbursed?",
    ],
     limitation: "The shared salary model estimates salary-only tax under the selected 2026–27 period: Tax Year 2026–27 under the Income-tax Act, 2025, or Assessment Year 2026–27 for income earned in FY 2025–26 under the Income-tax Act, 1961. It is for a resident individual below age 60 and does not model the old regime, other income, all exemptions, employer-specific payroll rules, benefit value, foreign payroll, or whether an entered cost is deductible or reimbursed. Use the signed offer and payslip; confirm individual tax treatment with a qualified adviser.",
    related: [
      { label: "Read the CTC offer guide", href: "/guides/read-the-offer-beyond-ctc", catalogSlug: "read-the-offer-beyond-ctc" },
      { label: "Review EPF wage rules", href: "/rules/employee-pf", catalogSlug: "employee-pf" },
      { label: "Review AY 2026–27 tax rules", href: "/rules/income-tax-new-regime", catalogSlug: "income-tax-new-regime" },
      { label: "Check employer risk before accepting", href: "/companies", catalogSlug: "employer-due-diligence" },
    ],
    example: (() => {
      const current = ctcWorkedExampleResults.find((item) => item.id === "20lpa");
      const offer = ctcWorkedExampleResults.find((item) => item.id === "40lpa");
      if (!current || !offer) return "";
      const result = compareCtcOffers({
        current: current.inputs,
        offer: offer.inputs,
        joiningBonusClawback: 25_000,
        noticePeriodCost: 10_000,
        relocationCost: 15_000,
        additionalAnnualCommuteCost: 60_000,
      });
      const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
      return `Illustrative built-in inputs, not observed salary data: current ${current.label}; new offer ${offer.label}; ₹25,000 clawback, ₹10,000 notice cost, ₹15,000 relocation and ₹60,000 additional commute for 12 months. The shared model returns monthly take-home of ${inr(result.current.monthlyInHandAtZeroVariable)} vs ${inr(result.offer.monthlyInHandAtZeroVariable)} at zero variable, and ${inr(result.current.monthlyInHandAtTargetAverage)} vs ${inr(result.offer.monthlyInHandAtTargetAverage)} at full target. After ₹110,000 entered first-year costs, the new offer’s zero-variable first-year cash estimate is ${inr(result.offerFirstYearAtZeroVariable)}.`;
    })(),
    sources: [
      { label: "Income Tax Department: official portal and tax calculator", href: "https://www.incometax.gov.in/iec/foportal/" },
      { label: "EPFO: wage-ceiling FAQs (official PDF)", href: "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" },
    ],
  },
  "/salary-calculator": guide(
    "Decision guide / offer math",
    "Use the CTC decoder before you negotiate",
     "A CTC headline combines different kinds of money. Separate fixed cash, variable pay, deductions, and one-time items before comparing offers or deciding what monthly life the role can support. Worked example: ₹20L CTC with 10% variable means ₹17.84L fixed, ₹1.8L variable at risk, ₹8.92L assumed basic, and manually entered ₹36,000 annual employee and employer PF at target.",
    ["Enter annual CTC exactly as it appears in the offer letter.", "Separate guaranteed fixed pay from variable, bonus, equity, and reimbursements.", "Compare estimated monthly cash with your current baseline and recurring expenses.", "Take unresolved items back to HR as written questions, not assumptions."],
    ["Is variable pay guaranteed, target-based, or discretionary?", "Does the offer include a joining bonus or clawback?", "Are employer PF, gratuity, insurance, and ESOPs being counted as cash?", "If using manual PF, are the PF and professional-tax amounts from the offer or payslip?"],
    "This is a planning estimate under the new regime, not a payroll statement or tax filing. PF uses your selected basis or manual amounts; professional tax is entered manually. Confirm the offer structure, exemptions, other income, and employer policy with payroll or a qualified tax professional.",
    [{ label: "Read the calculator method", href: "/methodology", catalogSlug: "methodology" }, { label: "Review official sources", href: "/sources", catalogSlug: "sources" }],
  ),
  "/resign-or-stay": guide(
    "Decision guide / timing",
    "Turn resignation anxiety into a risk checklist",
    "Resigning is a timing decision, not just a mood. Use runway, notice period, offer confidence, and contractual friction to identify what needs to be secured before you make the move.",
    ["Estimate how many months of essential expenses liquid savings can cover.", "Check the real notice period, buyout language, joining date, and document handover.", "Score the next offer on written certainty rather than verbal enthusiasm.", "Choose one risk-reducing action before setting a resignation date."],
    ["Can runway cover the full notice period and a slower search?", "Is the next role's location, pay mix, and start date written down?", "What happens if the offer is delayed or withdrawn?", "Which document or conversation would reduce the most uncertainty?"],
    "The result cannot predict a manager, market, health, family, or employer decision. It is a structured planning aid and should not replace legal or financial advice.",
    [{ label: "Decode the next offer", href: "/salary-calculator", catalogSlug: "ctc-calculator" }, { label: "Build an escape plan", href: "/escape-plan", catalogSlug: "escape-plan" }, { label: "Use the Compass", href: "/compass", catalogSlug: "compass" }],
  ),
  "/layoff-runway": guide(
    "Decision tool / cash planning",
    "Measure runway from funds you can actually use",
    "Runway is available liquid funds divided by monthly net cash outflow. For example, ₹3,60,000 available and ₹40,000 of monthly costs after continuing income gives 9 months of arithmetic runway. This is a fixed-burn illustration, not a job-search forecast.",
    ["Count savings you can access now; include severance only when confirmed in writing.", "Add essential recurring costs and debt payments, then subtract other income that is expected to continue.", "Review the month-by-month closing balance and note when it reaches zero.", "Recalculate when income, costs, or payment timing changes; keep one-off expenses separate."],
    ["Are the funds liquid and available after tax or withdrawal restrictions?", "Are debt instalments already included in essential costs, or should they be added separately?", "When will severance and other income actually arrive?", "Which likely one-off costs are missing from the monthly baseline?"],
    "The projection assumes the same net monthly outflow throughout. It excludes inflation, emergencies, investment losses, taxes on severance, benefit changes, and future job income. It cannot estimate how long a search will take.",
    [{ label: "Review resignation timing", href: "/resign-or-stay", catalogSlug: "resign-or-stay" }, { label: "Plan a reversible career step", href: "/escape-plan", catalogSlug: "escape-plan" }],
  ),
  "/salary-drop": guide(
    "Decision guide / trade-offs",
    "Price a salary cut before you call it a career move",
    "A lower offer may buy better scope, health, location, or long-term optionality. Make the cash trade-off explicit by calculating monthly impact, runway, expenses, and what the move is supposed to improve.",
    ["Compare fixed cash, not just headline CTC, across current and new roles.", "Calculate monthly and six-month impact after recurring expenses.", "Write the non-cash benefit in a form you can review later.", "Set a checkpoint for testing whether the trade-off delivered what it promised."],
    ["How much monthly cash disappears after tax and deductions?", "How many months of runway remain after the move?", "Which benefit is concrete, and which is only a promise?", "What would make you reverse or revisit the decision?"],
    "The model does not price health, family obligations, learning, or happiness precisely. It makes cash impact visible so you can discuss the rest honestly.",
    [{ label: "Decode monthly cash", href: "/salary-calculator", catalogSlug: "ctc-calculator" }, { label: "Plan the next move", href: "/escape-plan", catalogSlug: "escape-plan" }],
  ),
  "/escape-plan": guide(
    "Decision guide / next move",
    "Turn a stuck feeling into a sequence you can test",
    "An escape plan should lower uncertainty and build proof before it asks you to make an irreversible move. Use a weekly pace that fits your actual time, energy, and responsibilities. Worked example: a five-action checklist across eight weeks averages about one action per week; the weekly-hours field records your time budget, not a promise that the timeline is realistic.",
    ["Choose the outcome you want to test, not a vague identity change.", "Break it into visible proof: conversations, applications, portfolio work, or market checks.", "Set a weekly action pace small enough to repeat.", "Review evidence every few weeks and change the plan, not your self-worth."],
    ["What can you complete in the next seven days?", "Which action creates evidence rather than only consuming information?", "Who can give you a specific response or introduction?", "What is the smallest reversible experiment?"],
    "The plan is a pacing tool, not a promise of a new job. Your market, constraints, health, and response rate will change the timeline.",
    [{ label: "Check resignation timing", href: "/resign-or-stay", catalogSlug: "resign-or-stay" }, { label: "Use the Compass", href: "/compass", catalogSlug: "compass" }],
  ),
  "/career-reality-index": guide(
    "Decision guide / methodology",
    "Use the Index to find the decision you are avoiding",
    "The Career Reality Index asks how satisfied you are with pay, company confidence, ability to move, and AI readiness, then uses the response pattern to select a conditional diagnosis. The responses are not added or weighted into a score. Mixed or neutral answers prompt evidence gathering, not an exit prediction.",
    ["Choose Not satisfied, Somewhat satisfied, Neutral, Satisfied, or Super satisfied from current evidence.", "Read the uncomfortable truth and the evidence behind it.", "Choose the highest-leverage change instead of reacting to the loudest feeling.", "Save the diagnosis, then update it when one of your responses meaningfully changes."],
    ["What is the most important risk or opportunity in this profile?", "Which input is weakest or least evidenced?", "What fact would change the diagnosis?", "Which next step is reversible and useful this week?"],
    "The Index is illustrative and directional. It cannot know private company plans, manager decisions, personal wellbeing, or whether a change will make you happier.",
    [{ label: "Decode the offer", href: "/salary-calculator", catalogSlug: "ctc-calculator" }, { label: "Start with Compass", href: "/compass", catalogSlug: "compass" }],
  ),
  "/ai": guide(
    "Decision guide / future of work",
    "Translate AI headlines into role-level questions",
    "AI changes tasks before it changes job titles. The useful question is which parts of your work become cheaper, which become more valuable, and what evidence shows you can own the difference.",
    ["Choose the role and identify the task mix actually changing.", "Separate first-pass automation from review, judgement, context, and accountability.", "Move development effort toward decisions and outcomes, not tool collecting.", "Create one work sample that makes the durable part of your contribution visible."],
    ["Which recurring tasks are becoming easier or faster?", "Who reviews the output and owns the consequence?", "What domain context cannot be delegated to a generic tool?", "Can your portfolio show judgement, constraints, and outcomes?"],
    "Role exposure is an illustrative signal, not a forecast of employment. Adoption differs by company, manager, regulation, customer, and task quality.",
    [{ label: "Build an escape plan", href: "/escape-plan", catalogSlug: "escape-plan" }, { label: "Use the Index", href: "/career-reality-index", catalogSlug: "career-reality-index" }],
  ),
};

export function ToolGuideSection({ guide }: { guide: ToolGuide }) {
  const related = guide.related;
  return (
    <section className="mt-10 rounded-[22px] border border-border bg-card p-6 sm:p-8" aria-labelledby="tool-guide-heading">
      <p className="font-data text-[9px] uppercase tracking-[.18em] text-primary">{guide.eyebrow}</p>
      <h2 id="tool-guide-heading" className="mt-3 max-w-[720px] font-display text-4xl leading-[.98] tracking-[-.04em]">{guide.heading}</h2>
      <p className="mt-4 max-w-[760px] text-[12px] leading-[1.75] text-muted-foreground">{guide.summary}</p>
      {guide.example && <p className="mt-4 max-w-[820px] rounded-xl border border-border bg-secondary/35 p-4 text-[12px] leading-[1.75]">{guide.example}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-data text-[10px] uppercase tracking-[.14em] text-primary">Suggested workflow</h3>
          <ol className="mt-4 grid gap-3">
            {guide.steps.map((step, index) => <li key={step} className="flex gap-3 text-[12px] leading-[1.65]"><span className="font-data text-primary">0{index + 1}</span><span>{step}</span></li>)}
          </ol>
        </div>
        <div>
          <h3 className="font-data text-[10px] uppercase tracking-[.14em] text-primary">Questions that improve the read</h3>
          <ul className="mt-4 grid gap-3">
            {guide.checks.map((check) => <li key={check} className="border-b border-border/70 pb-3 text-[12px] leading-[1.6] text-muted-foreground last:border-0">{check}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-7 grid gap-5 border-t border-border pt-6 lg:grid-cols-[1fr_.9fr]">
         <div><h3 className="text-[11px] font-bold">What this tool cannot know</h3><p className="mt-2 text-[11px] leading-[1.7] text-muted-foreground">{guide.limitation}</p></div>
         {related.length > 0 && <div><h3 className="text-[11px] font-bold">Related decision paths</h3><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{related.map((link) => <Link key={link.href} href={link.href} onClick={() => trackNextAction(link.catalogSlug)} className="text-[11px] font-bold text-primary hover:underline">{link.label} <ArrowUpRight size={12} className="inline" /></Link>)}</div></div>}
      </div>
      {guide.sources && <div className="mt-7 border-t border-border pt-6"><h3 className="text-[11px] font-bold">Official sources to check</h3><ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{guide.sources.map((source) => <li key={source.href}><a href={withTrailingSlash(source.href)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-primary underline underline-offset-4">{source.label} <ArrowUpRight size={12} className="inline" /></a></li>)}</ul></div>}
    </section>
  );
}