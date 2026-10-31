import assert from "node:assert/strict";
import test from "node:test";
import {
  assessRecruiterDomain,
  audiences,
  checkLlpShape,
  faqItems,
  parseCinShape,
  questionBank,
  scanOfferText,
  verificationSources,
  verificationSteps,
} from "../src/lib/company-verification-model";

test("the guided checklist has seven source-aware steps and at least twelve FAQs", () => {
  assert.equal(verificationSteps.length, 7);
  assert.ok(verificationSteps.every((step) => step.title && step.why && step.actions.length && step.match && step.mismatch && step.next));
  assert.ok(faqItems.length >= 12);
  assert.ok(verificationSources.every((source) => source.url.startsWith("https://") && source.checkedOn && source.check));
});

test("every audience receives ten practical interview questions", () => {
  for (const audience of audiences) {
    assert.equal(questionBank[audience].length, 10, `${audience} should have ten questions`);
  }
});

test("CIN and LLPIN helpers only report local shapes", () => {
  const cin = parseCinShape("U74140TN2011PTC082268");
  assert.equal(cin.shapeLooksLikeCIN, true);
  assert.equal("industryCode" in cin, false);
  assert.equal("stateCode" in cin, false);
  assert.match(cin.message, /local 21-character CIN pattern/i);
  assert.match(cin.message, /No MCA-published reference/i);
  assert.match(cin.message, /not an MCA lookup/i);
  assert.equal(parseCinShape("U74140TN2011PTC08226").shapeLooksLikeCIN, false);
  assert.match(parseCinShape("U74140TN2011PTC08226").message, /local CIN pattern/i);
  assert.match(verificationSources.find((source) => source.id === "mca-find-cin")?.check ?? "", /no suitable MCA-published format reference/i);
  assert.equal(checkLlpShape("AAA-1234").looksLikeLLPIN, true);
  assert.match(checkLlpShape("AAA-1234").message, /not checked against MCA/i);
});

test("domain comparison recognizes exact domains, subdomains, free mail, and mismatches", () => {
  assert.equal(assessRecruiterDomain("example.in", "example.in").status, "exact-or-subdomain");
  assert.equal(assessRecruiterDomain("example.in", "careers.example.in").status, "exact-or-subdomain");
  assert.equal(assessRecruiterDomain("example.in", "gmail.com").status, "free-mail");
  assert.equal(assessRecruiterDomain("example.in", "examp1e.in").status, "lookalike");
});

test("offer scanner catches the enumerated pattern families without claiming certainty", () => {
  const samples = [
    ["registration fee", "job-fee"],
    ["guaranteed job", "guaranteed"],
    ["send OTP", "otp"],
    ["personal UPI account", "personal-transfer"],
    ["buy laptop", "equipment"],
    ["without interview", "no-interview"],
    ["act now", "urgent"],
    ["unpaid training", "unpaid-training"],
    ["send Aadhaar", "document-pressure"],
    ["install AnyDesk", "remote-access"],
    ["pay with bitcoin", "crypto"],
    ["no experience 10 LPA", "salary-claim"],
  ] as const;
  for (const [message, expected] of samples) {
    assert.ok(scanOfferText(message).some((finding) => finding.id === expected), `expected ${expected} for ${message}`);
  }
  assert.equal(scanOfferText("Hello, the team is looking forward to the interview.").length, 0);
  assert.ok(scanOfferText("registration fee")[0].explanation.length > 0);
});
