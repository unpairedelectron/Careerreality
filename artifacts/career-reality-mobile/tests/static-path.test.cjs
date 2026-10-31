const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  isPathInsideRoot,
  resolvePlatformManifestPath,
  resolveRealStaticPath,
  resolveStaticPath,
} = require('../server/static-path');

const root = path.resolve('/srv/career-reality/static-build');

test('resolves normal static paths beneath the build root', () => {
  assert.equal(
    resolveStaticPath(root, '/assets/main.js'),
    path.join(root, 'assets', 'main.js'),
  );
});

test('rejects encoded and literal traversal outside the build root', () => {
  assert.equal(resolveStaticPath(root, '/../server/serve.js'), null);
  assert.equal(resolveStaticPath(root, '/%2e%2e%2fserver%2fserve.js'), null);
  assert.equal(
    isPathInsideRoot(root, path.resolve(root, '..', 'static-build-secret')),
    false,
  );
});

test('rejects malformed encoding, null bytes, and backslash paths', () => {
  assert.equal(resolveStaticPath(root, '/%E0%A4%A'), null);
  assert.equal(resolveStaticPath(root, '/assets/%00secret'), null);
  assert.equal(resolveStaticPath(root, '/assets%5csecret'), null);
});

test('allows only a path whose resolved target remains under the root', () => {
  assert.equal(isPathInsideRoot(root, path.join(root, 'android', 'manifest.json')), true);
  assert.equal(isPathInsideRoot(root, path.resolve(root, '..', 'private.json')), false);
});

test('resolves only allowlisted platform manifests inside the static root', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'career-manifest-'));
  const staticRoot = path.join(tempRoot, 'static-build');
  fs.mkdirSync(path.join(staticRoot, 'ios'), { recursive: true });
  fs.mkdirSync(path.join(staticRoot, 'android'), { recursive: true });
  fs.writeFileSync(path.join(staticRoot, 'ios', 'manifest.json'), '{"platform":"ios"}');
  fs.writeFileSync(path.join(staticRoot, 'android', 'manifest.json'), '{"platform":"android"}');

  try {
    assert.equal(
      resolvePlatformManifestPath(staticRoot, 'ios'),
      path.join(staticRoot, 'ios', 'manifest.json'),
    );
    assert.equal(
      resolvePlatformManifestPath(staticRoot, 'android'),
      path.join(staticRoot, 'android', 'manifest.json'),
    );
    assert.equal(resolvePlatformManifestPath(staticRoot, '../private'), null);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('resolves real files and rejects symlinks that escape the static root', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'career-static-'));
  const staticRoot = path.join(tempRoot, 'static-build');
  const outsideFile = path.join(tempRoot, 'private.json');
  fs.mkdirSync(staticRoot);
  fs.writeFileSync(path.join(staticRoot, 'inside.json'), '{"ok":true}');
  fs.writeFileSync(outsideFile, '{"private":true}');
  fs.symlinkSync(outsideFile, path.join(staticRoot, 'outside.json'));

  try {
    assert.equal(
      resolveRealStaticPath(staticRoot, '/inside.json'),
      path.join(staticRoot, 'inside.json'),
    );
    assert.equal(resolveRealStaticPath(staticRoot, '/outside.json'), null);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
