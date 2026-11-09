import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { useCreateLayoffAlertSubscription, type LayoffAlertSubscriptionInputSector } from "@workspace/api-client-react";
import { Link } from "@/components/shared/app-link";
import eventData from "@/data/layoff-events.json";
import { trackEvent } from "@/lib/analytics";

const sectors = [...new Set(eventData.map((event) => event.sector).filter((sector): sector is string => Boolean(sector)))].sort();

export function LayoffAlertSignup() {
  const subscription = useCreateLayoffAlertSubscription();
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState<LayoffAlertSubscriptionInputSector | "">("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFailed(false);
    try {
      const preferences = {
        email: email.trim(),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(sector ? { sector } : {}),
      };
      const response = await subscription.mutateAsync({ data: preferences });
      trackEvent("layoff_alert_signup_requested", { location: window.location.pathname });
      setMessage(response.message);
      setEmail("");
      setCity("");
      setSector("");
    } catch {
      setFailed(true);
      setMessage("We could not send the confirmation email. Check your address or try again later.");
    }
  }

  return (
    <div id="email-alerts" className="rounded-2xl border border-border bg-card/75 p-5 sm:p-6">
      <h3 id="email-alerts-title" className="font-display text-xl">Get sourced layoff updates</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Confirm by email before alerts begin. Rumours are never sent.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="form-layoff-alert-signup">
        <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2">
          Email address
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal"
            data-testid="input-layoff-alert-email"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          City <span className="font-normal text-muted-foreground">Optional</span>
          <input
            type="text"
            maxLength={80}
            autoComplete="address-level2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="e.g. Bengaluru"
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal"
            data-testid="input-layoff-alert-city"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          Sector <span className="font-normal text-muted-foreground">Optional</span>
          <select
            value={sector}
            onChange={(event) => setSector(event.target.value as LayoffAlertSubscriptionInputSector | "")}
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal"
            data-testid="select-layoff-alert-sector"
          >
            <option value="">All sectors</option>
            {sectors.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button
          type="submit"
          disabled={subscription.isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60 sm:col-span-2"
          data-testid="button-layoff-alert-signup"
        >
          {subscription.isPending ? "Sending confirmation…" : "Request email alerts"}
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </form>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Your email and optional preferences are used to manage alerts. <Link href="/privacy-policy/" className="font-semibold text-primary underline underline-offset-2">Privacy policy</Link>.
      </p>
      {message && <p className={`mt-3 text-sm ${failed ? "text-destructive" : "text-primary"}`} role={failed ? "alert" : "status"} data-testid="status-layoff-alert-signup">{message}</p>}
    </div>
  );
}
