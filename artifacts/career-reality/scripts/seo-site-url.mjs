const SITE_URL_ENV_KEYS = ["SITE_URL", "VITE_SITE_URL"];

export function getSiteUrl(env = process.env) {
  const configured = SITE_URL_ENV_KEYS.map((key) => env[key]?.trim()).find(Boolean);
  if (!configured) {
    throw new Error("Missing SITE_URL (or VITE_SITE_URL). Production SEO output requires the canonical CareerReality origin.");
  }

  let parsed;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("Invalid SITE_URL. Use an absolute http(s) origin.");
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Invalid SITE_URL. Use an absolute http(s) origin without credentials, paths, query parameters, or fragments.");
  }

  return parsed.origin;
}