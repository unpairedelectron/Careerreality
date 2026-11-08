const editorial = (heading, first, second = [], third = []) => ({
  heading,
  content: Array.isArray(second) ? first : `${first}\n\n${second}`,
  sourceLinks: Array.isArray(second) ? second : third,
});
const form130Page = {
  url: "https://www.incometaxindia.gov.in/w/form-no.-130",
  label: "Income Tax Department — Form No. 130",
  year: "2026",
};
const form130Faq = {
  url: "https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs",
  label: "Income Tax Department — Form No. 130 FAQs",
  year: "2026",
};
const rule215 = {
  url: "https://wm.incometaxindia.gov.in/web/guest/w/rule-215-1",
  label: "Income-tax Rules, 2026 — Rule 215 (certificates and due dates)",
  year: "2026",
};
const transitionFaq = {
  url: "https://www.incometaxindia.gov.in/documents/81799/11848482/Updated-FQAs-on-Interplay&Transitions.pdf",
  label: "Income Tax Department — FAQs on transition to the Income-tax Act, 2025",
  year: "2026",
};
const annualStatement = {
  url: "https://www.incometaxindia.gov.in/tax-services/process-annual-tax-statement-e-filing-form-26as-form-168",
  label: "Income Tax Department — Annual tax statement (Form 26AS and Form 168)",
  year: "2026",
};
const disclaimer = "General editorial information only. Check current official rules and your own documents; this guide is not individualized tax, legal, or financial advice.";

export default {
  "form-130-salary-tds-certificate-india": {
    keepDecisionSupport: false,
    datePublished: null,
    dateModified: "2026-11-08",
    lastVerified: "8 November 2026",
    editorialFrame: "From tax year 2026–27, the salary TDS certificate that employers issue under the Income-tax Act, 2025 is Form 130, which replaces Form 16. Salary paid up to 31 March 2026 still belongs to the 1961 Act, so its certificate is Form 16. The name change does not change the job you have to do with it: check that the salary, deductions and tax deducted match your payslips, your declarations and your annual tax statement before you file.",
    lead: "This guide explains how to read and reconcile the certificate, not what tax you owe. Official sources were checked on 8 November 2026.",
    sections: [
      editorial(
        "Which certificate applies to which salary",
        "Start with when the salary was paid, not when the certificate arrives. The department's transition FAQs say salary for 2025–26, paid up to March 2026, follows section 192 of the 1961 Act, so its certificate is Form 16, normally due by 15 June 2026. Salary paid from April 2026 follows section 392 of the Income-tax Act, 2025, which uses the term tax year and certifies salary on Form 130.",
        "Rule 215 sets the Form 130 due date as 15 June of the financial year after the tax year, so the first one for tax year 2026–27 is due by 15 June 2027. If your March 2026 salary reached you in April, ask payroll which certificate covers it. Keep old and new forms in separate folders so that a figure from one year is never copied into another.",
      ),
      editorial(
        "What the certificate is meant to show",
        "The department's FAQs describe Form 130 in parts. Part A identifies the employer and employee. Part B is a summary reconciling the amount paid with the tax deducted. Part C carries the detail in annexures, with Annexure I for salary. The same form also covers pension and interest income of specified senior citizens under section 393(1), which uses Annexure II.",
        "The employer has to generate and download the certificate from the department's TRACES portal and give it to you signed digitally or by hand. A figure typed into a payroll letter is not the same document. Read the headings on the form you receive rather than assuming they match a Form 16 from an earlier year.",
      ),
      editorial(
        "Worked example: reconcile salary with payslips",
        "Illustrative figures, not a tax calculation. Riya's twelve payslips each show gross pay of ₹1,50,000, a total of ₹18,00,000. Her certificate shows gross salary of ₹18,60,000. The ₹60,000 gap is a performance bonus paid in March through a separate off-cycle payslip she had not saved. Once she adds that payslip, payslips and certificate agree, and she can move on to checking tax.",
        "If the gap had no matching payment, the next step would be to ask payroll for a month-by-month salary register. Do not adjust the figure in your return to match what you expected without knowing which side is wrong.",
      ),
      editorial(
        "Check tax deducted against the annual tax statement",
        "The tax deducted on the certificate should match the credit shown against your PAN in your annual tax statement on the e-filing portal. That statement is Form 26AS up to 2025–26 and Form 168 from tax year 2026–27. Compare totals for each employer and each quarter. If the certificate shows more tax than the statement credits to you, the employer's quarterly TDS statement may be missing or wrong.",
        "Ask the employer to confirm the filing and correct the statement, because the credit you can claim depends on what the department has on record. The department's FAQs tie issue of the certificate to the employer having deposited the tax and filed that quarterly statement.",
      ),
      editorial(
        "Check the regime and the deductions the employer used",
        "Employers withhold tax using the regime and declarations you gave them during the year. What payroll applied is not a final choice for your return. If you told payroll one regime and now find the other is better, check the current rules for when and how the option can be exercised in the return.",
        "For every deduction or exemption the employer allowed, confirm you hold the proof that supports it, such as rent receipts or premium statements. An amount the employer accepted on declaration is not proof of eligibility if records are later asked for.",
      ),
      editorial(
        "Two employers in one year",
        "Rule 215 says each employer issues Parts A and B for the period you worked there, and Part C may come from each employer or the last one, at your option. Tell payroll which you want. Each employer normally computes tax only on the salary it paid unless you gave it details of the earlier job, so total tax deducted can fall short of the tax due on combined salary.",
        "Add the gross salary and tax deducted from both certificates and run one estimate on the total. If the combined result shows tax still due, plan for it before the return deadline instead of discovering it while filing.",
      ),
      editorial(
        "When the certificate is late, lost or wrong",
        "Write to payroll with the specific line that is wrong, the figure you expected, and the document that supports it, such as a payslip or your annual tax statement. Ask for a corrected certificate and, where the problem is in deposited tax, a corrected TDS statement. If you lost the original, Rule 215 lets the employer issue a duplicate marked as one. Keep the request and reply.",
        "If the employer has closed or stopped responding, keep your payslips, bank credits and the portal statement together. These show what you were paid and what tax was credited, which is what a tax professional will need to advise you.",
      ),
      editorial(
        "What to keep after filing",
        "Save the certificate, the payslips used to check it, the annual tax statement on the day you filed, and the proofs for each deduction you claimed. Note which regime you chose and why. If a notice or mismatch arrives later, this file lets you answer quickly and shows which figure came from which document. Keep certificates under the old and new Acts separately so that a later reader can tell which law and form each year was filed under.",
      ),
      editorial(
        "Source boundary",
        "The department says its form FAQs and guidance notes are educational and that the Income-tax Act, 2025 and Income-tax Rules, 2026 govern legal interpretation. Rule 215, the Form 130 page and the transition FAQs below were checked on 8 November 2026. Forms, due dates and portal statements can change, so confirm them on the department's site before relying on any detail.",
        "This guide does not compute tax, decide which regime is better for you, or settle a dispute with an employer. Ask a qualified tax professional if figures do not reconcile or a correction is refused.",
        [form130Page, form130Faq, rule215, transitionFaq, annualStatement],
      ),
    ],
    nextSteps: [
      "Sort salary by when it was paid: Form 16 for salary paid up to 31 March 2026, Form 130 for salary paid from 1 April 2026 onwards.",
      "Reconcile gross salary with every payslip and tax deducted with your annual tax statement on the e-filing portal; list any gap with the document that explains it.",
      "Ask payroll in writing for a corrected certificate or TDS statement when a figure is wrong, and get qualified advice if it is not fixed before you file.",
    ],
    faqs: [
      { question: "Is Form 130 the new Form 16?", answer: "Yes. The department's FAQs say Form 130 replaces Form 16 for salary TDS under the Income-tax Act, 2025, from tax year 2026–27." },
      { question: "Will I get Form 130 for salary paid in 2025–26?", answer: "No. Salary paid up to March 2026 follows the 1961 Act, so expect Form 16 for it. Form 130 covers salary paid from April 2026." },
      { question: "When is the first Form 130 due?", answer: "Rule 215 sets 15 June after the tax year ends, so for tax year 2026–27 the employer has until 15 June 2027." },
      { question: "Does the regime payroll used bind my return?", answer: "Payroll withholding is separate from the option you exercise in your return. Check current rules on choosing the regime when you file." },
    ],
    relatedLinks: [
      { url: "/guides/old-vs-new-tax-regime-salaried-india", label: "Compare tax regimes before filing" },
      { url: "/salary-calculator", label: "Estimate salary and tax cash flow" },
      { url: "/rules/salary-standard-deduction-cess", label: "Salary tax rule notes" },
    ],
    sources: [form130Page, form130Faq, rule215, transitionFaq, annualStatement],
    sourceDisclosure: disclaimer,
  },
};
