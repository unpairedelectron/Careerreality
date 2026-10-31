const fs = require('fs');
const path = require('path');

const PLATFORM_MANIFEST_PATHS = Object.freeze({
  ios: '/ios/manifest.json',
  android: '/android/manifest.json',
});

function resolveStaticPath(staticRoot, requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  if (decodedPath.includes('\0') || decodedPath.includes('\\')) return null;

  const root = path.resolve(staticRoot);
  const relativeRequestPath = decodedPath.replace(/^\/+/, '');
  const candidate = path.resolve(root, relativeRequestPath);
  const relativePath = path.relative(root, candidate);

  if (
    path.isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`)
  ) {
    return null;
  }

  return candidate;
}

function isPathInsideRoot(root, candidate) {
  const relativePath = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relativePath === '' ||
    (!path.isAbsolute(relativePath) &&
      relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`))
  );
}

function resolveRealStaticPath(staticRoot, requestPath) {
  const candidate = resolveStaticPath(staticRoot, requestPath);
  if (!candidate) return null;

  try {
    const realRoot = fs.realpathSync(staticRoot);
    const realCandidate = fs.realpathSync(candidate);
    return isPathInsideRoot(realRoot, realCandidate) ? realCandidate : null;
  } catch {
    return null;
  }
}

function resolvePlatformManifestPath(staticRoot, platform) {
  if (platform !== 'ios' && platform !== 'android') return null;
  return resolveRealStaticPath(staticRoot, PLATFORM_MANIFEST_PATHS[platform]);
}

module.exports = {
  isPathInsideRoot,
  resolvePlatformManifestPath,
  resolveRealStaticPath,
  resolveStaticPath,
};
