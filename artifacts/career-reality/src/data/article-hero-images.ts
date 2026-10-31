const heroAltText: Record<string, string> = {
  "portfolio-first-hiring-gig-economy-careers-india-2026": "Freelance designer assembling a portfolio from completed client projects.",
  "green-careers-esg-renewable-sustainability-india-2026": "Engineer inspecting solar panels in an open renewable-energy site.",
  "cybersecurity-privacy-careers-beyond-tech-india-2026": "Security analyst reviewing a privacy incident in an operations room.",
  "joining-bonus-clawback-offer-letter-traps-2026": "Professional carefully reviewing an offer letter and bonus clause.",
  "staff-engineer-promotion-freeze-india-2026": "Senior engineer considering a career ladder with a stalled next step.",
  "gcc-return-to-office-hybrid-reality-india-2026": "Technology campus showing shared office work and remote collaboration.",
  "relieving-letter-hostage-notice-period-india-2026": "Employee organizing a work handover and exit documents.",
  "ai-upskilling-trap-india-api-wrapper-reality": "Developer comparing a simple AI wrapper with a robust software system.",
  "gcc-gold-rush-india-captive-center-reality": "Technology team collaborating in a modern Indian capability centre.",
  "indian-it-layoff-cycle-2026": "Technology worker reviewing hiring signals on a laptop.",
  "junior-data-scientist-reality-india": "Junior analyst cleaning spreadsheet data before building a model.",
  "home-loan-trap-dream-house-financial-prison": "Couple reviewing a home-loan budget beside a house model.",
  "ux-salary-myth-design-careers-plateau": "UX designer mapping a product journey and career options.",
  "pm-prestige-trap-escape-from-engineering": "Engineer weighing a product role against a technical roadmap.",
  "10x-developer-myth-productivity-killing-careers": "Software team comparing careful code review with a speed-focused workflow.",
  "data-science-bubble-excel-work-reality": "Data scientist working through operational spreadsheets and messy data.",
  "career-switch-illusion-changing-jobs-not-career": "Professional comparing career paths by the skills each requires.",
  "engineering-career-ceiling-peak-at-35": "Experienced engineer mentoring a colleague while designing a system.",
  "self-learning-trap-online-courses-expensive-entertainment": "Learner applying course notes to a hands-on project.",
  "broke-at-30-money-mistakes-nobody-warned": "Adult reviewing household bills, savings, and a monthly budget.",
  "indian-education-trap-degree-career-mistake": "Graduate comparing a degree certificate with practical work samples.",
  "work-life-balance-myth-high-performers": "Professional closing a laptop at home after a focused workday.",
  "passion-luxury-not-strategy-india": "Worker balancing a creative pursuit with practical income planning.",
  "hr-conversations-what-matters-india": "Candidate and HR partner discussing a written offer.",
  "culture-fit-trap-hiring-reality": "Hiring panel reviewing job-related evidence together.",
  "job-hopping-stops-working-after-35": "Experienced professional comparing the scope of several roles.",
  "performance-review-reality-ratings-india": "Manager and employee discussing concrete work outcomes in a review.",
  "tech-lead-trap-responsibility-authority": "Technical lead coordinating a team amid unclear decision authority.",
  "devops-sre-reality-india-oncall": "Site reliability engineer monitoring service health during an on-call shift.",
  "senior-developer-salary-ceiling-india": "Senior developer presenting system impact and outcomes to colleagues.",
  "freelancing-reality-india-freedom-myth": "Independent consultant planning client work, invoices, and a schedule.",
  "networking-reality-india-introverts": "Two professionals having a focused one-to-one conversation at an event.",
  "layoff-recovery-timeline-india": "Job seeker organizing a practical weekly recovery and application plan.",
  "manager-vs-ic-career-path-india": "Colleagues considering people leadership and individual technical work.",
  "startup-equity-esop-reality-india": "Employee reviewing an equity grant and vesting calendar.",
  "side-hustle-myth-india-reality": "Professional planning a side project while protecting personal time.",
  "remote-work-salary-trap-india": "Remote worker comparing pay with location-based living costs.",
  "mba-reality-india-worth-it-2026": "Professional comparing the cost and opportunity of an MBA.",
  "american-dream-indian-engineers": "Indian engineer weighing overseas work against family and career factors.",
  "what-20-lpa-actually-feels-like-india-purchasing-power": "Couple reviewing monthly take-home pay and household expenses.",
  "why-upskilling-stops-working-career-trap": "Experienced worker applying a new skill to a workplace problem.",
  "salary-transparency-india-2026-number-in-room": "Colleagues discussing a clear salary band in a hiring meeting.",
  "ai-job-market-2026-india-show-your-working": "Candidate demonstrating a verifiable AI project to an interviewer.",
  "humour-in-workplace-culture-2026-joke-is-on-promotion": "Colleagues sharing workplace humour while one person appears uncomfortable.",
};

export function getArticleHeroImage(slug: string) {
  const alt = heroAltText[slug];
  if (!alt) return undefined;
  return {
    src: `/api/storage/public-objects?path=${encodeURIComponent(`careerreality/articles/${slug}.jpg`)}`,
    alt,
  };
}

export const articleHeroImageCount = Object.keys(heroAltText).length;
