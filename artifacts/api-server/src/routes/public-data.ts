import {
  CreateCareerCatalogSuggestionBody,
  CreateCareerCatalogSuggestionResponse,
  CreateLayoffSignalReportBody,
  CreateLayoffSignalReportResponse,
  GetPublicCompanySignalResponse,
  GetPublicCompanySignalParams,
  ListLayoffSignalsQueryParams,
  ListLayoffSignalsResponse,
  ListPublicCompanySignalsQueryParams,
  ListPublicCompanySignalsResponse,
  ListSalaryBenchmarksQueryParams,
  ListSalaryBenchmarksResponse,
} from "@workspace/api-zod";
import {
  careerCatalogSuggestionsTable,
  db,
  companySignalsTable,
  layoffSignalSubmissionsTable,
  layoffSignalsTable,
  salaryBenchmarksTable,
  type PublicDataProvenance,
  type CompanySignal,
  type LayoffSignal,
  type SalaryBenchmark,
} from "@workspace/db";
import { getAuth } from "@clerk/express";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { companyDatasetMeta, companyQualityNotes } from "../lib/company-data-publication";
import {
  canPublishMarketSignal,
  canUseCompanySignal,
  canUseLayoffSignal,
  canUseSalaryBenchmark,
  publicProvenance,
} from "../lib/public-evidence";
import {
  consumeReportRateLimit,
  ReportRateLimitUnavailableError,
} from "../lib/report-rate-limiter";

const router: IRouter = Router();
const reportRateLimitUnavailableRetryAfterSeconds = 60;

function redactSensitiveText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted contact]")
    .replace(/\bhttps?:\/\/\S+\b/gi, "[redacted link]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[redacted phone]")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCatalogName(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, 160);
}

function parseQuery<T extends Record<string, unknown>>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
  value: T,
  res: Parameters<import("express").RequestHandler>[1],
): T | null {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return null;
  }
  return parsed.data;
}

function stringQuery(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : undefined;
}

function hasInvalidQueryValue(...values: unknown[]): boolean {
  return values.some((value) => value !== undefined && typeof value !== "string");
}

const datasetMeta = {
  salary: {
    dataset: "salary_benchmarks",
    source: "Each published record includes its source type, dates, and reviewed provenance.",
    methodology:
      "Only complete, reviewed records are published. Estimated values carry an explicit ESTIMATED provenance status.",
    confidence: "Low" as const,
  },
  companies: companyDatasetMeta,
  layoffs: {
    dataset: "layoff_signals",
    source: "Each published record includes its source type, dates, and reviewed provenance.",
    methodology:
      "A dated signal is a report to verify, not confirmation of workforce change. Only complete, reviewed provenance is published.",
    confidence: "Low" as const,
  },
};

type PublicDatasetKey = keyof typeof datasetMeta;

function validDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function latestSourceRetrievedAt(
  rows: Array<{ provenance: PublicDataProvenance | null }>,
): Date | null {
  const dates = rows.flatMap((row) => {
    const retrievedDate = row.provenance?.retrievedDate;
    if (!retrievedDate) return [];
    const date = new Date(`${retrievedDate}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? [] : [date];
  });
  return dates.length
    ? dates.reduce((latest, date) => (date > latest ? date : latest), dates[0])
    : null;
}

function qualityMeta(
  dataset: PublicDatasetKey,
  latestRetrievedAt: Date | null,
  sampleSize: number,
  rejectedRows = 0,
) {
  if (dataset === "companies") {
    return {
      ...datasetMeta.companies,
      refreshedAt: latestRetrievedAt,
      sampleSize,
      coverage:
        rejectedRows > 0
          ? ("partial" as const)
          : sampleSize === 0
            ? ("empty" as const)
            : ("complete" as const),
      qualityNotes: companyQualityNotes(sampleSize, rejectedRows),
    };
  }
  const qualityNotes = [
    ...(rejectedRows
      ? [`${rejectedRows} row${rejectedRows === 1 ? "" : "s"} omitted because source citations, reviewed provenance, or required fields failed validation.`]
      : []),
    ...(sampleSize === 0
      ? ["No qualifying records are available; legacy, unverified, or incomplete-provenance rows are withheld."]
      : []),
  ];
  return {
    ...datasetMeta[dataset],
    refreshedAt: latestRetrievedAt,
    sampleSize,
    coverage:
      rejectedRows > 0
        ? ("partial" as const)
        : sampleSize === 0
          ? ("empty" as const)
          : ("complete" as const),
    qualityNotes,
  };
}

function cleanSalaryRows(rows: SalaryBenchmark[]): {
  rows: SalaryBenchmark[];
  rejectedRows: number;
} {
  const validRows = rows.filter((row) =>
    canUseSalaryBenchmark(row) &&
    Number.isFinite(row.p25) &&
    Number.isFinite(row.median) &&
    Number.isFinite(row.p75) &&
    row.p25 >= 0 &&
    row.p25 <= row.median &&
    row.median <= row.p75 &&
    Number.isInteger(row.sampleSize) &&
    row.sampleSize > 0 &&
    row.role.trim() &&
    row.city.trim() &&
    row.experienceBand.trim() &&
    row.source.trim() &&
    validDate(row.observedAt) &&
    validDate(row.refreshedAt),
  );
  return { rows: validRows, rejectedRows: rows.length - validRows.length };
}

function cleanCompanyRows(rows: CompanySignal[]): {
  rows: CompanySignal[];
  rejectedRows: number;
} {
  const validRows = rows.filter((row) =>
    canUseCompanySignal(row) &&
    row.slug.trim() &&
    row.name.trim() &&
    row.sector.trim() &&
    row.signal.trim() &&
    row.source.trim() &&
    Number.isFinite(row.stability) &&
    row.stability >= 0 &&
    row.stability <= 100 &&
    validDate(row.observedAt) &&
    validDate(row.refreshedAt),
  );
  return { rows: validRows, rejectedRows: rows.length - validRows.length };
}

function cleanLayoffRows(rows: LayoffSignal[]): {
  rows: LayoffSignal[];
  rejectedRows: number;
} {
  const validRows = rows.filter((row) =>
    canUseLayoffSignal(row) &&
    row.company.trim() &&
    row.signal.trim() &&
    row.type.trim() &&
    row.source.trim() &&
    validDate(row.observedAt) &&
    validDate(row.refreshedAt),
  );
  return { rows: validRows, rejectedRows: rows.length - validRows.length };
}

function withoutPrivateReviewer<T extends { provenance: PublicDataProvenance | null }>(
  row: T,
) {
  return { ...row, provenance: publicProvenance(row.provenance) };
}

router.get("/public/salary-benchmarks", async (req, res, next) => {
  try {
    const conditions: SQL<unknown>[] = [];
    if (hasInvalidQueryValue(req.query.role, req.query.city, req.query.experienceBand)) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const query = parseQuery(
      ListSalaryBenchmarksQueryParams,
      {
        role: stringQuery(req.query.role),
        city: stringQuery(req.query.city),
        experienceBand: stringQuery(req.query.experienceBand),
      },
      res,
    );
    if (!query) return;
    const role = query.role?.trim() ?? "";
    const city = query.city?.trim() ?? "";
    const experienceBand = query.experienceBand?.trim() ?? "";

    if (role) conditions.push(eq(salaryBenchmarksTable.role, role));
    if (city) conditions.push(eq(salaryBenchmarksTable.city, city));
    if (experienceBand) {
      conditions.push(
        eq(salaryBenchmarksTable.experienceBand, experienceBand),
      );
    }

    const rawRows = await db
      .select()
      .from(salaryBenchmarksTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        salaryBenchmarksTable.role,
        salaryBenchmarksTable.city,
        salaryBenchmarksTable.experienceBand,
      )
      .limit(100);
    const { rows, rejectedRows } = cleanSalaryRows(rawRows);

    const latestRetrievedAt = latestSourceRetrievedAt(rows);

    res.json(
      ListSalaryBenchmarksResponse.parse({
        data: rows.map(withoutPrivateReviewer),
        meta: qualityMeta(
          "salary",
          latestRetrievedAt,
          rows.reduce((total, row) => total + row.sampleSize, 0),
          rejectedRows,
        ),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/public/companies", async (req, res, next) => {
  try {
    if (hasInvalidQueryValue(req.query.query)) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const queryInput = parseQuery(
      ListPublicCompanySignalsQueryParams,
      { query: stringQuery(req.query.query) },
      res,
    );
    if (!queryInput) return;
    const query = queryInput.query?.trim() ?? "";
    const escapedQuery = query.replace(/[%_]/g, "\\$&");
    const where = query
      ? or(
          ilike(companySignalsTable.name, `%${escapedQuery}%`),
          ilike(companySignalsTable.sector, `%${escapedQuery}%`),
        )
      : undefined;
    const rawRows = await db
      .select()
      .from(companySignalsTable)
      .where(where)
      .orderBy(desc(companySignalsTable.observedAt))
      .limit(100);
    const { rows, rejectedRows } = cleanCompanyRows(rawRows);

    const latestRetrievedAt = latestSourceRetrievedAt(rows);

    res.json(
      ListPublicCompanySignalsResponse.parse({
        data: rows.map(withoutPrivateReviewer),
        meta: qualityMeta("companies", latestRetrievedAt, rows.length, rejectedRows),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/public/companies/:slug", async (req, res, next) => {
  try {
    const params = GetPublicCompanySignalParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid company slug" });
      return;
    }
    const [rawRow] = await db
      .select()
      .from(companySignalsTable)
      .where(eq(companySignalsTable.slug, params.data.slug))
      .limit(1);

    const row = rawRow && cleanCompanyRows([rawRow]).rows[0];
    if (!row) {
      res.status(404).json({ error: "Company signal not found" });
      return;
    }

    res.json(
      GetPublicCompanySignalResponse.parse({
          data: withoutPrivateReviewer(row),
        meta: {
          ...qualityMeta("companies", latestSourceRetrievedAt([row]), 1),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/public/layoff-signals", async (req, res, next) => {
  try {
    if (hasInvalidQueryValue(req.query.query, req.query.type)) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const conditions: SQL<unknown>[] = [];
    const queryInput = parseQuery(
      ListLayoffSignalsQueryParams,
      {
        query: stringQuery(req.query.query),
        type: stringQuery(req.query.type) as
          | "Layoff"
          | "Hiring freeze"
          | "Hiring signal"
          | "Restructure"
          | undefined,
      },
      res,
    );
    if (!queryInput) return;
    const query = queryInput.query?.trim() ?? "";
    const type = queryInput.type?.trim() ?? "";
    const escapedQuery = query.replace(/[%_]/g, "\\$&");

    if (query) {
      conditions.push(
        or(
          ilike(layoffSignalsTable.company, `%${escapedQuery}%`),
          ilike(layoffSignalsTable.signal, `%${escapedQuery}%`),
        )!,
      );
    }
    if (
      type === "Layoff" ||
      type === "Hiring freeze" ||
      type === "Hiring signal" ||
      type === "Restructure"
    ) {
      conditions.push(eq(layoffSignalsTable.type, type));
    }

    const rawRows = await db
      .select()
      .from(layoffSignalsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(layoffSignalsTable.observedAt))
      .limit(100);
    const { rows, rejectedRows } = cleanLayoffRows(rawRows);
    const latestRetrievedAt = latestSourceRetrievedAt(rows);

    res.json(
      ListLayoffSignalsResponse.parse({
        data: rows.map(withoutPrivateReviewer),
        meta: qualityMeta("layoffs", latestRetrievedAt, rows.length, rejectedRows),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/public/layoff-signal-reports", async (req, res, next) => {
  const input = CreateLayoffSignalReportBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid signal report" });
    return;
  }
  const company = redactSensitiveText(input.data.company);
  const description = redactSensitiveText(input.data.description);
  if (company.length < 2 || description.length < 15) {
    res.status(400).json({ error: "Report is too short after privacy redaction" });
    return;
  }

  try {
    const { userId } = getAuth(req);
    let rateLimit;
    try {
      rateLimit = await consumeReportRateLimit({
        userId,
        ip: req.ip,
      });
    } catch (error) {
      if (!(error instanceof ReportRateLimitUnavailableError)) throw error;
      logger.warn(
        {
          requestId: req.id,
          errorType: error.name,
        },
        "Report rate limiter unavailable",
      );
      res.setHeader(
        "Retry-After",
        String(reportRateLimitUnavailableRetryAfterSeconds),
      );
      res.status(503).json({
        error: "Report submissions are temporarily unavailable. Try again later.",
      });
      return;
    }
    if (rateLimit.limited) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({ error: "Too many reports. Try again later." });
      return;
    }

    await db.insert(layoffSignalSubmissionsTable).values({
      company,
      description,
      confidence: input.data.confidence,
      submittedByUserId: userId ?? null,
      moderationStatus: "pending",
    });
    res.status(201).json(
      CreateLayoffSignalReportResponse.parse({
        status: "pending_review",
        message: "Your report is queued for review. It will only become public if approved.",
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/public/career-catalog-suggestions", async (req, res, next) => {
  const input = CreateCareerCatalogSuggestionBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid catalog suggestion" });
    return;
  }

  const companyName = redactSensitiveText(input.data.companyName ?? "");
  const positionTitle = redactSensitiveText(input.data.positionTitle ?? "");
  const acceptedEntities = [
    companyName ? "company" : null,
    positionTitle ? "position" : null,
  ].filter((value): value is "company" | "position" => value !== null);

  if (!acceptedEntities.length) {
    res.status(400).json({ error: "Add a company name, a position title, or both." });
    return;
  }
  if (companyName && companyName.length < 2) {
    res.status(400).json({ error: "Company name is too short after privacy redaction." });
    return;
  }
  if (positionTitle && positionTitle.length < 2) {
    res.status(400).json({ error: "Position title is too short after privacy redaction." });
    return;
  }

  const sector = redactSensitiveText(input.data.sector);
  const jobFunction = redactSensitiveText(input.data.jobFunction);
  if (sector.length < 2 || jobFunction.length < 2) {
    res.status(400).json({ error: "Choose a sector and job function." });
    return;
  }

  try {
    const { userId } = getAuth(req);
    let rateLimit;
    try {
      rateLimit = await consumeReportRateLimit({
        userId,
        ip: req.ip,
      });
    } catch (error) {
      if (!(error instanceof ReportRateLimitUnavailableError)) throw error;
      logger.warn(
        { requestId: req.id, errorType: error.name },
        "Catalog suggestion rate limiter unavailable",
      );
      res.setHeader(
        "Retry-After",
        String(reportRateLimitUnavailableRetryAfterSeconds),
      );
      res.status(503).json({
        error: "Suggestion submissions are temporarily unavailable. Try again later.",
      });
      return;
    }
    if (rateLimit.limited) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({ error: "Too many suggestions. Try again later." });
      return;
    }

    const suggestions = [
      companyName
        ? {
            entityType: "company" as const,
            name: companyName,
            normalizedName: normalizeCatalogName(companyName),
          }
        : null,
      positionTitle
        ? {
            entityType: "position" as const,
            name: positionTitle,
            normalizedName: normalizeCatalogName(positionTitle),
          }
        : null,
    ].filter((value): value is NonNullable<typeof value> => value !== null);

    await db.insert(careerCatalogSuggestionsTable).values(
      suggestions.map((suggestion) => ({
        ...suggestion,
        sector,
        jobFunction,
        submittedByUserId: userId ?? null,
        moderationStatus: "pending" as const,
      })),
    );

    res.status(201).json(
      CreateCareerCatalogSuggestionResponse.parse({
        status: "pending_review",
        acceptedEntities,
        message: "Thanks — your suggestion is queued for review before it joins the shared catalog.",
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;