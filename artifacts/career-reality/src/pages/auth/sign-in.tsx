import { SignIn } from '@clerk/react';
import { useLocation } from 'wouter';
import { Link } from '@/components/shared/app-link';
import { Logo } from '@/components/shared/app-nav';
import { useAppAuth } from '@/lib/app-auth-context';
import { useSeo } from '@/lib/seo';
import { AuthFrame } from '@/components/shared/auth-frame';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  useSeo({
    title: 'Sign in | CareerReality',
    description: 'Sign in to access your private CareerReality workspace.',
    path: '/sign-in',
    noIndex: true,
  });
  const requestedRedirect = new URLSearchParams(window.location.search).get('redirect_url');
  const redirectPath = requestedRedirect?.startsWith('/') ? requestedRedirect : '/workspace';
  const [, setLocation] = useLocation();
  const { signIn } = useAppAuth();

  if (
    import.meta.env.VITE_E2E === "true" ||
    import.meta.env.VITE_E2E_AUTH_RUNTIME === "true"
  ) {
    return (
      <div className="grain min-h-[100dvh] flex flex-col">
        <header className="flex items-center justify-between px-5 sm:px-8 h-[72px] border-b border-border bg-background/90 backdrop-blur-md">
          <Logo />
          <Link href="/" className="text-[11px] font-bold text-muted-foreground">Back to desk</Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-data text-[10px] uppercase tracking-[.18em] text-primary">Test sign-in</p>
            <h1 className="mt-3 font-display text-3xl">Welcome back</h1>
            <p className="mt-3 text-sm text-muted-foreground">Continue to the page that asked you to sign in.</p>
            <button
              type="button"
              data-testid="button-e2e-sign-in"
              onClick={() => {
                signIn();
                setLocation(redirectPath);
              }}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
            >
              Continue
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthFrame
      description="A private place to make better career decisions—with evidence, context, and a clearer next move in one view."
      eyebrow="WELCOME BACK"
      title="Make your next move with clarity."
    >
      <div className="animate-enter">
        <SignIn 
          routing="path" 
          path={`${basePath}/sign-in`} 
          signUpUrl={`${basePath}/sign-up`} 
          forceRedirectUrl={`${basePath}${redirectPath}`}
        />
      </div>
    </AuthFrame>
  );
}