import fs from "node:fs";
import path from "node:path";
import { archivedArticleRecords, articles } from "../src/data/content.ts";
import { ARTICLE_TITLE_SUFFIX } from "../src/data/editorial-metadata.ts";
import { isArticlePublishable } from "../src/data/editorial-readiness.ts";
import { formatSeoTitle } from "../src/data/seo-title.ts";
import { guideWorkedExamples, guideToolLinks } from "../src/data/guide-worked-examples.ts";
import { rulesLibraryContent } from "../src/data/rules-library-content.ts";
import { ctcWorkedExampleResults } from "../src/lib/ctc-calculator.ts";
import {
  createCareerRealityIndexReflection,
  escapePlanGoals,
  getEscapePlanTasks,
} from "../src/lib/application-models.ts";
import { calculateCareerTool } from "../../../lib/career-tools/src/index.ts";
import { getSiteUrl } from "./seo-site-url.mjs";
import { assertPublicRouteDescription } from "../src/data/seo-description-policy.ts";
import { createSiteOrganization } from "../src/data/seo-organization.ts";
import { publicSiteMap, sitemapSections } from "../src/data/site-map.ts";
import {
  audiences,
  employerTypeGuide,
  faqItems as companyFaqItems,
  questionBank,
  verificationSources,
  verificationSteps,
  workedExample,
} from "../src/lib/company-verification-model.ts";

const root = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(root, "dist", "public");
const indexPath = path.join(distRoot, "index.html");
type RegistryRoute = {
  path: string;
  component: string;
  kind: string;
  title: string;
  description: string;
  render: "snapshot" | "app-shell";
  indexability: "indexable" | "noindex";
  sitemap: boolean;
  toolId?: string;
  guideSlug?: string;
};

const routeRegistry = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"),
) as { routes: RegistryRoute[]; redirects: Array<{ from: string; to: string; status: number }> };
const generatedGuideData = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/generated-pillar-guides.json"), "utf8"),
) as {
  guides: Array<{
    slug: string;
    path: string;
    title: string;
    description: string;
    datePublished: string | null;
    dateModified: string | null;
    lead: string;
    editorialFrame: string;
    sections: Array<{
      heading: string;
      content: string;
      sourceNotes: string[];
      sourceLinks: Array<{ url: string; label: string; year?: string }>;
    }>;
    nextSteps: string[];
    faqs?: Array<{ question: string; answer: string }>;
    relatedLinks?: Array<{ url: string; label: string }>;
    sources: Array<{ url: string; label: string; year?: string }>;
    sourceDisclosure: string;
    wordCount: number;
  }>;
};
const layoffEvents = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/layoff-events.json"), "utf8"),
) as Array<{
  slug: string;
  company: string;
  date: string;
  scale: string;
  status: "Confirmed" | "Reported" | "Rumour";
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  updatedAt: string;
  geography: string;
}>;
const rulesLibraryData = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/rules-library.json"), "utf8"),
) as {
  pages: Array<{
    path: string;
    title: string;
    description: string;
    intro: string;
    rows: string[][];
    change: string;
    plainLanguage: string;
    sources: Array<{ label: string; url: string }>;
    verified: string;
    related: Array<{ label: string; url: string }>;
  }>;
};
const interviewRoleData = [
  { slug: "data-engineer", title: "Data Engineer" },
  { slug: "data-scientist", title: "Data Scientist" },
  { slug: "ai-ml-engineer", title: "AI/ML Engineer" },
  { slug: "gen-ai-engineer", title: "Generative AI Engineer" },
  { slug: "agentic-ai-engineer", title: "Agentic AI Engineer" },
].map((role) => {
  const bankRoot = path.resolve(root, "../../content/questions", role.slug);
  return {
    ...role,
    items: JSON.parse(fs.readFileSync(path.join(bankRoot, "items.json"), "utf8")) as Array<{
      id: string;
      topic: string;
      subtopic: string;
      question: string;
      what_is_assessed: string;
    }>,
  };
});
const siteUrl = getSiteUrl();
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
routeRegistry.routes.forEach(assertPublicRouteDescription);

if (!fs.existsSync(indexPath)) {
  throw new Error(`Built index not found at ${indexPath}`);
}

const builtIndex = fs.readFileSync(indexPath, "utf8");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function publicPath(route: string): string {
  const normalizedRoute = route === "/" ? "/" : `${route.replace(/\/+$/, "")}/`;
  return `${basePath}${normalizedRoute}`;
}

type StaticRouteMeta = {
  title: string;
  description: string;
  eyebrow: string;
  heading?: string;
  seoTitle?: string;
  noIndex?: boolean;
};

const routeToMeta = (route: RegistryRoute): StaticRouteMeta => ({
  title: route.title,
  description: route.description,
  heading: route.path === "/layoffs"
    ? "When work changes, steady the ground."
    : route.path === "/companies"
      ? "Check the employer behind the offer."
      : undefined,
  eyebrow: route.path === "/"
    ? "Career intelligence for India"
    : route.kind === "interview-guide"
      ? "Interview study guide / source-cited practice"
    : route.kind === "tool"
      ? "Decision tool / evidence first"
      : route.kind === "guide"
        ? "CareerReality Editorial / sourced guide"
        : `${route.kind} / CareerReality`,
  noIndex: route.indexability === "noindex",
});

const staticRouteMeta = Object.fromEntries(
  routeRegistry.routes
    .filter((route) => route.render === "snapshot")
    .map((route) => [route.path, routeToMeta(route)]),
) as Record<string, StaticRouteMeta>;
const homepageMeta: StaticRouteMeta = {
  ...staticRouteMeta["/"],
  heading: "Make your next move make sense.",
};
if (!homepageMeta.title || !homepageMeta.description) {
  throw new Error("The route registry must define the homepage title and description.");
}

const staticToolFaqs: Record<string, Array<{ question: string; answer: string }>> = {
  "/job-posting-reality-check": [
    { question: "How does the match score work?", answer: "It compares extracted mandatory and preferred requirements with evidence in your supplied resume wording. Mandatory items count twice; preferred items count once. This rule-based text review is not a validated hiring benchmark or a measure of hiring odds." },
    { question: "Does it send or save pasted text?", answer: "No. Analysis runs in the browser tab. The text is not sent to a model or saved by this tool; closing or refreshing the page clears it." },
    { question: "Does missing resume text prove a skill gap?", answer: "No. “Not documented” means only that the supplied text did not show matching evidence. A confirmed gap must be marked by the user." },
  ],
  "/salary-calculator": [
    { question: "Is CTC the same as monthly salary?", answer: "No. This estimate separates fixed cash and target variable pay from employer PF, gratuity, and other costs that you enter from the offer. A positive CTC remainder is shown as unallocated, not treated as salary." },
    { question: "How does the calculator estimate tax for 2026–27?", answer: "It models ordinary salary for a resident individual under age 60 using the new regime under Section 202 of the Income-tax Act, 2025. It applies the standard deduction, Section 156 rebate and marginal relief, applicable surcharge, and 4% cess. Professional tax reduces cash but is not deducted from taxable income in this estimate. This CTC view uses the new regime; a separate comparison page estimates old-regime tax for salary-only cases." },
    { question: "How is PF calculated?", answer: "Choose manual payroll amounts, or enter a PF start date to estimate 12% on the applicable monthly wage base. In Tax Year 2026–27 the statutory ceiling is ₹15,000 through 16 September and ₹25,000 from 17 September; September is split into the official 16/14-day periods. The employer share is estimated at 8.33% EPS and the balance EPF in calculated modes. Confirm membership and payroll treatment; employer PF counts toward CTC only when marked included." },
    { question: "Does the calculator know my state professional tax?", answer: "No. Select a state or union territory for context, then enter the annual amount from your payslip or offer. The calculator does not infer a state schedule." },
    { question: "Is target variable pay guaranteed?", answer: "No. The zero-variable result excludes it. The target-variable result is an annual average only if the full target is paid; actual payout depends on your written offer and employer plan." },
  ],
  "/offer-comparison": [
    { question: "What does the comparison treat as current cash?", answer: "Enter fixed annual pay and target variable pay separately for both packages. The model runs each side through the shared CTC calculation, so the fixed-pay-only outcome is not confused with a full-target outcome. Target variable pay is conditional, not guaranteed. Review the plan document for company, individual, and business performance conditions, eligibility dates, proration, payout timing, and whether the amount is a target or a maximum. If the offer gives a range rather than a definite value, run more than one scenario rather than treating the highest figure as certain." },
    { question: "How does it estimate provident-fund deductions?", answer: "Select manual payroll amounts when the offer or payslip already specifies employee and employer contributions. The two calculated choices apply 12% to either the ₹25,000 monthly ceiling or the full basic-pay amount entered as a percentage of fixed pay. Calculated employer contributions are split between EPS and EPF using the proportions shown in the dated Ministry source. Confirm that your employment and pay components fall within the rules before relying on the estimate. An employer contribution is subtracted from CTC only when you mark that it is included in the stated package." },
    { question: "What do zero-variable and full-target views mean?", answer: "Zero-variable cash uses fixed pay and excludes the target bonus. Full-target cash assumes the full target amount is paid and presents the annual result as an average monthly equivalent. Neither result predicts the actual payment date or amount. A target can be reduced by partial-year eligibility, company results, individual performance, deferrals, or plan rules. Compare the written plan and ask whether target compensation has historically been paid for the role, while remembering that historical payout is not a promise for your own year." },
    { question: "How are first-year move costs represented?", answer: "The worksheet subtracts only amounts you enter for joining-bonus clawback, notice-period cost, relocation, and additional annual commute. It keeps one-time costs separate from the recurring commute amount and shows their impact on first-year offer cash. Do not enter a cost twice if it already appears as a deduction in the salary inputs. Confirm the trigger, repayment period, tax treatment, and whether the amount is gross or net in the signed documents. The comparison does not decide whether a clause is enforceable or what an employer will collect." },
    { question: "What should I verify before choosing between offers?", answer: "Match each input to the same period and currency. Check whether fixed pay includes allowances, whether employer PF and gratuity sit inside CTC, and whether variable pay is stated at target or maximum. Confirm title, responsibilities, reporting line, location, joining date, notice requirements, probation, benefits, equity, and recovery terms in writing. Then compare the outputs alongside personal cash needs and non-financial constraints. This tool does not rank employers, assess workplace quality, estimate job security, or recommend accepting an offer; it makes the entered pay components easier to inspect." },
  ],
  "/tax-regime-comparison": [
    { question: "Which assessment year does this comparison use?", answer: "The comparison is labeled AY 2026–27 and uses the salary-only slabs for a resident individual below age 60. Do not confuse the assessment year with a financial year label when entering information or checking a return. Rules may change, and individual cases can depend on residence, age, income type, deductions, and elections. The result is a planning estimate, not a filed-return computation. Check the official Income Tax Department schedule and calculator for the relevant assessment year before changing payroll withholding or submitting a return." },
    { question: "How are deductions entered on the old-regime side?", answer: "The worksheet separates Section 80C, Section 80D, additional NPS under Section 80CCD(1B), a basic HRA exemption estimate, and other eligible deductions. The displayed caps are arithmetic limits for the modeled case, not confirmation that a particular payment qualifies. Keep receipts and statements, check who paid the premium or contribution, and verify that the amount is permitted under the regime and tax year. Do not repeat the standard deduction or an item already entered in another field. The tool does not determine eligibility, age-specific limits, or every deduction condition." },
    { question: "What is included in the HRA estimate?", answer: "The simplified HRA estimate uses annual basic salary, HRA received, rent paid, and the metro or non-metro selection. It takes the lowest of HRA received, rent less ten percent of basic, and the selected percentage of basic, with negative results set to zero. This is a screening calculation, not a complete exemption ruling. Verify city classification and eligible salary components for the applicable year, and retain rental evidence and landlord details where required. Special cases, changes during the year, and employer payroll treatment can change the result." },
    { question: "How does the tool compare the two tax totals?", answer: "The old-regime side applies its salary standard deduction, the entered eligible deduction total, the selected slabs, rebate rules, surcharge, marginal relief, and cess. The new-regime total comes from the same salary-tax engine used elsewhere in the product. The displayed difference is an absolute rupee amount and the lower-tax label compares those estimates; it does not account for non-tax costs, other income, special-rate gains, or personal circumstances. The break-even field estimates the extra old-regime deduction needed for its tax to reach the new-regime estimate under this model." },
    { question: "What should I do if my situation is outside the assumptions?", answer: "Do not use the result as a final tax figure if you have income beyond ordinary salary, special-rate income, business income, non-resident status, age-based variations, unusual exemptions, or complex employer benefits. The model also does not reproduce every return schedule or payroll rounding convention. Open the official links, compare with the current calculator for your facts, and consult a qualified tax professional when the result affects a filing or a material decision. The most useful next step is to list the missing income or deduction items rather than forcing them into a field with a different meaning." },
  ],
  "/gratuity-estimator": [
    { question: "What wage amount should I enter?", answer: "Enter the monthly wage base that you have checked against the applicable statutory definition and your employment records. Do not assume that take-home pay, total CTC, or every allowance automatically equals the wage amount used for gratuity. The labour-code FAQ and the Code on Social Security provide the source context, but this worksheet does not reconstruct every wage component or decide how a specific allowance is treated. If your payslip uses several salary components or has changed over time, check the governing rule and ask payroll for its calculation basis before relying on the estimate." },
    { question: "How does the general service threshold work here?", answer: "For the ordinary category, the worksheet marks the five-year threshold only after the entered service reaches sixty months. The arithmetic uses fifteen days of the entered monthly wage base for each formula year, divided by twenty-six. In this simplified ordinary case, a remaining service fraction greater than six months is rounded up to the next year; a fraction of six months or less is not. That formula is an estimate of the stated inputs, not a finding that a particular termination qualifies or that the entered service dates are correct." },
    { question: "How are fixed-term, death, and disablement cases represented?", answer: "The Ministry FAQ identifies a one-year threshold and pro-rata gratuity for fixed-term contract expiry, and pro-rata calculation for deceased employees. Both use exact entered months here; death and disablement waive the ordinary five-year threshold. Disablement uses the ordinary completed-year rule, which counts a service fraction only when it exceeds six months. Confirm the employment category, event, and service continuity because the worksheet does not decide entitlement." },
    { question: "What does the maximum amount mean?", answer: "The cited Ministry FAQ states a ₹20 lakh maximum as current at the date of that source. The worksheet applies that ceiling to the formula output so a high estimate is not displayed as payable above the stated cap. A source date matters: later legislation, notifications, or amendments could change the applicable limit. The ceiling is not a promised payment, a minimum, or a substitute for eligibility analysis. Compare the date of the source with the employment end date and verify current rules with the responsible authority or a qualified adviser." },
    { question: "Which cases are not fully represented?", answer: "The calculator is a monthly-rate illustration. It does not model seasonal or piece-rated wage methods, disputed service periods, forfeiture, multiple employers, nominee distribution after death, detailed wage reconstruction, or every exception and transitional issue. It also does not calculate interest, tax, payroll adjustments, or a final settlement. Use the result to identify what information is missing, then compare the inputs with appointment records, payslips, service records, and the employer's written calculation. For an actual claim, confirm the applicable law and facts rather than treating a rounded estimate as a final entitlement." },
  ],
  "/final-pay-estimator": [
    { question: "How is the daily amount calculated?", answer: "The worksheet divides the monthly cash amount you enter by the monthly-days divisor you choose. It then multiplies that daily amount separately by notice days and unused leave days. Enter the same salary basis that your contract or employer's calculation uses, and record the divisor explicitly rather than assuming every employer uses the same convention. This is simple arithmetic, not a statutory conclusion about the correct salary components or divisor. The result stays gross; tax, deductions, recoveries, and other final-settlement lines are not included." },
    { question: "Does the notice amount tell me whether notice pay is owed?", answer: "No. The calculation shows the product of your entered daily amount and notice days; it does not determine whether you must serve notice, whether an employer may waive it, or whether a payment is due in either direction. Read the employment agreement, amendments, resignation acknowledgement, and applicable policy. Verify whether notice is counted in calendar days or working days and whether payment is based on basic pay, gross salary, or another defined wage. If terms conflict or a deduction is disputed, seek an authoritative written explanation before treating this estimate as a settlement figure." },
    { question: "How should I enter unused leave?", answer: "Use the number of leave days that your current leave balance and employer policy support. Confirm which leave category can be carried forward or encashed, the cutoff date for the balance, and whether the employer uses a different salary base or divisor from the notice calculation. The worksheet deliberately applies the selected divisor to both items for consistent arithmetic, but actual policies can differ. It does not decide whether a category is encashable, whether a balance has expired, or how a partial day is rounded. Keep the leave statement and final settlement document for reconciliation." },
    { question: "What is included in the combined total?", answer: "The combined gross arithmetic total is notice amount plus leave amount only. It is not the complete final paycheck and should not be compared directly with a bank credit without accounting for salary through the last working date, tax withholding, statutory deductions, reimbursements, incentives, advances, loans, or documented recoveries. Some amounts may be payable to the employee while other notice amounts may be obligations; direction depends on the contract and facts. Use separate lines in your own reconciliation so an offset does not hide which component is being disputed." },
    { question: "How can I check an employer's final statement?", answer: "Ask for each amount, rate, number of days, date range, and policy reference on a written itemized statement. Match salary through the last working day to attendance records, compare leave to the HR balance, and verify the notice clause and any recovery authorization. Keep copies of the resignation or termination letter, handover record, payslips, and correspondence. If a number differs, ask the employer to show its calculation rather than changing unrelated inputs to force a match. This tool is a calculator aid; it does not provide legal advice or decide what an employer owes." },
  ],
  "/resignation-risk": [
    { question: "How much runway should I have before resigning?", answer: "There is no universal number. Model essential expenses, notice-period cash flow, dependents, debt, and the likelihood of a delayed start rather than relying on a single threshold." },
    { question: "Is a signed offer enough to resign?", answer: "A signed offer improves certainty but does not remove risk. Confirm the joining date, conditions, compensation structure, background checks, and notice dependencies." },
  ],
  "/layoff-radar": [
    { question: "Does an empty layoff radar mean my job is safe?", answer: "No. The current build has no publishable company or layoff records, so an empty result says nothing about an employer's plans." },
    { question: "How can I verify a layoff report?", answer: "Check the publication date, affected business unit, direct source, and whether the source supports the specific claim. Do not treat an unattributed rumour as confirmation." },
  ],
  "/salary-drop": [
    { question: "When is taking a pay cut worth it?", answer: "It may be rational when the new role improves a clearly defined constraint such as health, manager quality, location, scope, or future demand and the cash impact remains survivable." },
    { question: "How should I explain a salary cut?", answer: "Name the specific trade-off, the evidence that it is real, the time horizon, and the review date. Avoid calling an unverified promise a long-term investment." },
  ],
  "/escape-plan": [
    { question: "How long does a career change take?", answer: "It varies by role, market, experience, runway, and proof. Use the selected planning window to organize actions, not as a completion promise." },
    { question: "What should I do first if I feel stuck?", answer: "Name the decision, write the current baseline, and take one small action that produces new information from a person, document, application, or experiment." },
  ],
  "/career-reality-index": [
    { question: "Does the Career Reality Check calculate an index?", answer: "No. It displays four self-reported responses with a fixed reflection. Responses are not added, ranked, weighted, or converted into a score." },
    { question: "How should I use the check?", answer: "Choose one response to verify with a recent document, conversation, or work example. Do not use this check alone to make a resignation or financial decision." },
  ],
  "/ai": [
    { question: "Does this page predict AI job loss?", answer: "No. It offers editorial task-level questions for investigating team workflows; it does not measure role exposure or forecast employment outcomes." },
    { question: "What can I verify with my team?", answer: "Ask what work is automated, who checks the result, what source material supports it, and who remains accountable for the decision." },
  ],
};
staticToolFaqs["/companies"] = companyFaqItems.map(({ q, a }) => ({ question: q, answer: a }));

type SnapshotLink = {
  href: string;
  label: string;
};

const staticToolRelatedPages: Record<string, SnapshotLink[]> = {
  "/salary-calculator": [{ href: "/guides/read-the-offer-beyond-ctc", label: "Read a CTC offer" }, { href: "/rules/employee-pf", label: "EPF wage-ceiling rules" }, { href: "/rules/gratuity-wages", label: "Gratuity wage rules" }],
  "/offer-comparison": [{ href: "/guides/read-the-offer-beyond-ctc", label: "Read a CTC offer" }, { href: "/guides/notice-period-and-return-to-office", label: "Check notice-period terms" }, { href: "/rules/employee-pf", label: "EPF wage-ceiling rules" }],
  "/tax-regime-comparison": [{ href: "/guides/cross-border-and-remote-pay", label: "Location and tax questions" }, { href: "/guides/how-to-read-salary-and-hiring-claims", label: "Check salary claims" }],
  "/gratuity-estimator": [{ href: "/rules/gratuity-wages", label: "Official gratuity wage rules" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "Check exit documents" }],
  "/final-pay-estimator": [{ href: "/guides/notice-period-and-return-to-office", label: "Notice-period exit steps" }, { href: "/rules/leave-encashment", label: "Leave encashment rules" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "After a layoff" }],
  "/layoff-runway": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/layoff-recovery-and-employment-documents", label: "Layoff pay and documents" }],
  "/home-loan-stress-test": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/career-switches-and-education", label: "Compare career-change costs" }],
  "/resign-or-stay": [{ href: "/guides/notice-period-and-return-to-office", label: "Notice-period exit steps" }, { href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }],
  "/companies": [{ href: "/guides/getting-hired-through-evidence-and-conversations", label: "Prepare hiring questions" }, { href: "/guides/notice-period-and-return-to-office", label: "Check written job terms" }],
  "/compass": [{ href: "/guides/performance-reviews-and-career-choices", label: "Compare review and move options" }, { href: "/guides/career-switches-and-education", label: "Assess a career change" }],
  "/salary-drop": [{ href: "/guides/runway-debt-and-big-decisions", label: "Plan cash runway and debt" }, { href: "/guides/read-the-offer-beyond-ctc", label: "Separate fixed and variable pay" }],
  "/escape-plan": [{ href: "/guides/career-switches-and-education", label: "Test a career switch" }, { href: "/guides/independent-work-without-romanticising-it", label: "Test freelance work" }],
  "/career-reality-index": [{ href: "/guides/skills-passion-and-career-constraints", label: "Match a plan to your constraints" }, { href: "/guides/workplace-culture-and-boundaries", label: "Check workplace boundaries" }],
  "/ai": [{ href: "/guides/ai-at-work-questions-to-ask", label: "Ask about AI at work" }, { href: "/guides/data-science-career-claims", label: "Check data-science role claims" }],
};

type SnapshotSection = {
  id?: string;
  heading: string;
  body?: string;
  html?: string;
  links?: SnapshotLink[];
};

type SnapshotContent = {
  lead: string;
  sections: SnapshotSection[];
  relatedLinks?: SnapshotLink[];
};

// These are separately authored route notes, not a shared paragraph template.
const batchWorksheetCopy: Record<string, SnapshotSection[]> = {
  "/layoff-runway": [
    { heading: "Read the cash table as a sequence", body: "The opening balance is the money available at the start of that month. The closing balance subtracts the same net outflow entered in the form; it does not mean every bill is paid on the same day. A positive month-end figure can still hide an earlier rent, school-fee, or loan debit that arrives before salary or severance. Compare the schedule with actual bank dates, not only its final row. If income stops partway through a month, enter the amount that is genuinely expected to continue rather than a full-month assumption." },
    { heading: "Illustrative scenario: separate certain cash from hope", body: "Imagine a person with savings in a bank account, a severance amount that has not yet been confirmed, and occasional freelance work. The worksheet should include the liquid savings now, exclude the unconfirmed severance, and omit freelance income unless the person has a defensible continuing amount. This is not pessimism; it keeps the baseline auditable. A second run can add severance after a signed letter arrives. Keeping both versions makes the cost of waiting visible without treating a recruiter conversation, a pending claim, or an investment balance as spendable money." },
    { heading: "Decide what belongs in the monthly baseline", body: "Start with obligations that continue if work stops: housing, food, utilities, transport, insurance, school or care, minimum debt payments, and support sent to family. Separate recurring costs from one-time expenses such as a move, medical bill, device repair, or travel for interviews. The model has no dedicated field for every irregular cost, so preserve a separate reserve rather than quietly dividing an uncertain bill into monthly income. Avoid counting a loan instalment twice when it is already included in essential costs. Your own ledger is the source of truth; the calculator only performs the arithmetic you supplied." },
    { heading: "Questions for a second pass", html: "<dl><dt>Should I include investments?</dt><dd>Only include holdings you could access on the timeline and terms you accept. A market value is not identical to cash available after fees, taxes, settlement delays, or a price change.</dd><dt>What if my household has two incomes?</dt><dd>Enter only income that is likely to continue, then make a second scenario for a temporary interruption. Keep the income owner, expected date, and reason for confidence beside your own notes.</dd></dl>" },
    { heading: "Build a conservative, usable plan", body: "Make separate versions for different events rather than blending them into one average. One version can show current household income continuing; another can remove it if a contract ends; a third can add a confirmed payment on its expected date. These are scenarios, not probabilities. Keep the assumptions beside each version so another household member can challenge a number without having to reconstruct your thinking. If the result depends on selling an asset, borrowing from family, or collecting a disputed amount, name that dependency explicitly. A runway figure is most useful when it tells you which conversation or document to pursue before cash becomes urgent." },
    { heading: "Use the schedule to choose a next action", body: "Look for the month where the closing balance crosses a personal floor, not only the month it reaches zero. Your floor might represent money reserved for rent, medical access, dependants, or an unavoidable move. The calculator does not know that boundary; decide it outside the form and write down why it matters. If the balance falls quickly, possible actions include confirming final settlement, reviewing recurring subscriptions, speaking with lenders before a missed payment, or delaying a discretionary purchase. If the projection looks comfortable, still check timing and irregular expenses. The table is an invitation to act earlier, not a reason to wait until its last row." },
    { heading: "Keep evidence attached to each input", body: "For every major amount, note its origin: a current bank balance, a signed settlement statement, a recent bill, or a household estimate. Add a date because balances and obligations change. Distinguish money legally accessible to you from funds jointly held, restricted, pledged, or needed for another commitment. A simple private worksheet can record source, owner, expected date, confidence, and what would invalidate the assumption. Do not paste personal account numbers, employer documents, or identity details into public feedback or analytics. This page calculates in the browser; it does not verify a bank balance, make a benefits claim, negotiate debt, or contact an employer on your behalf." },
  ],
  "/home-loan-stress-test": [
    { heading: "How to read the amortisation schedule", body: "Each row starts with the unpaid balance, calculates one month's interest from the entered annual rate divided across twelve months, then allocates the scheduled payment between interest and principal. The closing balance becomes the next row's opening balance. Early rows can show a larger interest share because the outstanding principal is larger; later allocations shift as that balance falls. This is a standard fixed-rate arithmetic path, not a lender statement. The interactive schedule uses the entered-rate EMI; the second EMI is a separate stress comparison and does not silently rewrite every row." },
    { heading: "Illustrative scenario: compare the monthly squeeze", body: "Illustrative inputs: ₹50,00,000 principal, a 20-year term, 8% in the base field, and 10% in the stress field. The tool calculates two instalments from those inputs and reports the increase, total scheduled payments, estimated interest at the base rate, and cash left after the stressed payment plus other monthly costs. Treat this as a controlled comparison: only the rate changes. A real lender can also alter tenure, reset dates, fees, or the payment date, so the result is not a quotation or a claim about what your bank will charge." },
    { heading: "What the model leaves outside the table", body: "The schedule assumes one principal, one constant rate, regular monthly payments, and no extra principal reductions. It cannot represent an introductory rate followed by a reset, a partial prepayment, late charges, insurance bundled with an instalment, or a lender's day-count convention. If your agreement changes the tenure instead of the monthly payment after a rate revision, this table will not show the resulting end date. Use the lender's current repayment schedule to reconcile outstanding balance and interest. Keep this worksheet for sensitivity analysis, then compare the lender document line by line before budgeting around a payment." },
    { heading: "Questions before relying on the comparison", html: "<dl><dt>Does the stress rate predict a future reset?</dt><dd>No. It is a value you choose to test. Use a rate supplied by a lender only when it is presented as a real offer or contractual scenario.</dd><dt>Why can my bank EMI differ?</dt><dd>Check principal, remaining tenure, reset date, fees, rounding, payment timing, and whether the bank changes the instalment or extends the term. Small input mismatches compound across a long schedule.</dd></dl>" },
    { heading: "Check the result against your budget", body: "Compare the stressed instalment with take-home cash after other recurring commitments, not with gross compensation or a household income that may not arrive every month. List rent or maintenance, utilities, food, transport, education, insurance, medical needs, existing debt, and savings you intend to preserve. The worksheet subtracts only the costs you enter, so a positive remainder is not proof that the household is comfortable. Decide which expenses are flexible and which cannot be reduced without harm. If another borrower contributes, test a version that removes that contribution temporarily. The purpose is to surface dependence on shared income, not to judge the household's choices." },
    { heading: "What a prepayment scenario would require", body: "The current schedule has no extra-payment field. Do not interpret its closing balance as a lender forecast if you plan regular prepayments. A separate calculation would need the timing and amount of each extra payment, any fee, the rule for reducing tenure or instalment, and the lender's balance after each reset. Until you have those terms, compare only the base schedule with the rate scenario shown here. Ask the bank for a revised amortisation statement after a rate change and check whether a debit instruction changes automatically. Keep a copy of the requested schedule and the date it applies, because a statement for an earlier cycle may not reflect the next payment." },
    { heading: "Read every row as a model output", body: "An amortisation table is a sequence of arithmetic operations, not a contract amendment. The first row uses the entered principal; every later row depends on the previous closing amount and the rounded payment retained by this model. Actual servicing systems may round each component differently, apply a payment to a date-specific period, or adjust the final instalment. If your lender's amount differs, compare the assumptions before concluding that an error occurred. The most useful reconciliation starts with principal outstanding, rate effective date, remaining months, and the scheduled debit. A qualified lender representative can explain account-specific treatment; this tool cannot inspect your loan account or request a balance confirmation." },
  ],
  "/resign-or-stay": [
    { heading: "Use the comparison to expose assumptions", body: "For each area, enter how important it is to you, then how the staying and moving options currently look. The displayed products are arithmetic reminders of your own stated priorities; they do not measure a career, reveal a correct answer, or establish that one option is safer. Use the same scale consistently. If a factor is non-negotiable, note that separately instead of allowing a high rating elsewhere to cancel it. When the evidence is thin, mark the uncertainty in your own notes and choose a verification step before treating a tentative impression as a settled comparison." },
    { heading: "Illustrative scenario: make the unknown visible", body: "Illustrative scenario: a person enjoys their team but has no written promotion scope, while another employer has described a role verbally. The stay side can reflect known colleagues and familiar work; the move side may reflect potential authority alongside unanswered questions about manager, funding, and variable pay. The useful result is not whichever total is larger. It is the short list of facts that could reverse the choice: an approved role description, a conversation with the future manager, a written compensation plan, or a clearer review date at the current employer." },
    { heading: "What to verify before choosing a date", body: "Read the employment agreement and later amendments for notice obligations, bonus recovery, training repayment, confidentiality, and post-employment terms. Ask the prospective employer to confirm title, reporting line, location, decision authority, compensation components, conditions, background checks, and joining date in writing. Check whether resignation changes insurance, childcare arrangements, commute, visa status, or support for dependants. The worksheet does not interpret legal enforceability or personal wellbeing. Where a clause or consequence could materially change the decision, seek a qualified explanation instead of translating uncertainty into a confident score." },
    { heading: "Questions to ask yourself", html: "<dl><dt>Should I resign because the move total is larger?</dt><dd>No. The total is not a recommendation. Inspect the individual rows, identify any non-negotiable constraint, and test which unverified fact matters most.</dd><dt>What if I cannot decide?</dt><dd>Choose a reversible action that creates evidence: request written terms, review a budget, clarify authority, or set a date to reassess after a specific conversation.</dd></dl>" },
    { heading: "Separate urgency from readiness", body: "A difficult week can create urgency without supplying evidence that a change will solve the underlying problem. Conversely, a calm period can hide a deadline in a contract, benefit, or household budget. Write down what has to happen soon and what can wait for more information. If the issue is safety, health, discrimination, or a legal threat, this comparison is not an emergency service and should not delay qualified help. For ordinary career uncertainty, define a small test that protects your options: a confidential conversation, a revised scope request, a budget review, or a carefully chosen external interview." },
    { heading: "Give each option a realistic description", body: "Describe the staying path as it is likely to operate, not as the best version of a promise. Include the manager's authority, available work, team dependencies, and date for a decision. Describe the moving path using the written offer, current stage of checks, actual work location, and any unresolved approval. If the new role is not yet documented, compare it as an opportunity under discussion rather than as guaranteed employment. Include a third path when it is real, such as an internal transfer or a temporary pause. A comparison becomes misleading when one option contains facts while another is filled with imagined benefits." },
    { heading: "Decide what evidence would change your view", body: "Before entering preferences, name one fact that would make you reconsider either option. Examples include a manager confirming budget and decision rights, a revised written offer, a household cash calculation, or a conversation with someone who performs the work. Set a review date tied to that event rather than waiting indefinitely for certainty. Keep a record of what you asked, what answer arrived, and what remains unresolved. If no answer arrives by the date, decide whether the delay itself matters. This process does not remove risk; it makes the trade-off explicit enough for you to discuss with people who understand your circumstances." },
  ],
  "/compass": [
    { heading: "Separate evidence from preference", body: "Use one column of your own notes for facts you can point to and another for interpretations or hopes. A written offer, a recent performance review, a completed work sample, and a recurring household cost are different kinds of evidence; a rumour about a reorganisation or a promise of future scope deserves a different confidence label. Record when each item was last checked and who can confirm it. This worksheet does not combine those notes into a score. Its purpose is to help you compare a current role, an external move, or a smaller experiment without pretending that incomplete evidence has equal weight." },
    { heading: "Illustrative scenario: compare three paths", body: "Illustrative scenario: someone is weighing continued work in a current team, accepting a written offer, or asking for a bounded internal project before deciding. The offer path may have clearer pay but an unfamiliar manager. Staying may preserve relationships while leaving authority unresolved. The project may reveal whether the desired work is available without requiring an immediate exit. Write the evidence each path would produce, the cost of waiting, and the point at which you would reconsider. This does not establish which path will succeed; it shows what could be learned before making a harder-to-reverse commitment." },
    { heading: "What to verify next", body: "Choose one question whose answer could genuinely change your preference. Ask the hiring manager who approves the work and how success is reviewed; ask the current manager what scope can be granted and by when; inspect the offer for fixed-versus-variable definitions; or test the commute at the actual travel time. Avoid collecting information that cannot affect the decision. If a promised change has no owner, document, date, or consequence when missed, treat it as uncertain. Revisit your notes when that evidence arrives rather than letting an old impression silently become a fact." },
    { heading: "Questions for the next conversation", html: "<dl><dt>Does the Compass recommend a move?</dt><dd>No. It helps organise evidence and unknowns; the decision remains yours and may depend on priorities this page cannot observe.</dd><dt>How can I compare options fairly?</dt><dd>Use the same time horizon and categories, distinguish guaranteed terms from contingent promises, and keep the source beside every important claim.</dd></dl>" },
    { heading: "Keep a decision record that can be revisited", body: "Write the date, options considered, strongest evidence, material unknowns, and next action in ordinary language. Avoid reducing the record to a single total or colour. Add who could confirm each uncertain claim and how long you are willing to wait for the answer. A colleague may help examine work scope; a family member may understand household constraints; a professional adviser may address contractual or financial questions. Those perspectives are different, so note which question each person can answer. Review the note after new evidence arrives, not whenever anxiety spikes. This gives you a way to tell whether the circumstances changed or only your interpretation." },
    { heading: "Do not confuse comparison with certainty", body: "A table can make options easier to discuss, but it cannot reveal a manager's future conduct, the health of a team, the durability of a product, or whether the work will remain satisfying. Treat every statement as one of three things: confirmed, plausible but unconfirmed, or unknown. If the current role has a known constraint and the external option has an unknown constraint, do not call them equivalent simply because both are uncertain. Ask targeted questions that could reduce one uncertainty at a time. Where evidence remains unavailable, decide whether you can tolerate that uncertainty rather than inventing a reassuring answer." },
    { heading: "Prepare for the conversation you need", body: "Choose a person with access to the fact, then ask a question narrow enough to receive a concrete answer. A recruiter can confirm written terms but may not control team budgets. A manager can explain current priorities but may not approve a future reorganisation. A colleague can describe their experience without speaking for the whole organisation. Frame the question around your decision: what will I own, what must be true before I join, or when will this scope be reviewed? Record the response and its limits. If the answer is verbal, request a written summary so that later conversations do not depend on memory or interpretation." },
  ],
  "/salary-drop": [
    { heading: "Compare cash on the same basis", body: "Enter both packages for the same period and decide whether the comparison is gross fixed cash or a broader CTC figure. A target bonus belongs in a separate scenario because a stated target is not identical to money already paid. Check whether employer contributions, reimbursements, equity, or one-time joining amounts appear in either headline. The worksheet does not estimate tax or infer payroll policy. If the new amount is monthly and the old amount is annual, normalize them before comparing. Keep currency, pay period, variable assumptions, and household costs visible so the arithmetic does not conceal a mismatch." },
    { heading: "Illustrative scenario: name the purchase", body: "Illustrative scenario: a person considers lower fixed pay for shorter travel, clearer authority, or work that better matches a long-term direction. First calculate the recurring cash difference, then check that the household can absorb it without relying on a bonus. Next write down the benefit being purchased in observable terms: fewer hours in transit, direct responsibility for a defined product area, or protected time for a portfolio project. A promised cultural improvement is harder to verify than a written scope or a trial commute. The scenario is illustrative; the tool does not decide whether the exchange is worth making." },
    { heading: "Build a review point, not a justification", body: "Before accepting, identify the evidence that would show the trade-off is real and set a date to review it. For a scope change, ask who owns the decision and what work will move to you. For flexibility, clarify the expected schedule, location rules, and exceptions. For learning, define a work sample or responsibility that demonstrates progress. Add recurring expenses that change with the move, such as transport, meals, equipment, or care. One-off relocation or setup expenses should remain distinct from salary loss. If the expected benefit does not appear, decide in advance whether to renegotiate, search again, or revise the goal." },
    { heading: "Questions worth answering", html: "<dl><dt>Can I compare CTC directly?</dt><dd>Only after checking which employer-side items and conditional payments are included. The same label can hide a different cash mix.</dd><dt>How do I know the pay cut is affordable?</dt><dd>Compare conservative recurring cash with essential obligations and preserve room for irregular bills; do not rely on a best-case variable payout.</dd></dl>" },
    { heading: "Test the promise behind the lower figure", body: "A compensation reduction is concrete; a better manager, healthier pace, or broader authority may still be a promise. Translate each expected benefit into something you can observe without demanding a guarantee no employer can make. You might ask who approves priorities, how urgent work is handled, what hours are typical for the team, or which decisions the role owns. Speak with more than one relevant person when possible, and remember that individual experience is not universal evidence. If the employer cannot answer before you decide, include that uncertainty in your own reasoning rather than assigning the promised benefit the same confidence as written salary." },
    { heading: "Check household effects beyond the offer", body: "Estimate how the changed payment affects recurring commitments and goals that do not appear on a payslip: loan obligations, caregiving, education, savings, insurance, commuting, and support for relatives. Keep one-time transition costs separate from the ongoing difference. Consider whether a new location adds deposits, transport, meals, or duplicate housing before a move is complete. A partner's income may be shared in practice but should not be assumed available without discussion. The worksheet uses only the figures entered; it cannot know what the household considers essential. A conservative budget can show whether the trade-off is manageable even if the first few months are less predictable." },
    { heading: "Write a review condition before you accept", body: "Choose a date or event for reviewing the move, and write what evidence you expect by then. Examples include ownership of a named project, a confirmed schedule, or time reserved for a development goal. Decide what response would count as progress and what would prompt another conversation. Do not rely on a vague phrase such as better culture; specify the behaviour you need to observe. The review is not an ultimatum or a prediction that the job will fail. It gives you a way to compare the role you accepted with the role you are actually doing and to make a deliberate adjustment if the promised exchange does not appear." },
  ],
  "/escape-plan": [
    { heading: "Turn a goal into evidence-producing actions", body: "Choose a goal narrow enough to test, such as exploring a different function, improving access to a particular kind of work, or preparing for independent projects. A checklist is useful when each item creates an observable artifact or response: a draft portfolio case, a conversation with a practitioner, a carefully scoped application, or a written question to a hiring team. Reading another article may help, but it should not become a substitute for contact with the actual work. Fit the weekly plan around current energy, family commitments, and deadlines rather than borrowing time from an imaginary empty calendar." },
    { heading: "Illustrative scenario: a bounded career experiment", body: "Illustrative scenario: a person curious about product operations uses a planning window to map one recurring workflow, speak with two people doing similar work, and build a small before-and-after case study from a permitted project. The goal is not to claim expertise after a few tasks. It is to discover whether the daily problems are appealing and what proof employers ask for. If access to a work sample is restricted, use a fictional or public dataset and label it accurately. The checklist tracks actions completed; it does not estimate hiring probability, income, or the date a transition will be complete." },
    { heading: "Review the plan when reality changes", body: "At each review, keep actions that created a useful response, replace tasks that only consumed time, and record the reason for a pause. A rejected application can still reveal a requirement; silence may reveal nothing. Ask whether the target role, evidence, or available hours changed. If a family or financial constraint tightens, adjust the sequence without framing the change as failure. Preserve a version of your original goal so you can see whether your direction moved for a reason. The tool's page state is temporary, so save any plan you want to keep in a private document that does not contain sensitive employer information." },
    { heading: "Questions for a realistic plan", html: "<dl><dt>Does finishing every checklist item mean I am ready?</dt><dd>No. It means the selected tasks were marked complete. Readiness depends on evidence quality, constraints, role requirements, and conversations beyond the checklist.</dd><dt>What belongs in the first week?</dt><dd>Pick one action with a clear output and a low cost of reversal, such as clarifying a target role or asking one informed person a specific question.</dd></dl>" },
    { heading: "Make each task observable", body: "Replace vague actions such as research the market with an output you can inspect: a short list of role descriptions, a comparison of recurring responsibilities, or notes from a conversation with someone who does the work. Replace learn a skill with a small artifact that demonstrates the skill in context. Keep the artifact truthful about your contribution and remove confidential material. A task that depends on another person should name the request and a backup if they are unavailable. This level of specificity makes progress visible without turning activity into a claim of competence. The checklist is for planning, not public proof that you are qualified." },
    { heading: "Protect time without overpromising", body: "Choose a weekly time budget that already accounts for work, rest, family, and commute. If a plan requires every free evening, it probably needs a smaller experiment. Break a large project into a first deliverable that can be reviewed before you commit to more expense. Keep optional learning separate from work samples that could test demand. If you pause, record whether the reason was capacity, changed interest, missing access, or a different priority. Those are useful signals, not failures. The page's time window organizes a sequence; it cannot know your calendar or guarantee that an action will receive a response." },
    { heading: "Review the evidence, not just the checklist", body: "At the end of a planning interval, ask what you learned and what remains unknown. Did a practitioner describe the work in a way you still want? Did an application expose a missing requirement? Did the portfolio artifact receive specific critique? Separate a lack of response from a negative response, because they provide different information. Decide whether to repeat, revise, or stop the experiment. If the goal changed, preserve the reason so you can distinguish a deliberate redirection from a temporary reaction. A useful plan can conclude that the original path is not attractive; completion is not the same as switching careers." },
  ],
  "/career-reality-index": [
    { heading: "Treat the response pattern as a prompt", body: "The check asks for self-reported views on pay, company confidence, ability to move, and AI readiness. Its reflection is fixed; the answers are not added, ranked, weighted, or converted into a score. The words you select should describe your current evidence, not the answer you wish were true. A neutral response can mean the situation is acceptable, unclear, or simply not measured; use a note to distinguish those meanings. The tool cannot see your contract, manager, savings, health, or private company plans. Its useful output is a question to investigate, not a label about your career." },
    { heading: "Illustrative scenario: one answer needs evidence", body: "Illustrative scenario: a person is comfortable with current pay but unsure whether their work will remain relevant as a team adopts new software. Instead of interpreting the response as proof of risk, they list the tasks that changed, ask who reviews outputs, and request a discussion about the next project. That evidence may support learning, role redesign, or no immediate change. Another person with the same response could have a different context and need a different next step. The reflection is deliberately conditional because a short set of self-reports cannot establish an employment outcome or personal wellbeing." },
    { heading: "Verify the answer that matters most", body: "Pick one response and tie it to a recent source: a pay statement, written scope, performance feedback, a conversation with a manager, a completed work sample, or an explicit job requirement. Note the date and what would change your interpretation. If the source is missing, make that absence visible instead of guessing. A useful next action is small enough to complete and specific enough to produce evidence. Revisit the reflection after the evidence changes; do not treat a previous response as a permanent identity. Keep any saved note narrative, not as a pseudo-precise personal rating." },
    { heading: "Questions people ask", html: "<dl><dt>Is this a test of career health?</dt><dd>No. It has no validated scale or universal threshold. It is a structured pause for identifying one important fact to check.</dd><dt>Should a difficult reflection trigger resignation?</dt><dd>Not by itself. Review written terms, finances, support, and alternatives, then seek advice that fits the specific risk before acting.</dd></dl>" },
    { heading: "Read one answer in context", body: "A response about pay may refer to monthly cash, progression, fairness, or uncertainty about the next review. A response about company confidence may reflect a recent announcement, a team conversation, or a general feeling with no source attached. Before changing the answer, name the meaning you intended and the evidence supporting it. The same satisfaction label can describe very different circumstances for different people. This check does not normalize those experiences against other workers. Use your own explanation to keep the response grounded in your current situation rather than treating the selection as a diagnosis." },
    { heading: "Choose a reversible verification step", body: "A useful follow-up should produce information without forcing an immediate career move. You might compare your written pay terms with a recent statement, ask for the criteria behind a review, map which tasks changed in your team, or request feedback on a work sample. Keep the question specific and choose someone able to answer it. If the answer is not available, write that down and decide whether the uncertainty itself affects your plans. Avoid sharing sensitive employer or personal material in an open channel. The tool cannot save your private explanation, so preserve only notes you want to keep in a place you control." },
    { heading: "Notice what the check cannot observe", body: "Four self-reports leave out manager behaviour, caregiving, discrimination, health, immigration status, household debt, team funding, and many other facts that can change what is reasonable. A fixed reflection cannot know which factor is decisive for you. Do not use its language to dismiss a concern that needs specialist support or to certify that a workplace is safe. If the topic involves a legal right, tax question, health need, or financial commitment, consult the relevant qualified source. The check is deliberately modest: it can help you name a concern and select one fact to verify; it cannot take responsibility for the resulting decision." },
  ],
  "/ai": [
    { heading: "Start with a task, not a job title", body: "Write down one recurring piece of work from intake through delivery: its inputs, transformation, review, hand-off, and consequence. Ask which step a tool can draft, search, classify, or repeat, then ask what context must still be supplied by a person. A job title can bundle routine production with negotiation, exception handling, customer trust, and accountable decisions. Those tasks may change at different speeds inside one team. This worksheet is a set of investigation prompts, not a measure of exposure, a market forecast, or an estimate of employment risk." },
    { heading: "Illustrative scenario: trace an output to its owner", body: "Illustrative scenario: a team uses a language model to prepare a first draft of a customer update. Map who provides the source facts, who checks claims, who removes confidential information, who approves the tone, and who handles an incorrect statement. Record whether the tool changes the amount of work, its distribution, or the quality-control burden. A faster draft can move effort toward verification rather than remove it. Do not submit restricted or personal material to a system unless your employer has approved that use. The example describes a workflow question, not a prediction about a particular occupation." },
    { heading: "Make a practical learning test", body: "Choose one permitted task and compare a normal process with an assisted process using the same quality standard. Track time, correction types, missing context, and who accepts responsibility. Keep the source and an unassisted baseline where policy allows. Ask your manager how the result will be reviewed and whether the tool is approved for that data. A useful skill demonstration shows judgement: what you rejected, what you checked, and why the final output is fit for its audience. Tool familiarity without a real workflow or review boundary is weak evidence of contribution." },
    { heading: "Questions for a team conversation", html: "<dl><dt>Does this worksheet say whether AI will replace me?</dt><dd>No. It helps identify task changes and accountability questions; it cannot forecast adoption, staffing, or future demand.</dd><dt>What should I ask before using a tool?</dt><dd>Clarify approved products, data handling, review ownership, permitted sources, escalation routes, and what happens when an output is wrong.</dd></dl>" },
    { heading: "Map exceptions and hand-offs", body: "Routine examples rarely reveal the hardest part of a workflow. List the exceptions: incomplete records, contradictory instructions, unusual customer needs, policy conflicts, or a failed upstream system. Ask who detects each exception, who can pause the process, and where the case goes next. A tool may produce plausible text while omitting the condition that changes the correct response. Reviewing edge cases helps distinguish a draft generator from a system that can safely complete a task. Keep a record of the review criteria and escalation path rather than relying on a general instruction to check the output." },
    { heading: "Protect data and provenance", body: "Before testing a tool, identify the data classification and the system the employer permits. Do not paste customer records, employee details, source code, confidential strategy, or unpublished financial information into an unapproved service. Ask whether prompts or outputs are retained, who can access them, and whether generated material can be traced to source documents. For a public-facing answer, preserve citations and verify that they support the actual claim. A polished response is not evidence of correctness. If the source cannot be checked, mark the claim unresolved and keep a human owner responsible for the final decision." },
    { heading: "Describe your contribution precisely", body: "If you use an assistant in a work sample, explain the task, the permitted inputs, the parts you reviewed, and the changes you made. Show how you noticed a wrong assumption or improved a weak result. Do not claim that the tool created expertise or that a faster draft proves a business outcome. Ask your manager whether disclosure is required and follow team policy. A useful portfolio case distinguishes your judgement from automated output and respects confidentiality. This gives a hiring conversation something concrete to examine: problem framing, quality checks, exception handling, and accountability rather than a list of software names." },
  ],
  "/companies": [
    { heading: "A due-diligence conversation, not a rating", body: "Begin with the exact legal entity named in the offer, not only a familiar brand, product, or recruiter email domain. Compare the employer name on the offer with the entity expected to employ and pay you. If the business is listed, locate its own exchange filings and announcements for that entity; do not assume a headline about a parent company applies to every subsidiary or team. Ask the recruiter which documents are current and how the employing entity relates to the hiring team. This checklist records questions and sources. It produces no company score, safety verdict, or prediction about workplace quality." },
    { heading: "Ask about the role that exists now", body: "Request a written description of the first problems the role is expected to solve, the person who sets priorities, the decisions you can make, and the resources already approved. Ask which responsibilities are immediate and which depend on a future launch, funding event, or reorganisation. Clarify reporting line, location, travel expectations, team composition, review cadence, and how success will be discussed. If the answer is broad, ask for an example from the first month. A precise conversation helps you compare the actual work with the work that attracted you; it does not guarantee that the team will remain unchanged." },
    { heading: "Match paperwork before accepting", body: "Compare the written offer with the employment agreement, compensation annexure, benefits explanation, and any policy that changes payment or recovery. Confirm fixed salary, target or maximum variable pay, eligibility dates, payout conditions, joining incentive repayment, notice obligations, confidentiality, intellectual property, and location terms. Ask which details are final and which require a later approval. Keep copies of the versions you were given and note who answered each question. Do not rely on a verbal assurance to override wording you have not reviewed. For a disputed or high-impact clause, consult a qualified adviser rather than treating this checklist as legal interpretation." },
    { heading: "Official starting points and limits", body: "Use Ministry of Corporate Affairs company master data to check an exact registered entity; for a listed entity, use the relevant exchange's own filings and announcements. Check the employer's official careers and policy pages for the role and stated terms, then compare them with the signed documents. When employment records are relevant, consult the official provident-fund authority rather than an unofficial summary. Availability of a public record does not establish solvency, culture, hiring intent, or an individual's future job security. Similar names, stale pages, and group-company relationships need careful matching before you draw a conclusion." },
    { heading: "Offer details that deserve a pause", body: "Resolve a mismatch between the named employer and expected payroll entity, a variable amount with no written conditions, an undefined reporting line, or a joining incentive whose repayment trigger is unclear. Treat pressure to sign before receiving the agreement, requests for personal payment to secure a role, and assurances that contradict the written terms as reasons to stop and verify through an independent official channel. None of these details alone proves misconduct; they are unanswered questions with consequences. Ask for a corrected document, identify who can approve the change, and keep the response. If the employer will not clarify a material term, consider qualified advice before accepting." },
    { heading: "Questions before the final conversation", html: "<dl><dt>Can public filings prove that a role is secure?</dt><dd>No. Filings provide information about the reporting entity and disclosed events; they cannot establish the future of a specific team or position.</dd><dt>What if the recruiter cannot answer?</dt><dd>Record the unanswered item, ask who owns it, and request a written follow-up. Treat a missing answer as uncertainty, not evidence for either outcome.</dd></dl>" },
    { heading: "Verify a document trail carefully", body: "Start with the exact entity name and registration details shown in the offer. Use the Ministry of Corporate Affairs company master data page for a company-identity check, and search an exchange's own portal when the employer is listed. Read the date, reporting period, entity, and document type before applying a filing to your situation. A parent company announcement may not describe the subsidiary on your contract. The employer's careers page can confirm the public description of a role, but the signed offer and agreement govern the terms presented to you. Keep links and retrieval dates in your own notes so later changes are distinguishable from the version you reviewed." },
    { heading: "Ask questions that expose operational detail", body: "A due-diligence conversation should move from broad assurances to a concrete description of the job. Ask what problem the team is staffed to solve now, what would make the role successful, who owns the budget, how priorities change, and what happens if a planned launch is delayed. Ask how performance feedback is documented and who can resolve a disagreement about scope. These questions do not accuse an employer; they clarify how work is organized. Listen for whether different interviewers describe compatible responsibilities. If a material point remains unclear, request a written answer from the person authorized to confirm it." },
    { heading: "Illustrative scenario: match the offer to the entity", body: "Illustrative scenario: a candidate receives an offer naming a legal entity that differs from the brand on the careers page. They look up the exact entity in the Ministry's company master data, ask the recruiter whether that entity will issue payroll documents, and request written confirmation of the reporting line and role location. If the business is listed, they check the relevant exchange portal for filings by the matching entity rather than assuming a parent-company announcement applies. The exercise does not label the employer as safe or risky; it shows how to resolve identity and role questions before signing." },
    { heading: "Keep a source log without creating a verdict", body: "Record the claim, the source, the date, the exact entity, and the remaining uncertainty. Separate official filings from an employer's own recruiting material, and both from third-party commentary. A filing can describe reported information; it is not a guarantee about a future job. A careers page can describe an advertised role; it does not replace an individual agreement. If a statement is difficult to verify, label it as unconfirmed rather than turning absence of evidence into an accusation. This simple source log supports a better conversation while avoiding a company rating, an unsupported allegation, or a false promise of safety." },
  ],
};

const staticToolGuidance = Object.fromEntries(
  routeRegistry.routes
    .filter((route) => route.kind === "tool" && route.indexability === "indexable")
    .map((route) => [route.path, route.description]),
) as Record<string, string>;

function routeFaqSections(route: string): SnapshotSection[] {
  const faqs = staticToolFaqs[route] ?? [];
  return faqs.length
    ? [{ heading: "Questions worth checking", html: `<dl>${faqs.map((faq) => `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`).join("")}</dl>` }]
    : [];
}

function renderSnapshotLinks(links: SnapshotLink[]): string {
  return links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("");
}

function formatSnapshotRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function renderCtcWorkedExamples(): string {
  const rows = ctcWorkedExampleResults.map(({ label, result }) => `
    <tr>
      <th scope="row">${escapeHtml(label)}</th>
      <td>${formatSnapshotRupees(result.inputs.annualCtc)}</td>
      <td>${formatSnapshotRupees(result.annualGrossAtZeroVariable)}</td>
      <td>${formatSnapshotRupees(result.inputs.annualVariablePay)}</td>
      <td>${formatSnapshotRupees(result.annualTaxAtTarget)}</td>
      <td>${formatSnapshotRupees(result.annualEmployeePfAtZeroVariable)} / ${formatSnapshotRupees(result.annualEmployeePf)}</td>
      <td>${formatSnapshotRupees(result.inputs.annualProfessionalTax)}</td>
      <td>${formatSnapshotRupees(result.monthlyInHandAtZeroVariable)}</td>
      <td>${formatSnapshotRupees(result.monthlyInHandAtTargetAverage)}</td>
    </tr>`).join("");
  return `<p>Each row is a hypothetical package calculated by the same model as the interactive tool. They use the new regime and 50% basic pay. The ₹8L and ₹12L examples explicitly set employee PF and professional tax to ₹0, so their cash estimates are higher than a payroll estimate with those deductions. Replace these values with your offer or payslip. The ₹20L illustration uses the 2026–27 month-by-month statutory PF ceilings and an explicitly entered 1 April 2026 start date; other examples use manual PF amounts. These are examples, not market observations or guaranteed payroll outcomes.</p>
    <div class="snapshot-table-wrap"><table><caption>Illustrative annual package and monthly cash estimates</caption>
      <thead><tr><th scope="col">Illustration</th><th scope="col">CTC/year</th><th scope="col">Fixed gross/year</th><th scope="col">Target variable/year</th><th scope="col">Income tax/year</th><th scope="col">Employee PF/year · fixed / target</th><th scope="col">Professional tax/year</th><th scope="col">Monthly cash at zero variable</th><th scope="col">Monthly average at full target</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderSnapshotBreadcrumbs(items: SnapshotLink[]): string {
  return `<nav class="snapshot-breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => `<li>${index > 0 ? "<span aria-hidden=\"true\">›</span>" : ""}${index === items.length - 1 ? `<span aria-current="page">${escapeHtml(item.label)}</span>` : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`}</li>`).join("")}</ol></nav>`;
}

function getTrustSnapshotContent(route: string): SnapshotContent | undefined {
  const unpublished = "This is an unpublished local remediation build. The production site has not been updated and may still show earlier content.";
  const trustContent: Record<string, SnapshotContent> = {
    "/about": {
      lead: "CareerReality is the product name used in this application. The operating entity and responsible people have not been verified in the project records supplied for this review.",
      sections: [
        { heading: "Local release status", body: unpublished },
      { heading: "Current public scope", body: "The local route catalogue features the CTC calculator. All 44 archived articles and unsupported company and market records remain withheld. No company score or market benchmark is published." },
        { heading: "Who operates this site", body: "The code does not establish the legal operating entity, its location, or the names and biographies of responsible people. Those details are not inferred here." },
      ],
    },
    "/editorial": {
      lead: "This page describes the publication rules applied in the local remediation build. It does not claim that a person reviewed or approved this copy.",
      sections: [
        { heading: "Evidence before conclusion", body: "Legal, tax, payroll, and market claims require a relevant primary source, a recorded access date, and a clear statement of scope. Unsupported claims are removed or the page is withheld." },
        { heading: "Authorship and review", body: "The supplied article export has no named authors or verified publication and update dates. No human reviewer was supplied. Historical AI use could not be verified, so no claim is made about it." },
        { heading: "Publication status", body: `All 44 article routes are withheld in this local build. ${unpublished}` },
      ],
    },
    "/corrections": {
      lead: "The project records supplied for this review do not include a verified public correction history. That does not establish that no corrections have ever been made.",
      sections: [
        { heading: "Available correction record", body: "No verified correction entries were supplied in the records reviewed. This is an incomplete historical record, not a statement that the site has never corrected an error." },
        { heading: "What a publishable entry needs", body: "A public entry should identify the page, corrected claim, what changed, the date of the change, and the supporting evidence. An owner-verified, monitored contact route is still needed." },
      ],
    },
    "/contact": {
      lead: "The project records supplied for this review do not establish a working, monitored public contact route. No address is published here.",
      sections: [
        { heading: "No verified inbox", body: "No monitored public contact channel could be confirmed. Do not send salary details, resumes, credentials, or confidential documents to an address found in older page copy." },
        { heading: "What is needed", body: "The site owner must provide and test a public channel for corrections, privacy requests, and account questions before this page can direct visitors to an inbox." },
      ],
    },
    "/methodology": {
      lead: "The only featured public instrument in this local build is the CTC calculator. It separates offer inputs from assumptions instead of inferring employer policy.",
      sections: [
        { heading: "CTC reconciliation", body: "The calculator starts with fixed pay and target variable pay. It subtracts employer PF only when the user marks it as inside CTC, and subtracts gratuity or other employer costs only when entered. A remainder stays unallocated; a breakdown larger than CTC is shown as a shortfall." },
        { heading: "Tax, PF, and professional tax", body: "The tax estimate uses the new regime for AY 2026–27, for income earned in FY 2025–26. The separate tax-regime comparison covers both regimes for this same assessment year. Professional tax is entered manually and reduces cash, but is not deducted from taxable income. PF contributions are entered manually; no rate or wage base is inferred." },
        { heading: "Limits", body: "The estimate does not model special-rate income, a complete tax return, every exemption, state professional-tax schedules, employer-specific PF policy, or TDS timing. It is educational context, not tax or payroll advice." },
      ],
      relatedLinks: [{ href: publicPath("/salary-calculator"), label: "Open the CTC calculator" }],
    },
    "/sources": {
      lead: "A source label is not enough. This page lists official materials opened for the CTC estimate and explains why unlinked market records remain unpublished.",
      sections: [
      { heading: "Official sources opened 9 October 2026", html: `<ul>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: salaried-individual tax and return guidance</a> — official starting point for AY 2026–27.</li>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: Salaried Individuals for AY 2026–27</a> — regime options and salary-tax context.</li>
          <li>The Department distinguishes AY 2026–27, for income earned in FY 2025–26 under the 1961 Act, from Tax Year 2026–27 under the 2025 Act, which begins for income earned from 1 April 2026.</li>
          <li><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment press release</a> — revised ₹25,000 monthly EPFO coverage/contribution ceiling, effective 17 September 2026.</li>
          <li><a href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">Employees' Provident Fund Organisation: wage-ceiling FAQ</a> — retrieved from the official EPFO CDN on 9 October 2026.</li>
        </ul><p>The official FAQ describes the ₹25,000 monthly ceiling effective 17 September 2026, contribution examples and rates, and says CTC is not by itself the statutory basis for PF liability. Exact application of the statutory wage definition to offer components and individual membership cases still requires qualified payroll review. PF amounts therefore remain manual; no rate or wage base is inferred by the calculator.</p>` },
        { heading: "Market-data status", body: "The reviewed export contained 392 market rows without a source URL. They remain classified as legacy and are not used for public company or salary signals in this local build. No database rows were changed." },
      ],
    },
    "/privacy-policy": {
      lead: "This privacy notice describes observed product behavior, not a complete or owner-approved privacy policy. No legal entity name is published. Contact hello@careerreality.in with a privacy question.",
      sections: [
        { heading: "Public calculator inputs", body: "The CTC calculator runs its calculation in the browser. The inspected page does not add amounts to the URL or send calculator inputs to the API. Its event calls contain event names and route or catalogue labels, not salary amounts. Deployment-level analytics configuration was not verified." },
        { heading: "Layoff alert subscriptions", body: "Layoff alert subscriptions store an email address, an email hash, optional city and sector preferences, confirmation status, and the token hashes and timestamps needed to manage confirmation and unsubscribe links. Resend delivers confirmation and alert emails. Alerts start only after double opt-in and include Confirmed or Reported events, never Rumours. Unsubscribe changes the record to an unsubscribed status so it is no longer eligible for alerts; the database record remains, and a separate retention period has not been established." },
        { heading: "Other application data", body: "The wider application includes sign-in, saved-workspace features, profile records, and resume-processing routes. Retention, deletion, vendors, backups, and data-request processes were not verified for this review." },
        { heading: "Privacy questions", body: "Contact hello@careerreality.in. A form receipt confirms that a message was recorded; it does not promise review or a response time. Do not send credentials or confidential documents." },
      ],
    },
    "/terms": {
      lead: "CareerReality provides educational tools and editorial guidance, not individualized legal, tax, financial, or employment advice. No legal entity name is published.",
      sections: [
        { heading: "Use limits", body: "Check every estimate against current official rules and your written documents. A tool output is arithmetic based on entered values, not a payroll promise, professional recommendation, or guaranteed result." },
        { heading: "Operator information", body: "This page is not a complete legal agreement. The site does not publish a legal entity name. Contact hello@careerreality.in with questions." },
      ],
    },
  };
  return trustContent[route];
}

function getReleaseTrustSnapshotContent(route: string): SnapshotContent | undefined {
  const content: Record<string, SnapshotContent> = {
    "/about": {
      lead: "CareerReality publishes practical career decision tools and editorial guides. Operator: Doffysoft pvt. Limited.",
      sections: [
        { heading: "Current public scope", body: "The public site includes career decision tools, an employer due-diligence checklist, and editorial guides. No employer score or private-sector salary benchmark is published." },
        { heading: "Operator and contact", body: "Address: Hinjewadi Phase 3, Pune. Contact hello@careerreality.in." },
      ],
    },
    "/editorial": {
      lead: "CareerReality separates source-backed claims from editorial interpretation, user-entered assumptions, and questions that remain unresolved.",
      sections: [
        { heading: "Evidence before conclusion", body: "Legal, tax, payroll, and market claims require a relevant source, an access date when known, and a clear statement of scope. If a source does not support a claim, the claim is removed, qualified, or withheld." },
        { heading: "Authorship and review", body: "Authorship, review, publication dates, and substantive updates are identified where available. Source links identify references used; they do not by themselves mean a source author reviewed the page." },
        { heading: "Interpretation and uncertainty", body: "Editorial framing, checklists, and prompts are not reported facts. A source date appears only when stated in the preserved note. A missing result is not evidence of safety, demand, or a future outcome." },
      ],
    },
    "/team": {
      lead: "Shiv Mishra — Doffysoft pvt. Limited.",
      sections: [
        { heading: "Affiliation", body: "Shiv Mishra — Doffysoft pvt. Limited." },
      ],
    },
    "/corrections": {
      lead: "Email hello@careerreality.in to report an error or request a correction. No response-time promise is made.",
      sections: [
        { heading: "Public correction entries", body: "When a material correction is made, the affected claim, change, and supporting evidence are described here." },
        { heading: "What to include", body: "Identify the page and claim, explain what appears wrong, and include a supporting public source where possible. Do not send credentials or confidential documents." },
        { heading: "Correction details", body: "A correction entry identifies the page, the corrected claim, what changed, the change date, and supporting evidence." },
      ],
      relatedLinks: [{ href: publicPath("/contact"), label: "Send a correction request" }],
    },
    "/contact": {
      lead: "Use hello@careerreality.in for general queries, corrections, privacy requests, security reports, press, or complaints. No response-time promise is made.",
      sections: [
        { heading: "Email", html: '<p><a href="mailto:hello@careerreality.in">hello@careerreality.in</a></p><p>Operator: Doffysoft pvt. Limited. Address: Hinjewadi Phase 3, Pune.</p>' },
        { heading: "Contact route", body: "Email is the only published contact route. Do not include account credentials, resumes, confidential work documents, or sensitive personal information." },
      ],
    },
    "/methodology": {
      lead: "Each tool states what it calculates, which values it expects, and what it cannot establish. Entered values remain in the browser unless a page explicitly submits them.",
      sections: [
        { heading: "Offer, tax, and salary worksheets", body: "Offer comparison separates fixed cash from target variable pay. Tax-regime comparison estimates old and new salary-only tax for AY 2026–27 from the entered salary and deduction assumptions; compare its results with the current Income Tax Department calculator. Salary evidence comparison uses only amounts entered by the visitor and does not publish a private-sector benchmark." },
        { heading: "Gratuity worksheet", body: "The limited monthly-rate illustration uses 15/26 of the stated wage base, exact-month pro-rata arithmetic for fixed-term expiry and deceased employees, and the greater-than-six-month rounding rule for ordinary service and disablement. The Ministry FAQ published 30 December 2025 states a ₹20 lakh maximum as then current. The March 2026 FAQ states that the revised wage definition applies from 21 November 2025. It does not model piece-rated or seasonal cases, decide eligibility, or establish the applicable wage base." },
        { heading: "Cash and decision worksheets", body: "The notice and leave worksheet uses the daily-rate divisor and days entered by the visitor. The runway planner divides stated funds by stated monthly costs and predicts no re-employment date. The home-loan stress test uses standard EMI arithmetic at entered rates and term. The resign-or-stay worksheet displays visitor-entered weighted values and makes no recommendation." },
        { heading: "Employer checklist and limits", body: "The employer checklist prompts visitors to verify legal identity, official filings, employment terms, and role details. It creates no company record, rating, financial-health claim, or job-security estimate. These tools are educational worksheets, not tax, payroll, legal, investment, credit, or employment advice." },
      ],
      relatedLinks: [{ href: publicPath("/tools"), label: "Browse all tools" }],
    },
    "/sources": {
      lead: "Official sources support the tool references shown here. Guides provide editorial framing and practical prompts.",
      sections: [
        { heading: "Official tools and due-diligence sources", html: `<ul>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: salaried-individual tax and return guidance</a>.</li>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: Salaried Individuals for AY 2026–27</a>.</li>
          <li>The Department distinguishes AY 2026–27 for income earned in FY 2025–26 from Tax Year 2026–27 under the 2025 Act, which begins for income earned from 1 April 2026.</li>
          <li><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment press release</a> — revised EPFO ceiling and contribution split.</li>
          <li><a href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">Employees' Provident Fund Organisation wage-ceiling FAQ</a>.</li>
          <li><a href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: Additional FAQs on Labour Codes, 16 March 2026</a>.</li>
          <li><a href="https://www.indiacode.nic.in/indiacode/bitstream/123456789/16823/1/aA2020-36.pdf" target="_blank" rel="noopener noreferrer">India Code: Code on Social Security, 2020</a>.</li>
          <li><a href="https://www.mca.gov.in/content/mca/global/en/mca/master-data.html" target="_blank" rel="noopener noreferrer">Ministry of Corporate Affairs: master-data services</a>.</li>
          <li><a href="https://www.nseindia.com/companies-listing/corporate-filings-announcements" target="_blank" rel="noopener noreferrer">National Stock Exchange: corporate filings and announcements</a>.</li>
        </ul><p>The CTC calculator's official tax and EPFO references were checked 9 October 2026. The links are starting points; they do not establish that a source applies to a particular employment relationship.</p><p><a href="${escapeHtml(publicPath("/sources.json"))}">Download the machine-readable trust sources register</a>.</p>` },
        { heading: "Guide limits", body: "Guides provide editorial framing and practical prompts. They do not establish current legal, tax, compensation, or job-market facts; verify those claims against an official source for the specific rule." },
      ],
    },
    "/privacy-policy": {
      lead: "This notice explains information handled when you use CareerReality's tools, contact the team, or sign in. For privacy requests, email hello@careerreality.in.",
      sections: [
        { heading: "Decision-tool inputs", body: "Pure calculation worksheets run on your device. In salary-calculator checks, entered amounts were not sent off the device or placed in the web address. Account and live-data features may send information to the services they need." },
        { heading: "Contact messages", body: "The contact form is closed; use email instead. The former form stored a name, email address, topic, message, and submission time. The production records checked on 2 November 2026 contained no contact submissions. No retention period is established for copies in backups or logs." },
        { heading: "Layoff alert subscriptions", body: "Layoff alert subscriptions store an email address, an email hash, optional city and sector preferences, confirmation status, and the token hashes and timestamps needed to manage confirmation and unsubscribe links. Resend delivers confirmation and alert emails. Alerts start only after double opt-in and include Confirmed or Reported events, never Rumours. Unsubscribe changes the record to an unsubscribed status so it is no longer eligible for alerts; the database record remains, and a separate retention period has not been established." },
        { heading: "Account and sign-in", body: "Clerk provides sign-in and session authentication on sign-in, sign-up, and account-required pages. The public pages reviewed here did not load Clerk. When you sign in, your browser contacts Clerk through CareerReality's website; this involves account identity and session information. Signed-in features store profile fields and career-brief history in CareerReality's systems." },
        { heading: "Fonts, cookies, and email", body: "Fonts are served from CareerReality's own site. The six public pages checked did not load Google Fonts or an analytics provider. The site host sets a cookie named GAESA that expires after 30 days. CareerReality does not read this cookie, and its purpose is not identified here. Resend delivers layoff-alert email after double opt-in." },
        { heading: "Requests and staged law", body: "Email hello@careerreality.in to request access, correction, or deletion. No response time is promised. No retention period is established for contact-form backups or unsubscribed alert records. As of 2 November 2026, DPDP Act sections 3–17 and Rules 3, 5–16, 22–23 are scheduled for 13 May 2027; Act section 6(9), section 27(1)(d), and Rule 4 are scheduled for 13 November 2026. Rules 1, 2, and 17–21 have applied since 13 November 2025. This is a date-based summary, not legal advice." },
      ],
    },
    "/terms": {
      lead: "CareerReality's tools and guides provide general educational information, not individualized professional advice. Operator: Doffysoft pvt. Limited.",
      sections: [
        { heading: "Tools and guides", body: "Calculations use the inputs and assumptions shown on each page. Results may not reflect your complete tax, payroll, legal, financial, or employment situation. No tool predicts hiring, job security, market pay, or a guaranteed outcome." },
        { heading: "Verify before acting", body: "Check written offer terms, current official rules, and source dates that apply to your case. Do not treat a target bonus, employer checklist, guide, or worksheet as a promise or professional recommendation." },
        { heading: "Operator details", body: "Address: Hinjewadi Phase 3, Pune. Governing law: India. Contact hello@careerreality.in." },
      ],
    },
    "/accessibility": {
      lead: "Accessibility checks cover automated page rules and keyboard navigation on selected public pages. These checks are not a WCAG conformance audit.",
      sections: [
        { heading: "Accessibility checks", body: "On 2 November 2026, axe-core 4.10.3 checked 11 public trust pages at 1440 × 900 and 390 × 844 against WCAG 2.0, 2.1, and 2.2 A/AA rules. It found no automated violations; one check per page needs manual review. Keyboard Tab navigation showed a visible focus indicator on the first link on each page. These checks do not assess every success criterion, screen-reader behavior, or native mobile use. No conformance level is claimed." },
        { heading: "Known issues", body: "No automated violations were found in this sample. Manual review and assistive-technology testing remain incomplete." },
        { heading: "Report a barrier", html: '<p>Email <a href="mailto:hello@careerreality.in">hello@careerreality.in</a> with the page, device/browser, assistive technology if relevant, and the barrier. No response deadline is promised.</p>' },
      ],
    },
    "/security": {
      lead: "Report a security concern to hello@careerreality.in. Do not include credentials, personal data, or destructive exploit details.",
      sections: [
        { heading: "Responsible reporting", body: "Include the affected URL, impact, and safe reproduction steps. Do not access or alter another person's data, disrupt service, or use social engineering. Stop once the issue is demonstrated." },
        { heading: "Disclosure limits", body: "No response-time, bounty, or safe-harbor commitment is made. Coordinate before public disclosure." },
        { heading: "Machine-readable contact", html: '<p><a href="/.well-known/security.txt">View security.txt</a></p>' },
      ],
    },
  };
  return content[route];
}

function renderRouteContent(route: string, meta: StaticRouteMeta): SnapshotContent {
  if (route === "/interview-guides" || route.startsWith("/interview-guides/")) {
    return renderInterviewGuideSnapshotContent(route, meta);
  }

  const trustContent = getReleaseTrustSnapshotContent(route) ?? getTrustSnapshotContent(route);
  if (trustContent) return trustContent;

  if (route === "/") {
    const tools = routeRegistry.routes.filter((entry) => entry.kind === "tool" && entry.sitemap).slice(0, 5);
    const guides = routeRegistry.routes.filter((entry) => entry.kind === "guide" && entry.sitemap).slice(0, 5);
    const recentEvents = layoffEvents
      .filter((event) => event.status === "Confirmed" || event.status === "Reported")
      .sort((a, b) => b.date.localeCompare(a.date) || b.sourcePublishedAt.localeCompare(a.sourcePublishedAt))
      .slice(0, 3);
    const recentEventRows = recentEvents.map((event) =>
      `<li><a href="${escapeHtml(publicPath(`/layoffs/${event.slug}`))}">${escapeHtml(event.company)}</a> — ${escapeHtml(event.status)} · ${escapeHtml(formatSnapshotDate(event.date))}<br>${escapeHtml(event.summary)} <a href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.sourceLabel)} source</a></li>`,
    ).join("");
    const lastUpdated = layoffEvents.reduce((latest, event) => event.updatedAt > latest ? event.updatedAt : latest, "");
    return {
      lead: "CareerReality helps Indian professionals look beyond an offer headline—at money, the work, the evidence, and the life around it. Start with what you can check.",
      sections: [
        { heading: "Layoff support and sourced updates", body: "Recent dated reports are historical source records, not a current headcount, job-safety signal, prediction, or advice to act. Rumours are excluded; check each source date and scope." },
        { heading: "Latest sourced event records", html: `<p>Data reviewed through ${escapeHtml(formatSnapshotDate(lastUpdated))}.</p><ul>${recentEventRows}</ul><p><a href="${escapeHtml(publicPath("/layoffs"))}">Open the Layoff Hub</a> · <a href="${escapeHtml(publicPath("/layoff-runway"))}">Plan a cash runway</a> · <a href="${escapeHtml(publicPath("/layoffs"))}#email-alerts">Request sourced email alerts</a></p>` },
        { heading: "Start with a decision tool", html: `<ul>${tools.map((entry) => `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.description)}</li>`).join("")}</ul>` },
        { heading: "Read a sourced guide", html: `<ul>${guides.map((entry) => `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.description)}</li>`).join("")}</ul>` },
        { heading: "Browse CareerReality", html: `<ul><li><a href="${escapeHtml(publicPath("/tools"))}">All tools</a></li><li><a href="${escapeHtml(publicPath("/guides"))}">All guides</a></li><li><a href="${escapeHtml(publicPath("/rules"))}">Rules and Data Library</a></li><li><a href="${escapeHtml(publicPath("/companies"))}">Employer due-diligence checklist</a></li><li><a href="${escapeHtml(publicPath("/sources"))}">Sources and data</a></li></ul>` },
      ],
    };
  }

  if (route === "/tools") {
    const tools = routeRegistry.routes.filter((entry) => entry.kind === "tool" && entry.sitemap);
    return {
      lead: "Work through an offer, a cash decision, or a change in direction. Each tool uses visible inputs and states what it cannot establish.",
      sections: [{
        heading: "Registered tools",
        html: `<ul>${tools.map((entry) => `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.description)}</li>`).join("")}</ul>`,
      }, { heading: "Official rules and data", html: `<p><a href="${escapeHtml(publicPath("/rules"))}">Browse the Rules and Data Library</a> for dated official-source summaries related to compensation, leave, and payroll.</p>` }],
    };
  }

  if (route === "/guides") {
    const guides = routeRegistry.routes.filter((entry) => entry.kind === "guide" && entry.sitemap);
    return {
      lead: "Read practical guides on compensation, career changes, engineering work, layoffs, and workplace decisions. Each page distinguishes editorial prompts from facts that still need official verification.",
      sections: [{
        heading: "The reading room",
        html: `<ul>${guides.map((entry) => `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.description)}</li>`).join("")}</ul>`,
      }, { heading: "Official rules and data", html: `<p><a href="${escapeHtml(publicPath("/rules"))}">Browse the Rules and Data Library</a> for current official-source summaries that help verify employment and payroll questions.</p>` }],
    };
  }

  if (route === "/rules") {
    return {
      lead: "A small reference library built from official sources opened for this release. Each page states what was verified, when it was checked, and where individual or state-specific facts may change the result.",
      sections: [{
        heading: "Official rule summaries",
        html: `<ul>${rulesLibraryData.pages.map((page) => `<li><a href="${escapeHtml(publicPath(page.path))}">${escapeHtml(page.title)}</a> — ${escapeHtml(page.description)}</li>`).join("")}</ul>`,
      }],
    };
  }

  const rulesPage = rulesLibraryData.pages.find((page) => page.path === route);
  if (rulesPage) {
    const copy = rulesLibraryContent[route];
    if (!copy) throw new Error(`Missing hand-authored rules content for ${route}`);
    const tableRows = rulesPage.rows.map(([label, value]) =>
      `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    ).join("");
    const officialSources = rulesPage.sources.map((source) =>
      `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`,
    ).join("");
    const authoredSections = copy.sections.map((section) =>
      `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></section>`,
    ).join("");
    const faqItems = copy.faqs.map((faq) =>
      `<div><dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd></div>`,
    ).join("");
    return {
      lead: rulesPage.intro,
      sections: [
        { heading: `Rule summary · verified ${rulesPage.verified}`, html: `<p class="snapshot-table-hint">Scroll horizontally to view all columns on small screens.</p><div class="snapshot-table-wrap" role="region" aria-label="Scrollable rules summary table" tabindex="0"><table><thead><tr><th scope="col">Topic</th><th scope="col">Official summary</th></tr></thead><tbody>${tableRows}</tbody></table></div>` },
        { heading: "What changed since last year", body: rulesPage.change },
        { heading: "In plain language", body: rulesPage.plainLanguage },
        ...copy.sections.map((section) => ({ heading: section.heading, body: section.body })),
        { heading: "Questions to check", html: `<dl>${faqItems}</dl>` },
        { heading: "Official sources", html: `<ul>${officialSources}</ul>` },
      ],
      relatedLinks: rulesPage.related.map((item) => ({ href: publicPath(item.url), label: item.label })),
    };
  }

  if (route === "/companies") {
    const sourceById = new Map(verificationSources.map((source) => [source.id, source]));
    const renderSourceLink = (id: string) => {
      const source = sourceById.get(id);
      return source
        ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`
        : "";
    };
    const stepHtml = verificationSteps.map((step, index) => `
      <div class="snapshot-check">
        <h3>${String(index + 1).padStart(2, "0")} / ${escapeHtml(step.title)}</h3>
        <p><strong>Why this matters:</strong> ${escapeHtml(step.why)}</p>
        <h4>What to do</h4>
        <ol>${step.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ol>
        <p><strong>What a match can look like:</strong> ${escapeHtml(step.match)}</p>
        <p><strong>What a mismatch can look like:</strong> ${escapeHtml(step.mismatch)}</p>
        <p><strong>Next step:</strong> ${escapeHtml(step.next)}</p>
        ${step.sourceIds.length ? `<p><strong>Official sources:</strong> ${step.sourceIds.map(renderSourceLink).join(" · ")}</p>` : ""}
      </div>`).join("");
    const questionHtml = audiences.map((audience) => `
      <div><h3>${escapeHtml(audience)}</h3><ol>${questionBank[audience].map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ol></div>`).join("");
    const employerTypeHtml = employerTypeGuide.map((item) =>
      `<tr><th scope="row">${escapeHtml(item.type)}</th><td>${escapeHtml(item.note)}</td></tr>`,
    ).join("");
    const faqHtml = companyFaqItems.map(({ q, a }) =>
      `<div><dt>${escapeHtml(q)}</dt><dd>${escapeHtml(a)}</dd></div>`,
    ).join("");
    const sourceRows = verificationSources.map((source) =>
      `<tr><th scope="row">${renderSourceLink(source.id)}</th><td>${escapeHtml(source.purpose)}</td><td>${escapeHtml(source.checkedOn)}</td><td>${escapeHtml(source.check)}</td></tr>`,
    ).join("");
    return {
      lead: "Ten minutes to ask better questions. This private, browser-only guide helps Indian job seekers verify the legal employer, check the offer, and keep unanswered questions visible. It publishes no company rating, score, safety label, or verdict.",
      sections: [
        { heading: "Begin with ten minutes and a clear boundary", body: "Enter only information you are comfortable reviewing in this browser. The live checklist holds your employer name, identifier, domains, role, location, answers, notes, and pasted recruiter text in page memory only. It does not send those entries to an API, place them in a URL, save them to browser storage, or attach them to analytics. Each check can be marked Verified, Mismatch, or Couldn't verify, with a private note; a reload clears the current entries. The local format helper and message scanner are prompts for your own review, not registry lookups or fraud findings." },
        { heading: "Seven guided checks", html: stepHtml },
        { heading: "If someone requested money", html: `<p>Contact your bank or payment provider promptly through a phone number or app you independently know is official. For suspected financial cyber fraud in India, the official Cyber Crime Portal source advises calling <strong>1930 promptly</strong> and reporting through its portal. Preserve messages, transaction references, dates, and account details. No response time or outcome is promised here.</p><ul><li>${renderSourceLink("cybercrime-portal")} — the destination and current instructions could not be independently verified on the listed date. Confirm the official portal before relying on its guidance.</li><li>${renderSourceLink("cybercrime-job-advisory")} — the document could not be independently verified on the listed date. Confirm its current contents before relying on it.</li><li>Report the recruiter or listing through the platform where you found the job, and preserve the listing URL and messages.</li></ul><p>Never share an OTP or password with a recruiter. Stop and independently verify any payment request.</p>` },
        { heading: "A local message check, not a diagnosis", body: "The interactive page checks wording about recruitment or interview fees, personal transfers, OTPs and passwords, equipment purchases, cheque forwarding, guaranteed selection, urgency, unpaid training, early identity-document requests, remote-access apps, crypto or gift cards, and unusually high salary claims. It compares entered email and website domains for exact or subdomain matches, common free-mail services, text lookalikes, and suffixes outside a small reference list. These rules run in the browser. A match is a reason to verify; no match does not establish that an offer is genuine." },
        { heading: "Questions by audience", html: questionHtml },
        { heading: "Employer-type guide", html: `<table><thead><tr><th scope="col">Employer type</th><th scope="col">What to verify or ask</th></tr></thead><tbody>${employerTypeHtml}</tbody></table><p>For registrations that are not publicly searchable, ask the exact employing entity, the applicable code, issuing state, and whether the registration applies to this role and work location. An absent search result is not proof of wrongdoing.</p>` },
        { heading: "Evidence signals and pause points", html: "<div><h3>Useful evidence to collect</h3><ul><li>The offer, legal entity, and recruiter can be confirmed independently.</li><li>Role, manager, work location, pay structure, and start conditions are consistent in writing.</li><li>HR answers reasonable questions without asking for a fee, OTP, password, or remote access.</li><li>Identifiers and official records align with the entity and location claimed.</li></ul></div><div><h3>Reasons to pause and verify</h3><ul><li>Money is requested for an interview, job, equipment, or training.</li><li>Urgency is used to stop independent verification.</li><li>A personal transfer, credential, OTP, or remote-access request is made.</li><li>The employer identity, scope, manager, or work location changes repeatedly.</li><li>A record may describe a different entity; check identity before drawing a conclusion.</li></ul></div><p>Signals are questions, not proof or a company verdict.</p>" },
        { heading: workedExample.title, body: workedExample.text },
        { heading: "Offer and document checklist", html: `<ul><li>Legal employer on the offer, the legal name behind the brand, and who pays salary.</li><li>Role, responsibilities, manager, location, work mode, and travel expectations.</li><li>Fixed and variable pay, payout conditions, benefits, deductions, probation, and review cycle.</li><li>Joining date, notice, termination terms, and any bond or repayment clause.</li><li>For agency or contractor work: client, assignment period, employer responsibilities, and end-of-assignment terms.</li><li>Secure document-submission route; never share a password, OTP, or unnecessary financial data.</li></ul><p>Related CareerReality resources: <a href="${escapeHtml(publicPath("/salary-calculator"))}">compare take-home pay</a>, <a href="${escapeHtml(publicPath("/resign-or-stay"))}">think through a career move</a>, <a href="${escapeHtml(publicPath("/layoff-runway"))}">plan a financial runway</a>, and <a href="${escapeHtml(publicPath("/guides"))}">browse career guides</a>.</p>` },
        { heading: "Small glossary", html: "<dl><div><dt>CIN</dt><dd>Corporate Identity Number for a company record. The page's common-shape helper does not validate an MCA registration.</dd></div><div><dt>LLPIN</dt><dd>Limited Liability Partnership Identification Number. Confirm the exact identifier through MCA.</dd></div><div><dt>Legal employer</dt><dd>The entity that formally employs and pays you; it may differ from the brand, staffing partner, or client location.</dd></div><div><dt>Establishment code</dt><dd>An identifier associated with an establishment record; confirm the entity and location it applies to.</dd></div><div><dt>Lookalike domain</dt><dd>Text resembling another web or email domain. Similarity is a prompt to verify, not proof of who sent a message.</dd></div></dl>" },
        { heading: "Questions people ask", html: `<dl>${faqHtml}</dl>` },
        { heading: "Official source register", html: `<p>The date shows when each destination was reviewed. Notes explain what was confirmed and what still needs checking; a source record is not a guarantee that every page or service will remain available.</p><div class="snapshot-table-wrap" role="region" aria-label="Scrollable official source register" tabindex="0"><table><thead><tr><th scope="col">Source</th><th scope="col">Use it for</th><th scope="col">Checked</th><th scope="col">Check and limitation</th></tr></thead><tbody>${sourceRows}</tbody></table></div>` },
      ],
      relatedLinks: [
        { href: publicPath("/guides/getting-hired-through-evidence-and-conversations"), label: "Prepare hiring questions" },
        { href: publicPath("/guides/notice-period-and-return-to-office"), label: "Check written job terms" },
      ],
    };
  }

  if (route === "/about") {
    return {
      lead: "CareerReality publishes practical tools and editorial guides for career decisions in India. Contact hello@careerreality.in. No legal entity name is published.",
      sections: [
        { heading: "Current public scope", body: "The public site includes calculation worksheets, an employer due-diligence checklist, and 18 editorial guides assembled from 44 preserved article drafts. The original drafts remain archived. No employer score or private-sector salary benchmark is published." },
        { heading: "People and contact", body: "No owner-approved individual author or reviewer record is available for publication. No legal entity name is published. Contact hello@careerreality.in." },
      ],
    };
  }

  if (route === "/editorial") {
    return {
      lead: "CareerReality separates source-backed facts, editorial interpretation, assumptions, and uncertainty.",
      sections: [
        { heading: "Authorship and review", body: "Author, reviewer, original publication date, and substantive update details are published only when supported by owner-approved records. No independent review is implied without a record of an actual review. Source links do not establish authorship or review." },
        { heading: "Evidence limits", body: "Source links identify the material used. Historical publication and review dates are not recorded when they cannot be verified; no independent review is implied." },
      ],
    };
  }

  if (route === "/contact") {
    return {
      lead: "Email hello@careerreality.in or use the form for a correction, privacy request, or general message.",
      sections: [
        { heading: "Email", html: '<p><a href="mailto:hello@careerreality.in">hello@careerreality.in</a></p>' },
        { heading: "Form receipt", body: "A receipt confirms that the message was recorded; it does not promise review or a response time." },
      ],
    };
  }

  if (route === "/team") {
    return {
      lead: "Individual author and reviewer details are not published because the available records do not verify those attributions.",
      sections: [
        { heading: "Attribution status", body: "Individual author and reviewer names, roles, and biographies are not published because the available records do not verify those details." },
      ],
    };
  }

  if (route === "/sitemap") {
    return {
      lead: "This human sitemap is generated from the route registry. It lists only routes marked indexable and eligible for the sitemap.",
      sections: sitemapSections.map((group) => ({
        heading: group.label,
        html: `<ul>${group.items.map((entry) => `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${escapeHtml(entry.description)}</li>`).join("")}</ul>`,
      })),
    };
  }

  if (route === "/search") {
    return {
      lead: "Search the active calculator and current site pages. Quarantined articles and unverified company records are not included.",
      sections: [
        { heading: "Active tool", html: `<ul>${Object.entries(staticToolGuidance).map(([href, description]) => `<li><a href="${escapeHtml(publicPath(href))}">${escapeHtml(staticRouteMeta[href]?.title ?? href)}</a><span> — ${escapeHtml(description)}</span></li>`).join("")}</ul>` },
      ],
    };
  }

  if (route === "/salary-calculator") {
    return {
      lead: "A CTC headline is not a monthly salary. Separate fixed cash and target variable pay from employer-paid items, then estimate income tax using verified new-regime rules and enter PF from your offer or payroll.",
      sections: [
        { heading: "Illustrative worked examples", html: renderCtcWorkedExamples() },
        { id: "method", heading: "How the estimate works", body: "For Tax Year 2026–27, the model estimates ordinary salary income for a resident individual under age 60 in the new regime. It applies the standard deduction, rebate and marginal relief, surcharge rules, and 4% cess. Professional tax reduces cash but is entered from payroll or a verified state schedule. PF can be entered manually, or estimated month by month from a user-entered start date. The statutory ceiling is ₹15,000 through 16 September 2026 and ₹25,000 from 17 September; September is split by the official 16/14-day periods. Calculated employer shares use 8.33% EPS and the balance to EPF, subject to eligibility. Employer contributions count toward CTC only when marked included. Gratuity and other costs are not inferred." },
        { heading: "Limits to the estimate", body: "This is not a payslip, tax filing, or approved payroll guidance. It excludes special-rate income, exemptions not entered, other income, employer-specific treatment, and exact payroll rules. The employment start date affects the PF estimate only, not income tax or other annual salary amounts. Verify membership and contribution treatment with qualified payroll advice." },
        { heading: "Official references", html: `<ul>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: salaried-individual tax and return guidance</a></li>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: Salaried Individuals for AY 2026–27</a></li>
          <li><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: revised ₹25,000 monthly EPFO ceiling and contribution split</a> — effective 17 September 2026</li>
          <li><a href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">Employees' Provident Fund Organisation: wage-ceiling FAQ</a> — questions 7 and 9 show September contribution examples and the transition-period calculation.</li>
        </ul><p>The official EPFO FAQ and Ministry release describe the ₹15,000 ceiling through 16 September 2026, ₹25,000 from 17 September, and separate September contribution periods of 16 and 14 days. The calculator uses a user-entered employment start date and is not an approved payroll result. Verify membership, contribution treatment, and employer-specific rules with qualified payroll advice. Professional tax is entered manually.</p>` },
        { heading: "Questions worth checking", html: `<dl>${(staticToolFaqs[route] ?? []).map((faq) => `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`).join("")}</dl>` },
      ],
      relatedLinks: [
        { href: publicPath("/tools"), label: "Browse the active tools" },
      ],
    };
  }

  if (route === "/escape-plan") {
    const actionCounts = new Set(escapePlanGoals.map((goal) => getEscapePlanTasks(goal).length));
    const actionCount = actionCounts.size === 1 ? `${actionCounts.values().next().value}-action` : "goal-specific";
    const taskLists = escapePlanGoals.map((goal) =>
      `<h3>${escapeHtml(goal)}</h3><ul>${getEscapePlanTasks(goal).map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>`,
    ).join("");
    return {
      lead: `Choose a goal and build a session-only checklist with a time budget. Each goal has a ${actionCount} checklist. The total is arithmetic; it does not estimate job-search odds or resignation readiness.`,
      sections: [
        { heading: "Checklist examples", html: taskLists },
        { heading: "Limits and persistence", body: "Progress and selected inputs exist only in the current page state; refreshing clears them. Completing the checklist does not predict hiring, job-search success, or readiness to resign." },
        ...routeFaqSections(route),
      ],
    };
  }

  if (route === "/career-reality-index") {
    const reflection = createCareerRealityIndexReflection({
      pay: "Not answered",
      stability: "Not answered",
      optionality: "Not answered",
      ai: "Not answered",
    });
    return {
      lead: "The check displays four self-reported responses with the same fixed reflection. Responses are not added, ranked, weighted, or converted into a score.",
      sections: [
        { heading: "What the check asks about", html: "<ul><li>Current pay</li><li>Company confidence</li><li>Ability to move</li><li>AI readiness</li></ul>" },
        { heading: "What it can and cannot establish", body: `${reflection.truth} ${reflection.lever} ${reflection.next}` },
        { heading: "Questions to consider", html: `<ul>${reflection.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>` },
        ...routeFaqSections(route),
      ],
    };
  }

  if (route === "/ai") {
    return {
      lead: "Use task-level questions to investigate where AI fits into team workflows. Examples are editorial prompts, not measured exposure or a forecast.",
      sections: [
        { heading: "What this tool is for", body: "Start with a specific task, then ask what is automated, who reviews the result, and who remains accountable for decisions." },
        { heading: "Method and limits", body: "The examples are not a role-level score, an exposure measurement, or a prediction about a person's employment." },
        ...routeFaqSections(route),
      ],
    };
  }

  if (route === "/tools") {
    return {
      lead: meta.description,
      sections: [
        {
          heading: "Question this tool answers",
          body: "What might reach your account each month after the offer's fixed pay, target variable pay, employer-side costs, employee PF, professional tax, and estimated income tax are separated?",
        },
        {
          heading: "Active tool",
          html: `<ul>${Object.entries(staticToolGuidance).map(([href, description]) => `<li><a href="${escapeHtml(publicPath(href))}">${escapeHtml(staticRouteMeta[href]?.title ?? href)}</a><span> — ${escapeHtml(description)}</span></li>`).join("")}</ul>`,
        },
        { heading: "Illustrative scenarios", html: renderCtcWorkedExamples() },
        { heading: "Source review", body: "The official EPFO FAQ and Ministry of Labour and Employment release document the 17 September 2026 ceiling transition and September split. Qualified tax/payroll review is still pending, so results remain estimates and the calculator is noindex." },
        { heading: "Limits", body: "This estimate is not a payslip, tax filing, payroll promise, or professional advice. Enter only figures shown in the offer or payslip; the calculator does not infer employer policies or state professional-tax rates." },
      ],
    };
  }

  const routePolicy = routeRegistry.routes.find((entry) => entry.path === route);
  if (routePolicy?.component === "toolSuite" || routePolicy?.component === "companyDueDiligence") {
    const toolId = routePolicy.toolId;
    const sourceLinks = toolId === "employer-due-diligence"
      ? `<li><a href="https://www.mca.gov.in/content/mca/global/en/mca/master-data.html" target="_blank" rel="noopener noreferrer">Ministry of Corporate Affairs: master-data services</a></li><li><a href="https://www.nseindia.com/companies-listing/corporate-filings-announcements" target="_blank" rel="noopener noreferrer">National Stock Exchange: corporate filings and announcements</a></li>`
      : toolId === "tax-regime-comparison"
        ? `<li><a href="https://www.incometaxindia.gov.in/w/tax-rates%E2%80%8B" target="_blank" rel="noopener noreferrer">Income Tax Department: tax rates for AY 2026–27</a></li><li><a href="https://www.incometaxindia.gov.in/w/deductions-allowable-to-tax-payer" target="_blank" rel="noopener noreferrer">Income Tax Department: AY 2026–27 deductions, including salary standard deduction</a></li><li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: salaried individuals and deductions</a></li><li><a href="https://www.incometaxindia.gov.in/income-tax-calculator" target="_blank" rel="noopener noreferrer">Income Tax Department: official tax calculator</a></li>`
      : toolId === "gratuity-estimator"
        ? `<li><a href="https://www.labour.gov.in/static/uploads/2026/01/9fb60321f0028fc2fe08d3b3d8626dd7.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: FAQs on Labour Codes (30 December 2025), including gratuity amount and ceiling</a></li><li><a href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: Additional FAQs on Labour Codes, 16 March 2026 (wage definition)</a></li><li><a href="https://www.indiacode.nic.in/indiacode/bitstream/123456789/16823/1/aA2020-36.pdf" target="_blank" rel="noopener noreferrer">India Code: Code on Social Security, 2020</a></li>`
        : "";
    const worksheetName = toolId === "employer-due-diligence" ? "checklist" : "worksheet";
    const method = toolId === "employer-due-diligence"
      ? "Organizes checks for an employer's legal identity, available official filings, written offer terms, and role-specific questions. It provides no rating, score, or claim that an employer is safe."
      : toolId === "offer-comparison"
      ? "Runs both written pay breakdowns through the shared CTC model. It separates fixed pay, zero-variable take-home, full-target take-home, employer-side CTC components, and entered first-year clawback, notice, relocation, and commute costs. It does not assign an aggregate score or predict variable payout."
      : toolId === "tax-regime-comparison"
        ? "Estimates AY 2026–27 salary-only tax for a resident individual below age 60. Old-regime deductions are a user-entered verified total; the new-regime result uses the shared CTC tax engine. The model does not determine deduction eligibility or handle other income types."
        : toolId === "gratuity-estimator"
          ? "Shows a limited monthly-rate 15/26 illustration and the ₹20 lakh maximum stated as current in the Ministry FAQ of 30 December 2025. It does not cover all employee categories, confirm a later ceiling notification, determine eligibility, or establish the applicable wage base."
          : toolId === "final-pay-estimator"
            ? "Uses the monthly cash amount, daily-rate divisor, notice days, and unused leave days that you enter. It does not decide what an employer owes."
            : toolId === "layoff-runway"
              ? "Divides funds that you identify as liquid by the monthly costs you enter. It predicts no future income or job-search duration."
              : toolId === "home-loan-stress-test"
                ? "Calculates standard monthly EMI arithmetic at the rates and term you enter. A stressed rate is a scenario, not a prediction."
                : toolId === "resign-or-stay"
                  ? "Displays weighted values you assign to each option. The values are not an outcome score, recommendation, or forecast."
                  : "Compares the two amounts you enter. It does not create or validate a private-sector salary benchmark.";
    const workedExample = toolId === "layoff-runway"
      ? calculateCareerTool("layoff-runway", {
          liquidSavings: 360_000,
          severance: 0,
          essentialMonthlyCosts: 45_000,
          monthlyDebtPayments: 0,
          otherMonthlyIncome: 5_000,
        })
      : toolId === "home-loan-stress-test"
        ? calculateCareerTool("home-loan-stress-test", {
            loanPrincipal: 5_000_000,
            annualRatePercent: 8,
            stressRatePercent: 10,
            termMonths: 240,
            monthlyTakeHome: 150_000,
            otherMonthlyCosts: 50_000,
          })
        : null;
    const workedExampleHtml = workedExample
      ? `<p>${toolId === "layoff-runway"
          ? "Illustrative inputs: ₹3,60,000 liquid savings, ₹45,000 essential monthly costs, no debt payment, and ₹5,000 continuing monthly income. The result is arithmetic only; it does not predict re-employment."
          : "Illustrative inputs: ₹50,00,000 principal over 240 months, with 8% entered as the base rate and 10% as a stress scenario. The stress rate is not a forecast."}</p><table><caption>Worked example calculated by the same model as the interactive tool</caption><thead><tr><th scope="col">Measure</th><th scope="col">Calculated value</th></tr></thead><tbody>${workedExample.rows.filter((row) => toolId === "layoff-runway" ? row.label.includes("Liquid") || row.label.includes("Monthly costs") || row.label.includes("Runway") : row.label.includes("Monthly payment") || row.label.includes("Total scheduled") || row.label.includes("Total interest")).map((row) => `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${typeof row.value === "number" && row.format === "inr" ? formatSnapshotRupees(row.value) : typeof row.value === "number" && row.format === "months" ? `${row.value.toFixed(1)} months` : escapeHtml(String(row.value))}</td></tr>`).join("")}</tbody></table>`
      : "";
    return {
      lead: meta.description,
      sections: [
        { heading: `How the ${worksheetName} works`, body: method },
        { heading: "Inputs and privacy", body: "Calculations run in the browser. Entered values are not sent to the API, stored, added to the URL, or used as analytics events." },
        ...(toolId === "offer-comparison"
          ? [{ heading: "Compare first-year trade-offs", body: "Treat recurring monthly cash separately from a joining payment. Check any clawback against the signed bonus clause, and include relocation or commute costs only when the amount reflects your actual plan." }]
          : toolId === "final-pay-estimator"
            ? [{ heading: "Reconcile the final statement", body: "Keep notice pay and leave encashment on separate lines. Compare the entered divisor and days with the contract, leave balance, applicable rules and the employer's final payroll calculation." }]
            : []),
        ...(workedExampleHtml ? [{ heading: "Worked example", html: workedExampleHtml }] : []),
        { heading: "Limits", body: "Educational arithmetic only. Verify contracts, tax questions, and employer-specific terms against current documents and qualified sources." },
        ...(sourceLinks ? [{ heading: "Official reference", html: `<ul>${sourceLinks}</ul>` }] : []),
        ...routeFaqSections(route),
      ],
      relatedLinks: [
        { href: publicPath("/tools"), label: "Browse all tools" },
        { href: publicPath("/methodology"), label: "Review methods and limits" },
      ],
    };
  }

  if (staticToolGuidance[route]) {
    return {
      lead: staticToolGuidance[route],
      sections: [
        ...(staticToolGuidance[route] === meta.description
          ? []
          : [{ heading: "What this tool is for", body: meta.description }]),
        { heading: "Method and limits", body: "Check the example, confirm inputs against your documents, and verify official rules before relying on estimates." },
        ...routeFaqSections(route),
      ],
    };
  }

  return {
    lead: meta.description,
    sections: routeFaqSections(route),
  };
}

function renderGuideSnapshotContent(guide: (typeof generatedGuideData.guides)[number], answer: string): SnapshotContent {
  const sections: SnapshotSection[] = [
    {
      id: "guide-direct-answer",
      heading: "The direct answer",
      html: `<p>${escapeHtml(guide.editorialFrame)}</p>`,
    },
    ...guide.sections
    .filter((section) => section.heading !== "Questions to work through")
    .map((section, index) => ({
    id: `guide-section-${index + 1}`,
    heading: section.heading,
    html: `${section.content.split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}${section.sourceNotes.length ? `<p class="snapshot-source-note"><strong>Source context:</strong> ${section.sourceNotes.map(escapeHtml).join(" · ")}</p>` : ""}${section.sourceLinks.length ? `<ul class="snapshot-source-links">${section.sourceLinks.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a> — ${source.year ? `source year stated as ${escapeHtml(source.year)}` : "date not stated in the archived source note"}</li>`).join("")}</ul>` : ""}`,
    })),
  ];
  const workedExample = guideWorkedExamples[guide.slug as keyof typeof guideWorkedExamples];
  if (workedExample) {
    const comparison = "comparison" in workedExample && workedExample.comparison
      ? `<h3>Compare the scenarios</h3><ul>${workedExample.comparison.map(([label, detail]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(detail)}</li>`).join("")}</ul>`
      : "";
    sections.splice(1, 0, {
      heading: "Worked example",
      html: `<p>${escapeHtml(workedExample.caption)}</p><p class="snapshot-table-hint">Scroll horizontally to view all columns on small screens.</p><div class="snapshot-table-wrap" role="region" aria-label="Scrollable worked example table" tabindex="0"><table><caption>Example inputs and calculated result</caption><thead><tr>${workedExample.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${workedExample.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${comparison}<h3>Check this on your own offer or documents</h3><ol>${workedExample.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}</ol><p><a href="${escapeHtml(publicPath(workedExample.tool.href))}">${escapeHtml(workedExample.tool.label)}</a></p>`,
    });
  }
  if (guide.faqs?.length) {
    sections.push({
      heading: "Frequently asked questions",
      html: guide.faqs.map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`).join(""),
    });
  }
  if (guide.nextSteps.length > 0) {
    sections.push({
      heading: "Questions to carry forward",
      html: `<ul>${guide.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>`,
    });
  }
  if (guide.sources.length > 0) {
    sections.push({
      heading: "Sources",
      html: `<ul>${guide.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>${source.year ? ` — ${escapeHtml(source.year)}` : ""}</li>`).join("")}</ul>`,
    });
  }
  return {
    lead: answer,
    sections,
    relatedLinks: [
      { href: publicPath("/guides"), label: "Browse all guides" },
      ...(guideToolLinks[guide.slug] ? [{ href: publicPath(guideToolLinks[guide.slug].href), label: `Open the ${guideToolLinks[guide.slug].label}` }] : [{ href: publicPath("/tools"), label: "Use a decision tool" }]),
      { href: publicPath("/rules"), label: "Rules and data library" },
      { href: publicPath("/editorial"), label: "Editorial standards" },
      ...(guide.relatedLinks ?? []).map((link) => ({ href: publicPath(link.url), label: link.label })),
    ],
  };
}

function renderInterviewGuideSnapshotContent(route: string, meta: StaticRouteMeta): SnapshotContent {
  if (route === "/interview-guides") {
    const roleRoutes = routeRegistry.routes.filter((entry) => entry.kind === "interview-guide" && entry.sitemap);
    return {
      lead: "Choose a role-specific study guide with source-cited questions, answer signals, and browser-only preparation tools. These materials support practice; they do not predict hiring outcomes.",
      sections: [
        {
          heading: "Choose an interview guide",
          html: `<ul>${roleRoutes.map((entry) => {
            const slug = entry.path.split("/").at(-1);
            const role = interviewRoleData.find((candidate) => candidate.slug === slug);
            return `<li><a href="${escapeHtml(publicPath(entry.path))}">${escapeHtml(entry.title)}</a> — ${role?.items.length ?? 0} questions. ${escapeHtml(entry.description)}</li>`;
          }).join("")}</ul>`,
        },
        { heading: "How to use the question banks", body: "Work through the concepts and scenarios, explain your reasoning in your own words, and use the answer signals to identify gaps. Questions include cited references; fast-moving product and protocol details should be checked against those sources." },
        { heading: "Review status", body: "The site owner reviewed the complete interview question set. No independent SME endorsement is claimed; check cited sources for details that may change." },
      ],
      relatedLinks: [
        { href: publicPath("/guides"), label: "Browse CareerReality editorial guides" },
        { href: publicPath("/about"), label: "About CareerReality" },
        { href: publicPath("/editorial"), label: "Editorial standards" },
      ],
    };
  }

  const slug = route.split("/").at(-1);
  const role = interviewRoleData.find((candidate) => candidate.slug === slug);
  if (!role) throw new Error(`Missing question-bank content for interview guide route ${route}`);
  const reviewNote = `The ${role.title} questions were reviewed by the site owner. Independent SME endorsement is not claimed; verify fast-moving details against cited sources.`;

  const grouped = new Map<string, typeof role.items>();
  for (const item of role.items) grouped.set(item.topic, [...(grouped.get(item.topic) ?? []), item]);
  const topicsHtml = [...grouped.entries()].map(([topic, items]) =>
    `<section class="snapshot-question-topic"><h3>${escapeHtml(topic)} (${items.length})</h3><ol>${items.map((item) =>
      `<li><article><h4>${escapeHtml(item.question)}</h4><p class="snapshot-question-meta">${escapeHtml(item.subtopic)}</p><p><strong>Assesses:</strong> ${escapeHtml(item.what_is_assessed)}</p></article></li>`,
    ).join("")}</ol></section>`,
  ).join("");

  return {
    lead: `${role.items.length} source-cited questions organize ${role.title} interview preparation across ${grouped.size} study topics. Each question includes an assessment focus and is available in the interactive guide with practice tools.`,
    sections: [
      { heading: "Review status and scope", body: `${reviewNote} This educational guide is not a hiring-outcome prediction.` },
      { heading: `The ${role.title} question bank`, html: topicsHtml },
    ],
    relatedLinks: [
      { href: publicPath("/interview-guides"), label: "Browse all role interview guides" },
      { href: publicPath("/guides"), label: "Browse CareerReality editorial guides" },
      { href: publicPath("/editorial"), label: "Editorial standards" },
    ],
  };
}

function renderStaticPage(
  route: string,
  meta: StaticRouteMeta,
  options: { content?: SnapshotContent; noIndex?: boolean; canonicalRoute?: string } = {},
): string {
  const canonical = `${siteUrl}${publicPath(options.canonicalRoute ?? route)}`;
  const heading = meta.heading ?? meta.title;
  const seoTitle = formatSeoTitle(meta.seoTitle ?? meta.title);
  const baseContent = options.content ?? renderRouteContent(route, meta);
  const worksheetSections = route === "/companies" ? undefined : batchWorksheetCopy[route];
  const content = worksheetSections
    ? { ...baseContent, sections: [...baseContent.sections, ...worksheetSections] }
    : baseContent;
  const isGuide = routeRegistry.routes.find((entry) => entry.path === route)?.kind === "guide";
  const breadcrumbs = route === "/"
    ? [{ href: publicPath("/"), label: "Home" }]
    : isGuide
      ? [{ href: publicPath("/"), label: "Home" }, { href: publicPath("/guides"), label: "Guides" }, { href: publicPath(route), label: meta.title }]
      : route === "/interview-guides"
        ? [{ href: publicPath("/"), label: "Home" }, { href: publicPath(route), label: "Interview guides" }]
        : route.startsWith("/interview-guides/")
          ? [{ href: publicPath("/"), label: "Home" }, { href: publicPath("/interview-guides"), label: "Interview guides" }, { href: publicPath(route), label: meta.title }]
      : route === "/companies"
        ? [{ href: publicPath("/"), label: "Home" }, { href: publicPath("/tools"), label: "Tools" }, { href: publicPath(route), label: "Employer check" }]
      : [{ href: publicPath("/"), label: "Home" }, { href: publicPath(route), label: meta.title }];
  const relatedLinks = content.relatedLinks ?? [
    { href: publicPath("/tools"), label: "Browse active tools" },
    { href: publicPath("/about"), label: "About CareerReality" },
    { href: publicPath("/editorial"), label: "Editorial standards" },
  ];
  const excerpt = content.lead === meta.description || content.sections.some((section) => section.body === meta.description)
    ? ""
    : `<p class="snapshot-excerpt">${escapeHtml(meta.description)}</p>`;
  const isInterviewGuide = route === "/interview-guides" || route.startsWith("/interview-guides/");
  const body = `<div class="snapshot-shell${route === "/" ? " snapshot-home" : ""}${isInterviewGuide ? " snapshot-interview-guide" : ""}${route === "/interview-guides" ? " snapshot-interview-hub" : ""}">
    ${renderSnapshotBreadcrumbs(breadcrumbs)}
    <header class="snapshot-header">
      <p class="snapshot-kicker">${escapeHtml(meta.eyebrow)}</p>
       <h1>${escapeHtml(heading)}</h1>
      ${excerpt}
    </header>
    <main>
      <p class="snapshot-lead">${escapeHtml(content.lead)}</p>
      ${content.sections.map((section) => `<section${section.id ? ` id="${escapeHtml(section.id)}"` : ""}><h2>${escapeHtml(section.heading)}</h2>${section.body ? `<p>${escapeHtml(section.body)}</p>` : ""}${section.html ?? ""}${section.links?.length ? `<ul>${renderSnapshotLinks(section.links)}</ul>` : ""}</section>`).join("")}
    </main>
      <nav class="snapshot-related" aria-label="Related CareerReality paths">
      <strong>Keep exploring</strong>
      ${relatedLinks.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("")}
    </nav>
    <nav class="snapshot-navigation" aria-label="Public CareerReality navigation">
      ${publicSiteMap.map((section) => `<section><h2>${escapeHtml(section.label)}</h2><ul>${section.items.map((item) => `<li><a href="${escapeHtml(publicPath(item.href))}">${escapeHtml(item.label)}</a></li>`).join("")}</ul></section>`).join("")}
    </nav>
      <footer class="snapshot-disclaimer">CareerReality provides educational tools and editorial guidance, not individual legal, tax, or financial advice.</footer>
  </div>`;
  let html = builtIndex;
  html = replaceOrAppend(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seoTitle)}</title>`);
  html = replaceOrAppend(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(meta.description)}">`);
  html = replaceOrAppend(html, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(seoTitle)}">`);
  html = replaceOrAppend(html, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(meta.description)}">`);
  const routeKind = routeRegistry.routes.find((entry) => entry.path === route)?.kind;
  html = replaceOrAppend(html, /<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${routeKind === "guide" ? "article" : "website"}">`);
  html = replaceOrAppend(html, /<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  html = replaceOrAppend(html, /<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(seoTitle)}">`);
  html = replaceOrAppend(html, /<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`);
  html = replaceOrAppend(html, /<meta name="robots"[^>]*>/i, `<meta name="robots" content="${options.noIndex || meta.noIndex ? "noindex, follow" : "index, follow"}">`);
  html = replaceOrAppend(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  html = replaceOrAppend(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/i, renderStaticSchemas(route, meta, canonical));
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${body}</div>`);
  html = html.replace("</head>", `<style>
      .snapshot-shell.snapshot-interview-guide{max-width:1120px;color:#202b2b;background:radial-gradient(ellipse at 92% 0%,rgba(31,111,94,.07),transparent 30rem),#fbfaf6}
      .snapshot-interview-guide .snapshot-header{padding:32px 0 28px;border-bottom:1px solid #d9ded8}
      .snapshot-interview-guide .snapshot-kicker{color:#176f5e;font:600 11px/1.5 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
      .snapshot-interview-guide h1{max-width:13ch;margin:18px 0;font:500 clamp(42px,7vw,76px)/.98 Georgia,serif;letter-spacing:-.055em;text-wrap:balance}
      .snapshot-interview-guide .snapshot-excerpt{max-width:68ch;margin:0;color:#5d6966;font-size:17px;line-height:1.75}
      .snapshot-interview-guide .snapshot-lead{max-width:70ch;margin:28px 0;padding:18px 22px;border-left:2px solid #c48a54;background:rgba(196,138,84,.06);font:400 clamp(18px,2.1vw,22px)/1.55 Georgia,serif}
      .snapshot-interview-guide main>section{margin-top:30px}
      .snapshot-interview-guide main>section>h2{margin:0 0 16px;font:500 clamp(25px,3.2vw,36px)/1.1 Georgia,serif;letter-spacing:-.035em}
      .snapshot-interview-guide main>section>p{max-width:72ch;color:#53615e;font-size:15px;line-height:1.75}
      .snapshot-interview-guide .snapshot-question-topic{margin-top:26px;padding-top:22px;border-top:1px solid #d9ded8}
      .snapshot-interview-guide .snapshot-question-topic>h3{margin:0 0 10px;color:#176f5e;font:600 11px/1.5 ui-monospace,monospace;letter-spacing:.11em;text-transform:uppercase}
      .snapshot-interview-guide .snapshot-question-topic ol{margin:0;padding:0;list-style:none}
      .snapshot-interview-guide .snapshot-question-topic li{margin:0;padding:0;border-bottom:1px solid #e1e4df}
      .snapshot-interview-guide .snapshot-question-topic article{padding:20px 12px;font:inherit}
      .snapshot-interview-guide .snapshot-question-topic h4{max-width:68ch;margin:0 0 10px;color:#202b2b;font:500 clamp(19px,2.2vw,25px)/1.28 Georgia,serif}
      .snapshot-interview-guide .snapshot-question-meta{margin:0 0 8px;color:#697572;font:600 10px/1.5 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
      .snapshot-interview-guide .snapshot-question-topic article p:last-child{max-width:72ch;margin:0;color:#53615e;font-size:14px;line-height:1.7}
      .snapshot-interview-hub main>section:first-of-type ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:12px;margin:0;padding:0;list-style:none}
      .snapshot-interview-hub main>section:first-of-type li{padding:18px;border:1px solid #d9ded8;border-radius:8px;background:rgba(255,255,255,.72);font-size:13px;line-height:1.65}
      .snapshot-interview-hub main>section:first-of-type li a{display:block;margin-bottom:7px;color:#176f5e;font:600 20px/1.2 Georgia,serif}
      .snapshot-interview-guide .snapshot-related a{color:#176f5e}
      @media(max-width:640px){.snapshot-shell.snapshot-interview-guide{padding:32px 18px}.snapshot-interview-guide .snapshot-header{padding-top:20px}.snapshot-interview-guide .snapshot-question-topic article{padding:16px 8px}.snapshot-interview-hub main>section:first-of-type ul{grid-template-columns:1fr}}
     .snapshot-shell{max-width:860px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif;color:#26313a}
     .snapshot-breadcrumbs{margin-bottom:28px;font-size:12px}.snapshot-breadcrumbs ol{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}.snapshot-breadcrumbs li{display:flex;align-items:center;gap:8px}.snapshot-breadcrumbs a{color:#176f5e;font-weight:700}.snapshot-breadcrumbs span[aria-current="page"]{color:#66727a}
    .snapshot-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#176f5e}
    .snapshot-navigation{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;border-top:1px solid #d8dedb;margin-top:32px;padding-top:24px;font:14px/1.8 system-ui,sans-serif}.snapshot-navigation h2{font-size:16px}.snapshot-navigation ul{list-style:none;padding:0}.snapshot-navigation a{color:#176f5e}
    .snapshot-shell h1{font-family:Georgia,serif;font-size:clamp(42px,7vw,80px);line-height:.94;letter-spacing:-.05em;margin:24px 0}
    .snapshot-home h1{max-width:13.5ch;font-size:clamp(3.8rem,16.5vw,5.2rem);line-height:.84;text-wrap:balance}
    .snapshot-excerpt{font-size:18px;line-height:1.7;color:#66727a;max-width:700px}.snapshot-shell main{font-family:Georgia,serif;font-size:18px;line-height:1.9}.snapshot-lead{font-size:21px}.snapshot-related{display:flex;flex-wrap:wrap;gap:18px;border-top:1px solid #d8dedb;margin-top:56px;padding-top:24px;font-size:13px}.snapshot-related a{color:#176f5e;font-weight:700}
     .snapshot-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:20px 0}.snapshot-table-hint{font:12px/1.5 system-ui,sans-serif;color:#66727a}.snapshot-table-wrap table{min-width:760px;border-collapse:collapse;font:14px/1.5 system-ui,sans-serif}.snapshot-table-wrap caption{text-align:left;font-weight:700;padding:8px 0}.snapshot-table-wrap th,.snapshot-table-wrap td{border:1px solid #d8dedb;padding:10px;text-align:left;vertical-align:top}.snapshot-table-wrap thead th{background:#f0f3f1}.snapshot-table-wrap tbody th{white-space:nowrap}
  </style></head>`);
  return html;
}

function renderStaticSchemas(route: string, meta: StaticRouteMeta, canonical: string): string {
  const organization = createSiteOrganization(siteUrl, basePath);
  const isGuide = routeRegistry.routes.find((entry) => entry.path === route)?.kind === "guide";
  const isInterviewRolePage = route.startsWith("/interview-guides/");
  const breadcrumbs = route === "/"
    ? [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` }]
    : isGuide
      ? [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}${publicPath("/")}` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}${publicPath("/guides")}` },
          { "@type": "ListItem", position: 3, name: meta.title, item: canonical },
        ]
      : route === "/interview-guides"
        ? [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}${publicPath("/")}` },
            { "@type": "ListItem", position: 2, name: "Interview guides", item: canonical },
          ]
        : isInterviewRolePage
          ? [
              { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}${publicPath("/")}` },
              { "@type": "ListItem", position: 2, name: "Interview guides", item: `${siteUrl}${publicPath("/interview-guides")}` },
              { "@type": "ListItem", position: 3, name: meta.title, item: canonical },
            ]
      : route === "/companies"
        ? [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}${publicPath("/")}` },
            { "@type": "ListItem", position: 2, name: "Tools", item: `${siteUrl}${publicPath("/tools")}` },
            { "@type": "ListItem", position: 3, name: "Employer check", item: canonical },
          ]
      : [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: meta.title, item: canonical },
      ];
  const schemas = [
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          name: "CareerReality",
          url: siteUrl,
          inLanguage: "en-IN",
          publisher: { "@id": `${siteUrl}/#organization` },
        },
        organization,
        ...(route === "/about" ? [{
          "@type": "AboutPage",
          "@id": `${siteUrl}/about#webpage`,
          name: meta.title,
          url: canonical,
          about: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en-IN",
        }] : []),
        ...(route === "/contact" ? [{
          "@type": "ContactPage",
          "@id": `${siteUrl}/contact#webpage`,
          name: meta.title,
          url: canonical,
          about: { "@id": `${siteUrl}/#organization` },
          mainEntity: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en-IN",
        }] : []),
        ...(route === "/team" ? [{
          "@type": "Person",
          "@id": `${siteUrl}/team#shiv-mishra`,
          name: "Shiv Mishra",
          affiliation: { "@id": `${siteUrl}/#organization` },
        }] : []),
        ...(route === "/interview-guides" ? [{
          "@type": "CollectionPage",
          name: meta.title,
          description: meta.description,
          url: canonical,
          inLanguage: "en-IN",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: routeRegistry.routes
              .filter((entry) => entry.kind === "interview-guide" && entry.sitemap)
              .map((entry, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: entry.title,
                url: `${siteUrl}${publicPath(entry.path)}`,
              })),
          },
        }] : []),
        ...(isInterviewRolePage ? [{
          "@type": "LearningResource",
          name: meta.title,
          description: meta.description,
          url: canonical,
          learningResourceType: "Interview preparation guide",
          inLanguage: "en-IN",
          publisher: { "@id": `${siteUrl}/#organization` },
        }] : []),
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs,
    },
  ];

  if (routeRegistry.routes.find((entry) => entry.path === route)?.kind === "guide") {
    const guideSlug = routeRegistry.routes.find((entry) => entry.path === route)?.guideSlug;
    const guide = generatedGuideData.guides.find((entry) => entry.slug === guideSlug);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      ...(guide?.datePublished ? { datePublished: guide.datePublished } : {}),
      ...(guide?.dateModified ? { dateModified: guide.dateModified } : {}),
      mainEntityOfPage: canonical,
      publisher: organization,
      inLanguage: "en-IN",
    });
  }

  if (route === "/layoffs") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.title,
      description: meta.description,
      mainEntityOfPage: canonical,
      publisher: organization,
      inLanguage: "en-IN",
    });
  } else if (route.startsWith("/layoffs/")) {
    const event = layoffEvents.find((entry) => `/layoffs/${entry.slug}` === route);
    if (event) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        datePublished: event.sourcePublishedAt,
        dateModified: event.updatedAt,
        mainEntityOfPage: canonical,
        publisher: organization,
        citation: [event.sourceUrl],
        inLanguage: "en-IN",
      });
    }
  }

  const guideSlug = routeRegistry.routes.find((entry) => entry.path === route)?.guideSlug;
  const faqs = staticToolFaqs[route] ?? generatedGuideData.guides.find((entry) => entry.slug === guideSlug)?.faqs;
  if (faqs) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return schemas.map((schema, index) => {
    const type = (schema as { "@type"?: string })["@type"];
    const schemaId = type === "BreadcrumbList" ? "breadcrumbs" : type === "Article" ? "article" : type === "FAQPage" ? "faq" : index === 0 ? "site" : `schema-${index}`;
    return `<script type="application/ld+json" data-career-seo-schema="${schemaId}">${escapeJson(schema)}</script>`;
  }).join("");
}

fs.writeFileSync(indexPath, renderStaticPage("/", homepageMeta));

const publishableArticles = articles.filter((article) => isArticlePublishable(article));
if (publishableArticles.length !== articles.length) {
  const blockedSlugs = articles
    .filter((article) => !isArticlePublishable(article))
    .map((article) => article.slug);
  throw new Error(`Unverified editorial records cannot enter public snapshots: ${blockedSlugs.join(", ")}`);
}
if (publishableArticles.length > 0) {
  throw new Error("Article snapshot output is disabled until a human authorizing publication explicitly reopens that feature.");
}

function articleKeywords(article: (typeof articles)[number]): string[] {
  const slugTerms = article.slug.split("-").filter((term) => term.length > 2);
  return [...new Set([article.editorial.primaryIntent, ...article.tags, ...slugTerms.slice(0, 6)])].slice(0, 12);
}

function renderArticle(article: (typeof articles)[number]): string {
  const riskSection = article.sections.find((section) => section.heading === "What the headline leaves out");
  const decisionSection = article.sections.find((section) => section.heading === "The decision this changes");
  const firstSentence = (value: string) => value.match(/.*?[.!?](?:\s|$)/)?.[0].trim() ?? value;
  const relatedLinks = [
    { href: publicPath(`/category/${article.category}`), label: "More in this topic" },
    ...article.editorial.relatedSlugs.slice(0, 3).map((slug) => {
      const related = articles.find((item) => item.slug === slug);
      return { href: publicPath(`/article/${slug}`), label: related?.title ?? slug };
    }),
    { href: publicPath("/offer-comparison"), label: "Compare offers" },
    { href: publicPath("/companies"), label: "Research companies" },
    ...(article.slug === "what-20-lpa-actually-feels-like-india-purchasing-power"
      ? [{ href: publicPath("/salary-calculator"), label: "Use the salary calculator for your own offer" }]
      : article.slug === "tech-lead-trap-responsibility-authority" || article.slug === "manager-vs-ic-career-path-india"
        ? [
            { href: publicPath("/salary-calculator"), label: "Decode the pay mix behind an offer" },
            { href: publicPath("/article/what-20-lpa-actually-feels-like-india-purchasing-power"), label: "Read the ₹20 LPA take-home illustration" },
          ]
        : []),
  ];

  return `<div class="snapshot-shell">
     ${renderSnapshotBreadcrumbs([
       { href: publicPath("/"), label: "Home" },
       { href: publicPath("/articles"), label: "Articles" },
       { href: publicPath(`/article/${article.slug}`), label: article.title },
     ])}
    <header class="snapshot-header">
      <p class="snapshot-kicker">${escapeHtml(article.category.replaceAll("-", " "))}</p>
      <h1>${escapeHtml(article.editorial.h1)}</h1>
      <p class="snapshot-excerpt">${escapeHtml(article.editorial.metaDescription)}</p>
        <p class="snapshot-meta">${escapeHtml(article.readTime)} · Author and reviewer details not verified · ${article.editorial.datePublished ? `Published ${escapeHtml(article.editorial.datePublished)}` : "Publication and substantive update dates not verified"}</p>
    </header>
    <div class="snapshot-note"><strong>Editorial format.</strong> This is a long-form editorial article, not a claim of original reporting. It preserves the CareerReality desk brief and keeps uncertainty visible.</div>
     ${article.editorialEnhancement ? `<section class="snapshot-editorial-scope"><p class="snapshot-kicker">Editorial scope</p><h2>What this page adds</h2><p>${escapeHtml(article.editorialEnhancement.angle)}</p><div class="snapshot-scope-grid"><div><strong>Reader outcome</strong><p>${escapeHtml(article.editorialEnhancement.readerOutcome)}</p></div><div><strong>Evidence boundary</strong><p>${escapeHtml(article.editorialEnhancement.evidenceBoundary)}</p></div></div></section>` : ""}
    <figure class="snapshot-figure">
      <p class="snapshot-kicker">${escapeHtml(article.editorial.visual.label)}</p>
      <h2>${escapeHtml(article.editorial.visual.title)}</h2>
      <p>${escapeHtml(article.editorial.visual.caption)}</p>
      <table><caption>Text equivalent</caption><tbody>
        ${article.editorial.visual.items.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)} — ${escapeHtml(item.detail)}</td></tr>`).join("")}
      </tbody></table>
    </figure>
     <section class="snapshot-reality-check">
       <p class="snapshot-kicker">Reality check</p>
       <h2>The useful answer has edges.</h2>
       <div class="snapshot-check-grid">
         <div><strong>Bottom line</strong><p>${escapeHtml(article.editorial.takeaway)}</p></div>
         <div><strong>Who this matters to</strong><p>People weighing ${escapeHtml(article.editorial.primaryIntent)} and deciding which evidence to check next.</p></div>
         <div><strong>Biggest risk</strong><p>${escapeHtml(riskSection?.body.trim() ? firstSentence(riskSection.body) : "The headline may hide important context that changes the decision.")}</p></div>
         <div><strong>What to verify</strong><ul>${article.editorial.verifyQuestions.slice(0, 3).map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul></div>
       </div>
     </section>
    <article>
      <p class="snapshot-lead">${escapeHtml(article.editorial.metaDescription)}</p>
      ${article.sections.map((section) => {
        const supportingSources = article.editorial.sources.filter((source) => source.section === section.heading);
        if (!section.body.trim() && supportingSources.length === 0) return "";
        return `<section><h2>${escapeHtml(section.heading)}</h2>${section.body.trim() ? `<p>${escapeHtml(section.body)}</p>` : ""}${supportingSources.length ? `<p class="snapshot-source-note"><strong>Source context:</strong> ${supportingSources.map((source, index) => `${index > 0 ? " · " : ""}<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.publisher)} (${escapeHtml(source.date)})</a> — ${escapeHtml(source.supports)}`).join("")}</p>` : ""}</section>`;
      }).join("")}
    </article>
     <section class="snapshot-decision-summary">
       <p class="snapshot-kicker">Decision summary</p>
       <h2>What changes after you read this?</h2>
        <p>${escapeHtml(decisionSection?.body.trim() ? decisionSection.body : article.editorial.takeaway)}</p>
       <p><a href="${publicPath(`/category/${article.category}`)}">Read the wider topic</a> · <a href="${publicPath("/compass")}">Open the Compass</a></p>
     </section>
    <aside class="snapshot-references">
      <h2>References</h2>
      <p>Context sources for this brief; not claims of original reporting by CareerReality.</p>
      ${article.editorial.sources.map((source) => `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer"><strong>${escapeHtml(source.role === "claim" ? "Claim source" : "Context source")} · ${escapeHtml(source.publisher)} — ${escapeHtml(source.title)} (${escapeHtml(source.date)})</strong><span>Supports ${escapeHtml(source.section)}: ${escapeHtml(source.supports)}</span></a>`).join("")}
      <h2>What to verify next</h2>
      <ul>${article.editorial.verifyQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
    </aside>
       <nav class="snapshot-related" aria-label="Related CareerReality paths">
      <strong>Keep exploring</strong>
      ${relatedLinks.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("")}
    </nav>
  </div>`;
}

function renderSchema(article: (typeof articles)[number], canonical: string): string {
  const organizationId = `${siteUrl}/#organization`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "CareerReality",
        url: siteUrl,
        inLanguage: "en-IN",
        publisher: { "@id": organizationId },
      },
      {
        ...createSiteOrganization(siteUrl, basePath),
      },
      {
        "@type": "Article",
        headline: article.editorial.h1,
        description: article.editorial.metaDescription,
        ...(article.editorial.datePublished ? { datePublished: article.editorial.datePublished } : {}),
        ...(article.editorial.dateModified ? { dateModified: article.editorial.dateModified } : {}),
        articleSection: article.category,
        keywords: articleKeywords(article),
        mainEntityOfPage: canonical,
        publisher: { "@id": organizationId },
        citation: article.editorial.sources.map((source) => ({ "@type": "CreativeWork", name: source.title, description: source.supports, url: source.url })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${siteUrl}/articles` },
          { "@type": "ListItem", position: 3, name: article.title, item: canonical },
        ],
      },
    ],
  };
  return `<script type="application/ld+json" data-career-seo-schema="article">${escapeJson(graph)}</script>`;
}

function replaceOrAppend(html: string, pattern: RegExp, replacement: string, before = "</head>"): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace(before, `${replacement}${before}`);
}

for (const article of publishableArticles) {
  const canonical = `${siteUrl}${publicPath(`/article/${article.slug}`)}`;
  const description = article.editorial.metaDescription;
  const seoTitle = `${article.editorial.seoTitle}${ARTICLE_TITLE_SUFFIX}`;
  let html = builtIndex;
  html = replaceOrAppend(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seoTitle)}</title>`);
  html = replaceOrAppend(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  html = replaceOrAppend(html, /<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="article">`);
  html = replaceOrAppend(html, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(seoTitle)}">`);
  html = replaceOrAppend(html, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  html = replaceOrAppend(html, /<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  html = replaceOrAppend(html, /<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(seoTitle)}">`);
  html = replaceOrAppend(html, /<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  html = replaceOrAppend(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  html = replaceOrAppend(html, /<meta name="robots"[^>]*>/i, `<meta name="robots" content="noindex, follow">`);
  html = replaceOrAppend(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/i, renderSchema(article, canonical));
  const reviewNotice = `<aside class="snapshot-note" role="status"><strong>Staging draft · not approved for publication</strong><p>Every article route is retained while its source claims, originality, author, and publication history are reviewed. This page is noindex and is not an approved final editorial version.</p></aside>`;
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${reviewNotice}${renderArticle(article)}</div>`);
  html = html.replace("</head>", `<style>
    .snapshot-shell{max-width:860px;margin:0 auto;padding:64px 24px;font-family:system-ui,sans-serif;color:#26313a}
    .snapshot-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#176f5e}
    .snapshot-shell h1{font-family:Georgia,serif;font-size:clamp(42px,7vw,80px);line-height:.94;letter-spacing:-.05em;margin:24px 0}
    .snapshot-excerpt{font-size:18px;line-height:1.7;color:#66727a;max-width:700px}.snapshot-meta{font-size:12px;color:#66727a}
     .snapshot-note{margin:40px 0;padding:20px;border:1px solid #b6d3c9;background:#eef7f2;font-size:13px;line-height:1.7}
     .snapshot-editorial-scope{margin:32px 0;padding:22px 24px;border:1px solid #b6d3c9;background:#eff7f3;font:14px/1.7 system-ui,sans-serif}.snapshot-editorial-scope h2{font:700 28px/1.05 Georgia,serif;margin:10px 0}.snapshot-scope-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}.snapshot-scope-grid>div{padding-top:12px;border-top:1px solid #b6d3c9}.snapshot-scope-grid strong{color:#176f5e;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.snapshot-scope-grid p{margin:7px 0 0;color:#66727a}
     .snapshot-reality-check,.snapshot-decision-summary{margin:40px 0;padding:24px;border:1px solid #b6d3c9;background:#f2f7f2}.snapshot-reality-check h2,.snapshot-decision-summary h2{font-family:Georgia,serif;font-size:28px;line-height:1.1;margin:12px 0}.snapshot-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:20px}.snapshot-check-grid>div{padding:14px;border:1px solid #d8dedb;background:#fff}.snapshot-check-grid strong{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#176f5e}.snapshot-check-grid p,.snapshot-check-grid ul{font-size:13px;line-height:1.7;margin:8px 0 0}.snapshot-check-grid ul{padding-left:18px}
     .snapshot-shell article{font-family:Georgia,serif;font-size:18px;line-height:1.9}.snapshot-shell article h2{font-size:32px;line-height:1.1;margin:56px 0 16px}.snapshot-lead{font-size:21px}
     .snapshot-figure{margin:40px 0;padding:24px;border:1px solid #b6d3c9;background:#f2f7f2}.snapshot-figure h2,.snapshot-references h2{font-family:Georgia,serif;font-size:28px;line-height:1.1;margin:12px 0}.snapshot-figure table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}.snapshot-figure th,.snapshot-figure td{border-top:1px solid #d8dedb;padding:9px;text-align:left}.snapshot-figure caption{caption-side:top;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.snapshot-references{margin-top:52px;padding-top:24px;border-top:1px solid #d8dedb;font-size:13px;line-height:1.7}.snapshot-references a{display:block;color:#176f5e;font-weight:700;margin-top:10px}.snapshot-references a span{display:block;color:#66727a;font-weight:400;font-size:12px}.snapshot-references li{margin-top:8px}.snapshot-source-note{border-left:2px solid #b6d3c9;padding-left:12px;font-size:12px;line-height:1.7;color:#66727a}.snapshot-source-note a{color:#176f5e;font-weight:700}
    .snapshot-related{display:flex;flex-wrap:wrap;gap:18px;border-top:1px solid #d8dedb;margin-top:56px;padding-top:24px;font-size:13px}.snapshot-related a{color:#176f5e;font-weight:700}
  </style></head>`);
  const outputPath = path.join(distRoot, "article", article.slug, "index.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

const staticRoutes = routeRegistry.routes
  .filter((route) => route.render === "snapshot")
  .map((route) => route.path)
  .filter((route) => route !== "/");

function renderLayoffSnapshotContent(route: string, meta: StaticRouteMeta): SnapshotContent {
  if (route === "/layoffs") {
    const rows = [...layoffEvents].sort((a, b) => b.date.localeCompare(a.date) || b.sourcePublishedAt.localeCompare(a.sourcePublishedAt)).map((event) =>
      `<li><a href="${escapeHtml(publicPath(`/layoffs/${event.slug}`))}">${escapeHtml(event.company)} — ${escapeHtml(event.status)}</a><br>${escapeHtml(formatSnapshotDate(event.date))} · ${escapeHtml(event.scale)}<br>${escapeHtml(event.summary)}<br><a href="${escapeHtml(event.sourceUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(event.sourceLabel)} source</a> · Record reviewed ${escapeHtml(formatSnapshotDate(event.updatedAt))}</li>`,
    ).join("");
    const lastUpdated = layoffEvents.reduce((latest, event) => event.updatedAt > latest ? event.updatedAt : latest, "");
    return {
      lead: `Use the dated tracker as a starting point, not a prediction about your role. Last updated ${formatSnapshotDate(lastUpdated)}. Company announcements, reported events, and rumours are different evidence states.`,
      sections: [
        { heading: "Dated company reports", html: `<ul>${rows}</ul>` },
        { heading: "Request sourced email alerts", body: "The interactive alert form asks for an email address; city and sector are optional. Confirm by email before alerts begin. Rumours are never sent. The form appears when the interactive page loads.", id: "email-alerts" },
        { heading: "How rumours are handled", body: "A rumour must be labelled as unverified, linked to its attributable source, and kept out of email alerts. No rumour is presented here as a confirmed event." },
        { heading: "Cash and next steps", body: "The private 12-month cash-flow worksheet starts with accessible cash, lets you place an expected one-time payment in a selected month, and models continuing monthly income through a selected month. Break essential spending into housing, food, utilities, transport, healthcare and care, loan payments, and other essentials. Its month-end balances hold those assumptions steady; the worksheet does not model exact within-month payment dates, tax, legal entitlements, or when new work will arrive. Entries stay in page memory and clear on reload.", links: [
          { href: publicPath("/layoff-runway"), label: "Open the layoff cash-runway calculator" },
          { href: publicPath("/guides/layoff-recovery-and-employment-documents"), label: "Read the layoff recovery guide" },
        ] },
        { heading: "Rights questions — verify your situation", html: `<p>India’s Ministry of Labour and Employment published its Labour Codes FAQs on 30 December 2025 and additional FAQs dated 16 March 2026. These sources do not determine whether a particular role or employer is covered. Check the applicable law, state rules, contract, service facts, and written separation terms; seek qualified advice for your circumstances.</p><ul><li><a href="https://labour.gov.in/en/faqs-labour-codes" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment — FAQs on Labour Codes (30 December 2025)</a></li><li><a href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment — Additional FAQs on Labour Codes (16 March 2026)</a></li></ul>` },
      ],
      relatedLinks: [
        { href: publicPath("/layoff-runway"), label: "Cash runway calculator" },
        { href: publicPath("/guides/layoff-recovery-and-employment-documents"), label: "Layoff recovery guide" },
        { href: publicPath("/editorial"), label: "Editorial and sourcing standards" },
      ],
    };
  }

  const event = layoffEvents.find((entry) => `/layoffs/${entry.slug}` === route);
  if (!event) throw new Error(`No layoff event data exists for ${route}`);
  return {
    lead: event.summary,
    sections: [
      { heading: "What the source says", body: event.scale },
      { heading: "Status and limits", body: `${event.status} · ${event.geography} · Event date: ${event.date}. Copy updated: ${event.updatedAt}. This entry does not establish current headcount, a future layoff, or an individual worker’s job security.` },
      { heading: "Page update", body: event.updateNote },
      { heading: "What this report does not establish", body: event.coverageNote },
      { heading: "What to verify for your situation", body: event.readerCheck },
      { heading: "Source", html: `<p><a href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.sourceLabel)} report, published ${escapeHtml(event.sourcePublishedAt)}</a></p>` },
    ],
    relatedLinks: [
      { href: publicPath("/layoffs"), label: "Return to the Layoff Hub" },
      { href: publicPath("/layoff-runway"), label: "Plan a cash runway" },
      { href: publicPath("/guides/layoff-recovery-and-employment-documents"), label: "Read the layoff recovery guide" },
    ],
  };
}

const registeredSnapshotRoutes = new Set(
  routeRegistry.routes
    .filter((route) => route.render === "snapshot")
    .map((route) => route.path),
);
const missingRouteMetadata = staticRoutes.filter((route) => !staticRouteMeta[route]);
const unregisteredRouteMetadata = Object.keys(staticRouteMeta)
  .filter((route) => !registeredSnapshotRoutes.has(route));
if (missingRouteMetadata.length || unregisteredRouteMetadata.length) {
  throw new Error(
    `Route registry and snapshot metadata differ. Missing metadata: ${missingRouteMetadata.join(", ") || "none"}; unregistered metadata: ${unregisteredRouteMetadata.join(", ") || "none"}`,
  );
}

const appShellRoutes = routeRegistry.routes
  .filter((route) => route.render === "app-shell")
  .flatMap((route) => {
    if (route.path === "/article/*") return [];
    if (route.path === "/sign-in/*?") {
      return ["/sign-in", "/sign-in/sso-callback", "/sign-in/factor-one", "/sign-in/factor-two"];
    }
    if (route.path === "/sign-up/*?") {
      return ["/sign-up", "/sign-up/sso-callback", "/sign-up/continue"];
    }
    return [route.path];
  })
  .concat(archivedArticleRecords.map((article) => `/article/${article.slug}`));

function renderAppShell(route: string): string {
  const canonical = `${siteUrl}${publicPath(route)}`;
  let html = builtIndex;
  html = replaceOrAppend(html, /<title>[\s\S]*?<\/title>/i, `<title>CareerReality app route</title>`);
  html = replaceOrAppend(html, /<meta name="robots"[^>]*>/i, `<meta name="robots" content="noindex, follow">`);
  html = replaceOrAppend(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  return html;
}

for (const route of staticRoutes) {
  const meta = staticRouteMeta[route];
  const routePolicy = routeRegistry.routes.find((entry) => entry.path === route);
  if (!meta || !routePolicy) throw new Error(`Missing route registry metadata for ${route}`);

  const guide = routePolicy.kind === "guide"
    ? generatedGuideData.guides.find((entry) => entry.slug === routePolicy.guideSlug)
    : undefined;
  if (routePolicy.kind === "guide" && !guide) {
    throw new Error(`Missing generated guide content for registered guide route ${route}`);
  }
  const outputPath = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = route.startsWith("/layoffs")
    ? renderLayoffSnapshotContent(route, meta)
    : guide
    ? renderGuideSnapshotContent(guide, routePolicy.description)
    : renderRouteContent(route, meta);
  if (routePolicy.kind === "tool") {
    content.relatedLinks = (staticToolRelatedPages[route] ?? []).map((link) => ({ ...link, href: publicPath(link.href) }));
  }
  fs.writeFileSync(outputPath, renderStaticPage(route, meta, {
    noIndex: routePolicy.indexability === "noindex",
    content,
  }));
}

const forbiddenPublicCopy = [
  "source citation unavailable",
  "directional stability",
  "A concise editorial brief",
  "CareerReality keeps assumptions, evidence freshness",
  "Read the journal",
  "Archived article body text is not republished",
  "words of editorial framing",
];
for (const route of staticRoutes) {
  const outputPath = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  const html = fs.readFileSync(outputPath, "utf8");
  for (const phrase of forbiddenPublicCopy) {
    if (html.toLowerCase().includes(phrase.toLowerCase())) {
      throw new Error(`Forbidden legacy copy found in generated route ${route}: ${phrase}`);
    }
  }
  const redirectPaths = new Set(routeRegistry.redirects.map((entry) => entry.from.replace(/\/+$/, "") || "/"));
  const registeredPaths = new Set(routeRegistry.routes.map((entry) => entry.path.replace(/\/+$/, "") || "/"));
  const links = [...html.matchAll(/\bhref=["']([^"'#]+)["']/gi)].map((match) => match[1]);
  for (const href of links) {
    let target;
    try {
      target = new URL(href, `${siteUrl}${publicPath(route)}`);
    } catch {
      continue;
    }
    if (target.origin !== new URL(siteUrl).origin) continue;
    let internalPath = target.pathname;
    if (basePath && (internalPath === basePath || internalPath.startsWith(`${basePath}/`))) {
      internalPath = internalPath.slice(basePath.length) || "/";
    }
    internalPath = internalPath.replace(/\/+$/, "") || "/";
    if (/\.[a-z0-9]+$/i.test(internalPath)) continue;
    if (redirectPaths.has(internalPath) || !registeredPaths.has(internalPath)) {
      throw new Error(`Generated route ${route} links to a non-live or redirected path: ${href}`);
    }
  }
}

for (const route of appShellRoutes) {
  const outputPath = path.join(distRoot, route.replace(/^\/+/, ""), "index.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderAppShell(route));
}

console.log(`Generated ${publishableArticles.length + staticRoutes.length + 1} route snapshots and ${appShellRoutes.length} app shells.`);