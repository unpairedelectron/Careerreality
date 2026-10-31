import { getAuth } from "@clerk/express";
import {
  companySignalsTable,
  db,
  layoffSignalsTable,
  salaryBenchmarksTable,
} from "@workspace/db";
import { ProcessResumeIntelligenceResponse } from "@workspace/api-zod";
import { and, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import mammoth from "mammoth";
import multer from "multer";
import { Router, type IRouter, type RequestHandler } from "express";
import { createRequire } from "node:module";
import path from "node:path";
import { safeOperationalErrorType } from "../lib/logger";
import {
  canUseCompanySignal,
  canUseLayoffSignal,
  canUseSalaryBenchmark,
} from "../lib/public-evidence";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  data: Buffer,
  options?: { max?: number },
) => Promise<{ text: string }>;
const maxResumeBytes = 5 * 1024 * 1024;
const maxExtractedCharacters = 120_000;
const processingWindowMs = 60 * 60 * 1000;
const maxRequestsPerWindow = 5;
const supportedPdfTypes = new Set(["application/pdf", "application/octet-stream"]);
const supportedDocxTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const skillCatalog = [
  "Python",
  "SQL",
  "Data engineering",
  "Data architecture",
  "Cloud",
  "AWS",
  "Azure",
  "GCP",
  "Spark",
  "Kafka",
  "Kubernetes",
  "Docker",
  "Terraform",
  "Machine learning",
  "Generative AI",
  "LLM",
  "Airflow",
  "dbt",
  "Power BI",
  "Tableau",
  "Product strategy",
  "Stakeholder management",
];

function stringField(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.normalize("NFKC").trim().slice(0, maxLength) : "";
}

function cleanText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxExtractedCharacters);
}

function evidenceFor(text: string, term: string): string {
  const index = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if (index < 0) return "Mentioned in the uploaded resume.";
  const start = Math.max(0, index - 55);
  const end = Math.min(text.length, index + term.length + 85);
  return `${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function hasMagicHeader(buffer: Buffer, header: string): boolean {
  return buffer.subarray(0, header.length).toString("latin1") === header;
}

function isDocxZip(buffer: Buffer): boolean {
  return (
    hasMagicHeader(buffer, "PK") &&
    buffer.includes(Buffer.from("[Content_Types].xml")) &&
    buffer.includes(Buffer.from("word/document.xml"))
  );
}

async function extractText(file: Express.Multer.File): Promise<{ text: string; fileType: "PDF" | "DOCX" }> {
  const extension = path.extname(file.originalname).toLocaleLowerCase();
  const isPdf = extension === ".pdf" && supportedPdfTypes.has(file.mimetype) && hasMagicHeader(file.buffer, "%PDF-");
  const isDocx =
    extension === ".docx" &&
    supportedDocxTypes.has(file.mimetype) &&
    isDocxZip(file.buffer);

  if (!isPdf && !isDocx) {
    const error = new Error("Unsupported resume format");
    error.name = "UnsupportedResumeFormat";
    throw error;
  }

  if (isPdf) {
    const result = await pdfParse(file.buffer, { max: 20 });
    return { text: cleanText(result.text), fileType: "PDF" };
  }

  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return { text: cleanText(result.value), fileType: "DOCX" };
}

function parseSkills(text: string) {
  return skillCatalog
    .filter((skill) => new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ -]")}([^a-z0-9]|$)`, "i").test(text))
    .slice(0, 12)
    .map((name) => ({
      name,
      confidence: (text.toLocaleLowerCase().split(name.toLocaleLowerCase()).length > 2 ? "High" : "Medium") as "High" | "Medium",
      evidence: evidenceFor(text, name),
    }));
}

function parseResumeEmployers(text: string, knownCompanyNames: string[]) {
  const normalized = text.toLocaleLowerCase();
  const known = knownCompanyNames
    .filter((name) => name.length > 2 && normalized.includes(name.toLocaleLowerCase()))
    .slice(0, 5)
    .map((name) => ({
      name,
      confidence: "High" as const,
      evidence: evidenceFor(text, name),
    }));

  if (known.length > 0) return known;

  const hints = text
    .split(/(?<=[.!?])\s+|\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(worked|employed|experience|career)\b.{0,30}\b(at|with|for)\b/i.test(line))
    .slice(0, 2);
  return hints.map((line) => ({
    name: line.replace(/^.*?\b(?:at|with|for)\b\s+/i, "").split(/[|,;·]/)[0].trim().slice(0, 100),
    confidence: "Low" as const,
    evidence: line.slice(0, 180),
  })).filter((item) => item.name.length > 2);
}

type MarketData = {
  companyRows: (typeof companySignalsTable)["$inferSelect"][];
  salaryRows: (typeof salaryBenchmarksTable)["$inferSelect"][];
  layoffRows: (typeof layoffSignalsTable)["$inferSelect"][];
};

type MarketDataLoader = (filters: {
  role: string;
  city: string;
  currentCompany: string;
}) => Promise<MarketData>;

async function loadMarketData({
  role,
  city,
  currentCompany,
}: {
  role: string;
  city: string;
  currentCompany: string;
}): Promise<MarketData> {
  const [companyRows, salaryRows, layoffRows] = await Promise.all([
    db.select().from(companySignalsTable).where(isNotNull(companySignalsTable.sourceUrl)).orderBy(desc(companySignalsTable.observedAt)).limit(100),
    role && city
      ? db.select().from(salaryBenchmarksTable).where(and(ilike(salaryBenchmarksTable.role, `%${role}%`), ilike(salaryBenchmarksTable.city, `%${city}%`), isNotNull(salaryBenchmarksTable.sourceUrl))).limit(5)
      : Promise.resolve([]),
    currentCompany
      ? db.select().from(layoffSignalsTable).where(and(or(ilike(layoffSignalsTable.company, `%${currentCompany}%`), ilike(layoffSignalsTable.signal, `%${currentCompany}%`)), isNotNull(layoffSignalsTable.sourceUrl))).orderBy(desc(layoffSignalsTable.observedAt)).limit(3)
      : Promise.resolve([]),
  ]);
  return {
    companyRows: companyRows.filter((row) => canUseCompanySignal(row)),
    salaryRows: salaryRows.filter((row) => canUseSalaryBenchmark(row)),
    layoffRows: layoffRows.filter((row) => canUseLayoffSignal(row)),
  };
}

const uploadResume: RequestHandler = (req, res, next) => {
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxResumeBytes, files: 1, fields: 4, fieldSize: 500 },
  }).single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "Resume must be 5 MB or smaller." });
      return;
    }
    res.status(400).json({ error: "Invalid resume upload." });
  });
};

export function createResumeIntelligenceRouter(options: {
  loadMarketData?: MarketDataLoader;
  getAuthenticatedUserId?: (
    req: Parameters<RequestHandler>[0],
  ) => string | null | undefined;
  enableResumeProcessing?: boolean;
  extractResumeText?: typeof extractText;
} = {}): IRouter {
  const router: IRouter = Router();
  if (process.env.NODE_ENV === "production" || !options.enableResumeProcessing) {
    router.post("/resume/intelligence", (_req, res) => {
      res.status(404).json({ error: "Resume processing is not available." });
    });
    return router;
  }

  const requestWindows = new Map<string, { count: number; startedAt: number }>();
  const loadMarket = options.loadMarketData ?? loadMarketData;
  const extractResume = options.extractResumeText ?? extractText;

  const requireAuthenticatedUser: RequestHandler = (req, res, next) => {
    let userId: string | null | undefined;
    try {
      userId = options.getAuthenticatedUserId
        ? options.getAuthenticatedUserId(req)
        : getAuth(req).userId;
    } catch {
      userId = undefined;
    }
    if (!userId) {
      res.status(401).json({ error: "Sign in before processing a resume." });
      return;
    }
    res.locals.resumeUserId = userId;
    next();
  };

  const requireExplicitConsent: RequestHandler = (req, res, next) => {
    if (req.get("x-resume-intelligence-consent") !== "accepted-v1") {
      res.status(428).json({
        error: "Confirm the resume processing notice before uploading.",
      });
      return;
    }
    next();
  };

  function consumeRateLimit(userId: string): boolean {
    const now = Date.now();
    const key = `user:${userId}`;
    const previous = requestWindows.get(key);
    if (!previous || now - previous.startedAt >= processingWindowMs) {
      requestWindows.set(key, { count: 1, startedAt: now });
      return true;
    }
    if (previous.count >= maxRequestsPerWindow) return false;
    previous.count += 1;
    return true;
  }

  const enforceResumeRateLimit: RequestHandler = (_req, res, next) => {
    const userId = res.locals.resumeUserId as string;
    if (!consumeRateLimit(userId)) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "Resume processing limit reached. Try again later." });
      return;
    }
    next();
  };

  const processResume: RequestHandler = async (req, res, next) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Attach a PDF or DOCX resume to continue." });
      return;
    }

    try {
      const { text, fileType } = await extractResume(file);
      if (text.length < 80) {
        res.status(422).json({ error: "We could not find enough readable text in this resume. Try another export." });
        return;
      }

      const role = stringField(req.body.role, 160);
      const city = stringField(req.body.city, 120);
      const target = stringField(req.body.target, 160);
      const currentCompany = stringField(req.body.currentCompany, 160);
      const { companyRows, salaryRows, layoffRows } = await loadMarket({
        role,
        city,
        currentCompany,
      });

      const knownEmployers = companyRows.map((row) => row.name);
      const skills = parseSkills(text);
      const employers = parseResumeEmployers(text, knownEmployers);
      const matchedCompany = currentCompany
        ? companyRows.find((row) => row.name.toLocaleLowerCase().includes(currentCompany.toLocaleLowerCase()))
        : employers.map((item) => companyRows.find((row) => row.name.toLocaleLowerCase() === item.name.toLocaleLowerCase())).find(Boolean);
      const salary = salaryRows[0];
      const latestRefresh = [matchedCompany?.refreshedAt, salary?.refreshedAt, layoffRows[0]?.refreshedAt].filter(Boolean).sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] ?? new Date();
      const skillNames = skills.slice(0, 3).map((skill) => skill.name).join(", ") || "the capabilities shown in your resume";
      const targetRole = target || role || "your next role";
      const sources = [
      {
        label: "Resume evidence",
        source: "User-provided resume; not independently verified",
        refreshedAt: new Date(),
        confidence: employers.length || skills.length ? "Mixed" as const : "Low" as const,
      },
      ...(matchedCompany ? [{
        label: "Live company signal",
        source: matchedCompany.source,
        refreshedAt: matchedCompany.refreshedAt,
        confidence: matchedCompany.confidence,
      }] : []),
      ...(salary ? [{
        label: "Live salary benchmark",
        source: salary.source,
        refreshedAt: salary.refreshedAt,
        confidence: salary.confidence,
      }] : []),
      ...(layoffRows[0] ? [{
        label: "Related market reporting",
        source: layoffRows[0].source,
        refreshedAt: layoffRows[0].refreshedAt,
        confidence: layoffRows[0].confidence,
      }] : []),
      ];

      const response = {
      status: "ready" as const,
      fileName: file.originalname.slice(0, 180),
      fileType,
      processedAt: new Date(),
      extractedCharacters: text.length,
      skills,
      employers,
      progression: `Your resume points to ${skillNames}. For ${targetRole}, make the next move legible through one outcome that shows broader ownership, not just more tools.`,
      relatedNews: layoffRows[0]?.signal ?? (matchedCompany ? `${matchedCompany.name}: ${matchedCompany.signal}` : "No current company-specific reporting matched this resume. Treat the absence of a signal as unknown, not as proof of safety."),
      marketSummary: salary
        ? `${role} roles in ${city} currently show a directional benchmark of ₹${salary.p25}L–₹${salary.p75}L, with a median near ₹${salary.median}L.`
        : matchedCompany
          ? `${matchedCompany.name} is showing ${matchedCompany.momentum.toLocaleLowerCase()} momentum for the public signals we currently track.`
          : "No matching live benchmark was available for this profile yet; keep this readout directional.",
      jobMatches: companyRows
        .filter((row) => row.name.toLocaleLowerCase() !== currentCompany.toLocaleLowerCase())
        .slice(0, 3)
        .map((row) => ({
          company: row.name,
          role: targetRole,
          reason: `${skillNames} aligns with this company's tracked ${row.sector.toLocaleLowerCase()} signal.`,
          confidence: "Directional" as const,
        })),
      sources,
      qualityNotes: [
        "Resume claims are user-provided and were not independently verified.",
        ...(sources.length === 1 ? ["No matching live market row was available; related intelligence is limited."] : []),
        `Live context last refreshed ${latestRefresh.toISOString()}.`,
      ],
      };

      res.json(ProcessResumeIntelligenceResponse.parse(response));
    } catch (error) {
      if (error instanceof Error && error.name === "UnsupportedResumeFormat") {
        res.status(415).json({ error: "Only PDF and DOCX resumes are supported." });
        return;
      }
      req.log?.warn({ requestId: req.id, errorType: safeOperationalErrorType(error) }, "Resume processing failed");
      res.status(422).json({ error: "We could not read this resume. Try exporting it again as a PDF or DOCX." });
    } finally {
      file.buffer.fill(0);
    }
  };

  router.post(
    "/resume/intelligence",
    requireAuthenticatedUser,
    requireExplicitConsent,
    enforceResumeRateLimit,
    uploadResume,
    processResume,
  );

  return router;
}

const router = createResumeIntelligenceRouter();
export default router;
