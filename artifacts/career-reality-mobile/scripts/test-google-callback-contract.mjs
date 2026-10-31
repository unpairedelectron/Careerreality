import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function getRedirectOptions(source, screenName) {
  const match = source.match(
    /AuthSession\.makeRedirectUri\(\{\s*([\s\S]*?)\s*\}\)/,
  );

  assert.ok(
    match,
    `Google callback contract changed: ${screenName} no longer defines AuthSession.makeRedirectUri options`,
  );

  return normalize(match[1]);
}

function assertGoogleFlow(source, screenName, intent) {
  assert.match(
    source,
    /strategy:\s*['"]oauth_google['"]/,
    `Google callback contract changed: ${screenName} no longer starts the oauth_google flow`,
  );
  assert.match(
    source,
    new RegExp(
      `redirectUrl:\\s*getAuthRedirectUrl\\(['"]${intent}['"]\\)`,
    ),
    `Google callback contract changed: ${screenName} must use the ${intent} redirect intent`,
  );
}

const [layout, signIn, signUp, appConfig] = await Promise.all([
  read('app/_layout.tsx'),
  read('app/sign-in.tsx'),
  read('app/sign-up.tsx'),
  read('app.json'),
]);

let parsedAppConfig;
try {
  parsedAppConfig = JSON.parse(appConfig);
} catch (error) {
  throw new Error(
    `Google callback contract changed: app.json is not valid JSON (${error.message})`,
  );
}

assert.equal(
  parsedAppConfig.expo?.scheme,
  'career-reality-mobile',
  'Google callback contract changed: Expo scheme must remain career-reality-mobile',
);
assert.match(
  layout,
  /<Stack\.Screen name="sso-callback"/,
  'Google callback contract changed: app/_layout.tsx must register the sso-callback route',
);

const signInRedirectOptions = getRedirectOptions(signIn, 'sign-in');
const signUpRedirectOptions = getRedirectOptions(signUp, 'sign-up');
assert.equal(
  signInRedirectOptions,
  signUpRedirectOptions,
  'Google callback contract changed: sign-in and sign-up redirect options must be identical',
);
assert.match(
  signInRedirectOptions,
  /scheme:\s*Platform\.OS === ['"]web['"] \? undefined : ['"]career-reality-mobile['"]/,
  'Google callback contract changed: native redirect scheme must remain career-reality-mobile',
);
assert.match(
  signInRedirectOptions,
  /path:\s*['"]sso-callback['"]/,
  'Google callback contract changed: redirect path must remain sso-callback',
);

assertGoogleFlow(signIn, 'sign-in', 'sign-in');
assertGoogleFlow(signUp, 'sign-up', 'sign-up');

console.log('Google callback contract checks passed.');