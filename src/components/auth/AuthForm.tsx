'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/shared/toast-store';
import {
  DEMO_CREDENTIALS,
  getServerAuthSnapshot,
  hydrateAuthStore,
  readAuthState,
  signIn,
  signInWithDemo,
  signUp,
  subscribeAuth,
} from '@/lib/auth-store';

type AuthMode = 'sign-in' | 'sign-up';

const DEFAULT_REDIRECT = '/app';

/** Only allow internal, same-origin paths to prevent open-redirects. */
function sanitizeRedirect(value: string | null): string {
  if (!value) return DEFAULT_REDIRECT;
  if (!value.startsWith('/') || value.startsWith('//')) return DEFAULT_REDIRECT;
  return value;
}

const copy: Record<
  AuthMode,
  { title: string; subtitle: string; submitLabel: string; pendingLabel: string }
> = {
  'sign-in': {
    title: 'Welcome back',
    subtitle: 'Sign in to reach your boards and creative direction.',
    submitLabel: 'Sign in',
    pendingLabel: 'Signing in…',
  },
  'sign-up': {
    title: 'Create your workspace',
    subtitle: 'Set up an account to start building moodboards.',
    submitLabel: 'Create account',
    pendingLabel: 'Creating account…',
  },
};

const MODE_TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'sign-in', label: 'Sign in' },
  { mode: 'sign-up', label: 'Create account' },
];

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errorRef = useRef<HTMLParagraphElement>(null);
  const fieldIds = useId();
  const nameId = `${fieldIds}-name`;
  const emailId = `${fieldIds}-email`;
  const passwordId = `${fieldIds}-password`;
  const errorId = `${fieldIds}-error`;

  const text = copy[mode];

  useEffect(() => {
    hydrateAuthStore();
  }, []);

  useEffect(() => {
    if (auth.status === 'authenticated') {
      router.replace(redirectTarget);
    }
  }, [auth.status, redirectTarget, router]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function handleModeChange(nextMode: AuthMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result =
      mode === 'sign-up'
        ? signUp({ name, email, password })
        : signIn({ email, password });

    if (result.ok) {
      showToast(mode === 'sign-up' ? 'Account created.' : 'Signed in.', 'success');
      router.replace(redirectTarget);
      return;
    }

    setError(result.error);
    setSubmitting(false);
  }

  function handleDemoSignIn() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = signInWithDemo();

    if (result.ok) {
      showToast('Signed in with the demo account.', 'success');
      router.replace(redirectTarget);
      return;
    }

    setError(result.error);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label="Choose sign in or create account"
        className="grid grid-cols-2 gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
      >
        {MODE_TABS.map((tab) => {
          const active = tab.mode === mode;
          return (
            <button
              key={tab.mode}
              type="button"
              onClick={() => handleModeChange(tab.mode)}
              aria-pressed={active}
              disabled={submitting}
              className={cn(
                'h-9 rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                active
                  ? 'bg-[var(--surface-elevated)] text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2 text-center">
          <h1
            className="text-3xl tracking-tight text-[var(--text-strong)]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {text.title}
          </h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">{text.subtitle}</p>
        </div>

        {error ? (
          <p
            ref={errorRef}
            id={errorId}
            tabIndex={-1}
            role="alert"
            className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          {mode === 'sign-up' ? (
            <div className="space-y-1.5">
              <label htmlFor={nameId} className="block text-sm font-medium text-[var(--text-strong)]">
                Name
              </label>
              <Input
                id={nameId}
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                required
                disabled={submitting}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-sm font-medium text-[var(--text-strong)]">
              Email
            </label>
            <Input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@studio.com"
              required
              disabled={submitting}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={passwordId} className="block text-sm font-medium text-[var(--text-strong)]">
              Password
            </label>
            <div className="relative">
              <Input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Your password'}
                required
                minLength={mode === 'sign-up' ? 6 : undefined}
                disabled={submitting}
                aria-describedby={error ? errorId : undefined}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={submitting}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-[var(--text-muted)] transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {text.pendingLabel}
            </>
          ) : (
            text.submitLabel
          )}
        </Button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">or</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="space-y-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleDemoSignIn}
            disabled={submitting}
          >
            <Sparkles className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            Explore with the demo account
          </Button>
          <p className="text-center text-xs leading-5 text-[var(--text-muted)]">
            Test credentials:{' '}
            <span className="font-medium text-[var(--text-strong)]">{DEMO_CREDENTIALS.email}</span>
            {' · '}
            <span className="font-medium text-[var(--text-strong)]">{DEMO_CREDENTIALS.password}</span>
          </p>
        </div>
      </form>
    </div>
  );
}
