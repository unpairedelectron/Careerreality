import { getAuth } from "@clerk/express";
import {
  CreateSavedDecisionBody,
  CreateSavedDecisionResponse,
  CreateWatchlistItemBody,
  CreateWatchlistItemResponse,
  DeleteSavedDecisionParams,
  DeleteWatchlistItemParams,
  GetWorkspaceSummaryResponse,
  ListSavedDecisionsResponse,
  ListWatchlistResponse,
} from "@workspace/api-zod";
import {
  db,
  savedCareerDecisionsTable,
  companyWatchlistItemsTable,
} from "@workspace/db";
import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";

const router: IRouter = Router();

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

const requireUser: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

function currentUserId(req: Parameters<RequestHandler>[0]): string {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new Error("Authenticated user was not available");
  }
  return userId;
}

router.use(requireUser);

router.get("/workspace/summary", async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const [[savedDecisionCount], [watchlistCount], latestDecision, latestWatchlistItem] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(savedCareerDecisionsTable)
          .where(eq(savedCareerDecisionsTable.userId, userId)),
        db
          .select({ value: count() })
          .from(companyWatchlistItemsTable)
          .where(eq(companyWatchlistItemsTable.userId, userId)),
        db
          .select()
          .from(savedCareerDecisionsTable)
          .where(eq(savedCareerDecisionsTable.userId, userId))
          .orderBy(desc(savedCareerDecisionsTable.createdAt))
          .limit(1),
        db
          .select()
          .from(companyWatchlistItemsTable)
          .where(eq(companyWatchlistItemsTable.userId, userId))
          .orderBy(desc(companyWatchlistItemsTable.createdAt))
          .limit(1),
      ]);

    res.json(
      GetWorkspaceSummaryResponse.parse({
        savedDecisionCount: savedDecisionCount?.value ?? 0,
        watchlistCount: watchlistCount?.value ?? 0,
        latestDecision: latestDecision[0] ?? null,
        latestWatchlistItem: latestWatchlistItem[0] ?? null,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/saved-decisions", async (req, res, next) => {
  try {
    const decisions = await db
      .select()
      .from(savedCareerDecisionsTable)
      .where(eq(savedCareerDecisionsTable.userId, currentUserId(req)))
      .orderBy(desc(savedCareerDecisionsTable.createdAt));
    res.json(ListSavedDecisionsResponse.parse(decisions));
  } catch (error) {
    next(error);
  }
});

router.post("/saved-decisions", async (req, res, next) => {
  const input = CreateSavedDecisionBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid saved decision" });
    return;
  }
  try {
    const [decision] = await db
      .insert(savedCareerDecisionsTable)
      .values({ ...input.data, userId: currentUserId(req) })
      .returning();
    res.status(201).json(CreateSavedDecisionResponse.parse(decision));
  } catch (error) {
    next(error);
  }
});

router.delete("/saved-decisions/:id", async (req, res, next) => {
  const params = DeleteSavedDecisionParams.safeParse(req.params);
  if (!params.success || !params.data.id) {
    res.status(400).json({ error: "Invalid saved decision id" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(savedCareerDecisionsTable)
      .where(
        and(
          eq(savedCareerDecisionsTable.id, params.data.id),
          eq(savedCareerDecisionsTable.userId, currentUserId(req)),
        ),
      )
      .returning({ id: savedCareerDecisionsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Saved decision not found" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/watchlist", async (req, res, next) => {
  try {
    const items = await db
      .select()
      .from(companyWatchlistItemsTable)
      .where(eq(companyWatchlistItemsTable.userId, currentUserId(req)))
      .orderBy(desc(companyWatchlistItemsTable.createdAt));
    res.json(ListWatchlistResponse.parse(items));
  } catch (error) {
    next(error);
  }
});

router.post("/watchlist", async (req, res, next) => {
  const input = CreateWatchlistItemBody.safeParse(req.body);
  const company = input.success
    ? input.data.company.trim().toLocaleLowerCase()
    : "";
  if (!input.success || !company) {
    res.status(400).json({ error: "Invalid watchlist item" });
    return;
  }
  try {
    const [item] = await db
      .insert(companyWatchlistItemsTable)
      .values({ ...input.data, company, userId: currentUserId(req) })
      .returning();
    res.status(201).json(CreateWatchlistItemResponse.parse(item));
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      res.status(409).json({ error: "Company is already on your watchlist" });
      return;
    }
    next(error);
  }
});

router.delete("/watchlist/:id", async (req, res, next) => {
  const params = DeleteWatchlistItemParams.safeParse(req.params);
  if (!params.success || !params.data.id) {
    res.status(400).json({ error: "Invalid watchlist item id" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(companyWatchlistItemsTable)
      .where(
        and(
          eq(companyWatchlistItemsTable.id, params.data.id),
          eq(companyWatchlistItemsTable.userId, currentUserId(req)),
        ),
      )
      .returning({ id: companyWatchlistItemsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Watchlist item not found" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;