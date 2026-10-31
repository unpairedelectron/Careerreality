import { clerkClient, getAuth } from "@clerk/express";
import {
  ListCatalogSuggestionsQueryParams,
  ListCatalogSuggestionsResponse,
  ListPublicCareerCatalogQueryParams,
  ListPublicCareerCatalogResponse,
  ReviewCatalogSuggestionBody,
  ReviewCatalogSuggestionParams,
  ReviewCatalogSuggestionResponse,
  CheckReadinessDeskAccessResponse,
  GetReadinessDeskDataResponse,
} from "@workspace/api-zod";
import { applicationReadiness } from "../../../career-reality/src/data/application-readiness";
import { careerCatalogSuggestionsTable, db } from "@workspace/db";
import { and, desc, eq, ne, type SQL } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function configuredEditorIds(): Set<string> {
  return new Set(
    (process.env.CATALOG_EDITOR_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

async function hasCatalogEditorAccess(userId: string): Promise<boolean> {
  if (configuredEditorIds().has(userId)) return true;

  const user = await clerkClient.users.getUser(userId);
  const metadata = user.publicMetadata as Record<string, unknown>;
  return (
    metadata.catalogEditor === true ||
    metadata.role === "editor" ||
    metadata.role === "admin"
  );
}

const requireCatalogEditor: RequestHandler = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    if (!(await hasCatalogEditorAccess(userId))) {
      res.status(403).json({ error: "Catalog editor access required" });
      return;
    }
    next();
  } catch (error) {
    logger.error(
      { requestId: req.id, userId, errorType: error instanceof Error ? error.name : "UnknownError" },
      "Catalog editor authorization failed",
    );
    res.status(403).json({ error: "Catalog editor access required" });
  }
};

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function cleanReviewNote(value: string | undefined): string | null {
  if (!value) return null;
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

router.get("/public/career-catalog", async (req, res, next) => {
  try {
    const parsed = ListPublicCareerCatalogQueryParams.safeParse({
      entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid catalog filter" });
      return;
    }

    const conditions: SQL<unknown>[] = [
      eq(careerCatalogSuggestionsTable.moderationStatus, "approved"),
    ];
    if (parsed.data.entityType) {
      conditions.push(eq(careerCatalogSuggestionsTable.entityType, parsed.data.entityType));
    }

    const rows = await db
      .select({
        id: careerCatalogSuggestionsTable.id,
        entityType: careerCatalogSuggestionsTable.entityType,
        name: careerCatalogSuggestionsTable.name,
        sector: careerCatalogSuggestionsTable.sector,
        jobFunction: careerCatalogSuggestionsTable.jobFunction,
        approvedAt: careerCatalogSuggestionsTable.reviewedAt,
      })
      .from(careerCatalogSuggestionsTable)
      .where(and(...conditions))
      .orderBy(careerCatalogSuggestionsTable.entityType, careerCatalogSuggestionsTable.name)
      .limit(200);

    res.json(
      ListPublicCareerCatalogResponse.parse({
        data: rows.filter((row) => row.approvedAt !== null),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/workspace/readiness-access", requireCatalogEditor, (_req, res): void => {
  res.json(CheckReadinessDeskAccessResponse.parse({ authorized: true }));
});

router.get("/workspace/readiness-data", requireCatalogEditor, (_req, res): void => {
  res.json(GetReadinessDeskDataResponse.parse({ records: JSON.stringify(applicationReadiness) }));
});

router.use("/workspace/catalog-suggestions", requireCatalogEditor);

router.get("/workspace/catalog-suggestions", async (req, res, next) => {
  try {
    const parsed = ListCatalogSuggestionsQueryParams.safeParse({
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid catalog suggestion filter" });
      return;
    }

    const rows = await db
      .select()
      .from(careerCatalogSuggestionsTable)
      .where(eq(careerCatalogSuggestionsTable.moderationStatus, parsed.data.status ?? "pending"))
      .orderBy(desc(careerCatalogSuggestionsTable.createdAt))
      .limit(parsed.data.limit ?? 50);

    res.json(ListCatalogSuggestionsResponse.parse({ data: rows }));
  } catch (error) {
    next(error);
  }
});

router.patch("/workspace/catalog-suggestions/:id", async (req, res, next) => {
  const params = ReviewCatalogSuggestionParams.safeParse(req.params);
  const input = ReviewCatalogSuggestionBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({ error: "Invalid catalog review" });
    return;
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [existing] = await db
      .select()
      .from(careerCatalogSuggestionsTable)
      .where(eq(careerCatalogSuggestionsTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Catalog suggestion not found" });
      return;
    }

    if (input.data.moderationStatus === "approved") {
      const [duplicate] = await db
        .select({ id: careerCatalogSuggestionsTable.id })
        .from(careerCatalogSuggestionsTable)
        .where(
          and(
            eq(careerCatalogSuggestionsTable.entityType, existing.entityType),
            eq(careerCatalogSuggestionsTable.normalizedName, existing.normalizedName),
            eq(careerCatalogSuggestionsTable.moderationStatus, "approved"),
            ne(careerCatalogSuggestionsTable.id, params.data.id),
          ),
        )
        .limit(1);
      if (duplicate) {
        res.status(409).json({ error: "An approved catalog entry with the same name already exists" });
        return;
      }
    }

    const [updated] = await db
      .update(careerCatalogSuggestionsTable)
      .set({
        moderationStatus: input.data.moderationStatus,
        reviewedAt: new Date(),
        reviewedByUserId: userId,
        reviewNote: cleanReviewNote(input.data.reviewNote),
      })
      .where(eq(careerCatalogSuggestionsTable.id, params.data.id))
      .returning();

    res.json(ReviewCatalogSuggestionResponse.parse(updated));
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      res.status(409).json({ error: "An approved catalog entry with the same name already exists" });
      return;
    }
    next(error);
  }
});

export default router;