export const companyDatasetMeta = {
  dataset: "company_signals",
  source: "Company signals are withheld while their source evidence is reviewed.",
  methodology:
    "Company scores remain unpublished until each record has a working source URL, a source date, and a published, versioned scoring method.",
  confidence: "Mixed" as const,
};

export function companyQualityNotes(sampleSize: number, rejectedRows: number): string[] {
  return [
    ...(rejectedRows > 0
      ? [`${rejectedRows} row${rejectedRows === 1 ? "" : "s"} omitted because source evidence, a published scoring method, or required fields failed validation.`]
      : []),
    ...(sampleSize === 0
      ? ["No company records are published; rows without complete source and methodology evidence remain withheld."]
      : []),
  ];
}
