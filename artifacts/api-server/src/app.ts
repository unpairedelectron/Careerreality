import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger, safeOperationalErrorType, serializeRequestLog, serializeResponseLog } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

function configuredOrigins(): Set<string> {
  const values = [
    process.env.CORS_ORIGINS,
    process.env.SITE_URL,
    process.env.VITE_SITE_URL,
    process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : undefined,
    process.env.REPLIT_EXPO_DEV_DOMAIN
      ? `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`
      : undefined,
    "https://careerreality.in",
    "https://www.careerreality.in",
    "https://indigo-bowed-megabyte.replit.app",
  ]
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (!isProduction) {
    values.push("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173");
  }

  return new Set(values);
}

const allowedOrigins = configuredOrigins();

function requestOrigin(req: Parameters<import("express").RequestHandler>[0]): string | undefined {
  const origin = req.get("origin");
  if (origin) return origin.replace(/\/+$/, "");
  const referer = req.get("referer");
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

function csrfProtection(req: Parameters<import("express").RequestHandler>[0], res: Parameters<import("express").RequestHandler>[1], next: Parameters<import("express").RequestHandler>[2]) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || !req.path.startsWith("/api/")) {
    next();
    return;
  }

  // Bearer-token clients are not relying on a browser cookie and are allowed
  // to omit browser origin headers. Cookie-authenticated mutations must prove
  // that the request originated from one of our known web origins.
  if (/^Bearer\s+/i.test(req.get("authorization") ?? "")) {
    next();
    return;
  }

  const origin = requestOrigin(req);
  if (!origin || !allowedOrigins.has(origin)) {
    res.status(403).json({ error: "Request origin is not allowed" });
    return;
  }
  next();
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req: serializeRequestLog,
      res: serializeResponseLog,
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed"));
    },
  }),
);
app.use(express.json({ limit: "32kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "8kb" }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
app.use(csrfProtection);

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (isProduction) {
    logger.error(
      {
        errorType: safeOperationalErrorType(error),
        requestId: req.id,
        method: req.method,
        path: req.path,
      },
      "Unhandled request error",
    );
  } else {
    logger.error({ err: error, requestId: req.id }, "Unhandled request error");
  }
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: "Internal server error", requestId: req.id });
};

app.use(errorHandler);

export default app;
