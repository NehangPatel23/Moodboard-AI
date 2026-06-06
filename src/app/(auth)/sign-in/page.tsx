import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthFormFallback } from '@/components/auth/AuthFormFallback';

export const metadata: Metadata = {
  title: 'Sign in · MoodBoard AI',
};

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm />
    </Suspense>
  );
}
