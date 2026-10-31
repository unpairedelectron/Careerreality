import assert from "node:assert/strict";
import test from "node:test";
import {
  companyDatasetMeta,
  companyQualityNotes,
} from "../src/lib/company-data-publication.ts";

test("public company metadata never discloses an unapproved score formula", () => {
  const publicText = [
    companyDatasetMeta.source,
    companyDatasetMeta.methodology,
    ...companyQualityNotes(0, 26),
  ].join(" ");

  assert.match(publicText, /remain unpublished/i);
  assert.match(publicText, /working source URL/i);
  assert.match(publicText, /published, versioned scoring method/i);
  assert.doesNotMatch(publicText, /arithmetic mean|momentum range|Building\s*>|stability average/i);
  assert.equal(companyQualityNotes(0, 26).length, 2);
});
