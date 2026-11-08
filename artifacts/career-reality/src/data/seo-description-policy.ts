const genericEditorialDescription = /a concise editorial brief\b/i;

export function assertAuthoredDescription(description: string | undefined, route: string): asserts description is string {
  if (!description?.trim() || genericEditorialDescription.test(description)) {
    throw new Error(`Missing an article-specific description on ${route}; generic editorial fallback copy is not allowed.`);
  }
}

export function assertPublicRouteDescription(route: {
  path: string;
  kind: string;
  indexability: string;
  description: string;
}): void {
  if (route.indexability !== "indexable") return;
  assertAuthoredDescription(route.description, route.path);
  // Legal and trust pages should be concise rather than padded to fit a snippet.
  if (route.kind === "trust") return;
  const length = route.description.trim().length;
  if (length < 150 || length > 158) {
    throw new Error(`Meta description on ${route.path} is ${length} characters; expected 150–158.`);
  }
}
