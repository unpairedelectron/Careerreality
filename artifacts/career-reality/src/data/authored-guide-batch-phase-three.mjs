const editorial = (heading, first, second = [], third = []) => ({
  heading,
  content: Array.isArray(second) ? first : `${first}\n\n${second}`,
  sourceLinks: Array.isArray(second) ? second : third,
});
// OWNER CHECK BEFORE MERGE: replace these portal links with the CBDT notification of the
// Income-tax Rules, 2026 and the Form 130 page once verified, and set lastVerified/dateModified
// to the date you checked them. The draft was written without access to official sites.
const taxPortal = {
  url: "https://www.incometax.gov.in/iec/foportal/",
  label: "Income Tax Department — e-filing portal (forms, notifications and help)",
  year: "2026",
};
const taxDepartment = {
  url: "https://incometaxindia.gov.in/",
  label: "Income Tax Department — Acts, Rules and notifications",
  year: "2026",
};
const disclaimer = "General editorial information only. Check current official rules and your own documents; this guide is not individualized tax, legal, or financial advice.";

export default {
  "form-130-salary-tds-certificate-india": {
    keepDecisionSupport: false,
    datePublished: null,
    dateModified: null,
    lastVerified: null,
    editorialFrame: "From tax year 2026–27, the salary TDS certificate that employers issue under the Income-tax Act, 2025 is Form 130, the successor to Form 16. Salary paid up to 31 March 2026 still belongs to the old Act, so the certificate for that period is still Form 16. The name change does not change the job you have to do with it: check that the salary, deductions and tax deducted match your payslips, your declarations and the tax credit statement before you file.",
    lead: "This guide explains how to read and reconcile the certificate, not what tax you owe. Confirm current forms and dates on the Income Tax Department portal.",
    sections: [
      editorial(
        "Which certificate applies to which salary",
        "Start with the period the salary was paid in, not the date the certificate arrives. Salary for April 2025 to March 2026 was taxed under the Income-tax Act, 1961, so the employer's certificate for that year is Form 16, usually issued around June 2026. Salary from April 2026 falls under the Income-tax Act, 2025 and its rules, which use the term tax year and number the salary certificate Form 130.",
        "If you changed jobs during a year, expect one certificate from each employer for the months each one paid you. Ask for any certificate that is missing rather than filing from payslips alone. Keep the old and new forms in separate folders so that a figure from one year is never copied into the other year's return.",
      ),
      editorial(
        "What the certificate is meant to show",
        "Like Form 16, the salary certificate brings together who deducted tax, how much was deducted and deposited, and how the employer worked out taxable salary. Expect the employer and employee identifiers, the period of employment, gross salary, exempt allowances, deductions the employer allowed, the regime used for withholding, the tax computed, and the tax deducted. The exact layout comes from the notified form, so read the headings on the document you receive rather than assuming they match a Form 16 from an earlier year.",
      ),
      editorial(
        "Worked example: reconcile salary with payslips",
        "Illustrative figures, not a tax calculation. Riya's twelve payslips each show gross pay of ₹1,50,000, a total of ₹18,00,000. Her certificate shows gross salary of ₹18,60,000. The ₹60,000 gap is a performance bonus paid in March through a separate off-cycle payslip she had not saved. Once she adds that payslip, payslips and certificate agree, and she can move on to checking tax.",
        "If the gap had no matching payment, the next step would be to ask payroll for a month-by-month salary register. Do not adjust the figure in your return to match what you expected without knowing which side is wrong.",
      ),
      editorial(
        "Check tax deducted against the tax credit statement",
        "The tax deducted figure on the certificate should match the tax credit shown against your PAN in the annual tax statement on the e-filing portal. Compare the totals for each employer and each quarter. If the certificate shows more tax than the portal credits to you, the deduction may not have been deposited or reported correctly yet. Ask the employer to confirm the filing and to correct its TDS statement, because the credit you can claim depends on what the department has on record.",
      ),
      editorial(
        "Check the regime and the deductions the employer used",
        "Employers withhold tax using the regime and declarations you gave them during the year. The certificate shows what payroll applied, not a final choice for your return. If you told payroll one regime and now find the other is better, check the current rules for when and how the option can be exercised in the return.",
        "For every deduction or exemption the employer allowed, confirm you hold the proof that supports it, such as rent receipts or premium statements. An amount the employer accepted on declaration is not proof of eligibility if records are later asked for.",
      ),
      editorial(
        "Two employers in one year",
        "Each employer computes tax only on the salary it paid, unless you gave it details of salary from the earlier job. That is why people who switch jobs mid-year often find total tax deducted lower than the tax due on the combined salary. Add the gross salary and tax deducted from both certificates and run one estimate on the total. If the combined result shows tax still due, plan for it before the return deadline instead of discovering it while filing.",
      ),
      editorial(
        "When the certificate is late or wrong",
        "Write to payroll with the specific line that is wrong, the figure you expected, and the document that supports it, such as a payslip or the tax credit statement. Ask for a corrected certificate and, where the problem is in deposited tax, a corrected TDS statement. Keep the request and reply.",
        "If the employer has closed or stopped responding, keep your payslips, bank credits and the portal statement together. These show what you were paid and what tax was credited, which is what a tax professional will need to advise you.",
      ),
      editorial(
        "What to keep after filing",
        "Save the certificate, the payslips used to check it, the tax credit statement on the day you filed, and the proofs for each deduction you claimed. Note which regime you chose and why. If a notice or mismatch arrives later, this file lets you answer quickly and shows which figure came from which document. Keep certificates under the old and new Acts separately so that a later reader can tell which law and form each year was filed under.",
      ),
      editorial(
        "Source boundary",
        "The form names and Act dates in this guide come from the Income-tax Act, 2025 framework that applies from 1 April 2026. Notified forms, due dates and portal statements can change, so confirm the current Form 130 and its instructions on the Income Tax Department sites linked below before relying on any detail.",
        "This guide does not compute tax, decide which regime is better for you, or state a deadline for your case. Ask a qualified tax professional if figures do not reconcile or a correction is refused.",
      ),
    ],
    nextSteps: [
      "Sort salary by the year it was paid: Form 16 for salary up to 31 March 2026, Form 130 for salary from 1 April 2026 onwards.",
      "Reconcile gross salary with every payslip and tax deducted with the tax credit statement on the e-filing portal; list any gap with the document that explains it.",
      "Ask payroll in writing for a corrected certificate or TDS statement when a figure is wrong, and get qualified advice if it is not fixed before you file.",
    ],
    faqs: [
      { question: "Is Form 130 the new Form 16?", answer: "Yes, it is the salary TDS certificate under the Income-tax Act, 2025, for salary from tax year 2026–27. Salary for FY 2025–26 is still certified on Form 16." },
      { question: "Will I get Form 130 for salary paid in 2025–26?", answer: "No. That salary was taxed under the 1961 Act, so expect Form 16 for it. Form 130 covers salary paid from April 2026." },
      { question: "What if Form 130 and the portal tax credit differ?", answer: "Ask the employer to check its TDS statement. The credit you can claim depends on what the department has on record." },
      { question: "Does the regime on Form 130 bind my return?", answer: "It shows what payroll used for withholding. Check current rules on choosing the regime when you file." },
    ],
    relatedLinks: [
      { url: "/guides/old-vs-new-tax-regime-salaried-india", label: "Compare tax regimes before filing" },
      { url: "/salary-calculator", label: "Estimate salary and tax cash flow" },
      { url: "/rules/salary-standard-deduction-cess", label: "Salary tax rule notes" },
    ],
    sources: [taxPortal, taxDepartment],
    sourceDisclosure: disclaimer,
  },
};
