import assert from "node:assert/strict";
import test from "node:test";
import { AnalyzeCompensationDocumentResponse } from "@workspace/api-zod";
import {
  discardUploadBuffer,
  extractCompensationAnalysis,
} from "../src/routes/career";

function responseFor(
  documentType: "offer" | "payslip",
  text: string,
) {
  const analysis = extractCompensationAnalysis(text, documentType);
  return AnalyzeCompensationDocumentResponse.parse({
    status: "ready",
    documentType,
    fileName: `${documentType}.pdf`,
    processedAt: new Date("2026-09-08T00:00:00.000Z"),
    extractedCharacters: text.length,
    ...analysis,
  });
}

test("extracts fixed pay, variable pay, equity, and total CTC from an offer", () => {
  const response = responseFor(
    "offer",
    [
      "Offer compensation summary",
      "Total CTC: ₹42L per annum",
      "Fixed pay: ₹36L per annum",
      "Performance bonus: ₹4L per annum",
      "RSU equity: ₹12L over four years",
    ].join("\n"),
  );

  assert.equal(response.status, "ready");
  assert.deepEqual(
    response.findings.map((finding) => finding.category),
    ["guaranteed_cash", "variable_pay", "equity"],
  );
  assert.equal(response.findings[0]?.value, "₹36,00,000 / year");
  assert.match(response.findings[1]?.interpretation ?? "", /conditional/i);
  assert.match(response.findings[2]?.interpretation ?? "", /vesting/i);
});

test("uses headline CTC as a cautious fallback when fixed pay is absent", () => {
  const response = responseFor(
    "offer",
    "Total compensation: ₹28L. Joining bonus: ₹2L after six months.",
  );

  assert.equal(response.findings[0]?.category, "guaranteed_cash");
  assert.equal(response.findings[0]?.label, "Headline CTC");
  assert.match(response.findings[0]?.interpretation ?? "", /headline/i);
  assert.equal(response.findings.some((finding) => finding.category === "ambiguity"), false);
});

test("flags an offer with no guaranteed cash instead of inventing a number", () => {
  const response = responseFor(
    "offer",
    "We are excited to offer you a Senior Engineer role. Benefits include health insurance and leave.",
  );

  const ambiguity = response.findings.find((finding) => finding.category === "ambiguity");
  assert.ok(ambiguity);
  assert.equal(ambiguity.value, "Needs clarification");
  assert.equal(ambiguity.confidence, "Low");
  assert.match(response.summary, /compensation gap/i);
});

test("extracts gross pay, net take-home, and deductions from a payslip", () => {
  const response = responseFor(
    "payslip",
    [
      "Monthly salary statement",
      "Gross salary: ₹2,40,000",
      "Total deductions: ₹52,000",
      "Net pay: ₹1,88,000",
    ].join("\n"),
  );

  assert.deepEqual(
    response.findings.map((finding) => finding.category),
    ["guaranteed_cash", "take_home", "deductions"],
  );
  assert.equal(response.findings[0]?.value, "₹2,40,000");
  assert.match(response.findings[1]?.value ?? "", /78% of gross/);
  assert.match(response.findings[2]?.interpretation ?? "", /tax/i);
});

test("flags unreadable payslip labels and keeps the response contract valid", () => {
  const response = responseFor(
    "payslip",
    "Employee: Shiv\nPayroll statement generated successfully.\nThank you.",
  );

  assert.equal(response.findings.length, 1);
  assert.equal(response.findings[0]?.category, "ambiguity");
  assert.equal(response.findings[0]?.confidence, "Low");
  assert.match(response.qualityNotes.join(" "), /not clearly labeled/i);
});

test("discards uploaded bytes after processing", () => {
  const uploadedBytes = Buffer.from("private compensation document contents");
  discardUploadBuffer(uploadedBytes);
  assert.deepEqual(uploadedBytes, Buffer.alloc(uploadedBytes.length));
});