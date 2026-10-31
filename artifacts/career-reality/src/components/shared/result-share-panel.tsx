import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type ResultSharePanelProps = {
  toolId: string;
  toolName: string;
  resultText: string;
};

export function ResultSharePanel({ toolId, toolName, resultText }: ResultSharePanelProps) {
  const [status, setStatus] = useState("");
  const shareText = `${toolName} result from CareerReality\n\n${resultText}\n\nThis is an estimate based on entered information, not individualized advice. Verify the assumptions and source dates before acting.`;
  const encoded = encodeURIComponent(shareText);

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(shareText);
      trackEvent("decision_result_shared", { tool_id: toolId, method: "copy" });
      setStatus("Result copied.");
    } catch {
      setStatus("Copy is unavailable in this browser. Use WhatsApp or email instead.");
    }
  }

  return (
    <section className="mt-5 border-t border-border pt-4" aria-label={`Share ${toolName} result`} data-testid={`result-share-${toolId}`}>
      <p className="text-sm font-bold">Share this result</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Only the displayed result is included; your calculator inputs are not shared automatically.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("decision_result_shared", { tool_id: toolId, method: "whatsapp" })}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
          data-testid={`share-whatsapp-${toolId}`}
        >
          <MessageCircle size={15} aria-hidden="true" /> Share on WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(`${toolName} result | CareerReality`)}&body=${encoded}`}
          onClick={() => trackEvent("decision_result_shared", { tool_id: toolId, method: "email" })}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold"
          data-testid={`share-email-${toolId}`}
        >
          <Mail size={15} aria-hidden="true" /> Email result
        </a>
        <button
          type="button"
          onClick={copyResult}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold"
          data-testid={`share-copy-${toolId}`}
        >
          {status === "Result copied." ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          Copy text
        </button>
      </div>
      {status && <p className="mt-2 text-xs text-muted-foreground" role="status">{status}</p>}
    </section>
  );
}
