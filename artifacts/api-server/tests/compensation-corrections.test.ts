import assert from "node:assert/strict";
import test from "node:test";
import {
  clearCompensationCorrections,
  countCompensationCorrections,
  correctedValue,
  parseCompensationCorrections,
  shouldConfirmCompensationReset,
  updateCompensationCorrection,
} from "../../career-reality-mobile/lib/compensation-corrections";

const offerFixedCash = "compensation:offer:guaranteed_cash:Guaranteed / fixed cash";
const offerVariablePay = "compensation:offer:variable_pay:Variable / performance pay";
const payslipTakeHome = "compensation:payslip:take_home:Net monthly take-home";

test("restores saved corrections and ignores malformed storage values", () => {
  const saved = updateCompensationCorrection({}, offerFixedCash, "₹38,00,000 / year");
  const restored = parseCompensationCorrections(JSON.stringify(saved));

  assert.deepEqual(restored, {
    [offerFixedCash]: "₹38,00,000 / year",
  });
  assert.deepEqual(parseCompensationCorrections("{broken"), {});
  assert.deepEqual(parseCompensationCorrections(JSON.stringify(["not", "a map"])), {});
});

test("clears only the re-analyzed document prefix", () => {
  const corrections = {
    [offerFixedCash]: "₹38,00,000 / year",
    [offerVariablePay]: "₹3,00,000 / year",
    [payslipTakeHome]: "₹1,95,000",
  };

  assert.deepEqual(clearCompensationCorrections(corrections, "compensation:offer:"), {
    [payslipTakeHome]: "₹1,95,000",
  });
});

test("clearing a value restores the original extracted value", () => {
  const corrected = updateCompensationCorrection({}, offerFixedCash, "₹38,00,000 / year");
  const cleared = updateCompensationCorrection(corrected, offerFixedCash, "");

  assert.equal(correctedValue("₹36,00,000 / year", corrected, offerFixedCash), "₹38,00,000 / year");
  assert.equal(correctedValue("₹36,00,000 / year", cleared, offerFixedCash), "₹36,00,000 / year");
  assert.deepEqual(cleared, {});
});

test("corrections change only displayed values, not evidence or confidence", () => {
  const finding = {
    category: "guaranteed_cash",
    value: "₹36,00,000 / year",
    confidence: "High",
    evidence: "Fixed pay: ₹36L per annum",
  };
  const corrections = updateCompensationCorrection({}, offerFixedCash, "₹38,00,000 / year");
  const hydratedFinding = {
    ...finding,
    value: correctedValue(finding.value, corrections, offerFixedCash),
  };

  assert.equal(hydratedFinding.value, "₹38,00,000 / year");
  assert.equal(hydratedFinding.confidence, finding.confidence);
  assert.equal(hydratedFinding.evidence, finding.evidence);
});

test("requires confirmation only when resetting multiple corrections", () => {
  assert.equal(shouldConfirmCompensationReset(0), false);
  assert.equal(shouldConfirmCompensationReset(1), false);
  assert.equal(shouldConfirmCompensationReset(2), true);
});

test("counts corrections for one document without leaking the other document's edits", () => {
  const corrections = {
    [offerFixedCash]: "₹38,00,000 / year",
    [offerVariablePay]: "₹3,00,000 / year",
    [payslipTakeHome]: "₹1,95,000",
  };

  assert.equal(countCompensationCorrections(corrections, "compensation:offer:"), 2);
  assert.equal(countCompensationCorrections(corrections, "compensation:payslip:"), 1);
  assert.equal(countCompensationCorrections(corrections, "compensation:unknown:"), 0);
});