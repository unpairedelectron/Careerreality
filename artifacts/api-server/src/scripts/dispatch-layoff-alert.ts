import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { db, layoffAlertSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { matchesLayoffAlert } from "../lib/layoff-alert-matching.js";

type EventRecord = {
  slug: string;
  company: string;
  date: string;
  scale: string;
  status: "Confirmed" | "Reported" | "Rumour";
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  updatedAt: string;
  geography: string;
  sector?: string;
};

const eventPath = path.resolve(import.meta.dirname, "../../../career-reality/src/data/layoff-events.json");
const events = JSON.parse(fs.readFileSync(eventPath, "utf8")) as EventRecord[];
const slug = process.argv[2];
const event = events.find((item) => item.slug === slug);

if (!event) throw new Error("Pass a company event slug from layoff-events.json.");
if (event.status === "Rumour") throw new Error("Rumour records must never trigger email alerts.");

const connectors = new ReplitConnectors();
const siteUrl = (process.env.SITE_URL ?? "https://careerreality.in").replace(/\/+$/, "");
const from = process.env.LAYOFF_ALERT_FROM ?? "CareerReality <alerts@careerreality.in>";
const unsubscribeSecret = process.env.SESSION_SECRET;
if (!unsubscribeSecret) throw new Error("SESSION_SECRET is required for layoff alert unsubscribe links.");
const subscribers = await db.select().from(layoffAlertSubscriptionsTable)
  .where(eq(layoffAlertSubscriptionsTable.status, "confirmed"));
let sent = 0;

for (const subscriber of subscribers) {
  if (!matchesLayoffAlert(subscriber, event)) continue;
  const unsubscribeToken = createHmac("sha256", unsubscribeSecret)
    .update(`layoff-alert-unsubscribe:${subscriber.emailHash}`)
    .digest("base64url");
  const unsubscribeUrl = `${siteUrl}/api/public/layoff-alerts/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `layoff-event-${event.slug}-${event.updatedAt}-${subscriber.emailHash}`,
    },
    body: JSON.stringify({
      from,
      to: subscriber.email,
      subject: `${event.company}: sourced workforce report`,
      html: `<p>${event.summary}</p><p><strong>Status:</strong> ${event.status} · <strong>Event date:</strong> ${event.date} · <strong>Reported scale:</strong> ${event.scale}</p><p><a href="${event.sourceUrl}">Read ${event.sourceLabel} (published ${event.sourcePublishedAt})</a></p><p>This is a dated report, not a current headcount or job-security forecast. Rumours are never sent as alerts.</p><p><a href="${unsubscribeUrl}">Unsubscribe from these alerts</a></p>`,
      text: `${event.summary}\n\nStatus: ${event.status}\nEvent date: ${event.date}\nReported scale: ${event.scale}\nSource: ${event.sourceLabel}, published ${event.sourcePublishedAt}: ${event.sourceUrl}\n\nThis is a dated report, not a current headcount or job-security forecast. Rumours are never sent as alerts.\nUnsubscribe: ${unsubscribeUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!response.ok) throw new Error(`Resend did not accept the alert for event ${event.slug}.`);
  sent += 1;
}

console.log(`Accepted ${sent} alert email(s) for ${event.slug}.`);
