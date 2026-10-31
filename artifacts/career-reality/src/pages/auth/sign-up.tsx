import { SignUp } from '@clerk/react';
import { useSeo } from '@/lib/seo';
import { AuthFrame } from '@/components/shared/auth-frame';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  useSeo({
    title: 'Create an account | CareerReality',
    description: 'Create a CareerReality account for private saved decisions and watchlists.',
    path: '/sign-up',
    noIndex: true,
  });

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