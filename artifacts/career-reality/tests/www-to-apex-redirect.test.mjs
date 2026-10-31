import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const samples = [
  ["/", "?utm_source=host-redirect-test"],
  ["/guides/read-the-offer-beyond-ctc/", "?ref=article-test"],
  ["/companies/", "?source=company-test"],
  ["/salary-calculator/", "?utm_campaign=tool-test&view=monthly"],
  ["/offer-comparison/", "?source=tool-test"],
];

let child;
let port;

function request(host, pathname) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({
      host: "127.0.0.1",
      port,
      path: pathname,
      method: "GET",
      headers: { host },
    }, (response) => {
      response.resume();
      response.once("end", () => resolve(response));
    });
    req.once("error", reject);
    req.end();
  });
}

test.before(async () => {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  port = reservation.address().port;
  await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()));

  child = spawn(process.execPath, ["scripts/serve-published.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), BASE_PATH: "/" },
    stdio: "ignore",
  });

  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Published server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual" });
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await delay(100);
    }
  }
  assert.equal(ready, true, "published static server should start");
});

test.after(() => {
  child?.kill("SIGTERM");
});

for (const [pathname, query] of samples) {
  test(`redirects www ${pathname} to the matching apex URL in one hop`, async () => {
    const wwwResponse = await request("www.careerreality.in", `${pathname}${query}`);
    const expectedLocation = `https://careerreality.in${pathname}${query}`;
    assert.equal(wwwResponse.statusCode, 301);
    assert.equal(wwwResponse.headers.location, expectedLocation);

    const destination = new URL(expectedLocation);
    const apexResponse = await request("careerreality.in", `${destination.pathname}${destination.search}`);
    assert.equal(apexResponse.statusCode, 200, "apex destination should serve directly without another redirect");
    assert.equal(apexResponse.headers.location, undefined, "apex destination must not redirect back");
  });
}

test("keeps the apex host unchanged", async () => {
  const response = await request("careerreality.in", "/salary-calculator/?from=apex");
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.location, undefined);
});
