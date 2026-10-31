export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string | null;
  readTime: string;
  sections: Array<{ heading: string; body: string }>;
  tags: string[];
  contentType: "Editorial article";
  sourceUrl: string;
  editorial: import("./editorial-metadata").EditorialMetadata;
  heroImage?: { src: string; alt: string };
  editorialEnhancement?: import("./editorial-enhancements").EditorialEnhancement;
  editorialRecord: {
    authorName: string | null;
    authorProfileUrl: string | null;
    reviewerName: string | null;
    reviewerProfileUrl: string | null;
    createdAt: string | null;
    draftedAt: string | null;
    publishedAt: string | null;
    updatedAt: string | null;
    lastReviewedAt: string | null;
    lastFactCheckedAt: string | null;
    status: "requires-editorial-review" | "verified";
  };
};

export type ArticleCategory =
  | "career-reality-checks"
  | "career-strategy"
  | "engineering"
  | "money-reality"
  | "software-engineering";

import { editorialBriefs, editorialDeks } from "./editorial-briefs";
import { assertAuthoredDescription } from "./seo-description-policy";
import { getEditorialMetadata } from "./editorial-metadata";
import { authoredArticlesMarket } from "./authored-articles-market";
import { authoredCareerArticles } from "./authored-articles-career";
import { authoredBatchA } from "./authored-batch-a.ts.ts";
import { authoredArticlesBatchB } from "./authored-batch-b.ts.ts";
import { authoredBatchC } from "./authored-batch-c.ts.ts";
import { authoredBatchD } from "./authored-batch-d.ts.ts";
import { authoredBatchE } from "./authored-batch-e.ts.ts";
import { authoredBatchFArticles } from "./authored-batch-f.ts.ts";
import { authoredBatchG } from "./authored-batch-g.ts.ts";
import { editorialEnhancements } from "./editorial-enhancements";
import { getArticleHeroImage } from "./article-hero-images";

const titles: Record<string, string> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": "Portfolio-first hiring: building a career in India's gig economy",
  "green-careers-esg-renewable-sustainability-india-2026": "Green careers in India: the ESG and renewable energy reality",
  "cybersecurity-privacy-careers-beyond-tech-india-2026": "Cybersecurity and privacy careers are moving beyond tech",
  "joining-bonus-clawback-offer-letter-traps-2026": "The joining-bonus clawback: offer-letter traps to read twice",
  "staff-engineer-promotion-freeze-india-2026": "The staff engineer promotion freeze: what changes now",
  "gcc-return-to-office-hybrid-reality-india-2026": "GCC return-to-office plans: the hybrid reality in India",
  "relieving-letter-hostage-notice-period-india-2026": "When a relieving letter becomes leverage during notice period",
  "ai-upskilling-trap-india-api-wrapper-reality": "The AI upskilling trap: when every course is an API wrapper",
  "gcc-gold-rush-india-captive-center-reality": "The GCC gold rush: inside India's captive-center reality",
  "indian-it-layoff-cycle-2026": "India's IT layoff cycle: reading the signal before the headline",
  "junior-data-scientist-reality-india": "The junior data scientist reality: more spreadsheets than models",
  "home-loan-trap-dream-house-financial-prison": "The home-loan trap: when the dream house becomes a financial prison",
  "ux-salary-myth-design-careers-plateau": "The UX salary myth: where design careers plateau",
  "pm-prestige-trap-escape-from-engineering": "The PM prestige trap: escaping engineering is not a strategy",
  "10x-developer-myth-productivity-killing-careers": "The 10x developer myth is quietly killing careers",
  "data-science-bubble-excel-work-reality": "The data science bubble: the Excel-work reality",
  "career-switch-illusion-changing-jobs-not-career": "The career-switch illusion: changing jobs is not changing careers",
  "engineering-career-ceiling-peak-at-35": "The engineering career ceiling that appears around 35",
  "self-learning-trap-online-courses-expensive-entertainment": "The self-learning trap: when courses become expensive entertainment",
  "broke-at-30-money-mistakes-nobody-warned": "Broke at 30: money mistakes nobody warned you about",
  "indian-education-trap-degree-career-mistake": "The Indian education trap: a degree can be a career mistake",
  "work-life-balance-myth-high-performers": "The work-life balance myth for high performers",
  "passion-luxury-not-strategy-india": "Passion is a luxury, not a strategy, in India",
  "hr-conversations-what-matters-india": "HR conversations: what actually matters in India",
  "culture-fit-trap-hiring-reality": "The culture-fit trap: what hiring teams really mean",
  "job-hopping-stops-working-after-35": "When job hopping stops working after 35",
  "performance-review-reality-ratings-india": "Performance review reality: how ratings are made in India",
  "tech-lead-trap-responsibility-authority": "The tech lead trap: responsibility without authority",
  "devops-sre-reality-india-oncall": "DevOps and SRE reality in India: the on-call tax",
  "senior-developer-salary-ceiling-india": "The senior developer salary ceiling in India",
  "freelancing-reality-india-freedom-myth": "Freelancing reality in India: freedom has a price",
  "networking-reality-india-introverts": "Networking reality in India for introverts",
  "layoff-recovery-timeline-india": "Layoff recovery timeline: what the next six months look like",
  "manager-vs-ic-career-path-india": "Manager versus IC: choosing a career path that fits",
  "startup-equity-esop-reality-india": "Startup equity and ESOP reality in India",
  "side-hustle-myth-india-reality": "The side-hustle myth: a second job is not a second life",
  "remote-work-salary-trap-india": "The remote-work salary trap in India",
  "mba-reality-india-worth-it-2026": "MBA reality in India: is it worth it in 2026?",
  "american-dream-indian-engineers": "The American dream for Indian engineers, recalculated",
  "what-20-lpa-actually-feels-like-india-purchasing-power": "What ₹20 LPA actually feels like in India",
  "why-upskilling-stops-working-career-trap": "Why upskilling stops working: the career trap",
  "salary-transparency-india-2026-number-in-room": "Salary transparency is coming. India is still whispering the number.",
  "ai-job-market-2026-india-show-your-working": "The AI job market has a new entrance exam: show your working.",
  "humour-in-workplace-culture-2026-joke-is-on-promotion": "The joke is on your promotion: humour in workplace culture",
};

const categoryBySlug: Record<string, ArticleCategory> = {
  "joining-bonus-clawback-offer-letter-traps-2026": "money-reality",
  "home-loan-trap-dream-house-financial-prison": "money-reality",
  "broke-at-30-money-mistakes-nobody-warned": "money-reality",
  "startup-equity-esop-reality-india": "money-reality",
  "what-20-lpa-actually-feels-like-india-purchasing-power": "money-reality",
  "portfolio-first-hiring-gig-economy-careers-india-2026": "career-strategy",
  "career-switch-illusion-changing-jobs-not-career": "career-strategy",
  "manager-vs-ic-career-path-india": "career-strategy",
  "mba-reality-india-worth-it-2026": "career-strategy",
  "passion-luxury-not-strategy-india": "career-strategy",
  "10x-developer-myth-productivity-killing-careers": "software-engineering",
  "devops-sre-reality-india-oncall": "software-engineering",
  "senior-developer-salary-ceiling-india": "software-engineering",
  "tech-lead-trap-responsibility-authority": "software-engineering",
  "engineering-career-ceiling-peak-at-35": "engineering",
  "staff-engineer-promotion-freeze-india-2026": "engineering",
  "junior-data-scientist-reality-india": "engineering",
  "data-science-bubble-excel-work-reality": "engineering",
  "cybersecurity-privacy-careers-beyond-tech-india-2026": "engineering",
  "ai-job-market-2026-india-show-your-working": "engineering",
  "salary-transparency-india-2026-number-in-room": "money-reality",
  "humour-in-workplace-culture-2026-joke-is-on-promotion": "career-reality-checks",
};

const categoryLabels: Record<ArticleCategory, string> = {
  "career-reality-checks": "Career reality checks",
  "career-strategy": "Career strategy",
  engineering: "Engineering",
  "money-reality": "Money reality",
  "software-engineering": "Software engineering",
};

const allSlugs = Object.keys(titles);

type AuthoredArticleOverride = {
  sections: Array<{ heading: string; body: string }>;
};

const authoredArticles: Record<string, AuthoredArticleOverride> = {
  ...authoredArticlesMarket,
  ...authoredCareerArticles,
  ...authoredBatchA,
  ...authoredArticlesBatchB,
  ...authoredBatchC,
  ...authoredBatchD,
  ...authoredBatchE,
  ...authoredBatchFArticles,
  ...authoredBatchG,
};

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeParagraph(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
}

function removeExactRepeatedParagraphs(
  sections: Array<{ heading: string; body: string }>,
): Array<{ heading: string; body: string }> {
  const seen = new Set<string>();
  return sections.map((section) => ({
    ...section,
    body: section.body
      .split(/\n\s*\n+/)
      .filter((paragraph) => {
        const normalized = normalizeParagraph(paragraph);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .join("\n\n"),
  }));
}

export function collectRawArticleTextAudit() {
  const blocksByArticle = new Map<
    string,
    Map<string, Array<{ sectionHeading: string; paragraphIndex: number; excerpt: string }>>
  >();
  const articlesByBlock = new Map<string, Set<string>>();
  const duplicateGroups: Array<{
    articleSlug: string;
    articleTitle: string;
    excerpt: string;
    copies: number;
    classification: "repeated-template-candidate" | "repeated-editorial-content-candidate";
    reviewStatus: "requires-editorial-review";
    locations: Array<{ sectionHeading: string; paragraphIndex: number }>;
  }> = [];
  let rawParagraphCount = 0;
  let duplicateWithinArticleOccurrences = 0;
  let duplicateWithinArticleGroups = 0;
  let maxCopiesWithinArticle = 0;

  for (const [slug, article] of Object.entries(authoredArticles)) {
    const locationsByParagraph = new Map<
      string,
      Array<{ sectionHeading: string; paragraphIndex: number; excerpt: string }>
    >();
    for (const section of article.sections) {
      for (const [paragraphIndex, originalParagraph] of section.body.split(/\n\s*\n+/).entries()) {
        const paragraph = normalizeParagraph(originalParagraph);
        if (!paragraph) continue;
        rawParagraphCount += 1;
        const locations = locationsByParagraph.get(paragraph) ?? [];
        locations.push({
          sectionHeading: section.heading,
          paragraphIndex: paragraphIndex + 1,
          excerpt: originalParagraph.trim().slice(0, 200),
        });
        locationsByParagraph.set(paragraph, locations);
      }
    }
    blocksByArticle.set(slug, locationsByParagraph);
    for (const [paragraph, locations] of locationsByParagraph) {
      if (locations.length > 1) {
        const sectionCount = new Set(locations.map((location) => location.sectionHeading)).size;
        const paragraphSlots = new Set(locations.map((location) => location.paragraphIndex)).size;
        duplicateWithinArticleOccurrences += locations.length - 1;
        duplicateWithinArticleGroups += 1;
        maxCopiesWithinArticle = Math.max(maxCopiesWithinArticle, locations.length);
        duplicateGroups.push({
          articleSlug: slug,
          articleTitle: titles[slug] ?? slug,
          excerpt: locations[0].excerpt,
          copies: locations.length,
          classification: sectionCount >= 3 && paragraphSlots === 1
            ? "repeated-template-candidate"
            : "repeated-editorial-content-candidate",
          reviewStatus: "requires-editorial-review",
          locations: locations.map(({ sectionHeading, paragraphIndex }) => ({
            sectionHeading,
            paragraphIndex,
          })),
        });
      }
      const slugs = articlesByBlock.get(paragraph) ?? new Set<string>();
      slugs.add(slug);
      articlesByBlock.set(paragraph, slugs);
    }
  }

  const crossArticleSharedGroups = [...articlesByBlock.values()].filter((slugs) => slugs.size > 1);
  duplicateGroups.sort((left, right) =>
    left.articleSlug < right.articleSlug ? -1 :
      left.articleSlug > right.articleSlug ? 1 :
        left.excerpt < right.excerpt ? -1 : left.excerpt > right.excerpt ? 1 : 0,
  );
  return {
    articleCount: blocksByArticle.size,
    rawParagraphCount,
    duplicateWithinArticleOccurrences,
    duplicateWithinArticleGroups,
    duplicateGroups,
    crossArticleSharedGroups: crossArticleSharedGroups.length,
    maxCopiesWithinArticle,
    maxDistinctArticlesSharingBlock: Math.max(0, ...crossArticleSharedGroups.map((slugs) => slugs.size)),
  };
}

function relatedArticleSlugs(slug: string, category: ArticleCategory): string[] {
  return allSlugs
    .filter((candidate) => candidate !== slug && (categoryBySlug[candidate] ?? "career-reality-checks") === category)
    .slice(0, 3);
}

export const archivedArticleRecords: Article[] = allSlugs.map((slug, index) => {
  const category = categoryBySlug[slug] ?? "career-reality-checks";
  const label = categoryLabels[category];
  const dek = (editorialBriefs[slug]?.dek ?? editorialDeks[slug])?.trim();
  assertAuthoredDescription(dek, `/article/${slug}`);
  const authored = authoredArticles[slug];
  if (!authored) {
    throw new Error(`Missing authored article content for ${slug}`);
  }
  // Keep the first exact paragraph in the assembled draft; original exports remain untouched.
  const sections = removeExactRepeatedParagraphs(authored.sections);
  const articleWordCount = countWords([titles[slug], dek, ...sections.flatMap((section) => [section.heading, section.body])].join(" "));
  // Publication and review dates are omitted until they can be tied to a verified editorial record.
  const date: string | null = null;
  const editorial = getEditorialMetadata(slug, category, titles[slug], {
    datePublished: date,
    dateModified: date,
    metaDescription: dek,
    relatedSlugs: relatedArticleSlugs(slug, category),
    sectionHeadings: sections.map((section) => section.heading),
  });
  assertAuthoredDescription(editorial.metaDescription, `/article/${slug}`);
  return {
    slug,
    title: titles[slug],
    excerpt: dek,
    category,
    date,
    readTime: `${Math.max(1, Math.ceil(articleWordCount / 220))} min read`,
    sections,
    tags: [label, index % 2 ? "India 2026" : "Decision guide", "CareerReality"],
    contentType: "Editorial article",
    sourceUrl: editorial.sources[0].url,
    editorial,
    heroImage: getArticleHeroImage(slug),
    editorialEnhancement: editorialEnhancements[slug],
    editorialRecord: {
      authorName: null,
      authorProfileUrl: null,
      reviewerName: null,
      reviewerProfileUrl: null,
      createdAt: null,
      draftedAt: null,
      publishedAt: null,
      updatedAt: null,
      lastReviewedAt: null,
      lastFactCheckedAt: null,
      status: "requires-editorial-review",
    },
  };
});

// Quarantined from the active public catalogue; source records remain available to audit scripts.
export const articles: Article[] = [];

export const articleCategories = Object.entries(categoryLabels).map(([value, label]) => ({
  value: value as ArticleCategory,
  label,
}));

export const archivedCompanyRecords = [
  { slug: "tata-consultancy-services", name: "Tata Consultancy Services", sector: "IT services", stability: 78, momentum: "Steady", signal: "Hiring remains selective; large deal book supports a measured outlook.", updated: "18 Aug 2026", confidence: "High" },
  { slug: "infosys", name: "Infosys", sector: "IT services", stability: 71, momentum: "Recovering", signal: "Campus intake is returning while lateral hiring stays role-specific.", updated: "12 Aug 2026", confidence: "High" },
  { slug: "razorpay", name: "Razorpay", sector: "Fintech", stability: 62, momentum: "Mixed", signal: "Product hiring is visible; cost discipline remains part of the plan.", updated: "09 Aug 2026", confidence: "Medium" },
  { slug: "phonepe", name: "PhonePe", sector: "Fintech", stability: 69, momentum: "Building", signal: "Payments and commerce roles show the clearest hiring momentum.", updated: "04 Aug 2026", confidence: "Medium" },
  { slug: "microsoft-india", name: "Microsoft India", sector: "Software", stability: 86, momentum: "Selective", signal: "AI infrastructure hiring offsets restraint in adjacent teams.", updated: "29 Jul 2026", confidence: "High" },
  { slug: "freshworks", name: "Freshworks", sector: "SaaS", stability: 65, momentum: "Cautious", signal: "Openings concentrate around enterprise and platform roles.", updated: "22 Jul 2026", confidence: "Medium" },
  { slug: "hcltech", name: "HCLTech", sector: "IT services", stability: 75, momentum: "Steady", signal: "Cloud, engineering, and infrastructure demand supports selective hiring across accounts.", updated: "16 Aug 2026", confidence: "High" },
  { slug: "wipro", name: "Wipro", sector: "IT services", stability: 68, momentum: "Recovering", signal: "Demand is improving in cloud and consulting while discretionary lateral hiring remains measured.", updated: "15 Aug 2026", confidence: "High" },
  { slug: "tech-mahindra", name: "Tech Mahindra", sector: "IT services", stability: 67, momentum: "Recovering", signal: "Telecom and enterprise transformation work is rebuilding, with hiring concentrated by account.", updated: "14 Aug 2026", confidence: "High" },
  { slug: "ltimindtree", name: "LTIMindtree", sector: "IT services", stability: 70, momentum: "Selective", signal: "Integration work and cloud programmes support openings, but teams remain disciplined on cost.", updated: "13 Aug 2026", confidence: "Medium" },
  { slug: "persistent-systems", name: "Persistent Systems", sector: "IT services", stability: 79, momentum: "Building", signal: "Product engineering and cloud partnerships continue to create demand for experienced builders.", updated: "12 Aug 2026", confidence: "High" },
  { slug: "mphasis", name: "Mphasis", sector: "IT services", stability: 73, momentum: "Building", signal: "Cloud and banking technology work is supporting targeted hiring in delivery and engineering.", updated: "11 Aug 2026", confidence: "Medium" },
  { slug: "zoho", name: "Zoho", sector: "SaaS", stability: 77, momentum: "Steady", signal: "A broad product portfolio supports steady role creation, with hiring shaped by product teams.", updated: "10 Aug 2026", confidence: "Medium" },
  { slug: "google-india", name: "Google India", sector: "Software", stability: 88, momentum: "Selective", signal: "AI, cloud, and engineering roles remain the clearest openings while general hiring stays selective.", updated: "09 Aug 2026", confidence: "High" },
  { slug: "amazon-india", name: "Amazon India", sector: "E-commerce", stability: 80, momentum: "Selective", signal: "Cloud, logistics, and product roles remain active, with headcount decisions varying by business line.", updated: "08 Aug 2026", confidence: "High" },
  { slug: "flipkart", name: "Flipkart", sector: "E-commerce", stability: 70, momentum: "Mixed", signal: "Commerce and supply-chain roles show demand while growth expectations remain closely managed.", updated: "07 Aug 2026", confidence: "Medium" },
  { slug: "swiggy", name: "Swiggy", sector: "Consumer internet", stability: 61, momentum: "Mixed", signal: "Food delivery and quick-commerce roles remain visible, alongside tighter approval in corporate functions.", updated: "06 Aug 2026", confidence: "Medium" },
  { slug: "zomato", name: "Zomato", sector: "Consumer internet", stability: 64, momentum: "Building", signal: "Delivery and new-commerce expansion supports hiring, but operating economics differ by business line.", updated: "05 Aug 2026", confidence: "Medium" },
  { slug: "meesho", name: "Meesho", sector: "E-commerce", stability: 66, momentum: "Building", signal: "Supply-chain and marketplace growth roles remain the clearest hiring signals.", updated: "04 Aug 2026", confidence: "High" },
  { slug: "cred", name: "CRED", sector: "Fintech", stability: 58, momentum: "Cautious", signal: "Product and risk work remains visible while the business stays focused on disciplined growth.", updated: "03 Aug 2026", confidence: "Medium" },
  { slug: "groww", name: "Groww", sector: "Fintech", stability: 72, momentum: "Building", signal: "Investing and platform roles show expansion, with compliance and reliability becoming larger parts of scope.", updated: "02 Aug 2026", confidence: "Medium" },
  { slug: "policybazaar", name: "Policybazaar", sector: "Fintech", stability: 74, momentum: "Steady", signal: "Insurance distribution and platform operations support steady demand across product and analytics.", updated: "01 Aug 2026", confidence: "High" },
  { slug: "reliance-jio", name: "Reliance Jio", sector: "Telecom", stability: 82, momentum: "Building", signal: "Network, digital services, and commerce expansion create a broad but business-line-specific hiring surface.", updated: "31 Jul 2026", confidence: "High" },
  { slug: "ather-energy", name: "Ather Energy", sector: "Automotive", stability: 55, momentum: "Mixed", signal: "Product and manufacturing work remains visible while the company balances growth with operating discipline.", updated: "30 Jul 2026", confidence: "Low" },
  { slug: "ola-electric", name: "Ola Electric", sector: "Automotive", stability: 49, momentum: "Cautious", signal: "Manufacturing and product priorities remain active alongside restructuring pressure in selected functions.", updated: "29 Jul 2026", confidence: "Low" },
  { slug: "paytm", name: "Paytm", sector: "Fintech", stability: 52, momentum: "Recovering", signal: "Payments operations are rebuilding selectively, with tighter approval loops and role-specific backfills.", updated: "28 Jul 2026", confidence: "Medium" },
];

// Source-less company claims are not available to public components or API responses.
export const companies: typeof archivedCompanyRecords = [];

export const archivedLayoffRecords = [
  { company: "Byju's", signal: "Team reductions reported across sales and operations", date: "16 Aug 2026", type: "Layoff", confidence: "Medium", source: "Employee reports + public filings" },
  { company: "Swiggy", signal: "Hiring freeze in selected corporate functions", date: "08 Aug 2026", type: "Hiring freeze", confidence: "Medium", source: "Role availability pattern" },
  { company: "Ather Energy", signal: "Restructuring reported in non-core teams", date: "31 Jul 2026", type: "Restructure", confidence: "Low", source: "Community signal" },
  { company: "Paytm", signal: "Selective backfills and tighter approval loops", date: "24 Jul 2026", type: "Hiring freeze", confidence: "Medium", source: "Job board movement" },
  { company: "Meesho", signal: "No broad reduction signal; growth hiring in supply chain", date: "14 Jul 2026", type: "Hiring signal", confidence: "High", source: "Public role sample" },
  { company: "Ola Electric", signal: "Function-level reductions reported", date: "04 Jul 2026", type: "Layoff", confidence: "Low", source: "Community signal" },
];

// Source-less layoff claims are withheld from the active public catalogue.
export const layoffs: typeof archivedLayoffRecords = [];

export const toolsCatalog = [
  { slug: "ctc-calculator", href: "/salary-calculator", title: "CTC decoder", label: "MONEY", description: "Translate an offer into monthly cash, deferred pay, and tax reality." },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
