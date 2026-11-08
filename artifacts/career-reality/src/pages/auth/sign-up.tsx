import { SignUp } from '@clerk/react';
import { useSeo } from '@/lib/seo';
import { AuthFrame } from '@/components/shared/auth-frame';
import { useAppAuth } from '@/lib/app-auth-context';
import { useLocation } from 'wouter';
import { Link } from '@/components/shared/app-link';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  const { signIn } = useAppAuth();
  const [, setLocation] = useLocation();
  useSeo({
    title: 'Create an account | CareerReality',
    description: 'Create a CareerReality account for private saved decisions and watchlists.',
    path: '/sign-up',
    noIndex: true,
  });

  if (import.meta.env.VITE_E2E_AUTH_RUNTIME === "true") {
    return (
      <AuthFrame
        description="Start with a private career graph that turns scattered signals into a sharper next move."
        eyebrow="START WITH THE TRUTH"
        title="Build your career advantage."
      >
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-data text-[10px] uppercase tracking-[.18em] text-primary">Test sign-up</p>
          <button
            type="button"
            data-testid="button-e2e-sign-up"
            onClick={() => {
              signIn();
              setLocation("/workspace");
            }}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
          >
            Continue
          </button>
          <Link href="/sign-in" className="mt-4 inline-block text-xs text-muted-foreground">Already have an account? Sign in</Link>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      description="Start with a private career graph that turns scattered signals into a sharper next move."
      eyebrow="START WITH THE TRUTH"
      title="Build your career advantage."
    >
      <div className="animate-enter">
        <SignUp 
          routing="path" 
          path={`${basePath}/sign-up`} 
          signInUrl={`${basePath}/sign-in`} 
          forceRedirectUrl={`${basePath}/workspace`} 
        />
      </div>
    </AuthFrame>
  );
}