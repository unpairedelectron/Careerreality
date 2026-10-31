import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

const [layout, callback, authScreen, signIn, signUp, appConfig] = await Promise.all([
  read('app/_layout.tsx'),
  read('app/sso-callback.tsx'),
  read('components/auth-screen.tsx'),
  read('app/sign-in.tsx'),
  read('app/sign-up.tsx'),
  read('app.json'),
]);

assert.match(layout, /<Stack\.Screen name="sso-callback"/, 'the OAuth callback must be registered with Expo Router');
assert.match(callback, /testID="oauth-callback-screen"/, 'the callback screen needs a stable smoke-test target');
assert.match(callback, /needs another try\./, 'the callback must explain an interrupted handoff');
assert.match(
  callback,
  /Return to \{isSignUp \? 'sign up' : 'sign in'\}/,
  'the callback must expose a recovery action',
);
assert.match(callback, /testID="oauth-callback-retry"/, 'the callback recovery action needs a stable smoke-test target');
assert.match(callback, /router\.replace\('\/' as never\)/, 'a completed callback must return to the app entry route');
assert.match(
  callback,
  /const recoveryRoute = isSignUp \? '\/sign-up' : '\/sign-in';/,
  'an interrupted callback must choose the matching auth recovery route',
);
assert.match(
  callback,
  /router\.replace\(recoveryRoute as never\)/,
  'an interrupted callback must navigate to its recovery route',
);
assert.match(appConfig, /"scheme":\s*"career-reality-mobile"/, 'native OAuth needs a stable app scheme');
assert.match(authScreen, /testID=\{`social-\$\{provider\}`\}/, 'social actions need a stable smoke-test target');
assert.match(signIn, /finally\s*\{\s*setSocialLoading\(undefined\);\s*\}/, 'sign-in must clear social loading after every outcome');
assert.match(signUp, /finally\s*\{\s*setSocialLoading\(undefined\);\s*\}/, 'sign-up must clear social loading after every outcome');

console.log('Auth callback smoke checks passed.');