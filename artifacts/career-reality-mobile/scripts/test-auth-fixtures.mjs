import assert from 'node:assert/strict';
import {
  AUTH_FIXTURE_VALUES,
  createPasswordRecoveryFixture,
  createSignUpFixture,
} from './clerk-auth-fixture.mjs';

async function runSignUpFlow() {
  const signUp = createSignUpFixture();

  assert.equal(signUp.status, 'idle');
  assert.deepEqual(
    await signUp.password({
      emailAddress: AUTH_FIXTURE_VALUES.emailAddress,
      password: AUTH_FIXTURE_VALUES.password,
    }),
    { error: undefined },
  );
  assert.equal(signUp.status, 'needs_email_verification');

  await signUp.verifications.sendEmailCode();
  assert.equal(signUp.state.emailCodeSent, true);
  assert.equal(signUp.state.resendCount, 1);

  const invalidCode = await signUp.verifications.verifyEmailCode({ code: '000000' });
  assert.equal(invalidCode.error?.message, 'That verification code is not valid.');
  assert.equal(signUp.status, 'needs_email_verification');

  await signUp.verifications.sendEmailCode();
  assert.equal(signUp.state.resendCount, 2);
  await signUp.verifications.verifyEmailCode({ code: AUTH_FIXTURE_VALUES.verificationCode });
  assert.equal(signUp.status, 'complete');

  await signUp.finalize();
  assert.equal(signUp.state.finalized, true);
  assert.deepEqual(signUp.events, [
    'sign-up:password',
    'sign-up:send-email-code',
    'sign-up:send-email-code',
    'sign-up:verify-email-code',
    'sign-up:finalize',
  ]);
}

async function runPasswordRecoveryFlow() {
  const signIn = createPasswordRecoveryFixture();

  assert.equal(signIn.status, 'idle');
  await signIn.create({ identifier: AUTH_FIXTURE_VALUES.emailAddress });
  assert.equal(signIn.status, 'needs_password_reset');

  await signIn.resetPasswordEmailCode.sendCode();
  assert.equal(signIn.state.resendCount, 1);

  const invalidCode = await signIn.resetPasswordEmailCode.verifyCode({ code: '000000' });
  assert.equal(invalidCode.error?.message, 'That reset code is not valid.');
  assert.equal(signIn.status, 'needs_password_reset');

  await signIn.resetPasswordEmailCode.sendCode();
  assert.equal(signIn.state.resendCount, 2);
  await signIn.resetPasswordEmailCode.verifyCode({ code: AUTH_FIXTURE_VALUES.recoveryCode });
  assert.equal(signIn.status, 'needs_new_password');

  await signIn.resetPasswordEmailCode.submitPassword({
    password: AUTH_FIXTURE_VALUES.password,
    signOutOfOtherSessions: true,
  });
  assert.equal(signIn.status, 'complete');
  assert.equal(signIn.state.signOutOfOtherSessions, true);

  await signIn.reset();
  assert.equal(signIn.status, 'idle');
  assert.equal(signIn.state.emailCodeSent, false);
  assert.deepEqual(signIn.events, [
    'password-recovery:create',
    'password-recovery:send-code',
    'password-recovery:send-code',
    'password-recovery:verify-code',
    'password-recovery:submit-password',
    'password-recovery:reset',
  ]);
}

async function runSignUpSendFailureFlow() {
  const signUp = createSignUpFixture({ sendEmailCodeFailures: 1 });

  await signUp.password({
    emailAddress: AUTH_FIXTURE_VALUES.emailAddress,
    password: AUTH_FIXTURE_VALUES.password,
  });

  const failedSend = await signUp.verifications.sendEmailCode();
  assert.equal(
    failedSend.error?.message,
    'We could not send a verification code. Please try again.',
  );
  assert.equal(signUp.state.emailCodeSent, false);
  assert.equal(signUp.state.resendCount, 0);
  assert.deepEqual(signUp.events, ['sign-up:password']);

  const retriedSend = await signUp.verifications.sendEmailCode();
  assert.deepEqual(retriedSend, { error: undefined });
  assert.equal(signUp.state.emailCodeSent, true);
  assert.equal(signUp.state.resendCount, 1);

  await signUp.verifications.verifyEmailCode({
    code: AUTH_FIXTURE_VALUES.verificationCode,
  });
  await signUp.finalize();
  assert.equal(signUp.state.finalized, true);
}

async function runPasswordRecoverySendFailureFlow() {
  const signIn = createPasswordRecoveryFixture({ sendCodeFailures: 1 });

  await signIn.create({ identifier: AUTH_FIXTURE_VALUES.emailAddress });

  const failedSend = await signIn.resetPasswordEmailCode.sendCode();
  assert.equal(
    failedSend.error?.message,
    'We could not send a reset code. Please try again.',
  );
  assert.equal(signIn.state.emailCodeSent, false);
  assert.equal(signIn.state.resendCount, 0);
  assert.deepEqual(signIn.events, ['password-recovery:create']);

  const retriedSend = await signIn.resetPasswordEmailCode.sendCode();
  assert.deepEqual(retriedSend, { error: undefined });
  assert.equal(signIn.state.emailCodeSent, true);
  assert.equal(signIn.state.resendCount, 1);

  await signIn.resetPasswordEmailCode.verifyCode({
    code: AUTH_FIXTURE_VALUES.recoveryCode,
  });
  await signIn.resetPasswordEmailCode.submitPassword({
    password: AUTH_FIXTURE_VALUES.password,
    signOutOfOtherSessions: true,
  });
  assert.equal(signIn.status, 'complete');
}

export async function runDeterministicAuthFixtureChecks() {
  await runSignUpFlow();
  await runPasswordRecoveryFlow();
  await runSignUpSendFailureFlow();
  await runPasswordRecoverySendFailureFlow();

  const firstRun = createSignUpFixture();
  const secondRun = createSignUpFixture();
  for (const signUp of [firstRun, secondRun]) {
    await signUp.password({
      emailAddress: AUTH_FIXTURE_VALUES.emailAddress,
      password: AUTH_FIXTURE_VALUES.password,
    });
    await signUp.verifications.sendEmailCode();
    await signUp.verifications.verifyEmailCode({
      code: AUTH_FIXTURE_VALUES.verificationCode,
    });
  }
  assert.deepEqual(firstRun.state, secondRun.state);
  assert.deepEqual(firstRun.events, secondRun.events);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runDeterministicAuthFixtureChecks();
  console.log(
    'Deterministic Clerk fixture checks passed for email verification and password recovery.',
  );
}