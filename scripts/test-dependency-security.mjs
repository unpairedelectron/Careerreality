import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const workspace = (dir) => createRequire(path.join(root, dir, "package.json"));
const dependency = (require, name) => createRequire(require.resolve(name));
const mobile = workspace("artifacts/career-reality-mobile");
const web = workspace("artifacts/career-reality");
const api = workspace("artifacts/api-server");
const expo = dependency(mobile, "expo");

test("patched Zod preserves defaults, coercion, records, and validation errors", () => {
  const { z } = workspace("lib/api-zod")("zod");
  const schema = z.object({
    page: z.coerce.number().min(1).default(1),
    data: z.record(z.string(), z.unknown()),
  });
  assert.deepEqual(schema.parse({ data: { role: "Engineer" } }), {
    page: 1, data: { role: "Engineer" },
  });
  assert.equal(schema.parse({ page: "2", data: {} }).page, 2);
  const invalid = schema.safeParse({ page: 0, data: {} });
  assert.equal(invalid.success, false);
  assert.deepEqual(invalid.error.issues[0].path, ["page"]);
});

test("form resolvers handle both successful and rejected Zod 4 inputs", async () => {
  const { z } = web("zod");
  const { zodResolver } = web("@hookform/resolvers/zod");
  const resolve = zodResolver(z.object({ name: z.string().min(1) }));
  const options = { fields: {}, shouldUseNativeValidation: false };
  assert.deepEqual(await resolve({ name: "Engineer" }, {}, options), {
    values: { name: "Engineer" }, errors: {},
  });
  const invalid = await resolve({ name: "" }, {}, options);
  assert.equal(invalid.errors.name.type, "too_small");
  assert.deepEqual(invalid.values, {});
});

test("Expo Router's ESM query-string replacement preserves URL round trips", async () => {
  const router = dependency(mobile, "expo-router");
  const { default: queryString } = await import(router.resolve("query-string"));
  const encoded = queryString.stringify({ q: "career & salary", page: "2" });
  assert.deepEqual({ ...queryString.parse(encoded) }, {
    page: "2", q: "career & salary",
  });
  assert.doesNotThrow(() => queryString.parse("q=%E0%A4%A"));
});

test("patched Expo config loads the existing SDK 57 app", () => {
  const { getConfig } = expo("@expo/config");
  const { exp } = getConfig(path.join(root, "artifacts/career-reality-mobile"));
  assert.equal(typeof exp.name, "string");
  assert.equal(exp.slug, "career-reality-mobile");
});

test("updated xcode generates project IDs without the vulnerable uuid dependency", () => {
  const config = dependency(expo, "@expo/config");
  const plugins = dependency(config, "@expo/config-plugins");
  const xcode = plugins("xcode");
  const project = xcode.project("test.pbxproj");
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[0-9A-F]{24}$/);
});

test("glob and minimatch replacements retain config file matching", () => {
  const config = dependency(expo, "@expo/config");
  const globRequire = dependency(config, "glob");
  const { minimatch } = globRequire("minimatch");
  assert.equal(minimatch("app/(tabs)/index.tsx", "**/*.tsx"), true);
  assert.equal(minimatch("app/index.js", "**/*.tsx"), false);
  assert.deepEqual(config("glob").globSync("package.json", { cwd: root }), ["package.json"]);
});

test("patched Pino copier and query parser retain their runtime APIs", () => {
  const pretty = dependency(api, "pino-pretty");
  const original = { log: { message: "ok" }, values: [1, 2] };
  const copy = pretty("fast-copy").copy(original);
  assert.deepEqual(copy, original);
  assert.notEqual(copy.log, original.log);
  const express = dependency(api, "express");
  const qs = express("qs");
  assert.deepEqual(qs.parse("page=2&filter[role]=Engineer"), {
    page: "2", filter: { role: "Engineer" },
  });
  const parsed = qs.parse("__proto__[polluted]=yes&constructor[prototype][polluted]=yes");
  assert.equal(parsed.polluted, undefined);
  assert.equal({}.polluted, undefined);
});
