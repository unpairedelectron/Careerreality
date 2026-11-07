/**
 * Copy for /about and /team. Rendered by the React trust page and by the crawler snapshot
 * generator, so both always say the same thing. Paragraphs are plain text; links live in `links`.
 */
import { SITE_FOUNDER } from "./site-founder";

export type PeopleCopySection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  links?: { href: string; label: string }[];
};

export const aboutCopy = {
  eyebrow: "About / why this exists",
  title: "Most career decisions arrive as one number.",
  intro:
    "An offer says ₹18 LPA. A layoff notice says “as per policy”. A headline says a sector is hiring. CareerReality takes the number apart so you can see what is actually inside it, and what nobody has told you yet.",
  lead: "CareerReality is an independent, India-focused desk of career tools and guides, built and run by one engineer.",
  sections: [
    {
      id: "why",
      heading: "The gap between the letter and the account",
      paragraphs: [
        "Cost-to-company is an employer’s accounting figure, not a salary. Employer PF, gratuity, insurance and a target bonus that may never be paid in full can all sit inside it. People routinely accept, reject or negotiate offers without knowing what will reach their bank account each month.",
        "The same gap shows up elsewhere: notice periods that are longer in practice than on paper, gratuity eligibility nobody explains, and layoff news that rarely says who was affected or what the source actually confirmed. CareerReality started as a way to close those gaps with arithmetic and primary sources instead of opinions.",
      ],
    },
    {
      id: "what",
      heading: "What is here today",
      paragraphs: [
        "Calculators and worksheets for the money questions: CTC to take-home, old versus new tax regime, gratuity, notice-period and leave encashment, a layoff cash runway, a home-loan stress test, and a resign-or-stay worksheet. An employer due-diligence checklist helps you check who you would actually be working for. None of them need an account.",
        "Alongside them sit 28 practical guides on offers, layoffs, labour codes, career switches and reading hiring claims, plus dated public layoff records that show their source and status.",
      ],
      links: [
        { href: "/tools", label: "Browse the tools" },
        { href: "/guides", label: "Read the guides" },
        { href: "/layoffs", label: "Open the layoff records" },
      ],
    },
    {
      id: "rules",
      heading: "House rules",
      paragraphs: [
        "These are the rules every page is held to. When a page breaks one, that is a bug worth reporting.",
      ],
      bullets: [
        "Show the working. Every calculator states its formula, its inputs and the assumptions it did not make for you.",
        "Cite the primary source. Tax, PF, gratuity and labour-law statements point to the Income Tax Department, EPFO, the Labour Ministry or India Code, with the date they were checked.",
        "Say “we don’t know” out loud. If a source does not settle a question, the page says so instead of rounding it into a confident answer.",
        "No scores and no predictions. CareerReality does not rate employers, publish private-sector salary benchmarks or forecast anyone’s job security.",
        "Your numbers stay with you. Public calculators run in your browser; salary inputs are not sent to the server or placed in the URL.",
      ],
      links: [
        { href: "/methodology", label: "How the tools calculate" },
        { href: "/editorial", label: "Editorial standards" },
      ],
    },
    {
      id: "who",
      heading: "Who is behind it",
      paragraphs: [
        `CareerReality is built by ${SITE_FOUNDER.name}, an ML/AI engineer who designs, codes, tests and writes everything on the site. There is no newsroom, investor or marketing team. That keeps the site independent, and it also means the scope is deliberately narrow: a tool or guide goes live only when one person can stand behind every line of it.`,
        "The site is operated by Doffysoft pvt. Limited, Hinjewadi Phase 3, Pune.",
      ],
      links: [{ href: "/team", label: `Meet ${SITE_FOUNDER.name}` }],
    },
    {
      id: "help",
      heading: "Help keep it honest",
      paragraphs: [
        "If a figure is wrong, a rule has changed or a source no longer says what a page claims, email hello@careerreality.in with the page and the source. Material corrections are logged publicly. Please do not send passwords, payslips or confidential employer documents.",
      ],
      links: [
        { href: "/corrections", label: "Corrections log" },
        { href: "/contact", label: "Contact" },
      ],
    },
  ] satisfies PeopleCopySection[],
};

export const teamCopy = {
  eyebrow: "Team / the person behind the desk",
  title: "One builder, the whole stack.",
  intro: `CareerReality is designed, engineered, tested and written by ${SITE_FOUNDER.name}. Guides on this site carry his byline and link back to this page.`,
  lead: `${SITE_FOUNDER.name} (Shiv Mishra) — founder of CareerReality and an ML/AI engineer by profession.`,
  sections: [
    {
      id: "founder",
      heading: SITE_FOUNDER.name,
      paragraphs: [
        "Founder and sole builder of CareerReality.in. B.Tech graduate, currently working as a machine learning and AI engineer.",
        "Shiv is a technology enthusiast who started CareerReality to answer career questions the way he would debug a system: find the inputs, write down the assumptions, check the output against a known case, and be honest about what the model cannot see. Every tool, guide, page design, test and deployment on this site is his work.",
      ],
      links: SITE_FOUNDER.sameAs.map((href) => ({ href, label: "Shiv on LinkedIn" })),
    },
    {
      id: "roles",
      heading: "What that looks like in practice",
      paragraphs: ["Because there is no wider team, each of these jobs has a name attached to it."],
      bullets: [
        "Research: reads the Income-tax Act, EPFO circulars, Labour Code FAQs and company filings directly, and records the date each source was checked.",
        "Engineering: writes the calculation logic, the test cases that pin it to worked examples, and the site itself, from the data layer to the crawler-readable snapshots.",
        "Writing and editing: drafts and revises the guides, separating what a source says from his own interpretation.",
        "Design: builds the interface and visual identity, including the logo, and checks pages on mobile and with keyboard navigation.",
        "Quality and corrections: runs the test suites before each release and handles correction reports sent to hello@careerreality.in.",
      ],
    },
    {
      id: "ml-lens",
      heading: "Why an ML engineer is wary of confident answers",
      paragraphs: [
        "Working in machine learning teaches one lesson quickly: a model can sound certain and still be wrong, and an average hides the people it does not describe. That is why CareerReality does not score employers, predict who will be laid off, or quote a “market salary” for your role. The tools do arithmetic you can check, on numbers you supply, and say where their knowledge stops.",
      ],
    },
    {
      id: "limits",
      heading: "What one person cannot promise",
      paragraphs: [
        "Shiv is not a chartered accountant, lawyer or HR professional, and nothing here is personal tax, legal or financial advice. Internal tests are not independent specialist review, and a guide is not marked as reviewed unless a named reviewer actually reviewed it. Replies to email can be slow; no response time is promised.",
      ],
      links: [
        { href: "/editorial", label: "Editorial standards" },
        { href: "/methodology", label: "Calculation methods" },
      ],
    },
    {
      id: "reviewer",
      heading: "Outside review: payroll methodology",
      paragraphs: [
        "Aman Mishra is identified by the site owner as the reviewer for Indian payroll calculation methodology and related test cases. He is not part of the team; the owner reports that Aman inspected the calculation logic and tests in a personal capacity and agreed to be identified. The supplied documentation lists a Chartered Accountant and HR/Payroll Professional designation and a review date of 05 November 2026.",
        "That record does not include a confirmed version, findings, outcome or final credential wording, and an owner-prepared QA record dated 7 November 2026 says independent payroll review is not yet formally completed. No completed review or certification is claimed.",
      ],
    },
    {
      id: "contact",
      heading: "Contact and affiliation",
      paragraphs: [
        "Write to hello@careerreality.in for corrections, questions or press. CareerReality is operated by Doffysoft pvt. Limited, Hinjewadi Phase 3, Pune.",
      ],
      links: [
        { href: "/about", label: "About CareerReality" },
        { href: "/contact", label: "Contact" },
      ],
    },
  ] satisfies PeopleCopySection[],
};
