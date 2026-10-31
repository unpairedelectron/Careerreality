import app from "./app";
import { logger } from "./lib/logger";
import {
  PublicSignalSeedProvenanceError,
  seedPublicSignalData,
} from "./lib/seed-public-data";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (process.env.NODE_ENV === "production") {
  for (const key of ["DATABASE_URL", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"]) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required in production`);
    }
  }
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

void seedPublicSignalData().catch((error) => {
  if (error instanceof PublicSignalSeedProvenanceError) {
    logger.warn(
      {
        errorType: error.name,
        reason: "incomplete_reviewed_provenance",
        incompleteCounts: error.incompleteCounts,
      },
      "Public signal seed was blocked before writes; public dataset endpoints remain evidence-filtered",
    );
    return;
  }
  logger.warn(
    { errorType: error instanceof Error ? error.name : "UnknownError" },
    "Public signal seed did not complete; public dataset endpoints remain evidence-filtered",
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
