import type {
  CompanySignal,
  LayoffSignal,
  SalaryBenchmark,
} from "@workspace/db";

const refreshedAt = new Date("2026-08-18T00:00:00.000Z");

const salaryBases = [
  {
    role: "Software engineer",
    base: { p25: 1540000, median: 2480000, p75: 3690000 },
  },
  {
    role: "Product manager",
    base: { p25: 1860000, median: 2740000, p75: 3980000 },
  },
  {
    role: "Data analyst",
    base: { p25: 880000, median: 1420000, p75: 2170000 },
  },
  {
    role: "Data scientist",
    base: { p25: 1440000, median: 2260000, p75: 3420000 },
  },
  {
    role: "UX designer",
    base: { p25: 1120000, median: 1880000, p75: 3020000 },
  },
  {
    role: "UI designer",
    base: { p25: 980000, median: 1680000, p75: 2760000 },
  },
  {
    role: "DevOps / SRE",
    base: { p25: 1680000, median: 2680000, p75: 4080000 },
  },
  {
    role: "QA / Test engineer",
    base: { p25: 920000, median: 1560000, p75: 2520000 },
  },
  {
    role: "Cybersecurity analyst",
    base: { p25: 1260000, median: 2140000, p75: 3380000 },
  },
  {
    role: "Business analyst",
    base: { p25: 1080000, median: 1760000, p75: 2860000 },
  },
  {
    role: "Project manager",
    base: { p25: 1320000, median: 2240000, p75: 3540000 },
  },
  {
    role: "Sales / Business development",
    base: { p25: 900000, median: 1680000, p75: 3240000 },
  },
  {
    role: "Marketing",
    base: { p25: 780000, median: 1480000, p75: 2860000 },
  },
  {
    role: "Finance / Accounting",
    base: { p25: 840000, median: 1560000, p75: 2920000 },
  },
  {
    role: "HR / People operations",
    base: { p25: 760000, median: 1420000, p75: 2680000 },
  },
  {
    role: "Customer success",
    base: { p25: 820000, median: 1540000, p75: 2920000 },
  },
  {
    role: "Operations manager",
    base: { p25: 960000, median: 1720000, p75: 3100000 },
  },
  {
    role: "Content / Copywriter",
    base: { p25: 620000, median: 1180000, p75: 2320000 },
  },
] as const;

const cityMultipliers: Record<string, number> = {
  Bengaluru: 1,
  Mumbai: 1.04,
  "Delhi NCR": 1.01,
  Hyderabad: 0.91,
  Pune: 0.94,
};

const experienceMultipliers: Record<string, number> = {
  "0–2 years": 0.62,
  "3–5 years": 0.82,
  "5–8 years": 1,
  "9+ years": 1.24,
};

const roundToThousand = (value: number) => Math.round(value / 1000) * 1000;

export const salaryBenchmarkSeed: Array<
  Omit<SalaryBenchmark, "id" | "refreshedAt" | "provenance">
> = salaryBases.flatMap(({ role, base }) =>
  Object.entries(cityMultipliers).flatMap(([city, cityMultiplier]) =>
    Object.entries(experienceMultipliers).map(
      ([experienceBand, experienceMultiplier]) => ({
        role,
        city,
        experienceBand,
        p25: roundToThousand(base.p25 * cityMultiplier * experienceMultiplier),
        median: roundToThousand(
          base.median * cityMultiplier * experienceMultiplier,
        ),
        p75: roundToThousand(base.p75 * cityMultiplier * experienceMultiplier),
        sampleSize: 120 + Math.round(experienceMultiplier * 85),
        source: "CareerReality salary reports + public compensation signals",
        sourceUrl: null,
        confidence: "Medium" as const,
        observedAt: refreshedAt,
      }),
    ),
  ),
);

export const companySignalSeed: Array<
  Omit<CompanySignal, "id" | "refreshedAt" | "provenance">
> = [
  {
    slug: "tata-consultancy-services",
    name: "Tata Consultancy Services",
    sector: "IT services",
    stability: 78,
    momentum: "Steady",
    signal:
      "Hiring remains selective; large deal book supports a measured outlook.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-18T00:00:00.000Z"),
  },
  {
    slug: "infosys",
    name: "Infosys",
    sector: "IT services",
    stability: 71,
    momentum: "Recovering",
    signal:
      "Campus intake is returning while lateral hiring stays role-specific.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-12T00:00:00.000Z"),
  },
  {
    slug: "razorpay",
    name: "Razorpay",
    sector: "Fintech",
    stability: 62,
    momentum: "Mixed",
    signal:
      "Product hiring is visible; cost discipline remains part of the plan.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-09T00:00:00.000Z"),
  },
  {
    slug: "phonepe",
    name: "PhonePe",
    sector: "Fintech",
    stability: 69,
    momentum: "Building",
    signal:
      "Payments and commerce roles show the clearest hiring momentum.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-04T00:00:00.000Z"),
  },
  {
    slug: "microsoft-india",
    name: "Microsoft India",
    sector: "Software",
    stability: 86,
    momentum: "Selective",
    signal:
      "AI infrastructure hiring offsets restraint in adjacent teams.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-07-29T00:00:00.000Z"),
  },
  {
    slug: "freshworks",
    name: "Freshworks",
    sector: "SaaS",
    stability: 65,
    momentum: "Cautious",
    signal:
      "Openings concentrate around enterprise and platform roles.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-07-22T00:00:00.000Z"),
  },
  {
    slug: "hcltech",
    name: "HCLTech",
    sector: "IT services",
    stability: 75,
    momentum: "Steady",
    signal:
      "Cloud, engineering, and infrastructure demand supports selective hiring across accounts.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-16T00:00:00.000Z"),
  },
  {
    slug: "wipro",
    name: "Wipro",
    sector: "IT services",
    stability: 68,
    momentum: "Recovering",
    signal:
      "Demand is improving in cloud and consulting while discretionary lateral hiring remains measured.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-15T00:00:00.000Z"),
  },
  {
    slug: "tech-mahindra",
    name: "Tech Mahindra",
    sector: "IT services",
    stability: 67,
    momentum: "Recovering",
    signal:
      "Telecom and enterprise transformation work is rebuilding, with hiring concentrated by account.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-14T00:00:00.000Z"),
  },
  {
    slug: "ltimindtree",
    name: "LTIMindtree",
    sector: "IT services",
    stability: 70,
    momentum: "Selective",
    signal:
      "Integration work and cloud programmes support openings, but teams remain disciplined on cost.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-13T00:00:00.000Z"),
  },
  {
    slug: "persistent-systems",
    name: "Persistent Systems",
    sector: "IT services",
    stability: 79,
    momentum: "Building",
    signal:
      "Product engineering and cloud partnerships continue to create demand for experienced builders.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-12T00:00:00.000Z"),
  },
  {
    slug: "mphasis",
    name: "Mphasis",
    sector: "IT services",
    stability: 73,
    momentum: "Building",
    signal:
      "Cloud and banking technology work is supporting targeted hiring in delivery and engineering.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-11T00:00:00.000Z"),
  },
  {
    slug: "zoho",
    name: "Zoho",
    sector: "SaaS",
    stability: 77,
    momentum: "Steady",
    signal:
      "A broad product portfolio supports steady role creation, with hiring shaped by product teams.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-10T00:00:00.000Z"),
  },
  {
    slug: "google-india",
    name: "Google India",
    sector: "Software",
    stability: 88,
    momentum: "Selective",
    signal:
      "AI, cloud, and engineering roles remain the clearest openings while general hiring stays selective.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-09T00:00:00.000Z"),
  },
  {
    slug: "amazon-india",
    name: "Amazon India",
    sector: "E-commerce",
    stability: 80,
    momentum: "Selective",
    signal:
      "Cloud, logistics, and product roles remain active, with headcount decisions varying by business line.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-08T00:00:00.000Z"),
  },
  {
    slug: "flipkart",
    name: "Flipkart",
    sector: "E-commerce",
    stability: 70,
    momentum: "Mixed",
    signal:
      "Commerce and supply-chain roles show demand while growth expectations remain closely managed.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-07T00:00:00.000Z"),
  },
  {
    slug: "swiggy",
    name: "Swiggy",
    sector: "Consumer internet",
    stability: 61,
    momentum: "Mixed",
    signal:
      "Food delivery and quick-commerce roles remain visible, alongside tighter approval in corporate functions.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-06T00:00:00.000Z"),
  },
  {
    slug: "zomato",
    name: "Zomato",
    sector: "Consumer internet",
    stability: 64,
    momentum: "Building",
    signal:
      "Delivery and new-commerce expansion supports hiring, but operating economics differ by business line.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-05T00:00:00.000Z"),
  },
  {
    slug: "meesho",
    name: "Meesho",
    sector: "E-commerce",
    stability: 66,
    momentum: "Building",
    signal:
      "Supply-chain and marketplace growth roles remain the clearest hiring signals.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-04T00:00:00.000Z"),
  },
  {
    slug: "cred",
    name: "CRED",
    sector: "Fintech",
    stability: 58,
    momentum: "Cautious",
    signal:
      "Product and risk work remains visible while the business stays focused on disciplined growth.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-03T00:00:00.000Z"),
  },
  {
    slug: "groww",
    name: "Groww",
    sector: "Fintech",
    stability: 72,
    momentum: "Building",
    signal:
      "Investing and platform roles show expansion, with compliance and reliability becoming larger parts of scope.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-08-02T00:00:00.000Z"),
  },
  {
    slug: "policybazaar",
    name: "Policybazaar",
    sector: "Fintech",
    stability: 74,
    momentum: "Steady",
    signal:
      "Insurance distribution and platform operations support steady demand across product and analytics.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-08-01T00:00:00.000Z"),
  },
  {
    slug: "reliance-jio",
    name: "Reliance Jio",
    sector: "Telecom",
    stability: 82,
    momentum: "Building",
    signal:
      "Network, digital services, and commerce expansion create a broad but business-line-specific hiring surface.",
    source: "Public filings + role availability sample",
    sourceUrl: null,
    confidence: "High",
    observedAt: new Date("2026-07-31T00:00:00.000Z"),
  },
  {
    slug: "ather-energy",
    name: "Ather Energy",
    sector: "Automotive",
    stability: 55,
    momentum: "Mixed",
    signal:
      "Product and manufacturing work remains visible while the company balances growth with operating discipline.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Low",
    observedAt: new Date("2026-07-30T00:00:00.000Z"),
  },
  {
    slug: "ola-electric",
    name: "Ola Electric",
    sector: "Automotive",
    stability: 49,
    momentum: "Cautious",
    signal:
      "Manufacturing and product priorities remain active alongside restructuring pressure in selected functions.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Low",
    observedAt: new Date("2026-07-29T00:00:00.000Z"),
  },
  {
    slug: "paytm",
    name: "Paytm",
    sector: "Fintech",
    stability: 52,
    momentum: "Recovering",
    signal:
      "Payments operations are rebuilding selectively, with tighter approval loops and role-specific backfills.",
    source: "Public reporting + role availability sample",
    sourceUrl: null,
    confidence: "Medium",
    observedAt: new Date("2026-07-28T00:00:00.000Z"),
  },
];

export const layoffSignalSeed: Array<
  Omit<LayoffSignal, "id" | "refreshedAt" | "provenance">
> = [
  {
    company: "Byju's",
    signal: "Team reductions reported across sales and operations",
    type: "Layoff",
    confidence: "Medium",
    source: "Employee reports + public filings",
    sourceUrl: null,
    observedAt: new Date("2026-08-16T00:00:00.000Z"),
  },
  {
    company: "Swiggy",
    signal: "Hiring freeze in selected corporate functions",
    type: "Hiring freeze",
    confidence: "Medium",
    source: "Role availability pattern",
    sourceUrl: null,
    observedAt: new Date("2026-08-08T00:00:00.000Z"),
  },
  {
    company: "Ather Energy",
    signal: "Restructuring reported in non-core teams",
    type: "Restructure",
    confidence: "Low",
    source: "Community signal",
    sourceUrl: null,
    observedAt: new Date("2026-07-31T00:00:00.000Z"),
  },
  {
    company: "Paytm",
    signal: "Selective backfills and tighter approval loops",
    type: "Hiring freeze",
    confidence: "Medium",
    source: "Job board movement",
    sourceUrl: null,
    observedAt: new Date("2026-07-24T00:00:00.000Z"),
  },
  {
    company: "Meesho",
    signal:
      "No broad reduction signal; growth hiring in supply chain",
    type: "Hiring signal",
    confidence: "High",
    source: "Public role sample",
    sourceUrl: null,
    observedAt: new Date("2026-07-14T00:00:00.000Z"),
  },
  {
    company: "Ola Electric",
    signal: "Function-level reductions reported",
    type: "Layoff",
    confidence: "Low",
    source: "Community signal",
    sourceUrl: null,
    observedAt: new Date("2026-07-04T00:00:00.000Z"),
  },
];