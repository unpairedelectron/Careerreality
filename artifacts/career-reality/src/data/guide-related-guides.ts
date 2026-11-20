/**
 * Hand-picked "Keep reading" links between guides, rendered in the page and its crawler snapshot.
 * Each guide lists three related guides; tests/guide-related-guides.test.ts checks that every
 * published guide has a list and is linked from at least two other guides.
 */
export const guideRelatedGuides: Record<string, readonly [string, string, string]> = {
  // Offer, pay and tax
  "read-the-offer-beyond-ctc": ["offer-letter-red-flags-india", "negotiate-salary-offer-with-numbers", "old-vs-new-tax-regime-salaried-india"],
  "offer-letter-red-flags-india": ["read-the-offer-beyond-ctc", "notice-period-buyout-india", "negotiate-salary-offer-with-numbers"],
  "negotiate-salary-offer-with-numbers": ["read-the-offer-beyond-ctc", "how-to-read-salary-and-hiring-claims", "offer-letter-red-flags-india"],
  "how-to-read-salary-and-hiring-claims": ["negotiate-salary-offer-with-numbers", "data-science-career-claims", "cross-border-and-remote-pay"],
  "cross-border-and-remote-pay": ["read-the-offer-beyond-ctc", "how-to-read-salary-and-hiring-claims", "old-vs-new-tax-regime-salaried-india"],
  "old-vs-new-tax-regime-salaried-india": ["form-130-salary-tds-certificate-india", "read-the-offer-beyond-ctc", "negotiate-salary-offer-with-numbers"],
  "form-130-salary-tds-certificate-india": ["old-vs-new-tax-regime-salaried-india", "read-the-offer-beyond-ctc", "pf-withdrawal-after-job-loss"],
  // Notice and exit
  "notice-period-and-return-to-office": ["notice-period-buyout-india", "offer-letter-red-flags-india", "workplace-culture-and-boundaries"],
  "notice-period-buyout-india": ["notice-period-and-return-to-office", "offer-letter-red-flags-india", "gratuity-four-years-eight-months"],
  "gratuity-four-years-eight-months": ["labour-codes-and-layoffs-india", "severance-notice-leave-after-layoff", "notice-period-buyout-india"],
  // Layoffs
  "first-24-hours-after-layoff": ["severance-notice-leave-after-layoff", "layoff-recovery-and-employment-documents", "90-day-post-layoff-job-search"],
  "severance-notice-leave-after-layoff": ["first-24-hours-after-layoff", "gratuity-four-years-eight-months", "labour-codes-and-layoffs-india"],
  "layoff-recovery-and-employment-documents": ["first-24-hours-after-layoff", "pf-withdrawal-after-job-loss", "90-day-post-layoff-job-search"],
  "pf-withdrawal-after-job-loss": ["layoff-recovery-and-employment-documents", "runway-debt-and-big-decisions", "form-130-salary-tds-certificate-india"],
  "labour-codes-and-layoffs-india": ["severance-notice-leave-after-layoff", "gratuity-four-years-eight-months", "first-24-hours-after-layoff"],
  "90-day-post-layoff-job-search": ["runway-debt-and-big-decisions", "getting-hired-through-evidence-and-conversations", "layoff-recovery-and-employment-documents"],
  "runway-debt-and-big-decisions": ["90-day-post-layoff-job-search", "pf-withdrawal-after-job-loss", "independent-work-without-romanticising-it"],
  // Career moves
  "career-switches-and-education": ["skills-passion-and-career-constraints", "data-science-career-claims", "cybersecurity-and-green-work"],
  "skills-passion-and-career-constraints": ["career-switches-and-education", "independent-work-without-romanticising-it", "runway-debt-and-big-decisions"],
  "independent-work-without-romanticising-it": ["skills-passion-and-career-constraints", "runway-debt-and-big-decisions", "cross-border-and-remote-pay"],
  "getting-hired-through-evidence-and-conversations": ["90-day-post-layoff-job-search", "culture-fit-and-product-management", "negotiate-salary-offer-with-numbers"],
  "performance-reviews-and-career-choices": ["engineering-careers-without-the-title-trap", "workplace-culture-and-boundaries", "senior-engineering-and-operations-work"],
  // Roles and culture
  "engineering-careers-without-the-title-trap": ["senior-engineering-and-operations-work", "performance-reviews-and-career-choices", "culture-fit-and-product-management"],
  "senior-engineering-and-operations-work": ["engineering-careers-without-the-title-trap", "workplace-culture-and-boundaries", "ai-at-work-questions-to-ask"],
  "data-science-career-claims": ["ai-at-work-questions-to-ask", "career-switches-and-education", "how-to-read-salary-and-hiring-claims"],
  "cybersecurity-and-green-work": ["career-switches-and-education", "data-science-career-claims", "skills-passion-and-career-constraints"],
  "ai-at-work-questions-to-ask": ["data-science-career-claims", "career-switches-and-education", "cybersecurity-and-green-work"],
  "culture-fit-and-product-management": ["workplace-culture-and-boundaries", "engineering-careers-without-the-title-trap", "getting-hired-through-evidence-and-conversations"],
  "workplace-culture-and-boundaries": ["culture-fit-and-product-management", "performance-reviews-and-career-choices", "notice-period-and-return-to-office"],
};

export function getRelatedGuideSlugs(slug: string): readonly string[] {
  return guideRelatedGuides[slug] ?? [];
}
