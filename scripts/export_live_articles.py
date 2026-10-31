#!/usr/bin/env python3
"""Read-only export of the published CareerReality article corpus."""

import argparse
import concurrent.futures
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


USER_AGENT = "CareerRealityReadOnlyContentAudit/1.0"
ARTICLE_PATH = re.compile(r"^/article/([^/]+)/?$")


class ArticleIndexParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        href = dict(attrs).get("href", "")
        parsed = urlparse(href)
        if ARTICLE_PATH.fullmatch(parsed.path):
            self.paths.add(parsed.path.rstrip("/") + "/")


class PageMetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.metadata = {}
        self.article_depth = 0
        self.h1_depth = 0
        self.h1 = []
        self.time_values = []
        self.jsonld_depth = 0
        self.jsonld = []
        self.jsonld_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            name = (attrs.get("name") or attrs.get("property") or "").strip().lower()
            if name and attrs.get("content") is not None:
                self.metadata[name] = attrs["content"].strip()
        elif tag == "article":
            self.article_depth += 1
        elif tag == "h1" and self.article_depth:
            self.h1_depth += 1
        elif tag == "time" and self.article_depth:
            value = attrs.get("datetime")
            if value:
                self.time_values.append(value.strip())
        elif tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self.jsonld_depth += 1
            self.jsonld_parts = []

    def handle_endtag(self, tag):
        if tag == "h1" and self.h1_depth:
            self.h1_depth -= 1
        elif tag == "article" and self.article_depth:
            self.article_depth -= 1
        elif tag == "script" and self.jsonld_depth:
            self.jsonld_depth -= 1
            if self.jsonld_parts:
                self.jsonld.append("".join(self.jsonld_parts))
            self.jsonld_parts = []

    def handle_data(self, data):
        if self.h1_depth and data.strip():
            self.h1.append(data.strip())
        if self.jsonld_depth:
            self.jsonld_parts.append(data)


def fetch(url):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=40) as response:
        if response.status != 200:
            raise RuntimeError(f"{url} returned HTTP {response.status}")
        final_url = response.geturl()
        if urlparse(final_url).path.rstrip("/") != urlparse(url).path.rstrip("/"):
            raise RuntimeError(f"{url} redirected to {final_url}")
        return response.read().decode("utf-8", "replace")


def article_schema(parser):
    for raw in parser.jsonld:
        try:
            root = json.loads(raw)
        except json.JSONDecodeError:
            continue
        nodes = root.get("@graph", []) if isinstance(root, dict) else []
        if isinstance(root, dict):
            nodes = [root, *nodes]
        for node in nodes:
            if not isinstance(node, dict):
                continue
            kinds = node.get("@type", [])
            if isinstance(kinds, str):
                kinds = [kinds]
            if any(kind in ("Article", "NewsArticle", "BlogPosting") for kind in kinds):
                return node
    return {}


def schema_author(value):
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, dict):
        return (value.get("name") or "").strip() or None
    if isinstance(value, list):
        names = [schema_author(item) for item in value]
        names = [name for name in names if name]
        return ", ".join(names) if names else None
    return None


def export_one(base_url, path):
    url = urljoin(base_url, path)
    raw = fetch(url)
    parser = PageMetadataParser()
    parser.feed(raw)
    article = re.search(r"<article\b[^>]*>(.*?)</article>", raw, re.IGNORECASE | re.DOTALL)
    if not article:
        raise RuntimeError(f"{url} returned HTTP 200 without an article element")
    schema = article_schema(parser)
    title = " ".join(parser.h1).strip() or (schema.get("headline") or "").strip()
    description = parser.metadata.get("description", "").strip()
    if not title or not description:
        raise RuntimeError(f"{url} is missing its visible H1 or description")
    published = (
        schema.get("datePublished")
        or parser.metadata.get("article:published_time")
        or next((value for value in parser.time_values if value), None)
    )
    updated = schema.get("dateModified") or parser.metadata.get("article:modified_time")
    author = schema_author(schema.get("author")) or parser.metadata.get("author")
    slug = ARTICLE_PATH.fullmatch(path).group(1)
    return {
        "slug": slug,
        "title": html.unescape(title),
        "description": html.unescape(description),
        "body": article.group(1),
        "published": published,
        "updated": updated,
        "author": html.unescape(author).strip() if author else None,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True, help="Production URL returned by deployment metadata")
    parser.add_argument("--output", default="docs/work/articles.json")
    args = parser.parse_args()
    base_url = args.base_url.rstrip("/") + "/"
    if urlparse(base_url).scheme != "https" or not urlparse(base_url).netloc:
        parser.error("--base-url must be an HTTPS URL")

    index_url = urljoin(base_url, "articles/")
    index_raw = fetch(index_url)
    index_parser = ArticleIndexParser()
    index_parser.feed(index_raw)
    paths = sorted(index_parser.paths)
    if not paths:
        raise RuntimeError(f"No article URLs found in {index_url}")

    records = []
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(export_one, base_url, path): path for path in paths}
        for future in concurrent.futures.as_completed(futures):
            path = futures[future]
            try:
                records.append(future.result())
            except (HTTPError, URLError, RuntimeError, ValueError) as error:
                errors.append(f"{path}: {error}")
    if errors:
        raise RuntimeError("Article export incomplete:\n" + "\n".join(sorted(errors)))

    records.sort(key=lambda item: item["slug"])
    if len({item["slug"] for item in records}) != len(records):
        raise RuntimeError("Duplicate article slugs found in the production index")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "exported": len(records),
        "output": str(output),
        "articles_missing_published_date": sum(item["published"] is None for item in records),
        "articles_missing_updated_date": sum(item["updated"] is None for item in records),
        "articles_missing_author": sum(item["author"] is None for item in records),
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
