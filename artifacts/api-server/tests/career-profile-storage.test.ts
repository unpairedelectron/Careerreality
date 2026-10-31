import assert from "node:assert/strict";
import test from "node:test";
import {
  careerAccountScope,
  careerStorageKey,
  omitResumeUri,
} from "../../career-reality-mobile/context/career-profile-storage";

test("removes the selected local resume URI before profile persistence", () => {
  const localUri = "file:///private/var/mobile/Containers/Data/resume.pdf";
  const persisted = omitResumeUri({
    name: "Shiv",
    resumeName: "resume.pdf",
    resumeUri: localUri,
  });

  assert.deepEqual(persisted, {
    name: "Shiv",
    resumeName: "resume.pdf",
  });
  assert.equal("resumeUri" in persisted, false);
  assert.equal(JSON.stringify(persisted).includes(localUri), false);
});

test("career data storage keys are isolated by signed-in account", () => {
  const profileKey = "@careerreality/profile";
  assert.notEqual(
    careerStorageKey(profileKey, careerAccountScope("user-a")),
    careerStorageKey(profileKey, careerAccountScope("user-b")),
  );
  assert.equal(
    careerStorageKey(profileKey, careerAccountScope("user-a")),
    `${profileKey}/clerk-user%3Auser-a`,
  );
});