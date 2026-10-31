#!/usr/bin/env python3
"""Generate a review-only near-duplicate candidate list from the original article archive."""

import csv
import html
import itertools
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "archive/articles"
OUTPUT = ROOT / "docs/work/NEAR_DUPLICATE_CANDIDATES.csv"
MIN_WORDS = 25
SHINGLE_SIZE = 5
JACCARD_THRESHOLD = 0.80


def strip_html(value: str) -> str:
    value = re.sub(r"(?is)<(script|style).*?</\1>", " ", value)
    return html.unescape(re.sub(r"(?s)<[^>]+>", "\n", value))


def normalize(value: str) -> tuple[str, list[str]]:
    words = re.findall(r"[a-z0-9]+", value.lower())
    return " ".join(words), words


def read_paragraphs() -> list[dict[str, object]]:
    paragraphs: list[dict[str, object]] = []
    for file in sorted(ARCHIVE.glob("*.json")):
        record = json.loads(file.read_text(encoding="utf-8"))
        slug = record.get("slug")
        body = record.get("body")
        if not isinstance(slug, str) or not isinstance(body, str):
            raise ValueError(f"Incomplete original article export: {file}")
        for index, paragraph in enumerate(re.split(r"\n\s*\n", strip_html(body))):
            normalized, words = normalize(paragraph)
            if len(words) < MIN_WORDS:
                continue
            shingles = {
                tuple(words[position : position + SHINGLE_SIZE])
                for position in range(len(words) - SHINGLE_SIZE + 1)
            }
            if shingles:
                paragraphs.append(
                    {
                        "slug": slug,
                        "index": index + 1,
                        "text": re.sub(r"\s+", " ", html.unescape(paragraph)).strip(),
                        "normalized": normalized,
                        "word_count": len(words),
                        "shingles": shingles,
                    }
                )
    return paragraphs


def main() -> None:
    paragraphs = read_paragraphs()
    postings: dict[tuple[str, ...], list[int]] = defaultdict(list)
    for paragraph_id, paragraph in enumerate(paragraphs):
        for shingle in paragraph["shingles"]:
            postings[shingle].append(paragraph_id)

    possible_pairs: set[tuple[int, int]] = set()
    for ids in postings.values():
        if len(ids) < 2:
            continue
        for left, right in itertools.combinations(ids, 2):
            if left != right:
                possible_pairs.add((left, right) if left < right else (right, left))

    rows = []
    for left_id, right_id in possible_pairs:
        left = paragraphs[left_id]
        right = paragraphs[right_id]
        if left["normalized"] == right["normalized"]:
            continue
        left_shingles = left["shingles"]
        right_shingles = right["shingles"]
        smaller = min(len(left_shingles), len(right_shingles))
        larger = max(len(left_shingles), len(right_shingles))
        if smaller / larger < JACCARD_THRESHOLD:
            continue
        intersection = len(left_shingles & right_shingles)
        union = len(left_shingles | right_shingles)
        score = intersection / union
        if score < JACCARD_THRESHOLD:
            continue
        same_article = left["slug"] == right["slug"]
        rows.append(
            {
                "candidate_type": "within-article" if same_article else "cross-article",
                "article_a": left["slug"],
                "paragraph_a": left["index"],
                "words_a": left["word_count"],
                "article_b": right["slug"],
                "paragraph_b": right["index"],
                "words_b": right["word_count"],
                "five_word_shingle_jaccard": f"{score:.4f}",
                "paragraph_a_excerpt": str(left["text"])[:280],
                "paragraph_b_excerpt": str(right["text"])[:280],
                "human_review_status": "REVIEW_REQUIRED",
                "human_classification": "",
                "human_notes": "",
            }
        )

    rows.sort(
        key=lambda row: (
            row["candidate_type"],
            row["article_a"],
            int(row["paragraph_a"]),
            row["article_b"],
            int(row["paragraph_b"]),
        )
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "candidate_type",
        "article_a",
        "paragraph_a",
        "words_a",
        "article_b",
        "paragraph_b",
        "words_b",
        "five_word_shingle_jaccard",
        "paragraph_a_excerpt",
        "paragraph_b_excerpt",
        "human_review_status",
        "human_classification",
        "human_notes",
    ]
    with OUTPUT.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    within = sum(row["candidate_type"] == "within-article" for row in rows)
    cross = len(rows) - within
    article_pairs = {
        tuple(sorted((str(row["article_a"]), str(row["article_b"]))))
        for row in rows
        if row["candidate_type"] == "cross-article"
    }
    print(
        f"{len(paragraphs)} paragraphs scanned; {len(rows)} review candidates "
        f"({cross} cross-article across {len(article_pairs)} article pairs; "
        f"{within} within-article). No semantic duplicate classifications were made."
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
