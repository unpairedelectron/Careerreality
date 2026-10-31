import { expect, test } from "./fixtures";

test("retired salary-reality paths directly redirect to offer comparison", async ({ request }) => {
  for (const path of [
    "/salary-reality",
    "/salary-reality/",
    "/salary-reality-check",
    "/salary-reality-check/",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(301);
    expect(response.headers().location, path).toBe("/offer-comparison/");
  }
});
