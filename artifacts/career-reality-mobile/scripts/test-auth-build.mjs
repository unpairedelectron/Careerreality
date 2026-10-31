import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDeterministicAuthFixtureChecks } from './test-auth-fixtures.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticBuildRoot = path.join(projectRoot, 'static-build');

const requiredBundleMarkers = [
  ['auth-screen selector', 'auth-screen'],
  ['auth scroll selector', 'auth-scroll'],
  ['input selector factory', 'auth-input-'],
  ['code input selector', 'auth-input-code'],
  ['auth error selector', 'auth-error'],
  ['primary action selector', 'auth-primary-action'],
  ['secondary action selector', 'auth-secondary-action'],
  ['email field label', 'Email address'],
  ['password field label', 'Password'],
  ['confirm password field label', 'Confirm password'],
  ['new password field label', 'New password'],
  ['confirm new password field label', 'Confirm new password'],
  ['sign-up route', 'sign-up'],
  ['sign-in route', 'sign-in'],
  ['email verification action', 'sendEmailCode'],
  ['email verification transition', 'verifyEmailCode'],
  ['password recovery action', 'resetPasswordEmailCode'],
  ['password recovery transition', 'verifyCode'],
  ['password update transition', 'submitPassword'],
  ['sign-up finalization transition', 'finalize'],
  ['verification resend label', 'Send a new code'],
  ['recovery start label', 'Send reset code'],
  ['verification success label', 'Verify account'],
  ['recovery code success label', 'Verify code'],
  ['password reset success label', 'Update password'],
];

function parseTimestamp() {
  const timestampIndex = process.argv.indexOf('--timestamp');
  if (timestampIndex === -1) return undefined;

  const timestamp = process.argv[timestampIndex + 1];
  assert.ok(timestamp, 'Expected a value after --timestamp.');
  return timestamp;
}

function findLatestTimestamp() {
  const candidates = fs
    .readdirSync(staticBuildRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'ios' && entry.name !== 'android')
    .map((entry) => entry.name)
    .filter((entry) =>
      fs.existsSync(
        path.join(staticBuildRoot, entry, '_expo', 'static', 'js', 'ios', 'bundle.js'),
      ),
    )
    .sort();

  assert.ok(candidates.length > 0, 'No generated mobile bundle was found.');
  return candidates.at(-1);
}

function readPlatformBundle(timestamp, platform) {
  const bundlePath = path.join(
    staticBuildRoot,
    timestamp,
    '_expo',
    'static',
    'js',
    platform,
    'bundle.js',
  );
  assert.ok(fs.existsSync(bundlePath), `Missing generated ${platform} bundle.`);

  const bundle = fs.readFileSync(bundlePath, 'utf8');
  assert.ok(bundle.length > 0, `Generated ${platform} bundle is empty.`);
  return { bundle, bundlePath };
}

function checkBundleContract(bundle, platform) {
  for (const [description, marker] of requiredBundleMarkers) {
    assert.ok(
      bundle.includes(marker),
      `${platform} bundle is missing the ${description} (${marker}).`,
    );
  }
}

function checkManifest(timestamp, platform) {
  const manifestPath = path.join(staticBuildRoot, platform, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), `Missing generated ${platform} manifest.`);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const launchAssetUrl = manifest.launchAsset?.url;
  assert.equal(
    typeof launchAssetUrl,
    'string',
    `${platform} manifest must include a launch asset URL.`,
  );
  assert.match(
    launchAssetUrl,
    new RegExp(`${timestamp}/_expo/static/js/${platform}/bundle\\.js$`),
    `${platform} manifest must point at the bundle that was checked.`,
  );
}

async function main() {
  const timestamp = parseTimestamp() ?? findLatestTimestamp();

  await runDeterministicAuthFixtureChecks();

  for (const platform of ['ios', 'android']) {
    const { bundlePath, bundle } = readPlatformBundle(timestamp, platform);
    checkBundleContract(bundle, platform);
    checkManifest(timestamp, platform);
    console.log(`Verified ${platform} auth selectors and transitions in ${bundlePath}`);
  }

  console.log(
    `Built mobile auth checks passed for ${timestamp}: deterministic verification, resend, invalid-code, and password-reset transitions remain reachable.`,
  );
}

await main();