import { getAuth } from "@clerk/express";
import Busboy from "busboy";
import mammoth from "mammoth";
import {
  AskCareerRealityBody,
  AskCareerRealityResponse,
  AnalyzeCompensationDocumentResponse,
  CareerAction,
  CareerBrief,
  ListCareerBriefHistoryResponse,
  CreateCareerActionBody,
  CreateCareerActionResponse,
  GetCareerBriefResponse,
  GetCareerProfileResponse,
  ResumeRemovalResponse,
  ListCareerActionsResponse,
  ProcessCareerResumeResponse,
  GetPromotionReadinessResponse,
  ListPromotionEvidenceResponse,
  ListPromotionReadinessHistoryResponse,
  CreatePromotionEvidenceBody,
  CreatePromotionEvidenceResponse,
  DeletePromotionEvidenceResponse,
  DeleteCareerResumeResponse,
  UpdatePromotionReadinessBody,
  UpdatePromotionReadinessResponse,
  UpdateCareerActionBody,
  UpdateCareerActionResponse,
  UpdateCareerProfileBody,
  UpdateCareerProfileResponse,
} from "@workspace/api-zod";
import {
  careerActionsTable,
  careerBriefSnapshotsTable,
  careerProfilesTable,
  promotionEvidenceTable,
  promotionReadinessTable,
  promotionReadinessSnapshotsTable,
  companySignalsTable,
  db,
  layoffSignalsTable,
  salaryBenchmarksTable,
} from "@workspace/db";
import { and, desc, eq, ilike, isNotNull, lt } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import type { Request } from "express";
import {
  createFreshnessCache,
  type FreshnessReadStatus,
} from "../lib/freshness-cache";
import { buildCareerDecision, type LiveJobMarketSignal } from "../lib/career-decision-engine";
import { fetchJobFeed, THEIRSTACK_SOURCE } from "../lib/job-feeds";
import {
  CAREER_BRIEF_HISTORY_LIMIT,
  compareBriefSnapshots,
  createBriefSnapshot,
  buildBriefHistoryEntries,
  shouldPersistBriefSnapshot,
  type BriefSnapshot,
} from "../lib/career-brief-history";
import { logger } from "../lib/logger";
import {
  canUseCompanySignal,
  canUseLayoffSignal,
  canUseSalaryBenchmark,
} from "../lib/public-evidence";

const router: IRouter = Router();
const MAX_RESUME_BYTES = 8 * 1024 * 1024;
const CAREER_BRIEF_FRESHNESS_WINDOW_MS = 60_000;
const LIVE_JOB_MARKET_FRESHNESS_WINDOW_MS = 5 * 60_000;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type ExtractedResume = {
  skills: string[];
  employers: string[];
  roles: string[];
  seniority: string | null;
  yearsExperience: number | null;
  education: string[];
  source: string;
};

type CareerEvidence = {
  label: string;
  value: string;
  source: string;
  freshness: string;
  confidence: "High" | "Medium" | "Low" | "Mixed";
};

const liveJobMarketCache = createFreshnessCache<LiveJobMarketSignal>(
  LIVE_JOB_MARKET_FRESHNESS_WINDOW_MS,
);

function currentUserId(req: Parameters<RequestHandler>[0]): string {
  const { userId } = getAuth(req);
  if (!userId) throw new Error("Authenticated user was not available");
  return userId;
}

const requireUser: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

function ageLabel(value: Date): string {
  const days = Math.max(
    0,
    Math.round((Date.now() - value.getTime()) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function cleanText(value: string): string {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 80_000);
}

function stringField(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.normalize("NFKC").trim().slice(0, maxLength)
    : "";
}

export function discardUploadBuffer(buffer: Buffer): void {
  buffer.fill(0);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(
    0,
    20,
  );
}

function extractResumeSignals(text: string): ExtractedResume {
  const normalized = text.toLowerCase();
  const skillVocabulary = [
    "python",
    "sql",
    "java",
    "javascript",
    "typescript",
    "react",
    "node.js",
    "aws",
    "azure",
    "gcp",
    "kubernetes",
    "docker",
    "spark",
    "airflow",
    "snowflake",
    "databricks",
    "machine learning",
    "generative ai",
    "product strategy",
    "user research",
    "analytics",
    "sales",
    "financial modelling",
  ];
  const skills = skillVocabulary.filter((skill) =>
    normalized.includes(skill.toLowerCase()),
  );
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && line.length <= 160);
  const roles = unique(
    lines.filter((line) =>
      /(engineer|developer|manager|analyst|designer|consultant|scientist|lead|director|specialist)/i.test(
        line,
      ),
    ),
  ).slice(0, 8);
  const employers = unique(
    lines
      .filter((line) => /(?:worked|working|intern|at|@)\s+/i.test(line))
      .map((line) => line.replace(/^.*?(?:worked|working|intern|at|@)\s+/i, "")),
  ).slice(0, 8);
  const seniority =
    /(chief|vp|vice president|director|head|principal|staff|senior|lead|manager|associate|junior)/i.exec(
      text,
    )?.[1] ?? null;
  const yearsExperience =
    Number(
      /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i.exec(text)?.[1] ??
        "",
    ) || null;
  const education = unique(
    lines.filter((line) =>
      /(b\.?tech|m\.?tech|bachelor|master|mba|degree|university|college|certified|certification)/i.test(
        line,
      ),
    ),
  ).slice(0, 8);

  return {
    skills: unique(skills),
    employers,
    roles,
    seniority,
    yearsExperience,
    education,
    source: "Resume text extraction",
  };
}

async function parseResumeBuffer(
  contentType: string,
  buffer: Buffer,
): Promise<string> {
  if (contentType === "application/pdf") {
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new Error("The uploaded file is not a valid PDF");
    }
    const raw = buffer.toString("latin1");
    const strings = [...raw.matchAll(/\(([^()]*)\)/g)].map((match) =>
      match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\([()\\])/g, "$1"),
    );
    return cleanText(strings.join("\n"));
  }
  const result = await mammoth.extractRawText({ buffer });
  return cleanText(result.value);
}

async function parseResumeUpload(req: Request): Promise<{
  fileName: string;
  contentType: string;
  buffer: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      reject(new Error("Resume must be uploaded as multipart form data"));
      return;
    }
    const parser = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_RESUME_BYTES },
    });
    let fileName = "";
    let fileType = "";
    let tooLarge = false;
    let seenFile = false;
    const chunks: Buffer[] = [];

    parser.on("file", (_field, stream, info) => {
      seenFile = true;
      fileName = info.filename.replace(/[^\w.\- ()]/g, "_").slice(0, 160);
      fileType = info.mimeType;
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("limit", () => {
        tooLarge = true;
      });
    });
    parser.on("error", reject);
    parser.on("finish", () => {
      if (tooLarge) {
        reject(Object.assign(new Error("Resume exceeds the 8 MB limit"), { status: 413 }));
        return;
      }
      if (!seenFile || !fileName) {
        reject(new Error("Resume file is required"));
        return;
      }
      if (!ALLOWED_RESUME_TYPES.has(fileType)) {
        reject(new Error("Only PDF or Word resumes are supported"));
        return;
      }
      resolve({ fileName, contentType: fileType, buffer: Buffer.concat(chunks) });
    });
    req.pipe(parser);
  });
}

type CompensationDocumentType = "offer" | "payslip";

type ExtractedAmount = {
  amount: number;
  confidence: "High" | "Medium";
  evidence: string;
};

function parseAmount(value: string, unit?: string): number {
  const numeric = Number(value.replace(/,/g, ""));
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit === "crore" || normalizedUnit === "cr") return numeric * 10_000_000;
  if (normalizedUnit === "lakh" || normalizedUnit === "lac" || normalizedUnit === "l") return numeric * 100_000;
  if (normalizedUnit === "k") return numeric * 1_000;
  return numeric;
}

function formatRupees(amount: number, annual = false): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `₹${formatted}${annual ? " / year" : ""}`;
}

function findLabeledAmount(lines: string[], patterns: RegExp[]): ExtractedAmount | undefined {
  for (const line of lines) {
    if (!patterns.some((pattern) => pattern.test(line))) continue;
    const match = line.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(crore|cr|lakh|lac|l|k)?\b/i);
    if (!match) continue;
    return {
      amount: parseAmount(match[1], match[2]),
      confidence: match[2] || /₹|rs\.?|inr/i.test(line) ? "High" : "Medium",
      evidence: line.slice(0, 220),
    };
  }
  return undefined;
}

export function extractCompensationAnalysis(text: string, documentType: CompensationDocumentType) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const findings: Array<{
    category: "guaranteed_cash" | "variable_pay" | "deductions" | "take_home" | "equity" | "ambiguity";
    label: string;
    value: string;
    interpretation: string;
    confidence: "High" | "Medium" | "Low";
    evidence: string;
  }> = [];

  if (documentType === "offer") {
    const total = findLabeledAmount(lines, [/total\s*(ctc|compensation)|cost\s*to\s*company|annual\s*ctc/i]);
    const fixed = findLabeledAmount(lines, [/fixed\s*(pay|compensation)|guaranteed\s*(pay|cash)|base\s*(salary|pay)/i]);
    const variable = findLabeledAmount(lines, [/variable\s*(pay|compensation)|performance\s*bonus|annual\s*bonus/i]);
    const equity = findLabeledAmount(lines, [/esop|rsu|stock|equity/i]);

    if (fixed || total) {
      const amount = fixed ?? total;
      findings.push({
        category: "guaranteed_cash",
        label: fixed ? "Guaranteed / fixed cash" : "Headline CTC",
        value: formatRupees(amount!.amount, true),
        interpretation: fixed ? "Use this as the cleaner anchor for comparing offers." : "This is a headline number; confirm how much is fixed before comparing.",
        confidence: amount!.confidence,
        evidence: amount!.evidence,
      });
    }
    if (variable) {
      const base = fixed?.amount ?? total?.amount ?? 0;
      const share = base > 0 ? Math.round((variable.amount / (base + variable.amount)) * 100) : undefined;
      findings.push({
        category: "variable_pay",
        label: "Variable / performance pay",
        value: `${formatRupees(variable.amount, true)}${share ? ` · ${share}% of identified cash` : ""}`,
        interpretation: "Treat this as conditional until the payout rule, target history, and clawbacks are clear.",
        confidence: variable.confidence,
        evidence: variable.evidence,
      });
    }
    if (equity) {
      findings.push({
        category: "equity",
        label: "Equity / stock component",
        value: formatRupees(equity.amount, true),
        interpretation: "Do not value this like cash until vesting, exercise price, liquidity, and tax treatment are documented.",
        confidence: equity.confidence,
        evidence: equity.evidence,
      });
    }
    if (!fixed && !total) {
      findings.push({
        category: "ambiguity",
        label: "Guaranteed cash not found",
        value: "Needs clarification",
        interpretation: "Ask for the annual fixed component and the exact payout conditions before accepting.",
        confidence: "Low",
        evidence: "No clearly labeled fixed pay or total CTC line was found.",
      });
    }
  } else {
    const gross = findLabeledAmount(lines, [/gross\s*(salary|pay|earnings)|total\s*earnings/i]);
    const net = findLabeledAmount(lines, [/net\s*(pay|salary)|take[- ]home|net\s*payable/i]);
    const deductions = findLabeledAmount(lines, [/total\s*deductions|deductions/i]);
    if (gross) {
      findings.push({
        category: "guaranteed_cash",
        label: "Gross monthly pay",
        value: formatRupees(gross.amount),
        interpretation: "This is the pre-deduction monthly amount shown on the payslip.",
        confidence: gross.confidence,
        evidence: gross.evidence,
      });
    }
    if (net) {
      const takeHomeRate = gross ? Math.round((net.amount / gross.amount) * 100) : undefined;
      findings.push({
        category: "take_home",
        label: "Net monthly take-home",
        value: `${formatRupees(net.amount)}${takeHomeRate ? ` · ${takeHomeRate}% of gross` : ""}`,
        interpretation: "Use this for monthly runway planning, not headline CTC comparisons.",
        confidence: net.confidence,
        evidence: net.evidence,
      });
    }
    if (deductions) {
      findings.push({
        category: "deductions",
        label: "Monthly deductions",
        value: formatRupees(deductions.amount),
        interpretation: "Break this line into tax, provident fund, insurance, and other deductions before comparing employers.",
        confidence: deductions.confidence,
        evidence: deductions.evidence,
      });
    }
    if (!gross && !net) {
      findings.push({
        category: "ambiguity",
        label: "Take-home figures not found",
        value: "Needs a clearer payslip export",
        interpretation: "The document did not expose a clearly labeled gross or net pay line.",
        confidence: "Low",
        evidence: "No gross pay, net pay, or take-home line was found.",
      });
    }
  }

  const hasAmbiguity = findings.some((finding) => finding.category === "ambiguity");
  const headline = documentType === "offer"
    ? (findings.find((finding) => finding.category === "guaranteed_cash")?.value ?? "Offer economics need clarification")
    : (findings.find((finding) => finding.category === "take_home")?.value ?? "Payslip economics need clarification");
  const summary = documentType === "offer"
    ? hasAmbiguity
      ? "The offer contains at least one compensation gap. Get the guaranteed cash and payout rules in writing before comparing it with your current role."
      : "The offer has been separated into guaranteed cash, conditional pay, and equity so the headline CTC does not do all the persuading."
    : hasAmbiguity
      ? "The payslip did not expose enough labeled figures for a reliable take-home read. Use a clearer monthly payslip export."
      : "The payslip separates gross pay, take-home, and deductions so your monthly runway is grounded in what actually reaches your account.";

  return {
    headline,
    summary,
    findings,
    nextActions: documentType === "offer"
      ? [
          "Ask for the fixed annual cash number and the last two years of variable payout history.",
          "Confirm notice period, joining bonus repayment, equity vesting, and the first review date.",
          "Compare the guaranteed cash against your current monthly runway, not only the headline CTC.",
        ]
      : [
          "Check whether the net pay includes one-off deductions or a regular payroll item.",
          "Use the net amount to set a minimum six-month runway before resigning.",
          "Reconcile payslip totals with your offer letter and Form 16 before negotiating.",
        ],
    qualityNotes: [
      "Figures are extracted from labeled document text and are not a tax calculation.",
      ...(hasAmbiguity ? ["At least one important compensation figure was not clearly labeled."] : []),
    ],
  };
}

async function loadProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(careerProfilesTable)
    .where(eq(careerProfilesTable.userId, userId))
    .limit(1);
  return profile;
}

async function pruneCareerBriefSnapshots(userId: string): Promise<void> {
  const oldestRetainedRows = await db
    .select({ createdAt: careerBriefSnapshotsTable.createdAt })
    .from(careerBriefSnapshotsTable)
    .where(eq(careerBriefSnapshotsTable.userId, userId))
    .orderBy(
      desc(careerBriefSnapshotsTable.createdAt),
      desc(careerBriefSnapshotsTable.id),
    )
    .limit(CAREER_BRIEF_HISTORY_LIMIT + 1);

  if (oldestRetainedRows.length <= CAREER_BRIEF_HISTORY_LIMIT) return;

  const boundary = oldestRetainedRows[CAREER_BRIEF_HISTORY_LIMIT]?.createdAt;
  if (!boundary) return;

  // Only remove old snapshots for this user. The newest snapshot is always
  // newer than the boundary and remains available for the next comparison.
  await db
    .delete(careerBriefSnapshotsTable)
    .where(
      and(
        eq(careerBriefSnapshotsTable.userId, userId),
        lt(careerBriefSnapshotsTable.createdAt, boundary),
      ),
    );
}

async function loadLiveJobMarketSignal(profile: Awaited<ReturnType<typeof loadProfile>>): Promise<LiveJobMarketSignal> {
  const scope = `${profile?.target ?? profile?.role ?? "technology"} in ${profile?.city ?? "India"}`;
  if (!process.env.THEIRSTACK_API_KEY?.trim()) {
    return {
      status: "unavailable",
      count: 0,
      scope,
      source: THEIRSTACK_SOURCE.label,
      confidence: "Low",
    };
  }

  try {
    const jobs = await fetchJobFeed(THEIRSTACK_SOURCE, {
      role: profile?.role ?? "technology",
      target: profile?.target ?? profile?.role ?? "technology",
      city: profile?.city ?? "India",
    });
    return {
      status: "available",
      count: jobs.length,
      scope,
      source: THEIRSTACK_SOURCE.label,
      confidence: jobs.length >= 10 ? "Medium" : "Low",
      refreshedAt: new Date(),
    };
  } catch {
    return {
      status: "unavailable",
      count: 0,
      scope,
      source: THEIRSTACK_SOURCE.label,
      confidence: "Low",
    };
  }
}

async function readLiveJobMarketSignal(profile: Awaited<ReturnType<typeof loadProfile>>): Promise<LiveJobMarketSignal> {
  const key = [
    profile?.role ?? "",
    profile?.target ?? "",
    profile?.city ?? "",
  ].map((value) => value.trim().toLowerCase()).join("|");
  return (await liveJobMarketCache.get(key, () => loadLiveJobMarketSignal(profile))).value;
}

async function buildBrief(userId: string): Promise<CareerBrief> {
  const profile = await loadProfile(userId);
  if (!profile) throw Object.assign(new Error("Career profile not found"), { status: 404 });

  const [salaryRows, companyRows, layoffs, liveJobMarket] = await Promise.all([
    db
      .select()
      .from(salaryBenchmarksTable)
      .where(isNotNull(salaryBenchmarksTable.sourceUrl))
      .limit(500),
    db
      .select()
      .from(companySignalsTable)
      .where(and(ilike(companySignalsTable.name, `%${profile.company}%`), isNotNull(companySignalsTable.sourceUrl)))
      .limit(10),
    db
      .select()
      .from(layoffSignalsTable)
      .where(and(ilike(layoffSignalsTable.company, `%${profile.company}%`), isNotNull(layoffSignalsTable.sourceUrl)))
      .orderBy(desc(layoffSignalsTable.observedAt))
      .limit(5),
    readLiveJobMarketSignal(profile),
  ]);
  const sourceLinkedSalaryRows = salaryRows.filter((row) => canUseSalaryBenchmark(row));
  const publishableCompanyRows = companyRows.filter((row) => canUseCompanySignal(row));
  const sourceLinkedLayoffs = layoffs.filter((row) => canUseLayoffSignal(row));
  const decision = buildCareerDecision({
    profile,
    salaryRows: sourceLinkedSalaryRows,
    company: publishableCompanyRows[0],
    watch: sourceLinkedLayoffs[0],
    liveJobMarket,
  });
  const currentSnapshot = createBriefSnapshot({
    role: profile.role,
    company: profile.company,
    city: profile.city,
    experience: profile.experience,
    ctc: profile.ctc,
    situation: profile.situation,
    target: profile.target,
    resumeStatus: profile.resumeStatus,
    resumeUpdatedAt: profile.resumeUpdatedAt?.toISOString() ?? null,
  }, decision);
  const [previousRow] = await db
    .select({ snapshot: careerBriefSnapshotsTable.snapshot })
    .from(careerBriefSnapshotsTable)
    .where(eq(careerBriefSnapshotsTable.userId, userId))
    .orderBy(
      desc(careerBriefSnapshotsTable.createdAt),
      desc(careerBriefSnapshotsTable.id),
    )
    .limit(1);
  const previousSnapshot = previousRow?.snapshot as BriefSnapshot | undefined;
  const whatChanged = compareBriefSnapshots(previousSnapshot ?? null, currentSnapshot);
  if (shouldPersistBriefSnapshot(whatChanged)) {
    await db.insert(careerBriefSnapshotsTable).values({
      userId,
      snapshot: currentSnapshot,
    });
  }
  try {
    await pruneCareerBriefSnapshots(userId);
  } catch (error) {
    logger.warn(
      {
        errorType: error instanceof Error ? error.name : "UnknownError",
      },
      "Career brief history cleanup did not complete",
    );
  }
  return GetCareerBriefResponse.parse({ ...decision, whatChanged });
}

const careerBriefCache = createFreshnessCache<CareerBrief>(
  CAREER_BRIEF_FRESHNESS_WINDOW_MS,
);

async function readCareerBrief(userId: string) {
  return careerBriefCache.get(userId, () => buildBrief(userId));
}

function setBriefCacheHeaders(
  res: Parameters<RequestHandler>[1],
  status: FreshnessReadStatus,
) {
  res.set(
    "Cache-Control",
    `private, max-age=${CAREER_BRIEF_FRESHNESS_WINDOW_MS / 1000}`,
  );
  res.set("X-Career-Brief-Cache", status);
}

router.use(requireUser);

router.get("/career/profile", async (req, res, next) => {
  try {
    const profile = await loadProfile(currentUserId(req));
    if (!profile) {
      res.status(404).json({ error: "Career profile not found" });
      return;
    }
    res.json(GetCareerProfileResponse.parse(profile));
  } catch (error) {
    next(error);
  }
});

router.put("/career/profile", async (req, res, next) => {
  const input = UpdateCareerProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid career profile" });
    return;
  }
  try {
    const userId = currentUserId(req);
    const existing = await loadProfile(userId);
    const profile = existing
      ? (
          await db
            .update(careerProfilesTable)
            .set({ ...input.data, updatedAt: new Date() })
            .where(eq(careerProfilesTable.userId, userId))
            .returning()
        )[0]
      : (
          await db
            .insert(careerProfilesTable)
            .values({ ...input.data, userId })
            .returning()
        )[0];
    careerBriefCache.clear(userId);
    res.json(UpdateCareerProfileResponse.parse(profile));
  } catch (error) {
    next(error);
  }
});

router.post("/career/resume", async (req, res, next) => {
  let upload: Awaited<ReturnType<typeof parseResumeUpload>>;
  try {
    upload = await parseResumeUpload(req);
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 400;
    res.status(status).json({ error: error instanceof Error ? error.message : "Invalid resume" });
    return;
  }

  const userId = currentUserId(req);
  try {
    const text = await parseResumeBuffer(upload.contentType, upload.buffer);
    if (text.length < 40) throw new Error("The resume did not contain enough readable text");
    const extracted = extractResumeSignals(text);
    const existing = await loadProfile(userId);
    if (existing) {
      await db
        .update(careerProfilesTable)
        .set({
          resumeName: upload.fileName,
          resumeStatus: "ready",
          resumeData: extracted,
          resumeError: null,
          resumeUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(careerProfilesTable.userId, userId));
      careerBriefCache.clear(userId);
    }
    const response = ProcessCareerResumeResponse.parse({
      status: "ready",
      resumeName: upload.fileName,
      extracted,
      message: "Resume processed. The uploaded file was discarded after extraction.",
    });
    res.json(response);
  } catch (error) {
    if (await loadProfile(userId)) {
      await db
        .update(careerProfilesTable)
        .set({
          resumeName: upload.fileName,
          resumeStatus: "failed",
          resumeData: null,
          resumeError: error instanceof Error ? error.message : "Resume processing failed",
          resumeUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(careerProfilesTable.userId, userId));
      careerBriefCache.clear(userId);
    }
    res.status(400).json({
      status: "failed",
      resumeName: upload.fileName,
      extracted: {},
      message: error instanceof Error ? error.message : "Resume processing failed",
    });
  } finally {
    discardUploadBuffer(upload.buffer);
  }
});

router.delete("/career/resume", async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    await db
      .update(careerProfilesTable)
      .set({
        resumeName: null,
        resumeStatus: "not_added",
        resumeData: null,
        resumeError: null,
        resumeUpdatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(careerProfilesTable.userId, userId));
    careerBriefCache.clear(userId);
    res.json(DeleteCareerResumeResponse.parse({ status: "deleted" }));
  } catch (error) {
    next(error);
  }
});

router.post("/career/compensation", async (req, res) => {
  let upload: Awaited<ReturnType<typeof parseResumeUpload>>;
  try {
    upload = await parseResumeUpload(req);
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 400;
    res.status(status).json({ error: error instanceof Error ? error.message : "Invalid compensation document" });
    return;
  }

  try {
    const documentType = stringField(req.body.documentType, 20) as CompensationDocumentType;
    if (documentType !== "offer" && documentType !== "payslip") {
      res.status(400).json({ error: "Choose whether this document is an offer or payslip." });
      return;
    }
    const text = await parseResumeBuffer(upload.contentType, upload.buffer);
    if (text.length < 20) {
      res.status(422).json({ error: "We could not find enough readable compensation text in this document." });
      return;
    }
    const analysis = extractCompensationAnalysis(text, documentType);
    res.json(AnalyzeCompensationDocumentResponse.parse({
      status: "ready",
      documentType,
      fileName: upload.fileName,
      processedAt: new Date(),
      extractedCharacters: text.length,
      ...analysis,
    }));
  } catch (error) {
    res.status(422).json({
      error: error instanceof Error ? error.message : "We could not read this compensation document.",
    });
  } finally {
    discardUploadBuffer(upload.buffer);
  }
});

router.get("/career/promotion-readiness", async (req, res, next) => {
  try {
    const [readiness] = await db
      .select()
      .from(promotionReadinessTable)
      .where(eq(promotionReadinessTable.userId, currentUserId(req)))
      .limit(1);
    if (!readiness) {
      res.status(404).json({ error: "Promotion readiness has not been started" });
      return;
    }
    res.json(GetPromotionReadinessResponse.parse(readiness));
  } catch (error) {
    next(error);
  }
});

router.put("/career/promotion-readiness", async (req, res, next) => {
  const input = UpdatePromotionReadinessBody.safeParse(req.body);
  const scores = input.success
    ? [input.data.scopeScore, input.data.impactScore, input.data.skillsScore, input.data.sponsorshipScore]
    : [];
  if (!input.success || scores.some((score) => !Number.isInteger(score))) {
    res.status(400).json({ error: "Invalid promotion readiness" });
    return;
  }
  try {
    const userId = currentUserId(req);

    const existing = await db
      .select({ id: promotionReadinessTable.id })
      .from(promotionReadinessTable)
      .where(eq(promotionReadinessTable.userId, userId))
      .limit(1);
    const readiness = existing[0]
      ? (
          await db
            .update(promotionReadinessTable)
            .set({ ...input.data, updatedAt: new Date() })
            .where(eq(promotionReadinessTable.userId, userId))
            .returning()
        )[0]
      : (
          await db
            .insert(promotionReadinessTable)
            .values({ ...input.data, userId })
            .returning()
        )[0];
    await db.insert(promotionReadinessSnapshotsTable).values({
      userId,
      scopeScore: input.data.scopeScore,
      impactScore: input.data.impactScore,
      skillsScore: input.data.skillsScore,
      sponsorshipScore: input.data.sponsorshipScore,
      pathStatus: input.data.pathStatus,
      pathNotes: input.data.pathNotes,
      proofPoint: input.data.proofPoint,
      targetDate: input.data.targetDate ?? null,
      managerCheckInDate: input.data.managerCheckInDate ?? null,
    });
    res.json(UpdatePromotionReadinessResponse.parse(readiness));
  } catch (error) {
    next(error);
  }
});

router.get("/career/promotion-readiness/history", async (req, res, next) => {
  try {
    const history = await db
      .select()
      .from(promotionReadinessSnapshotsTable)
      .where(eq(promotionReadinessSnapshotsTable.userId, currentUserId(req)))
      .orderBy(desc(promotionReadinessSnapshotsTable.capturedAt))
      .limit(24);
    res.json(ListPromotionReadinessHistoryResponse.parse(history));
  } catch (error) {
    next(error);
  }
});

router.get("/career/promotion-evidence", async (req, res, next) => {
  try {
    const evidence = await db
      .select()
      .from(promotionEvidenceTable)
      .where(eq(promotionEvidenceTable.userId, currentUserId(req)))
      .orderBy(desc(promotionEvidenceTable.createdAt))
      .limit(100);
    res.json(ListPromotionEvidenceResponse.parse(evidence));
  } catch (error) {
    next(error);
  }
});

router.post("/career/promotion-evidence", async (req, res, next) => {
  const input = CreatePromotionEvidenceBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid promotion evidence" });
    return;
  }
  try {
    const userId = currentUserId(req);
    if (input.data.actionId) {
    const [action] = await db
      .select({ id: careerActionsTable.id })
      .from(careerActionsTable)
      .where(
        and(
          eq(careerActionsTable.id, input.data.actionId),
          eq(careerActionsTable.userId, userId),
        ),
      )
      .limit(1);
      if (!action) {
        res.status(400).json({ error: "The linked career action was not found" });
        return;
      }
    }
    const [evidence] = await db
      .insert(promotionEvidenceTable)
      .values({ ...input.data, userId })
      .returning();
    res.status(201).json(CreatePromotionEvidenceResponse.parse(evidence));
  } catch (error) {
    next(error);
  }
});

router.delete("/career/promotion-evidence/:id", async (req, res, next) => {
  try {
    const [deleted] = await db
      .delete(promotionEvidenceTable)
      .where(
        and(
          eq(promotionEvidenceTable.id, req.params.id),
          eq(promotionEvidenceTable.userId, currentUserId(req)),
        ),
      )
      .returning({ id: promotionEvidenceTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Promotion evidence not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/career/brief", async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const profile = await loadProfile(userId);
    if (!profile) {
      res.status(404).json({
        code: "CAREER_PROFILE_NOT_CONFIGURED",
        error: "Career profile setup is required before a brief can be generated",
      });
      return;
    }
    const brief = await readCareerBrief(userId);
    setBriefCacheHeaders(res, brief.status);
    res.json(brief.value);
  } catch (error) {
    next(error);
  }
});

router.get("/career/brief/history", async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 12);
    const limit = Number.isInteger(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 20))
      : 12;
    const rows = await db
      .select({
        id: careerBriefSnapshotsTable.id,
        createdAt: careerBriefSnapshotsTable.createdAt,
        snapshot: careerBriefSnapshotsTable.snapshot,
      })
      .from(careerBriefSnapshotsTable)
      .where(eq(careerBriefSnapshotsTable.userId, currentUserId(req)))
      .orderBy(desc(careerBriefSnapshotsTable.createdAt))
      .limit(limit);
    const entries = buildBriefHistoryEntries(
      rows.map((row) => ({
        ...row,
        snapshot: row.snapshot as BriefSnapshot,
      })),
    );
    res.json(ListCareerBriefHistoryResponse.parse({ entries }));
  } catch (error) {
    next(error);
  }
});

router.post("/career/ask", async (req, res, next) => {
  const input = AskCareerRealityBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Ask a question with at least 3 characters" });
    return;
  }
  try {
    const profile = await loadProfile(currentUserId(req));
    if (!profile) {
      res.status(404).json({ error: "Career profile not found" });
      return;
    }
    const brief = (await readCareerBrief(currentUserId(req))).value;
    const question = input.data.question.toLowerCase();
    const answer = question.includes("salary") || question.includes("pay")
      ? `Use the market range as your anchor: ${brief.evidence.find((item) => item.label === "Market pay")?.value ?? "the current benchmark is not precise enough yet"}. Your current CTC is only one input; scope, location, and proof of impact determine the credible next band.`
      : question.includes("company") || question.includes("risk")
        ? `${brief.diagnosis} Do not make a stay-or-leave decision from one signal; update the read after checking hiring momentum, team scope, and your own runway.`
        : `The useful answer is a next experiment: ${brief.nextMove}`;
    res.json(
      AskCareerRealityResponse.parse({
        answer,
        assumptions: [
          `Your current role is ${profile.role}.`,
          `Your target direction is ${profile.target}.`,
          "Public signals are directional and do not reveal your team-level reality.",
        ],
        nextActions: [
          "Save the question as a decision to revisit.",
          "Collect one concrete proof point from your current work.",
          "Recheck the relevant market signal after 30 days.",
        ],
        evidence: brief.evidence,
        confidence: brief.confidence,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/career/actions", async (req, res, next) => {
  try {
    const actions = await db
      .select()
      .from(careerActionsTable)
      .where(eq(careerActionsTable.userId, currentUserId(req)))
      .orderBy(desc(careerActionsTable.createdAt))
      .limit(100);
    res.json(ListCareerActionsResponse.parse(actions));
  } catch (error) {
    next(error);
  }
});

router.post("/career/actions", async (req, res, next) => {
  const input = CreateCareerActionBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid career action" });
    return;
  }
  try {
    const userId = currentUserId(req);
    if (input.data.marketChangeId) {
      const [existing] = await db
        .select()
        .from(careerActionsTable)
        .where(
          and(
            eq(careerActionsTable.userId, userId),
            eq(careerActionsTable.marketChangeId, input.data.marketChangeId),
          ),
        )
        .limit(1);
      if (existing) {
        res.json(CreateCareerActionResponse.parse(existing));
        return;
      }
    }
    const [action] = await db
      .insert(careerActionsTable)
      .values({ ...input.data, userId })
      .returning();
    res.status(201).json(CreateCareerActionResponse.parse(action));
  } catch (error) {
    next(error);
  }
});

router.patch("/career/actions/:id", async (req, res, next) => {
  const input = UpdateCareerActionBody.safeParse(req.body);
  if (!input.success || Object.keys(input.data).length === 0) {
    res.status(400).json({ error: "Invalid career action update" });
    return;
  }

  try {
    const userId = currentUserId(req);
    const hasDueDateUpdate = Object.prototype.hasOwnProperty.call(input.data, "dueDate");
    const values: Partial<typeof careerActionsTable.$inferInsert> = {};
    if (input.data.status !== undefined) {
      values.status = input.data.status;
      values.completedAt = input.data.status === "completed" ? new Date() : null;
    }
    if (Object.prototype.hasOwnProperty.call(input.data, "dueDate")) {
      values.dueDate = input.data.dueDate ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input.data, "marketChangeId")) {
      values.marketChangeId = input.data.marketChangeId ?? null;
    }

    const [action] = await db
      .update(careerActionsTable)
      .set(values)
      .where(
        and(
          eq(careerActionsTable.id, req.params.id),
          eq(careerActionsTable.userId, userId),
          ...(hasDueDateUpdate ? [eq(careerActionsTable.status, "open")] : []),
          ...(hasDueDateUpdate ? [eq(careerActionsTable.status, "open")] : []),
        ),
      )
      .returning();

    if (!action) {
      res.status(404).json({ error: "Career action not found" });
      return;
    }
    res.json(UpdateCareerActionResponse.parse(action));
  } catch (error) {
    next(error);
  }
});

export default router;
