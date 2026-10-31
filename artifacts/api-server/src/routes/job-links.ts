import { Router, type IRouter } from "express";
import { FetchPublicJobLinkBody, FetchPublicJobLinkResponse } from "@workspace/api-zod";
import { fetchPublicJobPage, JobLinkFetchError } from "../lib/safe-job-link-fetch";
import { consumeReportRateLimit } from "../lib/report-rate-limiter";

const router: IRouter = Router();
const jobLinkFetchRateLimitScope = "public-job-link-fetch";
const rateLimitUnavailableRetryAfterSeconds = 60;

export function jobLinkFetchEnabled(): boolean {
  if (process.env.JOB_LINK_FETCH_ENABLED !== "true") return false;
  return process.env.NODE_ENV !== "production" || process.env.JOB_LINK_FETCH_PRODUCTION_READY === "true";
}

export function createJobLinksRouter(options: {
  enabled?: boolean;
  fetchPage?: typeof fetchPublicJobPage;
  consumeRateLimit?: typeof consumeReportRateLimit;
} = {}): IRouter {
  const route = Router();
  route.post("/public/job-links/fetch", async (req, res): Promise<void> => {
    if (!(options.enabled ?? jobLinkFetchEnabled())) {
      res.status(503).json({ error: "Job-link fetching is not enabled." });
      return;
    }
    const input = FetchPublicJobLinkBody.safeParse(req.body);
    if (!input.success || input.data.consent !== true) {
      res.status(400).json({ error: "A valid job URL and explicit consent are required." });
      return;
    }

    let rateLimit;
    try {
      rateLimit = await (options.consumeRateLimit ?? consumeReportRateLimit)({
        scope: jobLinkFetchRateLimitScope,
        ip: req.ip,
      });
    } catch {
      res.setHeader("Retry-After", String(rateLimitUnavailableRetryAfterSeconds));
      res.status(503).json({ error: "Job-page fetching is temporarily unavailable. Try again later." });
      return;
    }
    if (rateLimit.limited) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({ error: "Too many job-page fetches. Try again later." });
      return;
    }

    try {
      const result = await (options.fetchPage ?? fetchPublicJobPage)(input.data.url);
      res.setHeader("Cache-Control", "no-store, private");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.json(FetchPublicJobLinkResponse.parse(result));
    } catch (error) {
      if (error instanceof JobLinkFetchError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(502).json({ error: "The job page could not be fetched." });
    }
  });
  return route;
}

export default createJobLinksRouter();
