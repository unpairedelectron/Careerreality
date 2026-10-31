import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDeterministicAuthFixtureChecks } from './test-auth-fixtures.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

const [keyboardCompat, authScreen, signIn, signUp, packageJson] = await Promise.all([
  read('components/KeyboardAwareScrollViewCompat.tsx'),
  read('components/auth-screen.tsx'),
  read('app/sign-in.tsx'),
  read('app/sign-up.tsx'),
  read('package.json'),
]);

assert.match(
  packageJson,
  /"test:auth-keyboard":\s*"node scripts\/test-auth-keyboard\.mjs"/,
  'the mobile package needs a repeatable auth keyboard smoke-test command',
);

assert.match(
  keyboardCompat,
  /export const AUTH_KEYBOARD_BOTTOM_OFFSET = 24;/,
  'auth screens must use one shared bottom offset',
);
assert.match(
  keyboardCompat,
  /export const AUTH_KEYBOARD_EXTRA_SPACE = 28;/,
  'auth screens must use one shared extra keyboard space',
);
assert.match(
  keyboardCompat,
  /keyboardShouldPersistTaps = 'handled'/,
  'primary actions must remain tappable while the keyboard is open',
);
assert.match(
  keyboardCompat,
  /bottomOffset = AUTH_KEYBOARD_BOTTOM_OFFSET/,
  'the shared keyboard offset must be applied by the compatibility wrapper',
);
assert.match(
  keyboardCompat,
  /disableScrollOnKeyboardHide = true/,
  'focused inputs must remain recoverable after the keyboard is dismissed',
);

for (const selector of [
  'auth-screen',
  'auth-scroll',
  'auth-input-code',
  'auth-error',
  'auth-primary-action',
  'auth-secondary-action',
]) {
  assert.match(
    authScreen,
    new RegExp(`['"]${selector}['"]`),
    `auth screens need the shared ${selector} smoke-test selector`,
  );
}

assert.match(
  authScreen,
  /testID=\{props\.testID \?\? AUTH_TEST_IDS\.input\(label\)\}/,
  'focused text inputs must expose a shared label-based selector',
);
assert.match(
  authScreen,
  /accessibilityLabel=\{props\.accessibilityLabel \?\? label\}/,
  'the focused input must remain recoverable by its accessible label',
);
assert.match(
  authScreen,
  /accessibilityRole="alert"/,
  'validation errors must be exposed as an alert to the smoke test',
);

const stateChecks = [
  {
    name: 'sign-up',
    source: signUp,
    patterns: [
      /title=\{verificationSent \? 'Check your inbox\.'/,
      /const result = await signUp\.password\(\{ emailAddress, password \}\);/,
      /const codeResult = await signUp\.verifications\.sendEmailCode\(\);/,
      /const result = await signUp\.verifications\.verifyEmailCode\(\{ code \}\);/,
      /setVerificationSent\(true\);/,
      /<AuthCodeInput/,
      /<AuthError message=\{error\} \/>/,
      /Create account/,
      /Verify account/,
      /const resendVerificationCode = async \(\) =>/,
      /const result = await signUp\.verifications\.sendEmailCode\(\);/,
      /setActionError\(getErrorMessage\(result\.error\)\);/,
      /onPress=\{\(\) => void resendVerificationCode\(\)\}/,
    ],
  },
  {
    name: 'forgot-password',
    source: signIn,
    patterns: [
      /type SignInMode = 'password' \| 'forgot-email'/,
      /title: 'A fresh start is close\.'/,
      /const result = await signIn\.create\(\{ identifier: emailAddress \}\);/,
      /const codeResult = await signIn\.resetPasswordEmailCode\.sendCode\(\);/,
      /setMode\('forgot-code'\);/,
      /const result = await signIn\.resetPasswordEmailCode\.verifyCode\(\{ code \}\);/,
      /setMode\('forgot-password'\);/,
      /const resendRecoveryCode = async \(\) =>/,
      /const result = await signIn\.resetPasswordEmailCode\.sendCode\(\);/,
      /setActionError\(getErrorMessage\(result\.error\)\);/,
      /onPress=\{\(\) => void resendRecoveryCode\(\)\}/,
    ],
  },
  {
    name: 'password-reset',
    source: signIn,
    patterns: [
      /title: 'Choose a stronger password\.'/,
      /const result = await signIn\.resetPasswordEmailCode\.submitPassword\(/,
      /signOutOfOtherSessions: true/,
    ],
  },
];

for (const state of stateChecks) {
  for (const pattern of state.patterns) {
    assert.match(state.source, pattern, `${state.name} must remain in the auth keyboard smoke path`);
  }
}

assert.match(
  signIn,
  /<AuthButton disabled=\{!emailAddress\} loading=\{submitting\} onPress=\{startRecovery\}>/,
  'forgot-password must expose its primary action to the shared selector',
);
assert.match(
  signIn,
  /<AuthButton disabled=\{!newPassword \|\| !confirmPassword\} loading=\{submitting\} onPress=\{finishRecovery\}>/,
  'password-reset must expose its primary action to the shared selector',
);
assert.match(
  signIn,
  /<AuthError message=\{error\} \/>/,
  'recovery errors must remain visible while the keyboard is open',
);

await runDeterministicAuthFixtureChecks();

console.log(
  'Auth keyboard and deterministic Clerk fixture checks passed for sign-up, email verification, forgot-password, and password-reset states.',
);