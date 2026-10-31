import { createHash, createHmac, randomBytes } from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";
import {
  ConfirmLayoffAlertSubscriptionBody,
  ConfirmLayoffAlertSubscriptionResponse,
  CreateLayoffAlertSubscriptionBody,
  CreateLayoffAlertSubscriptionResponse,
  UnsubscribeLayoffAlertsQueryParams,
  UnsubscribeLayoffAlertsResponse,
} from "@workspace/api-zod";
import { db, layoffAlertSubscriptionsTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { consumeReportRateLimit, ReportRateLimitUnavailableError } from "../lib/report-rate-limiter";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const siteUrl = (process.env.SITE_URL ?? "https://careerreality.in").replace(/\/+$/, "");

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function token(): string {
  return randomBytes(32).toString("base64url");
}

function unsubscribeToken(emailHash: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for layoff alert unsubscribe links.");
  return createHmac("sha256", secret).update(`layoff-alert-unsubscribe:${emailHash}`).digest("base64url");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  headers?: Record<string, string>;
}): Promise<boolean> {
  const from = process.env.LAYOFF_ALERT_FROM ?? "CareerReality <alerts@careerreality.in>";
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.headers ? { headers: message.headers } : {}),
    }),
  });
  return response.ok;
}

async function allowRequest(req: Request, res: Response): Promise<boolean> {
  try {
    const decision = await consumeReportRateLimit({ ip: req.ip });
    if (decision.limited) {
      res.setHeader("Retry-After", String(decision.retryAfterSeconds));
      res.status(429).json({ error: "Too many requests. Try again later." });
      return false;
    }
    return true;
  } catch {
    res.setHeader("Retry-After", "60");
    res.status(503).json({ error: "The subscription service is temporarily unavailable." });
    return false;
  }
}

router.post("/public/layoff-alerts/subscriptions", async (req, res): Promise<void> => {
  if (!(await allowRequest(req, res))) return;
  const parsed = CreateLayoffAlertSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email address and check your optional alert preferences." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const emailHash = hash(email);
  const confirmationToken = token();
  const unsubscribeLinkToken = unsubscribeToken(emailHash);
  const confirmationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const confirmationUrl = `${siteUrl}/layoffs/confirm?token=${encodeURIComponent(confirmationToken)}`;
  const unsubscribeUrl = `${siteUrl}/layoffs/unsubscribe?token=${encodeURIComponent(unsubscribeLinkToken)}`;
  const oneClickUnsubscribeUrl = `${siteUrl}/api/public/layoff-alerts/unsubscribe?token=${encodeURIComponent(unsubscribeLinkToken)}`;

  try {
    await db
      .insert(layoffAlertSubscriptionsTable)
      .values({
        email,
        emailHash,
        companySlugs: [],
        city: parsed.data.city?.trim() || null,
        sector: parsed.data.sector ?? null,
        status: "pending",
        confirmationTokenHash: hash(confirmationToken),
        confirmationExpiresAt,
        unsubscribeTokenHash: hash(unsubscribeLinkToken),
      })
      .onConflictDoUpdate({
        target: layoffAlertSubscriptionsTable.emailHash,
        set: {
          email,
          companySlugs: [],
          city: parsed.data.city?.trim() || null,
          sector: parsed.data.sector ?? null,
          status: "pending",
          confirmationTokenHash: hash(confirmationToken),
          confirmationExpiresAt,
          unsubscribeTokenHash: hash(unsubscribeLinkToken),
          confirmedAt: null,
          unsubscribedAt: null,
          updatedAt: new Date(),
        },
      });

    const sent = await sendEmail({
      to: email,
      subject: "Confirm CareerReality layoff alerts",
      html: `<p>Confirm your request to receive CareerReality layoff updates.</p><p><a href="${escapeHtml(confirmationUrl)}">Confirm email alerts</a></p><p>Rumours are never sent as alerts. If you did not request this, ignore this email or <a href="${escapeHtml(unsubscribeUrl)}">cancel the request</a>.</p>`,
      text: `Confirm your request to receive CareerReality layoff updates: ${confirmationUrl}\n\nRumours are never sent as alerts. If you did not request this, ignore this message or cancel the request: ${unsubscribeUrl}`,
      idempotencyKey: `layoff-confirm-${emailHash}-${hash(confirmationToken).slice(0, 20)}`,
      headers: {
        "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (!sent) {
      req.log.warn("Resend did not accept the layoff-alert confirmation email");
      res.status(503).json({ error: "The confirmation email could not be sent. Check the sender setup and try again." });
      return;
    }
    res.status(202).json(CreateLayoffAlertSubscriptionResponse.parse({
      message: "Check your inbox for a confirmation link. Alerts start only after you confirm.",
    }));
  } catch {
    req.log.error("Layoff-alert subscription request failed");
    res.status(503).json({ error: "The confirmation email could not be sent. Try again later." });
  }
});

router.post("/public/layoff-alerts/confirm", async (req, res): Promise<void> => {
  const parsed = ConfirmLayoffAlertSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "This confirmation link is invalid or expired." });
    return;
  }
  try {
    const [updated] = await db
      .update(layoffAlertSubscriptionsTable)
      .set({
        status: "confirmed",
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(layoffAlertSubscriptionsTable.confirmationTokenHash, hash(parsed.data.token)),
        gt(layoffAlertSubscriptionsTable.confirmationExpiresAt, new Date()),
        eq(layoffAlertSubscriptionsTable.status, "pending"),
      ))
      .returning({ id: layoffAlertSubscriptionsTable.id });
    if (!updated) {
      res.status(400).json({ error: "This confirmation link is invalid or expired." });
      return;
    }
    res.json(ConfirmLayoffAlertSubscriptionResponse.parse({
      message: "Your email is confirmed. You will receive alerts only for credible reports.",
    }));
  } catch {
    req.log.error("Layoff-alert confirmation failed");
    res.status(503).json({ error: "Confirmation is temporarily unavailable." });
  }
});

router.post("/public/layoff-alerts/unsubscribe", async (req, res): Promise<void> => {
  const parsed = UnsubscribeLayoffAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "This unsubscribe link is invalid." });
    return;
  }
  try {
    const [updated] = await db
      .update(layoffAlertSubscriptionsTable)
      .set({
        status: "unsubscribed",
        confirmationTokenHash: null,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(layoffAlertSubscriptionsTable.unsubscribeTokenHash, hash(parsed.data.token)))
      .returning({ id: layoffAlertSubscriptionsTable.id });
    if (!updated) {
      res.status(400).json({ error: "This unsubscribe link is invalid." });
      return;
    }
    res.json(UnsubscribeLayoffAlertsResponse.parse({ message: "You are unsubscribed from layoff alerts." }));
  } catch {
    req.log.error("Layoff-alert unsubscribe failed");
    res.status(503).json({ error: "Unsubscribe is temporarily unavailable." });
  }
});

export default router;
