import pino from "pino";

export const operationalLogRedactions = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "req.body",
  "req.query",
  "req.params",
  "*.password",
  "*.token",
  "*.secret",
];

export function createLoggerOptions(isProduction = process.env.NODE_ENV === "production") {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    redact: operationalLogRedactions,
    ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
  };
}

export function serializeRequestLog(req: { id?: string | number; method?: string; url?: string }) {
  return {
    id: req.id,
    method: req.method,
    url: req.url?.split("?")[0],
  };
}

export function serializeResponseLog(res: { statusCode: number }) {
  return { statusCode: res.statusCode };
}

export function safeOperationalErrorType(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return /^[A-Za-z][A-Za-z0-9]{0,63}$/u.test(name) ? name : "UnknownError";
}

export const logger = pino(createLoggerOptions());
