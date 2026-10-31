import assert from "node:assert/strict";
import test from "node:test";
import {
  PublicSignalSeedProvenanceError,
  seedPublicSignalData,
} from "../src/lib/seed-public-data.ts";

test("incomplete static seed catalog fails before any database writes", async () => {
  await assert.rejects(
    seedPublicSignalData(),
    (error: unknown) => {
      assert.ok(error instanceof PublicSignalSeedProvenanceError);
      assert.deepEqual(error.incompleteCounts, {
        salary: 360,
        companies: 26,
        layoffs: 6,
      });
      assert.match(error.message, /No records were written/u);
      return true;
    },
  );
});
