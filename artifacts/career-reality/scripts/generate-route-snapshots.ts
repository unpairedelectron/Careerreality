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
  escapePlanGoals,
  getEscapePlanTasks,
} from "../src/lib/application-models.ts";
import { getPageHeading } from "../src/data/page-headings.ts";
import { mobileAppFaqs } from "../src/data/mobile-app-faqs.ts";
import { TOOL_FAQ_HEADING, toolFaqs } from "../src/data/tool-faqs.ts";
import { getToolContentBlocks, type ToolContentBlock } from "../src/data/tool-page-content.ts";
import { getSiteUrl } from "./seo-site-url.mjs";
import { assertPublicRouteDescription } from "../src/data/seo-description-policy.ts";
import { createSiteOrganization } from "../src/data/seo-organization.ts";
import { SITE_FOUNDER, createFounderAuthor, createFounderPerson } from "../src/data/site-founder.ts";
import { aboutCopy, teamCopy, type PeopleCopySection } from "../src/data/trust-people-copy.ts";
import { createRulesPageSchema, createToolApplicationSchema, isApplicationToolRoute, SITE_SOCIAL_IMAGE_PATH } from "../src/data/seo-page-schemas.ts";
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
  seoTitle?: string;
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

/** Source links can be internal routes or external URLs; internal ones use the canonical slash form. */
function sourceLink(url: string, label: string): string {
  return url.startsWith("/")
    ? `<a href="${escapeHtml(publicPath(url))}">${escapeHtml(label)}</a>`
    : `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
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
  seoTitle: route.seoTitle,
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

const staticToolFaqs: Record<string, Array<{ question: string; answer: string }>> = { ...toolFaqs, "/mobile-app": mobileAppFaqs };
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

const staticToolGuidance = Object.fromEntries(
  routeRegistry.routes
    .filter((route) => route.kind === "tool" && route.indexability === "indexable")
    .map((route) => [route.path, route.description]),
) as Record<string, string>;

function routeFaqSections(route: string): SnapshotSection[] {
  const faqs = staticToolFaqs[route] ?? [];
  return faqs.length
    ? [{ heading: route === "/mobile-app" ? "Before you bookmark this." : TOOL_FAQ_HEADING, html: `<dl>${faqs.map((faq) => `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`).join("")}</dl>` }]
    : [];
}

function renderToolContentBlock(block: ToolContentBlock): SnapshotSection {
  const list = (items: string[]) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  const table = block.table;
  const html = [
    block.body ? `<p>${escapeHtml(block.body)}</p>` : "",
    block.list ? list(block.list) : "",
    ...(block.groups ?? []).map((group) => `<h3>${escapeHtml(group.title)}</h3>${list(group.items)}`),
    table?.intro ? `<p>${escapeHtml(table.intro)}</p>` : "",
    table ? `<table><caption>${escapeHtml(table.caption)}</caption><thead><tr>${table.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell, index) => index === 0 && table.rowHeaders ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "",
    block.links ? `<ul>${block.links.map((link) => `<li>${sourceLink(link.href, link.label)}${link.note ? ` — ${escapeHtml(link.note)}` : ""}</li>`).join("")}</ul>` : "",
    block.note ? `<p>${escapeHtml(block.note)}</p>` : "",
    block.qa ? `<dl>${block.qa.map((item) => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join("")}</dl>` : "",
  ].join("");
  return { id: block.id, heading: block.heading, html };
}

function toolSnapshotLead(route: string, meta: StaticRouteMeta): string {
  if (route === "/escape-plan") {
    const actionCounts = new Set(escapePlanGoals.map((goal) => getEscapePlanTasks(goal).length));
    const actionCount = actionCounts.size === 1 ? `${actionCounts.values().next().value}-action` : "goal-specific";
    return `Choose a goal and build a session-only checklist with a time budget. Each goal has a ${actionCount} checklist. The total is arithmetic; it does not estimate job-search odds or resignation readiness.`;
  }
  if (route === "/career-reality-index") return "The check displays four self-reported responses with the same fixed reflection. Responses are not added, ranked, weighted, or converted into a score.";
  if (route === "/ai") return "Use task-level questions to investigate where AI fits into team workflows. Examples are editorial prompts, not measured exposure or a forecast.";
  return staticToolGuidance[route] ?? meta.description;
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
        { heading: "Authorship and assembly", body: "The supplied article export has no named authors or verified publication and update dates. No human reviewer was supplied. Historical AI use could not be verified, so no claim is made about it." },
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

function peopleCopySnapshot(lead: string, sections: PeopleCopySection[]): SnapshotContent {
  return {
    lead,
    sections: sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      html: section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
        + (section.bullets ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "")
        + (section.links ? `<p>${section.links.map((link) => /^https?:/.test(link.href) ? `<a href="${escapeHtml(link.href)}" rel="me noopener noreferrer">${escapeHtml(link.label)}</a>` : `<a href="${escapeHtml(publicPath(link.href))}">${escapeHtml(link.label)}</a>`).join(" · ")}</p>` : ""),
    })),
  };
}

function getReleaseTrustSnapshotContent(route: string): SnapshotContent | undefined {
  const content: Record<string, SnapshotContent> = {
    "/about": peopleCopySnapshot(aboutCopy.lead, aboutCopy.sections),
    "/editorial": {
      lead: "CareerReality separates source-backed claims from editorial interpretation, user-entered assumptions, and questions that remain unresolved.",
      sections: [
        { heading: "Evidence before conclusion", body: "Legal, tax, payroll, and market claims require a relevant source, an access date when known, and a clear statement of scope. If a source does not support a claim, the claim is removed, qualified, or withheld." },
        { heading: "Authorship and assembly", body: "Authorship, review, publication dates, and substantive updates are identified where available. Source links identify references used; they do not by themselves mean a source author reviewed the page." },
        { heading: "Interpretation and uncertainty", body: "Editorial framing, checklists, and prompts are not reported facts. A source date appears only when stated in the preserved note. A missing result is not evidence of safety, demand, or a future outcome." },
      ],
    },
    "/team": peopleCopySnapshot(teamCopy.lead, teamCopy.sections),
    "/corrections": {
      lead: "Email hello@careerreality.in to report an error or request a correction. No response-time promise is made.",
      sections: [
        { heading: "Available correction record", body: "When a material correction is made, the affected claim, change, and supporting evidence are described here." },
        { heading: "What to include", body: "Identify the page and claim, explain what appears wrong, and include a supporting public source where possible. Do not send credentials or confidential documents." },
        { heading: "Correction details", body: "A correction entry identifies the page, the corrected claim, what changed, the change date, and supporting evidence." },
      ],
      relatedLinks: [{ href: publicPath("/contact"), label: "Send a correction request" }],
    },
    "/contact": {
      lead: "Use hello@careerreality.in for general queries, corrections, privacy requests, security reports, press, or complaints. No response-time promise is made.",
      sections: [
        { heading: "Email and operator", html: '<p><a href="mailto:hello@careerreality.in">hello@careerreality.in</a></p><p>Operator: Doffysoft pvt. Limited. Address: Hinjewadi Phase 3, Pune.</p>' },
        { heading: "Contact by purpose", body: "Email is the only published contact route. Do not include account credentials, resumes, confidential work documents, or sensitive personal information." },
      ],
    },
    "/methodology": {
      lead: "Each tool states what it calculates, which values it expects, and what it cannot establish. Entered values remain in the browser unless a page explicitly submits them.",
      sections: [
        { heading: "CTC reconciliation", body: "Offer comparison separates fixed cash from target variable pay. Tax-regime comparison estimates old and new salary-only tax for AY 2026–27 from the entered salary and deduction assumptions; compare its results with the current Income Tax Department calculator. Salary evidence comparison uses only amounts entered by the visitor and does not publish a private-sector benchmark." },
        { heading: "Gratuity", body: "The limited monthly-rate illustration uses 15/26 of the stated wage base, exact-month pro-rata arithmetic for fixed-term expiry and deceased employees, and the greater-than-six-month rounding rule for ordinary service and disablement. The Ministry FAQ published 30 December 2025 states a ₹20 lakh maximum as then current. The March 2026 FAQ states that the revised wage definition applies from 21 November 2025. It does not model piece-rated or seasonal cases, decide eligibility, or establish the applicable wage base." },
        { heading: "Other worksheets and checklist", body: "The notice and leave worksheet uses the daily-rate divisor and days entered by the visitor. The runway planner divides stated funds by stated monthly costs and predicts no re-employment date. The home-loan stress test uses standard EMI arithmetic at entered rates and term. The resign-or-stay worksheet displays visitor-entered weighted values and makes no recommendation." },
        { heading: "Employer checklist and limits", body: "The employer checklist prompts visitors to verify legal identity, official filings, employment terms, and role details. It creates no company record, rating, financial-health claim, or job-security estimate. These tools are educational worksheets, not tax, payroll, legal, investment, credit, or employment advice." },
      ],
      relatedLinks: [{ href: publicPath("/tools"), label: "Browse all tools" }],
    },
    "/sources": {
      lead: "Official sources support the tool references shown here. Guides provide editorial framing and practical prompts.",
      sections: [
        { heading: "Official sources for tools and due diligence", html: `<ul>
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
        { heading: "Sources in the guides", body: "Guides provide editorial framing and practical prompts. They do not establish current legal, tax, compensation, or job-market facts; verify those claims against an official source for the specific rule." },
      ],
    },
    "/privacy-policy": {
      lead: "This notice explains information handled when you use CareerReality's tools, contact the team, or sign in. For privacy requests, email hello@careerreality.in.",
      sections: [
        { heading: "What this notice covers", body: "This notice describes known information handling across CareerReality's public website, account features, mobile app, and email alerts. It is an operational summary, not legal advice or a guarantee that every infrastructure or third-party data flow has been independently audited. Where a flow or retention period has not been verified, that limit is stated instead of guessed. CareerReality tools and guides provide educational information, not individualized legal, tax, payroll, employment, or financial advice." },
        { heading: "Public calculator inputs", body: "Public calculation worksheets are designed to calculate in your browser. In salary-calculator checks, entered amounts were not sent to the API or placed in the web address. The public job-posting and resume evidence check also processes the selected text or file in the browser; it is not an automated hiring prediction. Avoid entering confidential employer information or another person's personal data. Interview-guide selections and readiness markers are stored in local storage and can be cleared in the guide; theme and interface preferences may also be stored on the device. Clearing browser storage may remove these local records." },
        { heading: "Messages and information you choose to send", body: "The website contact form is closed. Email to hello@careerreality.in may include your address, message, attachments, and information you choose to provide. Do not email passwords, payment details, resumes, confidential work documents, or another person's personal information unless necessary and authorized. A former contact form collected a name, email address, topic, message, and submission time. Retention of any remaining copies in backups or logs has not been established." },
        { heading: "Layoff alert subscriptions", body: "If you request layoff alerts, the subscription database stores your email address, an email hash, optional city and sector preferences, confirmation status, and token hashes and timestamps used to manage confirmation and unsubscribe links. Resend delivers confirmation and alert emails. Alerts begin only after email confirmation and include Confirmed or Reported events, never Rumours. Unsubscribing makes the record ineligible for alerts, but the record remains in the database to prevent accidental reactivation; a separate deletion schedule has not been established. Do not forward confirmation or unsubscribe links because they contain account-management tokens." },
        { heading: "Accounts, profiles, and mobile storage", body: "Clerk provides sign-in and session authentication. Signed-in career features can store profile answers such as role, company, city, experience, compensation, situation, and target direction, along with generated career-brief history. Up to 24 brief-history snapshots are kept per account; this is not a general deletion or backup-retention promise. The mobile app keeps account-scoped career information on the device and syncs profile information with CareerReality's API. “Clear saved intelligence” removes extracted resume fields from the account profile and current account-scoped device data; it does not remove profile answers or earlier career-brief history. Retention of older unscoped device copies and infrastructure backups has not been established. The public website does not offer resume upload or job-link processing as a public service; use a feature-specific notice before submitting an upload." },
        { heading: "Service providers and live-data requests", body: "Clerk provides sign-in and Resend delivers layoff-alert email. If the signed-in live job-market feature is configured and used, the API may send role, target direction, and city search terms to TheirStack to retrieve job listings. Provider handling is also subject to each provider's terms and privacy information. Production configuration, processing locations, and the complete list of infrastructure and service providers have not been independently verified; no country-specific storage or provider retention period is promised here." },
        { heading: "Analytics, cookies, and technical logs", body: "CareerReality uses Google Analytics 4 on careerreality.in to measure visits, page views, and tool use. Google receives the page address and browser and device details, processes your IP address to work out approximate location, and sets first-party cookies such as _ga to recognise a returning browser. Advertising storage, Google signals, and ad personalization are turned off. Visitors in the EEA, the UK, and Switzerland are measured without analytics cookies. Analytics does not start when you open a link that carries an access token. The application also sends limited event names and route, tool, or catalogue identifiers to Google Analytics, and to an Umami analytics script if that script is present. Those event calls are designed not to include values typed into calculators. How long analytics or server logs are retained has not been verified. The site host sets a cookie named GAESA that expires after 30 days; CareerReality does not read it, and its purpose is not identified here. Servers and providers may process technical request information such as IP address, browser or device details, timestamps, and error records; complete log contents and retention are not established." },
        { heading: "Advertising and Google AdSense", html: '<p>Google AdSense ads are not currently served on this site. If AdSense is enabled, Google and other third-party vendors may use cookies or similar technologies to collect or receive information, including IP addresses and other identifiers, when ads are served. Google and its partners may use advertising cookies to show ads based on a visitor&#39;s prior visits to this site or other sites.</p><p>Visitors can manage personalized advertising through <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. Read <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer">how Google uses data on partner sites and apps</a>. Before any other ad vendor or network is enabled, this notice will identify it and link to its privacy and opt-out information where available. The technologies used and available choices may vary by configuration and location; this notice does not mean ads are active.</p>' },
        { heading: "External sites and information you share", body: "CareerReality links to government, employer, research, and service-provider sites. Those sites control their own content, cookies, and privacy practices; opening an external link may send technical request information to that site. Tool results are estimates or decision prompts based on displayed inputs and assumptions, not a promise, professional recommendation, employment outcome, or complete assessment of your circumstances." },
        { heading: "Security limits", body: "CareerReality uses access controls for account features, but no website, email, device, or transmission method can be guaranteed completely secure. Do not send credentials or unnecessary sensitive information. Contact hello@careerreality.in about a suspected exposure without including passwords or access tokens." },
        { heading: "India data-protection law status", body: "As of 7 November 2026, the DPDP Act and Rules have staged commencement. Core notice, consent, rights, grievance, breach, and child-data provisions in Act sections 3–17 and Rules 3, 5–16, 22–23 are scheduled for 13 May 2027. Rule 4 and Act section 6(9) / section 27(1)(d) are scheduled for 13 November 2026. Rules 1, 2, and 17–21 took effect on 13 November 2025. This date-based summary may change and is not legal advice or a statement that every obligation has been assessed for this product." },
        { heading: "Your choices, requests, and retention", body: "You can clear interview-guide progress in the guide, manage browser storage through device settings, unsubscribe from layoff alerts using the email link, and use the account controls described above. Email hello@careerreality.in for an access, correction, or deletion request. No self-service account-wide export or deletion process or response time has been verified. Unsubscribed alert records remain in the database; contact-form backup/log retention, account deletion handling, analytics/log retention, and backup expiry periods have not been established. A request does not confirm that information has been found, deleted from every system or provider, or removed from backups." },
        { heading: "Updates to this notice", body: "We may revise this notice when the site or its data flows change. The information-updated date identifies the date of the current text, not a guarantee that every provider or production configuration was audited on that date. Check this page again before submitting information if a feature has changed." },
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
        { heading: "What we aim to support", body: "On 2 November 2026, axe-core 4.10.3 checked 11 public trust pages at 1440 × 900 and 390 × 844 against WCAG 2.0, 2.1, and 2.2 A/AA rules. It found no automated violations; one check per page needs manual review. Keyboard Tab navigation showed a visible focus indicator on the first link on each page. These checks do not assess every success criterion, screen-reader behavior, or native mobile use. No conformance level is claimed." },
        { heading: "Known issues from these checks", body: "No automated violations were found in this sample. Manual review and assistive-technology testing remain incomplete." },
        { heading: "Report an accessibility barrier", html: '<p>Email <a href="mailto:hello@careerreality.in">hello@careerreality.in</a> with the page, device/browser, assistive technology if relevant, and the barrier. No response deadline is promised.</p>' },
      ],
    },
    "/security": {
      lead: "Report a security concern to hello@careerreality.in. Do not include credentials, personal data, or destructive exploit details.",
      sections: [
        { heading: "Responsible reporting", body: "Include the affected URL, impact, and safe reproduction steps. Do not access or alter another person's data, disrupt service, or use social engineering. Stop once the issue is demonstrated." },
        { heading: "Disclosure terms", body: "No response-time, bounty, or safe-harbor commitment is made. Coordinate before public disclosure." },
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
        { heading: "Latest sourced event records", html: `<p>Record copy updated through ${escapeHtml(formatSnapshotDate(lastUpdated))}. This date marks edits to these records, not a fresh confirmation of current workforce conditions or every reported outcome.</p><ul>${recentEventRows}</ul><p><a href="${escapeHtml(publicPath("/layoffs"))}">Open the Layoff Hub</a> · <a href="${escapeHtml(publicPath("/layoff-runway"))}">Plan a cash runway</a> · <a href="${escapeHtml(publicPath("/layoffs"))}#email-alerts">Request sourced email alerts</a></p>` },
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
        { heading: "", html: `<p class="snapshot-table-hint">Scroll horizontally to view all columns on small screens.</p><div class="snapshot-table-wrap" role="region" aria-label="Scrollable rules summary table" tabindex="0"><table><caption>Rule summary · verified ${escapeHtml(rulesPage.verified)}</caption><thead><tr><th scope="col">Topic</th><th scope="col">Official summary</th></tr></thead><tbody>${tableRows}</tbody></table></div>` },
        { heading: "What changed since last year", body: rulesPage.change },
        { heading: "In plain language", body: rulesPage.plainLanguage },
        ...copy.sections.map((section) => ({ heading: section.heading, body: section.body })),
        { heading: "Questions to check", html: `<dl>${faqItems}</dl>` },
        { heading: "Official sources", html: `<ul>${officialSources}</ul>` },
        { heading: "Related tools and guides", links: rulesPage.related.map((item) => ({ href: publicPath(item.url), label: item.label })) },
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
        { heading: "Ten minutes to ask better questions.", body: "Enter only information you are comfortable reviewing in this browser. The live checklist holds your employer name, identifier, domains, role, location, answers, notes, and pasted recruiter text in page memory only. It does not send those entries to an API, place them in a URL, save them to browser storage, or attach them to analytics. Each check can be marked Verified, Mismatch, or Couldn't verify, with a private note; a reload clears the current entries. The local format helper and message scanner are prompts for your own review, not registry lookups or fraud findings." },
        { heading: "Follow the evidence, one question at a time.", html: stepHtml },
        { heading: "Pause first. Use a channel you trust.", html: `<p>Contact your bank or payment provider promptly through a phone number or app you independently know is official. For suspected financial cyber fraud in India, the official Cyber Crime Portal source advises calling <strong>1930 promptly</strong> and reporting through its portal. Preserve messages, transaction references, dates, and account details. No response time or outcome is promised here.</p><ul><li>${renderSourceLink("cybercrime-portal")} — the destination and current instructions could not be independently verified on the listed date. Confirm the official portal before relying on its guidance.</li><li>${renderSourceLink("cybercrime-job-advisory")} — the document could not be independently verified on the listed date. Confirm its current contents before relying on it.</li><li>Report the recruiter or listing through the platform where you found the job, and preserve the listing URL and messages.</li></ul><p>Never share an OTP or password with a recruiter. Stop and independently verify any payment request.</p>` },
        { heading: "Look for patterns—not a diagnosis.", body: "The interactive page checks wording about recruitment or interview fees, personal transfers, OTPs and passwords, equipment purchases, cheque forwarding, guaranteed selection, urgency, unpaid training, early identity-document requests, remote-access apps, crypto or gift cards, and unusually high salary claims. It compares entered email and website domains for exact or subdomain matches, common free-mail services, text lookalikes, and suffixes outside a small reference list. These rules run in the browser. A match is a reason to verify; no match does not establish that an offer is genuine." },
        { heading: "Questions that fit the role.", html: questionHtml },
        { heading: "Different legal forms, different checks.", html: `<table><thead><tr><th scope="col">Employer type</th><th scope="col">What to verify or ask</th></tr></thead><tbody>${employerTypeHtml}</tbody></table><p>For registrations that are not publicly searchable, ask the exact employing entity, the applicable code, issuing state, and whether the registration applies to this role and work location. An absent search result is not proof of wrongdoing.</p>` },
        { heading: "Signals are prompts, not proof.", html: "<div><h3>Useful evidence to collect</h3><ul><li>The offer, legal entity, and recruiter can be confirmed independently.</li><li>Role, manager, work location, pay structure, and start conditions are consistent in writing.</li><li>HR answers reasonable questions without asking for a fee, OTP, password, or remote access.</li><li>Identifiers and official records align with the entity and location claimed.</li></ul></div><div><h3>Reasons to pause and verify</h3><ul><li>Money is requested for an interview, job, equipment, or training.</li><li>Urgency is used to stop independent verification.</li><li>A personal transfer, credential, OTP, or remote-access request is made.</li><li>The employer identity, scope, manager, or work location changes repeatedly.</li><li>A record may describe a different entity; check identity before drawing a conclusion.</li></ul></div><p>Signals are questions, not proof or a company verdict.</p>" },
        { heading: workedExample.title, body: workedExample.text },
        { heading: "Offer and document checklist.", html: `<ul><li>Legal employer on the offer, the legal name behind the brand, and who pays salary.</li><li>Role, responsibilities, manager, location, work mode, and travel expectations.</li><li>Fixed and variable pay, payout conditions, benefits, deductions, probation, and review cycle.</li><li>Joining date, notice, termination terms, and any bond or repayment clause.</li><li>For agency or contractor work: client, assignment period, employer responsibilities, and end-of-assignment terms.</li><li>Secure document-submission route; never share a password, OTP, or unnecessary financial data.</li></ul><p>Related CareerReality resources: <a href="${escapeHtml(publicPath("/salary-calculator"))}">compare take-home pay</a>, <a href="${escapeHtml(publicPath("/resign-or-stay"))}">think through a career move</a>, <a href="${escapeHtml(publicPath("/layoff-runway"))}">plan a financial runway</a>, and <a href="${escapeHtml(publicPath("/guides"))}">browse career guides</a>.</p>` },
        { heading: "Terms worth knowing.", html: "<dl><div><dt>CIN</dt><dd>Corporate Identity Number for a company record. The page's common-shape helper does not validate an MCA registration.</dd></div><div><dt>LLPIN</dt><dd>Limited Liability Partnership Identification Number. Confirm the exact identifier through MCA.</dd></div><div><dt>Legal employer</dt><dd>The entity that formally employs and pays you; it may differ from the brand, staffing partner, or client location.</dd></div><div><dt>Establishment code</dt><dd>An identifier associated with an establishment record; confirm the entity and location it applies to.</dd></div><div><dt>Lookalike domain</dt><dd>Text resembling another web or email domain. Similarity is a prompt to verify, not proof of who sent a message.</dd></div></dl>" },
        { heading: "Questions people ask", html: `<dl>${faqHtml}</dl>` },
        { heading: "Official source links and limits.", html: `<p>The date shows when each destination was reviewed. Notes explain what was confirmed and what still needs checking; a source record is not a guarantee that every page or service will remain available.</p><div class="snapshot-table-wrap" role="region" aria-label="Scrollable official source register" tabindex="0"><table><thead><tr><th scope="col">Source</th><th scope="col">Use it for</th><th scope="col">Checked</th><th scope="col">Check and limitation</th></tr></thead><tbody>${sourceRows}</tbody></table></div>` },
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
        { heading: "Authorship and assembly", body: "Author, reviewer, original publication date, and substantive update details are published only when supported by owner-approved records. No independent review is implied without a record of an actual review. Source links do not establish authorship or review." },
        { heading: "Evidence limits", body: "Source links identify the material used. Historical publication and review dates are not recorded when they cannot be verified; no independent review is implied." },
      ],
    };
  }

  if (route === "/contact") {
    return {
      lead: "Email hello@careerreality.in or use the form for a correction, privacy request, or general message.",
      sections: [
        { heading: "Email and operator", html: '<p><a href="mailto:hello@careerreality.in">hello@careerreality.in</a></p>' },
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
        { heading: "Start with a known shape", html: renderCtcWorkedExamples() },
        { id: "method", heading: "A useful estimate is not a payslip.", body: "For Tax Year 2026–27, the model estimates ordinary salary income for a resident individual under age 60 in the new regime. It applies the standard deduction, rebate and marginal relief, surcharge rules, and 4% cess. Professional tax reduces cash but is entered from payroll or a verified state schedule. PF can be entered manually, or estimated month by month from a user-entered start date. The statutory ceiling is ₹15,000 through 16 September 2026 and ₹25,000 from 17 September; September is split by the official 16/14-day periods. Calculated employer shares use 8.33% EPS and the balance to EPF, subject to eligibility. Employer contributions count toward CTC only when marked included. Gratuity and other costs are not inferred." },
        { heading: "Assumptions & exclusions", body: "This is not a payslip, tax filing, or approved payroll guidance. It excludes special-rate income, exemptions not entered, other income, employer-specific treatment, and exact payroll rules. The employment start date affects the PF estimate only, not income tax or other annual salary amounts. Verify membership and contribution treatment with qualified payroll advice." },
        { heading: "Official references", html: `<ul>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: salaried-individual tax and return guidance</a></li>
          <li><a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" target="_blank" rel="noopener noreferrer">Income Tax Department: Salaried Individuals for AY 2026–27</a></li>
          <li><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2314111&amp;lang=2&amp;reg=48" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment: revised ₹25,000 monthly EPFO ceiling and contribution split</a> — effective 17 September 2026</li>
          <li><a href="https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf" target="_blank" rel="noopener noreferrer">Employees' Provident Fund Organisation: wage-ceiling FAQ</a> — questions 7 and 9 show September contribution examples and the transition-period calculation.</li>
        </ul><p>The official EPFO FAQ and Ministry release describe the ₹15,000 ceiling through 16 September 2026, ₹25,000 from 17 September, and separate September contribution periods of 16 and 14 days. The calculator uses a user-entered employment start date and is not an approved payroll result. Verify membership, contribution treatment, and employer-specific rules with qualified payroll advice. Professional tax is entered manually.</p>` },
        ...routeFaqSections(route),
      ],
      relatedLinks: [
        { href: publicPath("/tools"), label: "Browse the active tools" },
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
  const toolBlocks = routePolicy?.kind === "tool" ? getToolContentBlocks(route) : [];
  if (toolBlocks.length) {
    return {
      lead: toolSnapshotLead(route, meta),
      sections: [...toolBlocks.map(renderToolContentBlock), ...routeFaqSections(route)],
      ...(routePolicy?.component === "toolSuite"
        ? { relatedLinks: [
            { href: publicPath("/tools"), label: "Browse all tools" },
            { href: publicPath("/methodology"), label: "Review methods and limits" },
          ] }
        : {}),
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
    html: `${section.content.split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}${section.sourceNotes.length ? `<p class="snapshot-source-note"><strong>Source context:</strong> ${section.sourceNotes.map(escapeHtml).join(" · ")}</p>` : ""}${section.sourceLinks.length ? `<ul class="snapshot-source-links">${section.sourceLinks.map((source) => `<li>${sourceLink(source.url, source.label)} —${source.year ? `source year stated as ${escapeHtml(source.year)}` : "date not stated in the archived source note"}</li>`).join("")}</ul>` : ""}`,
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
      html: `<ul>${guide.sources.map((source) => `<li>${sourceLink(source.url, source.label)}${source.year ? ` — ${escapeHtml(source.year)}` : ""}</li>`).join("")}</ul>`,
    });
  }
  if (guide.relatedLinks?.length) {
    sections.push({ heading: "Related guides and tools", links: guide.relatedLinks.map((link) => ({ href: publicPath(link.url), label: link.label })) });
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
  const pageHeading = getPageHeading(route);
  const heading = pageHeading?.h1 ?? meta.heading ?? meta.title;
  const seoTitle = formatSeoTitle(meta.seoTitle ?? meta.title);
  const baseContent = options.content ?? renderRouteContent(route, meta);
  const content = baseContent;
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
      ${pageHeading?.subhead ? `<p class="snapshot-subhead">${escapeHtml(pageHeading.subhead)}</p>` : ""}
      ${excerpt}
      ${isGuide ? `<p class="snapshot-byline">By <a href="${escapeHtml(publicPath("/team"))}" rel="author">${escapeHtml(SITE_FOUNDER.name)}</a></p>` : ""}
    </header>
    <main>
      <p class="snapshot-lead">${escapeHtml(content.lead)}</p>
      ${content.sections.map((section) => `<section${section.id ? ` id="${escapeHtml(section.id)}"` : ""}>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}${section.body ? `<p>${escapeHtml(section.body)}</p>` : ""}${section.html ?? ""}${section.links?.length ? `<ul>${renderSnapshotLinks(section.links)}</ul>` : ""}</section>`).join("")}
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
          "@id": `${siteUrl}/about/#webpage`,
          name: meta.title,
          url: canonical,
          about: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en-IN",
        }] : []),
        ...(route === "/contact" ? [{
          "@type": "ContactPage",
          "@id": `${siteUrl}/contact/#webpage`,
          name: meta.title,
          url: canonical,
          about: { "@id": `${siteUrl}/#organization` },
          mainEntity: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en-IN",
        }] : []),
        ...(route === "/team" ? [{
          "@type": "ProfilePage",
          "@id": `${siteUrl}/team/#webpage`,
          name: meta.title,
          url: canonical,
          mainEntity: { "@id": createFounderPerson(siteUrl)["@id"] },
          inLanguage: "en-IN",
        }, createFounderPerson(siteUrl)] : []),
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

  const registryRoute = routeRegistry.routes.find((entry) => entry.path === route);
  // Article headline and description come from the route registry, matching src/lib/seo.ts after hydration.
  const articleHeadline = registryRoute?.title ?? meta.title;
  const articleImage = [`${siteUrl}${SITE_SOCIAL_IMAGE_PATH}`];

  if (registryRoute?.kind === "guide") {
    const guide = generatedGuideData.guides.find((entry) => entry.slug === registryRoute.guideSlug);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: articleHeadline,
      description: meta.description,
      ...(guide?.datePublished ? { datePublished: guide.datePublished } : {}),
      ...(guide?.dateModified ? { dateModified: guide.dateModified } : {}),
      image: articleImage,
      mainEntityOfPage: canonical,
      author: createFounderAuthor(siteUrl),
      publisher: organization,
      inLanguage: "en-IN",
    });
  }

  if (registryRoute && isApplicationToolRoute(registryRoute)) {
    schemas.push(createToolApplicationSchema(siteUrl, registryRoute));
  }

  const rulesPage = rulesLibraryData.pages.find((page) => page.path === route);
  if (rulesPage) {
    schemas.push(createRulesPageSchema(siteUrl, rulesPage));
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
        headline: articleHeadline,
        description: meta.description,
        // The source report's date belongs to the cited work, not to this page's publication.
        dateModified: event.updatedAt,
        image: articleImage,
        mainEntityOfPage: canonical,
        publisher: organization,
        citation: [{ "@type": "CreativeWork", name: event.sourceLabel, url: event.sourceUrl, datePublished: event.sourcePublishedAt }],
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
    const schemaId = type === "BreadcrumbList" ? "breadcrumbs" : type === "Article" ? "article" : type === "FAQPage" ? "faq" : type === "WebApplication" ? "webapp" : type === "WebPage" ? "webpage" : index === 0 ? "site" : `schema-${index}`;
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
      lead: `Use the dated tracker as a starting point, not a prediction about your role. Record copy updated ${formatSnapshotDate(lastUpdated)}; this is not confirmation of current outcomes. Company announcements, reported events, and rumours are different evidence states.`,
      sections: [
        { heading: "Company events, with the source attached.", html: `<ul>${rows}</ul>` },
        { heading: "Follow sourced company events.", body: "The interactive alert form asks for an email address; city and sector are optional. Confirm by email before alerts begin. Rumours are never sent. The form appears when the interactive page loads.", id: "email-alerts" },
        { heading: "How rumours are handled", body: "A rumour must be labelled as unverified, linked to its attributable source, and kept out of email alerts. No rumour is presented here as a confirmed event." },
        { heading: "How much room do you have to move?", body: "The private 12-month cash-flow worksheet starts with accessible cash, lets you place an expected one-time payment in a selected month, and models continuing monthly income through a selected month. Break essential spending into housing, food, utilities, transport, healthcare and care, loan payments, and other essentials. Its month-end balances hold those assumptions steady; the worksheet does not model exact within-month payment dates, tax, legal entitlements, or when new work will arrive. Entries stay in page memory and clear on reload.", links: [
          { href: publicPath("/layoff-runway"), label: "Open the layoff cash-runway calculator" },
          { href: publicPath("/guides/layoff-recovery-and-employment-documents"), label: "Read the layoff recovery guide" },
        ] },
        { heading: "Rights depend on the details.", html: `<p>India’s Ministry of Labour and Employment published its Labour Codes FAQs on 30 December 2025 and additional FAQs dated 16 March 2026. These sources do not determine whether a particular role or employer is covered. Check the applicable law, state rules, contract, service facts, and written separation terms; seek qualified advice for your circumstances.</p><ul><li><a href="https://labour.gov.in/en/faqs-labour-codes" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment — FAQs on Labour Codes (30 December 2025)</a></li><li><a href="https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf" target="_blank" rel="noopener noreferrer">Ministry of Labour and Employment — Additional FAQs on Labour Codes (16 March 2026)</a></li></ul>` },
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
      ...(event.sourceUpdates?.length ? [{
        heading: "Later reporting and clarifications",
        html: event.sourceUpdates.map((update) =>
          `<p><strong>${escapeHtml(update.sourceLabel)} · ${escapeHtml(formatSnapshotDate(update.sourcePublishedAt))}:</strong> ${escapeHtml(update.summary)} <a href="${escapeHtml(update.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read this report</a></p>`,
        ).join(""),
      }] : []),
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
  });

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