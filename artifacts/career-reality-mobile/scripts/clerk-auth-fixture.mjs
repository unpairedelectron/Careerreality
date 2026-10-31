const DEFAULT_FIXTURE_EMAIL = 'auth-fixture@careerreality.test';
const DEFAULT_FIXTURE_PASSWORD = 'FixturePassword!123';
const DEFAULT_VERIFICATION_CODE = '246810';
const DEFAULT_RECOVERY_CODE = '135790';

function clerkError(message) {
  return { error: { message } };
}

function result() {
  return { error: undefined };
}

function createState(initialState) {
  let state = { ...initialState };
  const events = [];

  return {
    get state() {
      return { ...state };
    },
    get events() {
      return [...events];
    },
    update(nextState, event) {
      state = { ...state, ...nextState };
      events.push(event);
    },
  };
}

/**
 * A small Clerk-shaped fixture for auth transition tests.
 *
 * It intentionally lives under scripts/ and is never imported by the app.
 * The method names and return shape mirror the subset used by the Expo
 * screens, so smoke tests can exercise the same transition contract without
 * contacting Clerk or sending mail.
 */
export function createSignUpFixture({
  emailAddress = DEFAULT_FIXTURE_EMAIL,
  verificationCode = DEFAULT_VERIFICATION_CODE,
  sendEmailCodeFailures = 0,
} = {}) {
  let remainingSendEmailCodeFailures = sendEmailCodeFailures;
  const fixture = createState({
    status: 'idle',
    emailAddress: undefined,
    password: undefined,
    emailCodeSent: false,
    finalized: false,
    resendCount: 0,
  });

  return {
    get status() {
      return fixture.state.status;
    },
    get state() {
      return fixture.state;
    },
    get events() {
      return fixture.events;
    },
    async password({ emailAddress: requestedEmail, password }) {
      if (requestedEmail !== emailAddress) return clerkError('Enter the fixture email address.');
      if (!password) return clerkError('Enter a password.');

      fixture.update(
        {
          status: 'needs_email_verification',
          emailAddress: requestedEmail,
          password,
        },
        'sign-up:password',
      );
      return result();
    },
    verifications: {
      async sendEmailCode() {
        if (fixture.state.status !== 'needs_email_verification') {
          return clerkError('Start sign-up before requesting an email code.');
        }
        if (remainingSendEmailCodeFailures > 0) {
          remainingSendEmailCodeFailures -= 1;
          return clerkError('We could not send a verification code. Please try again.');
        }

        fixture.update(
          {
            emailCodeSent: true,
            resendCount: fixture.state.resendCount + 1,
          },
          'sign-up:send-email-code',
        );
        return result();
      },
      async verifyEmailCode({ code }) {
        if (!fixture.state.emailCodeSent) return clerkError('Request an email code first.');
        if (code !== verificationCode) return clerkError('That verification code is not valid.');

        fixture.update({ status: 'complete' }, 'sign-up:verify-email-code');
        return result();
      },
    },
    async finalize() {
      if (fixture.state.status !== 'complete') {
        return clerkError('Verify the email address before finalizing sign-up.');
      }

      fixture.update({ finalized: true }, 'sign-up:finalize');
      return result();
    },
  };
}

export function createPasswordRecoveryFixture({
  emailAddress = DEFAULT_FIXTURE_EMAIL,
  recoveryCode = DEFAULT_RECOVERY_CODE,
  sendCodeFailures = 0,
} = {}) {
  let remainingSendCodeFailures = sendCodeFailures;
  const fixture = createState({
    status: 'idle',
    emailAddress: undefined,
    emailCodeSent: false,
    resendCount: 0,
    password: undefined,
    finalized: false,
  });

  return {
    get status() {
      return fixture.state.status;
    },
    get state() {
      return fixture.state;
    },
    get events() {
      return fixture.events;
    },
    async create({ identifier }) {
      if (identifier !== emailAddress) return clerkError('Enter the fixture email address.');

      fixture.update(
        { status: 'needs_password_reset', emailAddress: identifier },
        'password-recovery:create',
      );
      return result();
    },
    async reset() {
      fixture.update(
        {
          status: 'idle',
          emailAddress: undefined,
          emailCodeSent: false,
          password: undefined,
          finalized: false,
        },
        'password-recovery:reset',
      );
      return result();
    },
    resetPasswordEmailCode: {
      async sendCode() {
        if (fixture.state.status !== 'needs_password_reset') {
          return clerkError('Start password recovery before requesting a reset code.');
        }
        if (remainingSendCodeFailures > 0) {
          remainingSendCodeFailures -= 1;
          return clerkError('We could not send a reset code. Please try again.');
        }

        fixture.update(
          {
            emailCodeSent: true,
            resendCount: fixture.state.resendCount + 1,
          },
          'password-recovery:send-code',
        );
        return result();
      },
      async verifyCode({ code }) {
        if (!fixture.state.emailCodeSent) return clerkError('Request a reset code first.');
        if (code !== recoveryCode) return clerkError('That reset code is not valid.');

        fixture.update({ status: 'needs_new_password' }, 'password-recovery:verify-code');
        return result();
      },
      async submitPassword({ password, signOutOfOtherSessions }) {
        if (fixture.state.status !== 'needs_new_password') {
          return clerkError('Verify the reset code before choosing a password.');
        }
        if (!password) return clerkError('Enter a new password.');

        fixture.update(
          {
            status: 'complete',
            password,
            finalized: true,
            signOutOfOtherSessions: Boolean(signOutOfOtherSessions),
          },
          'password-recovery:submit-password',
        );
        return result();
      },
    },
  };
}

export const AUTH_FIXTURE_VALUES = {
  emailAddress: DEFAULT_FIXTURE_EMAIL,
  password: DEFAULT_FIXTURE_PASSWORD,
  verificationCode: DEFAULT_VERIFICATION_CODE,
  recoveryCode: DEFAULT_RECOVERY_CODE,
};