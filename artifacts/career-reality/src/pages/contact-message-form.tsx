import { useState, type FormEvent } from "react";
import { useSubmitContactMessage } from "@workspace/api-client-react";

const topics = [
  ["general", "General message"],
  ["correction", "Correction request"],
  ["privacy", "Privacy request"],
  ["account", "Account question"],
  ["other", "Other"],
] as const;

export function ContactMessageForm() {
  const submitMessage = useSubmitContactMessage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof topics)[number][0]>(() => {
    if (typeof window === "undefined") return "general";
    return new URLSearchParams(window.location.search).get("topic") === "privacy" ? "privacy" : "general";
  });
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = {
      name: name.trim(),
      email: email.trim(),
      topic,
      message: message.trim(),
    };
    if (!payload.name || !payload.email || payload.message.length < 20) {
      setError("Enter your name and email, and write a message of at least 20 characters.");
      return;
    }
    try {
      await submitMessage.mutateAsync({ data: payload });
      setName("");
      setEmail("");
      setTopic("general");
      setMessage("");
      setReceipt(true);
    } catch (cause) {
      const status = typeof cause === "object" && cause !== null && "status" in cause
        ? Number((cause as { status?: unknown }).status)
        : 0;
      setError(status === 400
        ? "Check the form fields and try again."
        : "The message could not be stored. Please try again later.");
    }
  }

  return (
    <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="contact-form-title">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Contact CareerReality Editorial</p>
      <h2 id="contact-form-title" className="mt-2 font-display text-3xl">Send a message.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        The form stores your name, email, topic, message, and server receipt time. It does not store a raw client IP address. A receipt confirms storage only; no reply time is promised.
      </p>
      {receipt && (
        <p className="mt-5 rounded-xl border border-primary/30 bg-primary/[.05] p-4 text-sm leading-6" role="status" data-testid="contact-receipt">
          Your message was recorded. No response time is promised.
        </p>
      )}
      <form onSubmit={submit} className="mt-6 space-y-5" data-testid="form-contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} maxLength={100} autoComplete="name" className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value as (typeof topics)[number][0])} className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm">
            {topics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {topic === "privacy" && (
          <p className="rounded-xl border border-primary/20 bg-primary/[.04] p-4 text-sm leading-6 text-muted-foreground">
            State whether you are asking about access, correction, or deletion. The form only confirms that your message was stored; it does not confirm review or completion. Do not include passwords, identity documents, or other sensitive details.
          </p>
        )}
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Message</span>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={20} maxLength={5000} rows={6} className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <span className="block text-xs text-muted-foreground">Do not include passwords, credentials, resumes, or confidential work documents.</span>
        </label>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={submitMessage.isPending} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-submit-contact">
          {submitMessage.isPending ? "Recording message…" : "Send message"}
        </button>
      </form>
    </section>
  );
}
