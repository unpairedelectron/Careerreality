import type { ComponentProps } from "react";
import { Link as WouterLink } from "wouter";
import { withTrailingSlash } from "@/lib/internal-href";

export { withTrailingSlash };

type AppLinkProps = ComponentProps<typeof WouterLink>;

/**
 * Drop-in replacement for wouter's `Link` that renders the canonical
 * trailing-slash URL for internal paths (`/tools` → `/tools/`). Routing is
 * unaffected: wouter route patterns match with and without the slash.
 */
export function AppLink(props: AppLinkProps) {
  const { href, to } = props as { href?: unknown; to?: unknown };
  const normalized = {
    ...props,
    ...(typeof href === "string" ? { href: withTrailingSlash(href) } : {}),
    ...(typeof to === "string" ? { to: withTrailingSlash(to) } : {}),
  } as AppLinkProps;
  return <WouterLink {...normalized} />;
}

export { AppLink as Link };
