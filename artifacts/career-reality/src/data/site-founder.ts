/**
 * Single source of truth for the person behind CareerReality.
 * Used by the /team page, guide bylines, and Person / Article JSON-LD (hydrated and crawler snapshots).
 *
 * sameAs: add full public profile URLs (LinkedIn, GitHub, X, etc.) here. Only list profiles
 * the founder controls; they are emitted verbatim in Person and Organization structured data.
 */
export const SITE_FOUNDER = {
  name: "Shiv Shakti Mishra",
  alternateName: "Shiv Mishra",
  slugId: "shiv-mishra",
  jobTitle: "Founder, CareerReality",
  profession: "Machine learning / AI engineer",
  shortBio:
    "Founder of CareerReality and an ML/AI engineer by profession. Designs, builds, tests and writes every tool and guide on the site.",
  knowsAbout: [
    "Machine learning",
    "Artificial intelligence",
    "Software engineering",
    "Salary and CTC structures in India",
    "Career decision-making",
    "Product design",
  ],
  sameAs: ["https://www.linkedin.com/in/shivmishra1408"] as string[],
} as const;

export function founderPersonId(siteUrl: string) {
  return `${siteUrl.replace(/\/+$/, "")}/team/#${SITE_FOUNDER.slugId}`;
}

/** Full Person node — emitted only on /team, referenced by @id everywhere else. */
export function createFounderPerson(siteUrl: string) {
  const origin = siteUrl.replace(/\/+$/, "");
  return {
    "@type": "Person",
    "@id": founderPersonId(origin),
    name: SITE_FOUNDER.name,
    alternateName: SITE_FOUNDER.alternateName,
    url: `${origin}/team/`,
    jobTitle: SITE_FOUNDER.jobTitle,
    description: SITE_FOUNDER.shortBio,
    knowsAbout: [...SITE_FOUNDER.knowsAbout],
    worksFor: { "@id": `${origin}/#organization` },
    ...(SITE_FOUNDER.sameAs.length ? { sameAs: [...SITE_FOUNDER.sameAs] } : {}),
  };
}

/** Compact author reference for Article schema on guides. */
export function createFounderAuthor(siteUrl: string) {
  const origin = siteUrl.replace(/\/+$/, "");
  return {
    "@type": "Person",
    "@id": founderPersonId(origin),
    name: SITE_FOUNDER.name,
    url: `${origin}/team/`,
  };
}
