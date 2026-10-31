import type { ArticleCategory } from "./content";
import { editorialPrimaryIntents } from "./editorial-briefs";
import { ARTICLE_TITLE_SUFFIX } from "./seo-title";

export { ARTICLE_TITLE_SUFFIX } from "./seo-title";

export type EditorialSource = {
  publisher: string;
  title: string;
  date: string;
  url: string;
  section: string;
  supports: string;
  role: "claim" | "context";
  verificationStatus?: "UNVERIFIED" | "VERIFIED" | "REQUIRES_EDITORIAL_REVIEW";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

type SourceRecord = Omit<EditorialSource, "section" | "supports" | "role">;

export type VisualKind = "timeline" | "comparison" | "signal-ladder" | "decision-map";

export type EditorialVisualVariant = "ctc-breakdown" | "ai-evidence-ladder" | "humour-matrix";

export type EditorialVisualCallout = {
  label: string;
  value: string;
  detail: string;
  sourcePublisher: string;
};

export type EditorialVisualMatrix = {
  xAxis: { low: string; high: string };
  yAxis: { low: string; high: string };
  quadrants: Array<{ label: string; detail: string; tone: "safe" | "watch" | "risk" }>;
};

export type EditorialVisual = {
  kind: VisualKind;
  variant?: EditorialVisualVariant;
  label: string;
  title: string;
  caption: string;
  measurement: "qualitative" | "source-backed";
  items: Array<{ label: string; value: string; detail: string }>;
  callouts?: EditorialVisualCallout[];
  matrix?: EditorialVisualMatrix;
  guide?: Array<{ question: string; answer: string; detail: string }>;
};

export type EditorialMetadata = {
  primaryIntent: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  datePublished: string | null;
  dateModified: string | null;
  relatedSlugs: string[];
  sources: EditorialSource[];
  visual: EditorialVisual;
  takeaway: string;
  verifyQuestions: string[];
};

export const ARTICLE_TITLE_MAX_LENGTH = 65;

const sourceLibrary = {
  wef: {
    publisher: "World Economic Forum",
    title: "The Future of Jobs Report 2025",
    date: "2025",
    url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest",
  },
  iloGenai: {
    publisher: "International Labour Organization",
    title: "Generative AI and Jobs: A Refined Global Index of Occupational Exposure",
    date: "2025",
    url: "https://www.ilo.org/resource/news/one-four-jobs-risk-being-transformed-genai-new-ilo%E2%80%93nask-global-index-shows",
  },
  iloWeso: {
    publisher: "International Labour Organization",
    title: "World Employment and Social Outlook Trends 2025",
    date: "2025",
    url: "https://www.ilo.org/sites/default/files/2025-01/WESO25_Trends_Report_ENGLISH.pdf",
  },
  zinnovSalary: {
    publisher: "Zinnov",
    title: "Salary Increase, Attrition & Hiring Trends in GCCs 2025",
    date: "2025",
    url: "https://zinnov.com/global-talent/salary-increase-attrition-and-hiring-trends-an-india-gcc-view-2025-report",
  },
  zinnovBoom: {
    publisher: "Zinnov",
    title: "India’s GCC Boom: Insights from the Zinnov-NASSCOM report",
    date: "2025",
    url: "https://zinnov.com/news-media/indias-gcc-boom-insights-from-the-zinnov-nasscom-report",
  },
  bsJobs: {
    publisher: "Business Standard / PTI",
    title: "GCCs to create 450K new jobs in 2025",
    date: "2025",
    url: "https://www.business-standard.com/companies/news/gccs-to-create-450k-new-jobs-in-2025-as-companies-plan-to-expand-report-125020501322_1.html",
  },
  foundit: {
    publisher: "Business Standard / foundit Insights Tracker",
    title: "India’s GCC growth holds at 12% in 2025; Tier-2 cities and freshers drive momentum",
    date: "2025",
    url: "https://www.business-standard.com/content/press-releases-ani/india-s-gcc-growth-holds-at-12-in-2025-tier-2-cities-and-freshers-drive-momentum-foundit-insights-tracker-125080701133_1.html",
  },
  etOutlook: {
    publisher: "The Economic Times",
    title: "India’s employment outlook rises 43% for Q2 2025: survey",
    date: "2025",
    url: "https://m.economictimes.com/news/economy/indicators/indias-employment-outlook-rises-43-pc-in-q2-2025-survey/articleshow/118895742.cms",
  },
  cartaGuide: {
    publisher: "Carta",
    title: "Equity Compensation: A Guide for Employees & Founders",
    date: "2025",
    url: "https://carta.com/learn/equity/compensation",
  },
  cartaState: {
    publisher: "Carta",
    title: "State of Startup Compensation H2 2025",
    date: "2025",
    url: "https://carta.com/data/startup-compensation-h2-2025",
  },
  oecdPay: {
    publisher: "OECD",
    title: "Pay Transparency in Progress",
    date: "2026",
    url: "https://www.oecd.org/en/publications/pay-transparency-in-progress_121f268d-en.html",
  },
  euroPay: {
    publisher: "Euronews / Indeed",
    title: "EU pay transparency: Are job ads finally getting honest about salaries?",
    date: "2026",
    url: "https://www.euronews.com/business/2026/09/08/eu-pay-transparency-are-job-ads-finally-getting-honest-about-salaries",
  },
  linkedinAi: {
    publisher: "India Today / LinkedIn",
    title: "AI jobs in India rise 51 as skills-first hiring and tier-2 cities reshape workforce",
    date: "2026",
    url: "https://www.indiatoday.in/jobs/story/ai-jobs-in-india-rise-51-as-skills-first-hiring-and-tier-2-cities-reshape-workforce-india-linkedin-head-educ-2976508-2026-08-21",
  },
  teamleaseAi: {
    publisher: "Reuters / ET HRWorld",
    title: "India hiring tilts toward contracts as AI prompts workforce rethink",
    date: "2026",
    url: "https://hr.economictimes.indiatimes.com/news/workplace-4-0/talent-management/india-hiring-tilts-toward-contracts-as-ai-prompts-workforce-rethink-teamlease-says/131246873",
  },
  workdayConnection: {
    publisher: "Workday Foundation",
    title: "Human Connection Workplace Index",
    date: "2026",
    url: "https://newsroom.workday.com/2026-05-27-New-Workday-Global-Research-Finds-AI-is-Easing-Burnout-but-May-Be-Deepening-a-Connection-Deficit-at-Work",
  },
  humourResearch: {
    publisher: "Safety Science",
    title: "When humour hurts: The experience, social functions and risks of workplace humour",
    date: "2026",
    url: "https://www.sciencedirect.com/science/article/pii/S0925753526002031",
  },
  unionBudget2026TaxMemo: {
    publisher: "Government of India, Ministry of Finance",
    title: "Memorandum explaining the provisions in the Finance Bill, 2026",
    date: "2026",
    url: "https://www.indiabudget.gov.in/doc/memo.pdf",
  },
  incomeTaxSalaryDeductions: {
    publisher: "Income Tax Department, Government of India",
    title: "Deductions from salary",
    date: "2026",
    url: "https://www.incometaxindia.gov.in/w/%E2%80%8Bdeductions-from-salary",
  },
  incomeTaxAct2025FinanceAct2026: {
    publisher: "Government of India",
    title: "Income-tax Act, 2025, as amended by Finance Act 2026",
    date: "2026",
    url: "https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf",
  },
  epfoWageCeilingFaqs2026: {
    publisher: "Employees' Provident Fund Organisation, Ministry of Labour and Employment",
    title: "FAQs: Revision of EPFO Statutory Wage Ceiling",
    date: "2026",
    url: "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf",
  },
} satisfies Record<string, SourceRecord>;

const articleSeoTitles: Record<string, string> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": "Portfolio-first hiring: the gig test",
  "green-careers-esg-renewable-sustainability-india-2026": "Green careers in India: the real work",
  "cybersecurity-privacy-careers-beyond-tech-india-2026": "Cybersecurity careers beyond tech",
  "joining-bonus-clawback-offer-letter-traps-2026": "Joining-bonus clawback: what to check",
  "staff-engineer-promotion-freeze-india-2026": "Staff engineer promotion freezes",
  "gcc-return-to-office-hybrid-reality-india-2026": "GCC return-to-office in India",
  "relieving-letter-hostage-notice-period-india-2026": "Relieving letters and notice periods",
  "ai-upskilling-trap-india-api-wrapper-reality": "AI upskilling beyond API wrappers",
  "gcc-gold-rush-india-captive-center-reality": "India's GCC gold rush: the role test",
  "indian-it-layoff-cycle-2026": "India's IT layoff cycle: signals",
  "junior-data-scientist-reality-india": "Junior data science: beyond models",
  "home-loan-trap-dream-house-financial-prison": "Home loans: the financial-prison test",
  "ux-salary-myth-design-careers-plateau": "UX salary myth: where careers plateau",
  "pm-prestige-trap-escape-from-engineering": "PM prestige trap: test the work",
  "10x-developer-myth-productivity-killing-careers": "The 10x developer myth",
  "data-science-bubble-excel-work-reality": "Data science bubble: the Excel reality",
  "career-switch-illusion-changing-jobs-not-career": "Career switch: change the work",
  "engineering-career-ceiling-peak-at-35": "Engineering career ceiling: scope",
  "self-learning-trap-online-courses-expensive-entertainment": "Self-learning trap: courses vs practice",
  "broke-at-30-money-mistakes-nobody-warned": "Broke at 30: the money gaps",
  "indian-education-trap-degree-career-mistake": "Indian education: the career trade-off",
  "work-life-balance-myth-high-performers": "Work-life balance for high performers",
  "passion-luxury-not-strategy-india": "Passion is not a career strategy",
  "hr-conversations-what-matters-india": "HR conversations: what matters",
  "culture-fit-trap-hiring-reality": "Culture fit: what hiring teams mean",
  "job-hopping-stops-working-after-35": "Job hopping after 35",
  "performance-review-reality-ratings-india": "Performance reviews: how ratings work",
  "tech-lead-trap-responsibility-authority": "Tech lead trap: responsibility vs power",
  "devops-sre-reality-india-oncall": "DevOps and SRE: the on-call tax",
  "senior-developer-salary-ceiling-india": "Senior developer salary ceiling",
  "freelancing-reality-india-freedom-myth": "Freelancing in India: price of freedom",
  "networking-reality-india-introverts": "Networking in India for introverts",
  "layoff-recovery-timeline-india": "Layoff recovery: the next six months",
  "manager-vs-ic-career-path-india": "Manager vs IC: choose the work",
  "startup-equity-esop-reality-india": "Startup equity: the real trade-offs",
  "side-hustle-myth-india-reality": "Side hustle: not a second life",
  "remote-work-salary-trap-india": "Remote-work salary trap in India",
  "mba-reality-india-worth-it-2026": "MBA in India: is it worth it?",
  "american-dream-indian-engineers": "The American dream for Indian engineers",
  "what-20-lpa-actually-feels-like-india-purchasing-power": "What ₹20L CTC can mean in monthly cash",
  "why-upskilling-stops-working-career-trap": "Why upskilling stops working",
  "salary-transparency-india-2026-number-in-room": "Salary transparency in India",
  "ai-job-market-2026-india-show-your-working": "AI job market 2026 India",
  "humour-in-workplace-culture-2026-joke-is-on-promotion": "Humour in workplace culture",
};

export function articleSeoTitle(title: string, slug: string): string {
  const candidate = articleSeoTitles[slug] ?? title;
  const fullTitle = `${candidate}${ARTICLE_TITLE_SUFFIX}`;
  if (fullTitle.length > ARTICLE_TITLE_MAX_LENGTH) {
    throw new Error(`Article SEO title exceeds ${ARTICLE_TITLE_MAX_LENGTH} characters: ${slug}`);
  }
  return candidate;
}

type SourceKey = keyof typeof sourceLibrary;

function source(
  key: SourceKey,
  section: string,
  supports: string,
  role: EditorialSource["role"] = "context",
): EditorialSource {
  return { ...sourceLibrary[key], section, supports, role };
}

const articleSources: Record<string, EditorialSource[]> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": [
    source("wef", "The signal", "skills employers expect as work changes", "context"),
    source("iloWeso", "What the headline leaves out", "why broad labour-market context cannot prove a stable gig career", "context"),
  ],
  "green-careers-esg-renewable-sustainability-india-2026": [
    source("wef", "The signal", "green-transition skills and changing work", "context"),
    source("iloWeso", "Questions worth asking next", "labour-market context around new work, not a forecast of one role", "context"),
  ],
  "cybersecurity-privacy-careers-beyond-tech-india-2026": [
    source("wef", "The signal", "cybersecurity and analytical skills in the changing jobs landscape", "context"),
    source("iloWeso", "What the headline leaves out", "why labour-market exposure varies by work and region", "context"),
  ],
  "joining-bonus-clawback-offer-letter-traps-2026": [
    source("etOutlook", "The signal", "employment-demand context for evaluating an offer", "context"),
    source("cartaGuide", "What the headline leaves out", "the distinction between headline compensation and conditional value", "context"),
  ],
  "staff-engineer-promotion-freeze-india-2026": [
    source("wef", "The signal", "skills, leadership, and organisational change context", "context"),
    source("iloWeso", "Questions worth asking next", "why a broad labour outlook cannot establish an individual promotion path", "context"),
  ],
  "gcc-return-to-office-hybrid-reality-india-2026": [
    source("zinnovSalary", "The signal", "India GCC hiring, attrition, and salary context", "claim"),
    source("zinnovBoom", "What the headline leaves out", "the scale and operating context of GCC expansion", "claim"),
  ],
  "relieving-letter-hostage-notice-period-india-2026": [
    source("iloWeso", "The signal", "employment-transition context only; check the governing contract for rights", "context"),
    source("etOutlook", "Questions worth asking next", "why a labour-market survey cannot resolve an individual exit process", "context"),
  ],
  "ai-upskilling-trap-india-api-wrapper-reality": [
    source("iloGenai", "The signal", "AI exposure is more often task transformation than full replacement", "claim"),
    source("wef", "What the headline leaves out", "skills and human capabilities that sit beside new technology", "context"),
  ],
  "gcc-gold-rush-india-captive-center-reality": [
    source("zinnovBoom", "The signal", "India GCC expansion and capability-building context", "claim"),
    source("bsJobs", "What the headline leaves out", "reported GCC job creation plans and their limits for one role", "claim"),
    source("foundit", "Questions worth asking next", "reported GCC growth, city mix, and fresher momentum", "claim"),
  ],
  "indian-it-layoff-cycle-2026": [
    source("iloWeso", "The signal", "broad employment and labour-market conditions", "context"),
    source("zinnovSalary", "What the headline leaves out", "GCC hiring and attrition context rather than a company-level layoff forecast", "claim"),
  ],
  "junior-data-scientist-reality-india": [
    source("wef", "The signal", "analytical and technology skills employers are developing", "context"),
    source("iloGenai", "What the headline leaves out", "how AI exposure changes tasks without proving role elimination", "claim"),
  ],
  "home-loan-trap-dream-house-financial-prison": [
    source("etOutlook", "The signal", "employment confidence context for a household commitment", "context"),
    source("cartaGuide", "Questions worth asking next", "why conditional financial upside should not be treated as fixed cash", "context"),
  ],
  "ux-salary-myth-design-careers-plateau": [
    source("wef", "The signal", "creative, analytical, and technology skills in changing work", "context"),
    source("etOutlook", "What the headline leaves out", "why an employment survey cannot establish an individual salary ceiling", "context"),
  ],
  "pm-prestige-trap-escape-from-engineering": [
    source("wef", "The signal", "analytical thinking, leadership, and collaboration as durable skills", "context"),
    source("iloWeso", "Questions worth asking next", "broad labour context rather than proof that a PM move is better", "context"),
  ],
  "10x-developer-myth-productivity-killing-careers": [
    source("wef", "The signal", "technology literacy, systems thinking, and collaboration context", "context"),
    source("iloGenai", "What the headline leaves out", "AI exposure does not reduce engineering work to a single productivity score", "claim"),
  ],
  "data-science-bubble-excel-work-reality": [
    source("wef", "The signal", "analytical thinking and technology skills in the jobs landscape", "context"),
    source("iloGenai", "What the headline leaves out", "task transformation context for analytical work", "claim"),
  ],
  "career-switch-illusion-changing-jobs-not-career": [
    source("wef", "The signal", "skills portability and changing work requirements", "context"),
    source("iloWeso", "What the headline leaves out", "why labour-market conditions do not validate a personal career switch", "context"),
  ],
  "engineering-career-ceiling-peak-at-35": [
    source("wef", "The signal", "skills change and the value of judgement beyond task execution", "context"),
    source("iloWeso", "Questions worth asking next", "broad work context, not an age-based career rule", "context"),
  ],
  "self-learning-trap-online-courses-expensive-entertainment": [
    source("wef", "The signal", "skills employers expect people to keep developing", "context"),
    source("iloGenai", "What the headline leaves out", "why tool familiarity can change faster than durable capability", "claim"),
  ],
  "broke-at-30-money-mistakes-nobody-warned": [
    source("etOutlook", "The signal", "employment outlook context for household planning", "context"),
    source("iloWeso", "What the headline leaves out", "why labour-market conditions cannot predict one household's runway", "context"),
  ],
  "indian-education-trap-degree-career-mistake": [
    source("wef", "The signal", "skills and changing pathways into work", "context"),
    source("iloWeso", "The decision this changes", "broad employment context rather than a return-on-degree promise", "context"),
  ],
  "work-life-balance-myth-high-performers": [
    source("wef", "The signal", "the changing skills and work-design landscape", "context"),
    source("iloWeso", "What the headline leaves out", "why macro employment data cannot measure one team's pace or health", "context"),
  ],
  "passion-luxury-not-strategy-india": [
    source("wef", "The signal", "skills, opportunity, and changing work context", "context"),
    source("etOutlook", "The decision this changes", "employment-demand context without a promise of personal demand", "context"),
  ],
  "hr-conversations-what-matters-india": [
    source("etOutlook", "The signal", "employment outlook context for evaluating an offer", "context"),
    source("wef", "What the headline leaves out", "skills and work expectations that a role conversation may hide", "context"),
  ],
  "culture-fit-trap-hiring-reality": [
    source("wef", "The signal", "human skills, collaboration, and changing work expectations", "context"),
    source("iloWeso", "What the headline leaves out", "why a broad labour outlook cannot validate a culture-fit claim", "context"),
  ],
  "job-hopping-stops-working-after-35": [
    source("wef", "The signal", "skills portability and changing job requirements", "context"),
    source("iloWeso", "Questions worth asking next", "broad labour context, not an age-based rule about job changes", "context"),
  ],
  "performance-review-reality-ratings-india": [
    source("wef", "The signal", "leadership, collaboration, and analytical skills in changing work", "context"),
    source("iloWeso", "What the headline leaves out", "why macro employment data cannot explain one employer's calibration", "context"),
  ],
  "tech-lead-trap-responsibility-authority": [
    source("wef", "The signal", "leadership, systems thinking, and collaboration context", "context"),
    source("iloGenai", "What the headline leaves out", "technology exposure does not reveal the authority behind a role", "claim"),
  ],
  "devops-sre-reality-india-oncall": [
    source("wef", "The signal", "technology literacy and resilience skills in changing work", "context"),
    source("iloGenai", "The decision this changes", "automation changes tasks but does not remove operational accountability", "claim"),
  ],
  "senior-developer-salary-ceiling-india": [
    source("wef", "The signal", "skills and scope that can compound beyond local execution", "context"),
    source("etOutlook", "What the headline leaves out", "why an employment survey is not a salary benchmark", "context"),
  ],
  "freelancing-reality-india-freedom-myth": [
    source("iloWeso", "The signal", "self-employment and labour-market context", "context"),
    source("etOutlook", "What the headline leaves out", "why employment outlook does not guarantee a freelance pipeline", "context"),
  ],
  "networking-reality-india-introverts": [
    source("wef", "The signal", "human skills and collaboration in changing work", "context"),
    source("iloWeso", "The decision this changes", "broad labour context rather than a networking success rate", "context"),
  ],
  "layoff-recovery-timeline-india": [
    source("iloWeso", "The signal", "labour-market context for a recovery after job loss", "claim"),
    source("etOutlook", "What the headline leaves out", "why a survey period cannot predict an individual's search timeline", "claim"),
  ],
  "manager-vs-ic-career-path-india": [
    source("wef", "The signal", "leadership, collaboration, and technical skills as different forms of leverage", "context"),
    source("iloWeso", "The decision this changes", "broad labour context rather than a universal career ladder", "context"),
  ],
  "startup-equity-esop-reality-india": [
    source("cartaGuide", "The signal", "how equity compensation differs from cash compensation", "claim"),
    source("cartaState", "What the headline leaves out", "startup compensation and liquidity context", "claim"),
  ],
  "side-hustle-myth-india-reality": [
    source("iloWeso", "The signal", "labour-market context for work outside a primary job", "context"),
    source("etOutlook", "What the headline leaves out", "why employment outlook cannot establish side-income demand", "context"),
  ],
  "remote-work-salary-trap-india": [
    source("wef", "The signal", "work design and skills context as jobs change", "context"),
    source("etOutlook", "What the headline leaves out", "employment outlook context rather than a remote-pay benchmark", "context"),
  ],
  "mba-reality-india-worth-it-2026": [
    source("wef", "The signal", "skills and changing pathways into work", "context"),
    source("iloWeso", "The decision this changes", "employment context rather than a guaranteed MBA return", "context"),
  ],
  "american-dream-indian-engineers": [
    source("wef", "The signal", "global skills and changing work context", "context"),
    source("iloWeso", "What the headline leaves out", "labour-market context that cannot price immigration or household support", "context"),
  ],
  "what-20-lpa-actually-feels-like-india-purchasing-power": [
    source("incomeTaxAct2025FinanceAct2026", "The signal", "the Tax Year 2026–27 tax rules and salary deduction used in the calculation", "claim"),
    source("incomeTaxAct2025FinanceAct2026", "What the headline leaves out", "the new-regime slabs and standard deduction used in the example", "claim"),
    source("epfoWageCeilingFaqs2026", "What the headline leaves out", "the PF ceiling date transition used in the example; employment timing and eligibility remain assumptions", "claim"),
    source("epfoWageCeilingFaqs2026", "What the headline leaves out", "the current PF wage ceiling and contribution basis; the example separately labels its 12-month annualization", "claim"),
  ],
  "why-upskilling-stops-working-career-trap": [
    source("wef", "The signal", "skills employers expect to evolve", "context"),
    source("iloGenai", "What the headline leaves out", "why AI exposure changes tasks and raises the value of judgement", "claim"),
  ],
  "salary-transparency-india-2026-number-in-room": [
    source("oecdPay", "The signal", "global pay-transparency tools, reporting, and job-evaluation context", "claim"),
    source("euroPay", "What the headline leaves out", "how published salary information can still vary by country, role, and implementation", "claim"),
  ],
  "ai-job-market-2026-india-show-your-working": [
    source("linkedinAi", "The signal", "reported growth in AI roles, skills-first hiring, and tier-2 city momentum in India", "claim"),
    source("teamleaseAi", "What the headline leaves out", "contract hiring, workforce redesign, and skill-location-salary mismatch context", "claim"),
  ],
  "humour-in-workplace-culture-2026-joke-is-on-promotion": [
    source("workdayConnection", "The signal", "reported connection deficit alongside AI-enabled work and burnout changes", "claim"),
    source("humourResearch", "What the headline leaves out", "the distinction between affiliative and harmful workplace humour", "claim"),
  ],
};

const categoryQuestions: Record<ArticleCategory, string[]> = {
  "career-reality-checks": [
    "Which part of this signal is visible in your team, city, or employer rather than only in the wider market?",
    "What document, conversation, or repeated pattern would confirm the claim for your situation?",
    "What would make you revise this decision after the next 30 or 90 days?",
  ],
  "career-strategy": [
    "What evidence would show that this move improves your actual scope, not just your title?",
    "Which assumption about timing, support, or opportunity is still untested?",
    "What is the smallest reversible experiment you can run before committing?",
  ],
  engineering: [
    "What work would you own in practice, and who can confirm the decision rights?",
    "Which artefact or outcome would make your readiness visible to the next decision-maker?",
    "What changes if the roadmap, budget, or team structure moves by one quarter?",
  ],
  "money-reality": [
    "What reaches your bank account in an ordinary month, and what is conditional?",
    "Which obligation or recurring cost makes the headline number less usable?",
    "What written clause or calculation would you check before accepting the offer?",
  ],
  "software-engineering": [
    "What system, reliability, or product outcome would you be accountable for?",
    "Where does the role have authority to change the result it is measured on?",
    "What evidence will you keep so the scope compounds beyond one project?",
  ],
};

const visualByCategory: Record<ArticleCategory, EditorialVisual> = {
  "career-reality-checks": {
    kind: "signal-ladder",
    label: "Editorial synthesis",
    title: "From noise to a decision-grade signal",
    caption: "A practical reading order for separating a loud headline from evidence you can act on.",
    measurement: "qualitative",
    items: [
      { label: "Headline", value: "01", detail: "A claim worth noticing, not accepting." },
      { label: "Pattern", value: "02", detail: "Repeated evidence across roles, teams, or time." },
      { label: "Case", value: "03", detail: "The part that matches your actual situation." },
      { label: "Next check", value: "04", detail: "One question or document that can change the view." },
    ],
  },
  "career-strategy": {
    kind: "decision-map",
    label: "Editorial synthesis",
    title: "A move has three gates",
    caption: "Use the map as a reading aid. It is a synthesis of the article’s decision logic, not a forecast.",
    measurement: "qualitative",
    items: [
      { label: "Want", value: "01", detail: "Name the outcome you are actually trying to change." },
      { label: "Proof", value: "02", detail: "Find evidence that the path can produce it." },
      { label: "Downside", value: "03", detail: "Price the cost if the promise arrives late or not at all." },
    ],
  },
  engineering: {
    kind: "signal-ladder",
    label: "Editorial synthesis",
    title: "The work behind the title",
    caption: "The cards are a qualitative lens for reading scope; they are not a survey or market measurement.",
    measurement: "qualitative",
    items: [
      { label: "Visible craft", value: "Core", detail: "The artefact, system, or technical decision." },
      { label: "Judgement", value: "Middle", detail: "Trade-offs, prioritisation, and risk ownership." },
      { label: "Leverage", value: "Wider", detail: "Making other teams or systems more effective." },
    ],
  },
  "money-reality": {
    kind: "comparison",
    label: "Editorial synthesis",
    title: "Headline pay versus usable pay",
    caption: "A comparison frame for checking what an offer changes in ordinary life. The values are labels, not salary estimates.",
    measurement: "qualitative",
    items: [
      { label: "Headline", value: "Gross", detail: "The number used to sell the opportunity." },
      { label: "Certain", value: "Fixed", detail: "Cash and benefits you can reasonably count on." },
      { label: "Conditional", value: "Variable", detail: "Pay dependent on targets, timing, or discretion." },
      { label: "Usable", value: "Net", detail: "What remains after tax and the cost of accepting." },
    ],
  },
  "software-engineering": {
    kind: "timeline",
    label: "Editorial synthesis",
    title: "Read the role across a quarter",
    caption: "A simple timeline for testing whether a technical role has the scope it promises.",
    measurement: "qualitative",
    items: [
      { label: "Week 01", value: "Context", detail: "Learn the system, owner map, and current constraint." },
      { label: "Week 04", value: "Proof", detail: "Ship a bounded improvement or make a risk legible." },
      { label: "Week 08", value: "Scope", detail: "Take a decision that cannot be solved by ticket volume." },
      { label: "Week 12", value: "Review", detail: "Compare promised leverage with observed authority." },
    ],
  },
};

const visualOverrides: Record<string, EditorialVisual> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": { kind: "decision-map", label: "Career decision lens", title: "Turn a portfolio into a hiring case", caption: "Read the gig-work question through proof of demand, delivery, repeatability, and downside.", measurement: "qualitative", items: [{ label: "Demand", value: "Need", detail: "A real client or employer problem worth solving." }, { label: "Proof", value: "Artefact", detail: "Work that makes judgement visible without inflated claims." }, { label: "Repeat", value: "Process", detail: "A way to deliver reliably beyond one lucky project." }, { label: "Downside", value: "Runway", detail: "Cash, rights, and boundaries that keep the experiment survivable." }] },
  "green-careers-esg-renewable-sustainability-india-2026": { kind: "signal-ladder", label: "Career decision lens", title: "From green label to accountable work", caption: "Use the sustainability question as a path from purpose language to evidence, ownership, and action.", measurement: "qualitative", items: [{ label: "Claim", value: "Purpose", detail: "What the employer says the work is meant to change." }, { label: "Record", value: "Evidence", detail: "Bills, inventories, supplier files, or operating data behind the claim." }, { label: "Owner", value: "Mandate", detail: "Who can correct a process rather than only report it." }, { label: "Result", value: "Change", detail: "A decision or control that makes the work consequential." }] },
  "cybersecurity-privacy-careers-beyond-tech-india-2026": { kind: "decision-map", label: "Career decision lens", title: "Choose the risk you will make legible", caption: "A reading aid for separating security vocabulary from the authority and evidence behind the role.", measurement: "qualitative", items: [{ label: "Domain", value: "Risk", detail: "The system, data, or people the role protects." }, { label: "Signal", value: "Finding", detail: "How a concern becomes a specific, reviewable issue." }, { label: "Lever", value: "Control", detail: "What the team can change to reduce exposure." }, { label: "Escalation", value: "Owner", detail: "Who accepts, funds, or resolves the remaining risk." }] },
  "joining-bonus-clawback-offer-letter-traps-2026": { kind: "timeline", label: "Offer-reading lens", title: "Follow the bonus through its conditions", caption: "Read the joining payment as a sequence of promises, triggers, documents, and possible repayment.", measurement: "qualitative", items: [{ label: "Offer", value: "Promise", detail: "Whether payment is fixed, discretionary, or approval-dependent." }, { label: "Join", value: "Condition", detail: "What must happen on the joining date." }, { label: "Stay", value: "Window", detail: "The stated period and whether the obligation reduces." }, { label: "Exit", value: "Trigger", detail: "What the document says happens when employment ends." }] },
  "staff-engineer-promotion-freeze-india-2026": { kind: "decision-map", label: "Career decision lens", title: "Separate staff scope from staff recognition", caption: "Use the promotion question to test readiness, organisational capacity, authority, and the cost of waiting.", measurement: "qualitative", items: [{ label: "Scope", value: "Work", detail: "Cross-team problems and decisions already being carried." }, { label: "Proof", value: "Evidence", detail: "Outcomes and trade-offs another reviewer can verify." }, { label: "Capacity", value: "Slot", detail: "The budget, level opening, or process outside personal control." }, { label: "Choice", value: "Path", detail: "A clear checkpoint for staying, negotiating, or moving." }] },
  "gcc-return-to-office-hybrid-reality-india-2026": { kind: "comparison", label: "Work-design lens", title: "Compare the office bargain with ordinary life", caption: "A qualitative frame for weighing attendance, collaboration, household cost, and policy stability.", measurement: "qualitative", items: [{ label: "Presence", value: "Cadence", detail: "The actual team expectation, not the campus description." }, { label: "Value", value: "Access", detail: "Decisions, learning, or relationships office time improves." }, { label: "Cost", value: "Routine", detail: "Travel, care, housing, energy, and time moved onto the employee." }, { label: "Stability", value: "Policy", detail: "How the arrangement is documented and can change." }] },
  "relieving-letter-hostage-notice-period-india-2026": { kind: "signal-ladder", label: "Exit-reading lens", title: "Build the record behind a difficult exit", caption: "Separate dates, handover, clearance, and employment proof before treating one missing document as the whole dispute.", measurement: "qualitative", items: [{ label: "Date", value: "Chronology", detail: "Resignation, acknowledgement, and last-working-day records." }, { label: "Handover", value: "Continuity", detail: "A factual account of systems, risks, owners, and open work." }, { label: "Clearance", value: "Process", detail: "Named dependencies and an owner rather than an indefinite promise." }, { label: "Proof", value: "Documents", detail: "Employment records that answer the next employer's actual question." }] },
  "ai-upskilling-trap-india-api-wrapper-reality": { kind: "signal-ladder", label: "Learning decision lens", title: "Move from AI exposure to useful capability", caption: "Read the upskilling question through the problem, judgement, evidence, and feedback a course can produce.", measurement: "qualitative", items: [{ label: "Problem", value: "Need", detail: "A workplace decision the new skill is meant to improve." }, { label: "Build", value: "Artefact", detail: "A working example that includes limits and failure cases." }, { label: "Judge", value: "Context", detail: "Knowing when automation is unsafe, weak, or incomplete." }, { label: "Feedback", value: "Review", detail: "A person or outcome that can challenge the claim of readiness." }] },
  "gcc-gold-rush-india-captive-center-reality": { kind: "decision-map", label: "Career decision lens", title: "Look past the GCC signboard", caption: "A qualitative map for testing whether a growing centre offers local authority, durable learning, and usable compensation.", measurement: "qualitative", items: [{ label: "Growth", value: "Signal", detail: "Expansion context that does not guarantee an individual role." }, { label: "Mandate", value: "Ownership", detail: "The product, system, or decision India can genuinely control." }, { label: "Trajectory", value: "Leverage", detail: "How execution can grow into judgement and wider scope." }, { label: "Bargain", value: "Trade-off", detail: "Cash, location, stability, and uncertainty carried by the candidate." }] },
  "indian-it-layoff-cycle-2026": { kind: "signal-ladder", label: "Risk-reading lens", title: "Turn layoff anxiety into observable signals", caption: "A qualitative reading order for separating rumours from administrative changes, team evidence, and preparation.", measurement: "qualitative", items: [{ label: "Rumour", value: "Prompt", detail: "A claim to verify, not a forecast or fact." }, { label: "Pattern", value: "Change", detail: "Repeated pauses, funding shifts, or staffing decisions." }, { label: "Exposure", value: "Role", detail: "How project, skill, and manager conditions affect your position." }, { label: "Option", value: "Readiness", detail: "Documents, relationships, runway, and a wider search." }] },
  "junior-data-scientist-reality-india": { kind: "comparison", label: "Role-reading lens", title: "Compare the model story with the working queue", caption: "Use the junior data-science question to inspect data quality, business context, modelling, and ownership.", measurement: "qualitative", items: [{ label: "Input", value: "Data", detail: "The spreadsheets, definitions, and missing fields behind the task." }, { label: "Question", value: "Context", detail: "The decision the analysis is supposed to support." }, { label: "Method", value: "Model", detail: "Why a method fits the evidence and its limitations." }, { label: "Use", value: "Outcome", detail: "Who acts on the result and checks whether it helped." }] },
  "home-loan-trap-dream-house-financial-prison": { kind: "decision-map", label: "Household decision lens", title: "Test the home against the life around it", caption: "A qualitative framework for reading a loan as a household commitment, not only a lender-approved payment.", measurement: "qualitative", items: [{ label: "Cash", value: "Obligation", detail: "The payment and ownership costs that arrive every month." }, { label: "Shock", value: "Resilience", detail: "What happens when income, rates, or possession changes." }, { label: "Place", value: "Routine", detail: "Commute, care, school, and support shaped by the location." }, { label: "Choice", value: "Flexibility", detail: "The career and household options left after signing." }] },
  "ux-salary-myth-design-careers-plateau": { kind: "signal-ladder", label: "Career decision lens", title: "Read a design plateau through scope", caption: "A qualitative lens for moving from polished screens to judgement, context, influence, and visible outcomes.", measurement: "qualitative", items: [{ label: "Craft", value: "Quality", detail: "Interaction, accessibility, content, and visual decisions." }, { label: "Context", value: "Problem", detail: "Users, constraints, and the reason the work exists." }, { label: "Influence", value: "Decision", detail: "How the designer changes priorities or resolves trade-offs." }, { label: "Evidence", value: "Outcome", detail: "What shipped, changed, or remains honestly unknown." }] },
  "pm-prestige-trap-escape-from-engineering": { kind: "decision-map", label: "Career decision lens", title: "Test the PM work before the PM title", caption: "Use the role-change question to separate customer learning, prioritisation, influence, and prestige.", measurement: "qualitative", items: [{ label: "Need", value: "Reason", detail: "The change wanted from leaving engineering." }, { label: "Work", value: "Ambiguity", detail: "Problem framing, trade-offs, and decisions without every lever." }, { label: "Access", value: "Customer", detail: "How directly the role can learn from real users or operators." }, { label: "Authority", value: "Leverage", detail: "Who can resolve conflict when accountability exceeds control." }] },
  "10x-developer-myth-productivity-killing-careers": { kind: "comparison", label: "Engineering lens", title: "Replace heroics with durable leverage", caption: "A qualitative comparison of visible output, system health, team capability, and sustainable contribution.", measurement: "qualitative", items: [{ label: "Output", value: "Visible", detail: "Code or tickets that are easy to count but incomplete alone." }, { label: "Quality", value: "Reliable", detail: "Review, testing, safety, and operation after launch." }, { label: "Leverage", value: "Shared", detail: "Tools, decisions, and context that help others succeed." }, { label: "Sustainability", value: "Repeatable", detail: "Work that does not depend on one exhausted rescuer." }] },
  "data-science-bubble-excel-work-reality": { kind: "comparison", label: "Role-reading lens", title: "Find the decision inside the spreadsheet work", caption: "A qualitative frame for distinguishing data cleaning, analysis, modelling, and business ownership.", measurement: "qualitative", items: [{ label: "Routine", value: "Input", detail: "Reconciliation and preparation that make analysis possible." }, { label: "Meaning", value: "Question", detail: "The business decision hidden behind the request." }, { label: "Method", value: "Judgement", detail: "Choosing an approach and naming what it cannot show." }, { label: "Influence", value: "Action", detail: "Whether someone changes a decision because of the work." }] },
  "career-switch-illusion-changing-jobs-not-career": { kind: "decision-map", label: "Career decision lens", title: "Name the career change beneath the job change", caption: "A qualitative map for testing whether a move changes capability, authority, evidence, or only the employer name.", measurement: "qualitative", items: [{ label: "Pattern", value: "Past", detail: "What repeated work has actually built so far." }, { label: "Target", value: "Direction", detail: "The capability or decision surface wanted next." }, { label: "Bridge", value: "Evidence", detail: "A project, responsibility, or result that connects the two." }, { label: "Move", value: "Trade-off", detail: "Cash, location, runway, and risk accepted to change course." }] },
  "engineering-career-ceiling-peak-at-35": { kind: "signal-ladder", label: "Career decision lens", title: "Replace the age ceiling with a scope question", caption: "Read the engineering-career question through judgement, authority, transferability, and life constraints.", measurement: "qualitative", items: [{ label: "Work", value: "Execution", detail: "The visible tasks that established current credibility." }, { label: "Judgement", value: "Trade-off", detail: "Decisions that prevent rework and clarify risk." }, { label: "Authority", value: "Mandate", detail: "The levers available to change the result." }, { label: "Life", value: "Context", detail: "Family, health, energy, and appetite for the next move." }] },
  "self-learning-trap-online-courses-expensive-entertainment": { kind: "decision-map", label: "Learning decision lens", title: "Make learning answer to a real assignment", caption: "A qualitative test for whether a course creates capability, feedback, and evidence rather than another unfinished tab.", measurement: "qualitative", items: [{ label: "Need", value: "Decision", detail: "The work problem the learning should help solve." }, { label: "Practice", value: "Artefact", detail: "Something built under realistic constraints." }, { label: "Challenge", value: "Feedback", detail: "A reviewer or user who can expose weak understanding." }, { label: "Stop", value: "Rule", detail: "A reason to pause content and apply what was learned." }] },
  "broke-at-30-money-mistakes-nobody-warned": { kind: "comparison", label: "Money-reading lens", title: "Find the gap between income and usable room", caption: "A qualitative frame for reading financial stress through cash certainty, fixed obligations, support, and options.", measurement: "qualitative", items: [{ label: "Income", value: "Reliable", detail: "What reaches the account without optimistic assumptions." }, { label: "Obligations", value: "Fixed", detail: "Payments and duties that cannot easily pause." }, { label: "Buffer", value: "Liquidity", detail: "Cash available for disruption rather than long-term hope." }, { label: "Choice", value: "Runway", detail: "The room to change work without immediate crisis." }] },
  "indian-education-trap-degree-career-mistake": { kind: "decision-map", label: "Education decision lens", title: "Read a degree as a bundle of trade-offs", caption: "Use the education question to compare curriculum, evidence, cost, access, and alternatives.", measurement: "qualitative", items: [{ label: "Learning", value: "Curriculum", detail: "What the programme actually teaches and lets students practise." }, { label: "Access", value: "Pathway", detail: "Networks, placement channels, and support it genuinely opens." }, { label: "Cost", value: "Commitment", detail: "Fees, living costs, debt, and the household's lost flexibility." }, { label: "Evidence", value: "Outcome", detail: "Work a student can show beyond the credential name." }] },
  "work-life-balance-myth-high-performers": { kind: "comparison", label: "Work-design lens", title: "Measure the bargain behind high performance", caption: "A qualitative comparison of effort, control, recovery, recognition, and the life work is meant to support.", measurement: "qualitative", items: [{ label: "Effort", value: "Demand", detail: "The work and interruptions the role repeatedly requires." }, { label: "Control", value: "Choice", detail: "Ability to set priorities, boundaries, and escalation." }, { label: "Recovery", value: "Health", detail: "Whether the pace can be repeated without hidden depletion." }, { label: "Return", value: "Recognition", detail: "Scope, learning, pay, or authority gained from the trade." }] },
  "passion-luxury-not-strategy-india": { kind: "decision-map", label: "Career decision lens", title: "Give passion a market and a runway", caption: "A qualitative map for testing energy, demand, practice, support, and the cost of making a leap.", measurement: "qualitative", items: [{ label: "Energy", value: "Interest", detail: "What keeps attention through repetition and unglamorous work." }, { label: "Demand", value: "Audience", detail: "Who values the work and what they will actually choose." }, { label: "Proof", value: "Experiment", detail: "A small paid, shipped, or reviewed test before resigning." }, { label: "Runway", value: "Support", detail: "Cash, family, health, and time available for learning." }] },
  "hr-conversations-what-matters-india": { kind: "signal-ladder", label: "Offer-reading lens", title: "Turn the HR conversation into a written package", caption: "Read the hiring exchange through authority, compensation structure, constraints, and the document that governs each promise.", measurement: "qualitative", items: [{ label: "Role", value: "Scope", detail: "What the manager expects the person to do." }, { label: "Package", value: "Structure", detail: "Fixed, conditional, benefits, timing, and location terms." }, { label: "Authority", value: "Owner", detail: "Who can approve or change each part of the offer." }, { label: "Record", value: "Checkpoint", detail: "The final written terms and clarifications kept together." }] },
  "culture-fit-trap-hiring-reality": { kind: "decision-map", label: "Hiring-reading lens", title: "Translate culture fit into working behaviour", caption: "A qualitative test for separating job requirements, team habits, personal comfort, and similarity bias.", measurement: "qualitative", items: [{ label: "Work", value: "Behaviour", detail: "The collaboration or judgement the role genuinely needs." }, { label: "Evidence", value: "Example", detail: "A recent situation showing how the team handles difficulty." }, { label: "Boundary", value: "Requirement", detail: "Availability, disagreement, or process expectations stated plainly." }, { label: "Fit", value: "Choice", detail: "Whether the working arrangement matches the candidate's needs." }] },
  "job-hopping-stops-working-after-35": { kind: "decision-map", label: "Career decision lens", title: "Make each move compound rather than reset", caption: "Use the job-hopping question to inspect scope, story, stability, and the cost of another transition.", measurement: "qualitative", items: [{ label: "Reason", value: "Pattern", detail: "The durable problem each move is meant to solve." }, { label: "Gain", value: "Scope", detail: "A clearer mandate, capability, or authority in the next role." }, { label: "Story", value: "Evidence", detail: "Results that connect moves into a coherent trajectory." }, { label: "Cost", value: "Reset", detail: "Probation, trust, location, and household disruption carried." }] },
  "performance-review-reality-ratings-india": { kind: "signal-ladder", label: "Review-reading lens", title: "Read a rating as a system of evidence", caption: "A qualitative path from observed work to calibration, manager judgement, and the next actionable conversation.", measurement: "qualitative", items: [{ label: "Work", value: "Record", detail: "Specific outcomes, decisions, and constraints from the cycle." }, { label: "Context", value: "Scope", detail: "The expectations and resources attached to the role." }, { label: "Calibration", value: "Comparison", detail: "How judgement is shaped beyond one manager's impression." }, { label: "Next", value: "Action", detail: "A behaviour, owner, and review point that can change the path." }] },
  "tech-lead-trap-responsibility-authority": { kind: "comparison", label: "Engineering lens", title: "Compare responsibility with the authority behind it", caption: "A qualitative frame for reading a tech-lead role through decisions, levers, escalation, and support.", measurement: "qualitative", items: [{ label: "Responsibility", value: "Outcome", detail: "The result the lead is expected to protect." }, { label: "Authority", value: "Lever", detail: "The decisions and resources available to affect it." }, { label: "Escalation", value: "Route", detail: "What happens when another team controls the constraint." }, { label: "Support", value: "System", detail: "Time, staffing, and peers that make leadership sustainable." }] },
  "devops-sre-reality-india-oncall": { kind: "timeline", label: "Role-reading lens", title: "Read on-call as an operating system", caption: "A qualitative timeline for testing preparation, incident work, recovery, and the improvements that follow.", measurement: "qualitative", items: [{ label: "Before", value: "Readiness", detail: "Runbooks, ownership, alerts, access, and escalation." }, { label: "During", value: "Response", detail: "How the team communicates and restores service safely." }, { label: "After", value: "Learning", detail: "Whether review produces changes rather than blame." }, { label: "Between", value: "Reliability", detail: "Engineering work that reduces recurring operational pain." }] },
  "senior-developer-salary-ceiling-india": { kind: "comparison", label: "Career decision lens", title: "Find which ceiling you are actually facing", caption: "A qualitative comparison of company band, role scope, skill leverage, negotiation, and usable compensation.", measurement: "qualitative", items: [{ label: "Band", value: "Company", detail: "The employer's level and budget constraint." }, { label: "Scope", value: "Role", detail: "The size and consequence of problems already owned." }, { label: "Leverage", value: "Skill", detail: "A capability that transfers beyond one internal system." }, { label: "Bargain", value: "Package", detail: "Fixed cash, conditions, location, and learning in the actual offer." }] },
  "freelancing-reality-india-freedom-myth": { kind: "comparison", label: "Work-design lens", title: "Price freedom with the work it requires", caption: "A qualitative comparison of client demand, pipeline, administration, protection, and control.", measurement: "qualitative", items: [{ label: "Demand", value: "Client", detail: "The problem, expectation, and payment terms being accepted." }, { label: "Pipeline", value: "Continuity", detail: "How the next piece of work is found without assuming it." }, { label: "Admin", value: "Overhead", detail: "Sales, invoices, tax, scope changes, and collections." }, { label: "Freedom", value: "Control", detail: "The actual say over time, clients, and the kind of work." }] },
  "networking-reality-india-introverts": { kind: "signal-ladder", label: "Career strategy lens", title: "Build relationships around useful work", caption: "A qualitative reading order for networking through context, contribution, trust, and a clear next step.", measurement: "qualitative", items: [{ label: "Context", value: "Connection", detail: "A shared problem, domain, event, or honest reason to reach out." }, { label: "Contribution", value: "Usefulness", detail: "A question, insight, or introduction that respects the other person." }, { label: "Trust", value: "Follow-through", detail: "Doing what was promised without turning contact into extraction." }, { label: "Next", value: "Conversation", detail: "A specific, low-pressure step that keeps the relationship real." }] },
  "layoff-recovery-timeline-india": { kind: "timeline", label: "Recovery decision lens", title: "Move through a layoff without false deadlines", caption: "A qualitative sequence for stabilising records, cash, search direction, and the next credible role.", measurement: "qualitative", items: [{ label: "Stabilise", value: "Basics", detail: "Documents, benefits, cash obligations, and immediate support." }, { label: "Explain", value: "Story", detail: "A factual account of the role ending and work completed." }, { label: "Search", value: "Direction", detail: "Target roles matched to evidence and household constraints." }, { label: "Rebuild", value: "Traction", detail: "Feedback, conversations, and a sustainable next commitment." }] },
  "manager-vs-ic-career-path-india": { kind: "comparison", label: "Career decision lens", title: "Choose the repeated work, not the label", caption: "A qualitative comparison of management and individual contribution through energy, authority, craft, and responsibility.", measurement: "qualitative", items: [{ label: "Work", value: "Daily", detail: "Coaching and coordination versus deep technical or functional craft." }, { label: "Leverage", value: "People", detail: "Growing others through feedback, staffing, and decisions." }, { label: "Craft", value: "Depth", detail: "Owning systems, expertise, and outcomes directly." }, { label: "Fit", value: "Season", detail: "The path that matches current life, strengths, and desired responsibility." }] },
  "startup-equity-esop-reality-india": { kind: "decision-map", label: "Compensation-reading lens", title: "Separate equity promise from usable cash", caption: "A qualitative map for reading instrument, vesting, exercise, dilution, and liquidity before valuing a grant.", measurement: "qualitative", items: [{ label: "Instrument", value: "Grant", detail: "What is actually offered: option, share, or another award." }, { label: "Clock", value: "Vesting", detail: "When ownership can accrue and what departure changes." }, { label: "Cost", value: "Exercise", detail: "Cash, tax, and risk required before any possible sale." }, { label: "Exit", value: "Liquidity", detail: "Whether and when a buyer or company process could exist." }] },
  "side-hustle-myth-india-reality": { kind: "decision-map", label: "Career decision lens", title: "Test a side hustle without buying a second life", caption: "A qualitative framework for demand, time, boundaries, income certainty, and the effect on the main job.", measurement: "qualitative", items: [{ label: "Demand", value: "Customer", detail: "A problem someone will pay to have solved." }, { label: "Capacity", value: "Time", detail: "The real hours and energy left after primary obligations." }, { label: "Boundary", value: "Conflict", detail: "Employer, confidentiality, tax, and reputation constraints." }, { label: "Choice", value: "Trade-off", detail: "What the experiment gives up and what would make it stop." }] },
  "remote-work-salary-trap-india": { kind: "comparison", label: "Work-design lens", title: "Compare remote pay with the whole work bargain", caption: "A qualitative frame for weighing cash, home costs, time zones, progression, and policy risk.", measurement: "qualitative", items: [{ label: "Cash", value: "Fixed", detail: "What reliably arrives, separate from conditional compensation." }, { label: "Home", value: "Cost", detail: "Equipment, power, space, care, and boundaries shifted home." }, { label: "Time", value: "Schedule", detail: "Overlap, travel, meetings, and availability in local life." }, { label: "Future", value: "Path", detail: "Learning, visibility, promotion, and what happens if policy changes." }] },
  "mba-reality-india-worth-it-2026": { kind: "decision-map", label: "Education decision lens", title: "Ask what the MBA changes", caption: "A qualitative map for testing access, capability, opportunity cost, debt, and the target role.", measurement: "qualitative", items: [{ label: "Target", value: "Role", detail: "The specific work the programme is meant to unlock." }, { label: "Access", value: "Network", detail: "Recruiting, peers, and relationships unavailable through alternatives." }, { label: "Cost", value: "Pause", detail: "Fees, lost income, debt, and household obligations." }, { label: "Bridge", value: "Evidence", detail: "Projects, internships, or practice that connect past and future work." }] },
  "american-dream-indian-engineers": { kind: "decision-map", label: "Mobility decision lens", title: "Recalculate the overseas engineering move", caption: "A qualitative framework for comparing opportunity, immigration, cash, support, and reversibility.", measurement: "qualitative", items: [{ label: "Work", value: "Opportunity", detail: "The technical scope and learning the move actually offers." }, { label: "Status", value: "Permission", detail: "Visa, employer, and residency conditions behind the role." }, { label: "Life", value: "Support", detail: "Housing, family, health, community, and distance carried." }, { label: "Return", value: "Options", detail: "What remains possible if the job or immigration path changes." }] },
  "what-20-lpa-actually-feels-like-india-purchasing-power": { kind: "comparison", label: "Money-reading lens", title: "Translate headline CTC into ordinary life", caption: "A qualitative comparison of gross promise, reliable cash, fixed obligations, location costs, and usable room.", measurement: "qualitative", items: [{ label: "Headline", value: "CTC", detail: "The package label before payroll conditions are unpacked." }, { label: "Cash", value: "Monthly", detail: "What reaches the account in an ordinary month." }, { label: "Cost", value: "Life", detail: "Rent, commute, family support, debt, and recurring duties." }, { label: "Room", value: "Choice", detail: "What remains for saving, shocks, and a career move." }] },
  "why-upskilling-stops-working-career-trap": { kind: "signal-ladder", label: "Learning decision lens", title: "Find the missing link in upskilling", caption: "A qualitative path from content consumption to applied capability, workplace evidence, feedback, and a changed role.", measurement: "qualitative", items: [{ label: "Content", value: "Exposure", detail: "Information that names a tool or idea but proves little alone." }, { label: "Practice", value: "Capability", detail: "Using the skill under real constraints and exceptions." }, { label: "Proof", value: "Outcome", detail: "A result another person can inspect or challenge." }, { label: "Transfer", value: "Role", detail: "A responsibility where the capability is actually used." }] },
  "salary-transparency-india-2026-number-in-room": {
    kind: "comparison",
    variant: "ctc-breakdown",
    label: "Compensation-reading lens",
    title: "Follow the number to usable pay",
    caption: "A CTC breakdown diagram: each step narrows a headline promise into the money and conditions that shape ordinary life.",
    measurement: "qualitative",
    items: [
      { label: "Global direction", value: "Policy", detail: "Pay-transparency rules and reporting are making the logic of compensation harder to hide." },
      { label: "Published range", value: "Band", detail: "The advertised range still needs level, location, and scope before it means anything." },
      { label: "Fixed pay", value: "Cash", detail: "The dependable salary component that reaches the bank through ordinary payroll." },
      { label: "Variable pay", value: "Terms", detail: "Bonus, equity, or one-time money tied to targets, timing, discretion, or an event." },
      { label: "Usable compensation", value: "Life", detail: "What remains after tax, commute, rent, care, debt, and the cost of accepting the role." },
    ],
  },
  "ai-job-market-2026-india-show-your-working": {
    kind: "signal-ladder",
    variant: "ai-evidence-ladder",
    label: "AI hiring evidence lens",
    title: "Climb from tool familiarity to owned outcomes",
    caption: "The hiring signal gets stronger as the candidate moves from naming a tool to owning what happens when the system is wrong.",
    measurement: "qualitative",
    items: [
      { label: "Step 01", value: "Familiarity", detail: "You can describe the tool, its basic use, and the problem it might address." },
      { label: "Step 02", value: "Prototype", detail: "You can make a bounded workflow work on representative inputs." },
      { label: "Step 03", value: "Evaluation", detail: "You can test quality, failure cases, cost, latency, and what should not be automated." },
      { label: "Step 04", value: "Ownership", detail: "You can define the human review, escalation, permissions, and accountability around the output." },
      { label: "Step 05", value: "Outcome", detail: "You can show a useful business or user result and explain what changed." },
    ],
    callouts: [
      { label: "Platform-reported market signal", value: "51%", detail: "Reported rise in AI-related jobs in India. This is a platform trend, not a guarantee for an individual role or city.", sourcePublisher: "India Today / LinkedIn" },
      { label: "Workforce-shape signal", value: "Contract tilt", detail: "TeamLease reporting describes contract and outsourced hiring as firms rethink workforce design around AI.", sourcePublisher: "Reuters / ET HRWorld" },
    ],
  },
  "humour-in-workplace-culture-2026-joke-is-on-promotion": {
    kind: "comparison",
    variant: "humour-matrix",
    label: "Workplace culture lens",
    title: "When humour builds connection — and when it spends someone else’s safety",
    caption: "Use the matrix to read the target, power, and repair path behind workplace banter. Laughter alone is not a safety test.",
    measurement: "qualitative",
    items: [
      { label: "Affiliative", value: "Shared", detail: "Humour creates recognition, lowers tension, or makes a shared problem easier to discuss." },
      { label: "Punching down", value: "Targeted", detail: "Humour asks a less powerful person or group to absorb the room’s discomfort." },
      { label: "Power", value: "Who decides", detail: "Notice who can start, stop, or redirect the joke without losing status." },
      { label: "Risk", value: "Who carries", detail: "Notice who risks reputation, belonging, identity, or promotion when the joke lands badly." },
    ],
    matrix: {
      xAxis: { low: "Private / one-way", high: "Shared / reciprocal" },
      yAxis: { low: "Low power difference", high: "High power difference" },
      quadrants: [
        { label: "Check the room", detail: "A joke may be fine, but make opting out and repair easy.", tone: "watch" },
        { label: "Manager’s self-own", detail: "A leader can lower distance by making themselves accountable, not by recruiting a target.", tone: "safe" },
        { label: "One-way teasing", detail: "A private joke can still narrow belonging. Notice whether the target can decline the bit without consequence.", tone: "watch" },
        { label: "Shared relief", detail: "A gentle joke about a common situation that opens the conversation back up.", tone: "safe" },
      ],
    },
    guide: [
      { question: "Who has the power to end the joke?", answer: "The person with less power should be able to opt out.", detail: "If only the speaker or manager can decide when it is over, treat the humour as a risk signal." },
      { question: "Who carries the career risk?", answer: "The target should not have to perform agreement.", detail: "If silence, correction, or discomfort could cost belonging or promotion, change the joke or stop." },
      { question: "What happens after it lands badly?", answer: "Healthy teams repair without retaliation.", detail: "A direct apology and changed behaviour matter more than defending intent." },
    ],
  },
};

function visualFor(slug: string, category: ArticleCategory): EditorialVisual {
  const override = visualOverrides[slug];
  if (override) return override;
  const base = visualByCategory[category];
  const variants: VisualKind[] = ["timeline", "comparison", "signal-ladder", "decision-map"];
  const shift = slug.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % variants.length;
  const kind = category === "money-reality" || category === "software-engineering" ? base.kind : variants[shift];
  return { ...base, kind };
}

export function getEditorialMetadata(
  slug: string,
  category: ArticleCategory,
  title: string,
  options: {
    datePublished: string | null;
    dateModified: string | null;
    metaDescription: string;
    relatedSlugs: string[];
    sectionHeadings: string[];
  },
): EditorialMetadata {
  const configuredSources = articleSources[slug];
  if (!configuredSources?.length) {
    throw new Error(`Missing article-specific sources for ${slug}`);
  }
  if (!options.sectionHeadings.length) {
    throw new Error(`Missing authored section headings for ${slug}`);
  }
  const sourceSectionIndex: Record<string, number> = {
    "The signal": 0,
    "What the headline leaves out": 1,
    "The decision this changes": Math.min(2, options.sectionHeadings.length - 1),
    "Questions worth asking next": options.sectionHeadings.length - 1,
  };
  const sources = configuredSources.map((configuredSource) => {
    const sectionIndex = sourceSectionIndex[configuredSource.section];
    if (sectionIndex === undefined) {
      throw new Error(`Unknown source section mapping "${configuredSource.section}" for ${slug}`);
    }
    return {
      ...configuredSource,
      section: options.sectionHeadings[sectionIndex],
      verificationStatus: configuredSource.verificationStatus ?? "REQUIRES_EDITORIAL_REVIEW",
    };
  });
  const questions = categoryQuestions[category].map((question, index) =>
    index === 0 ? `${question} Consider this article’s question: “${title}”.` : question,
  );
  const primaryIntent = editorialPrimaryIntents[slug];
  if (!primaryIntent) {
    throw new Error(`Missing primary editorial intent for ${slug}`);
  }
  return {
    primaryIntent,
    seoTitle: articleSeoTitle(title, slug),
    metaDescription: options.metaDescription,
    h1: title,
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    relatedSlugs: options.relatedSlugs,
    sources,
    visual: visualFor(slug, category),
    takeaway: `The useful conclusion is narrower than the headline: ${title} should change the next question you ask, not replace the evidence you still need.`,
    verifyQuestions: questions,
  };
}