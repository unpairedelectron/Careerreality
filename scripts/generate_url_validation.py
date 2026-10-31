#!/usr/bin/env python3
"""Combine reviewed URL decisions, built static output, and read-only production observations."""

import argparse
import csv
import html
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OBSERVATIONS = Path("/tmp/career-reality-production-readonly-current.json")
DEFAULT_DECISIONS = WORKSPACE_ROOT / "docs/work/URL_DECISIONS.csv"
DEFAULT_DIST = WORKSPACE_ROOT / "artifacts/career-reality/dist/public"
DEFAULT_OUTPUT = WORKSPACE_ROOT / "docs/work/URL_VALIDATION.csv"


def normalized_path(path: str) -> str:
    return path.rstrip("/") or "/"


def strip_base_path(path: str, base_path: str) -> str:
    base = base_path.rstrip("/")
    if base and path == base:
        return "/"
    if base and path.startswith(base + "/"):
        return path[len(base) :]
    return path


def read_local_state(dist_root: Path, routes: list[str], base_path: str) -> tuple[set[str], dict[str, int], set[str]]:
    if not dist_root.is_dir():
        return set(), {}, set()

    sitemap_path = dist_root / "sitemap.xml"
    sitemap_paths: set[str] = set()
    if sitemap_path.exists():
        sitemap = sitemap_path.read_text(encoding="utf-8")
        for loc in re.findall(r"<loc>(.*?)</loc>", sitemap, re.IGNORECASE | re.DOTALL):
            sitemap_paths.add(normalized_path(urlparse(html.unescape(loc.strip())).path))

    link_counts = {normalized_path(route): 0 for route in routes}
    retired = set(link_counts)
    for file in dist_root.rglob("*.html"):
        source = file.read_text(encoding="utf-8", errors="replace")
        for match in re.finditer(r"<a\b[^>]*\bhref\s*=\s*(['\"])(.*?)\1", source, re.IGNORECASE | re.DOTALL):
            href = html.unescape(match.group(2).strip())
            parsed = urlparse(href)
            if parsed.scheme and parsed.scheme not in {"http", "https"}:
                continue
            pathname = strip_base_path(parsed.path or "/", base_path)
            candidate = normalized_path(pathname)
            if candidate in retired:
                link_counts[candidate] += 1

    snapshots: set[str] = set()
    for route in routes:
        relative = route.strip("/")
        snapshot = dist_root / relative / "index.html" if relative else dist_root / "index.html"
        if snapshot.is_file():
            snapshots.add(normalized_path(route))
    return snapshots, link_counts, sitemap_paths


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--observations", type=Path, default=DEFAULT_OBSERVATIONS)
    parser.add_argument("--decisions", type=Path, default=DEFAULT_DECISIONS)
    parser.add_argument("--dist", type=Path, default=DEFAULT_DIST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--base-path", default=os.environ.get("BASE_PATH", "/"))
    args = parser.parse_args()

    observations = json.loads(args.observations.read_text(encoding="utf-8"))
    production_by_path = {
        normalized_path(urlparse(item.get("requestedUrl", "")).path): item
        for item in observations.get("routes", [])
    }
    with args.decisions.open(encoding="utf-8", newline="") as source:
        decisions = list(csv.DictReader(source))
    if len(decisions) != 80:
        raise SystemExit(f"Expected 80 reviewed URL decisions, found {len(decisions)}")

    routes = [row["old_url"].strip() for row in decisions]
    snapshots, link_counts, sitemap_paths = read_local_state(args.dist, routes, args.base_path)
    fields = [
        "url",
        "intended_action",
        "redirect_target",
        "decision_reason",
        "production_checked_at_utc",
        "production_checked_host",
        "production_status",
        "production_final_url",
        "production_robots",
        "production_canonical",
        "production_canonical_path_match",
        "production_last_modified",
        "production_cache_control",
        "production_body_sha256",
        "production_body_bytes",
        "production_redirect_count",
        "local_snapshot_present",
        "local_sitemap_present",
        "local_internal_link_count",
        "local_http_status",
        "release_status",
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        for decision, route in zip(decisions, routes, strict=True):
            route_key = normalized_path(route)
            production = production_by_path.get(route_key, {})
            requested_url = production.get("requestedUrl", "")
            canonical = production.get("canonical", "")
            canonical_path_match = (
                "missing"
                if not canonical
                else (
                    "match"
                    if normalized_path(urlparse(requested_url).path)
                    == normalized_path(urlparse(canonical).path)
                    else "mismatch"
                )
            )
            writer.writerow(
                {
                    "url": route,
                    "intended_action": decision.get("action", ""),
                    "redirect_target": decision.get("target", ""),
                    "decision_reason": decision.get("reason", ""),
                    "production_checked_at_utc": observations.get("capturedAt", ""),
                    "production_checked_host": urlparse(requested_url).netloc,
                    "production_status": production.get("status", "not observed"),
                    "production_final_url": production.get("finalUrl", ""),
                    "production_robots": production.get("robots", ""),
                    "production_canonical": canonical,
                    "production_canonical_path_match": canonical_path_match,
                    "production_last_modified": production.get("headers", {}).get("last-modified", ""),
                    "production_cache_control": production.get("headers", {}).get("cache-control", ""),
                    "production_body_sha256": production.get("bodySha256", ""),
                    "production_body_bytes": production.get("bodyBytes", ""),
                    "production_redirect_count": len(production.get("redirects", [])),
                    "local_snapshot_present": route_key in snapshots,
                    "local_sitemap_present": route_key in sitemap_paths,
                    "local_internal_link_count": link_counts.get(route_key, 0),
                    "local_http_status": "not tested; static output is not an HTTP response",
                    "release_status": "blocked; production remains unchanged and must be checked after an approved publish",
                }
            )
    print(
        f"Wrote {len(decisions)} route validations to {args.output}; "
        f"{len(snapshots)} local snapshots, {sum(link_counts.values())} local links, "
        f"{sum(route in sitemap_paths for route in routes)} local sitemap entries."
    )


if __name__ == "__main__":
    main()
