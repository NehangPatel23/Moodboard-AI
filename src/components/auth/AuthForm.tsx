'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Frown, Loader2, Smile, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/shared/toast-store';
import { setWelcomeSession, welcomeFirstName } from '@/lib/welcome-session';
import {
  authInputErrorClassName,
  getPasswordRequirements,
  hasAuthFieldErrors,
  isAuthFormValid,
  isValidEmail,
  passwordRequirementsMet,
  validateAuthField,
  validateAuthFields,
  type AuthFieldErrors,
} from '@/lib/auth-validation';
import {
  DEMO_CREDENTIALS,
  getServerAuthSnapshot,
  hydrateAuthStore,
  readAuthState,
  requestPasswordReset,
  signIn,
  signInWithDemo,
  signUp,
  subscribeAuth,
  updatePassword,
} from '@/lib/auth-store';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'update-password';

function resolveInitialMode(value: string | null): AuthMode {
  if (value === 'sign-up') return 'sign-up';
  if (value === 'update-password') return 'update-password';
  if (value === 'forgot-password') return 'forgot-password';
  return 'sign-in';
}

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
  'forgot-password': {
    title: 'Reset your password',
    subtitle: 'Enter your email and we will send a reset link.',
    submitLabel: 'Send reset link',
    pendingLabel: 'Sending link…',
  },
  'update-password': {
    title: 'Choose a new password',
    subtitle: 'Set a new password for your account.',
    submitLabel: 'Update password',
    pendingLabel: 'Updating password…',
  },
};

const MODE_TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'sign-in', label: 'Sign in' },
  { mode: 'sign-up', label: 'Create account' },
];

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="px-1 text-sm text-red-600">
      {message}
    </p>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--text-strong)]">
      {children}
      <span className="ml-0.5 text-red-500" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </label>
  );
}

function PasswordRequirements({
  id,
  password,
}: {
  id: string;
  password: string;
}) {
  const requirements = getPasswordRequirements(password);

  return (
    <ul
      id={id}
      className="grid grid-cols-1 gap-x-5 gap-y-2 px-1 sm:grid-cols-2"
      aria-live="polite"
    >
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className={cn(
            'flex items-start gap-2 text-xs leading-5 transition-colors',
            requirement.fullWidth && 'sm:col-span-2',
            requirement.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]',
          )}
        >
          {requirement.met ? (
            <Smile className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Frown className="mt-0.5 h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{requirement.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  const [mode, setMode] = useState<AuthMode>(resolveInitialMode(searchParams.get('mode')));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_callback'
      ? 'Sign-in or reset link expired or is invalid. Request a fresh link and open it in the same browser you used to sign in.'
      : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const errorRef = useRef<HTMLParagraphElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const fieldIds = useId();
  const nameId = `${fieldIds}-name`;
  const emailId = `${fieldIds}-email`;
  const passwordId = `${fieldIds}-password`;
  const nameErrorId = `${fieldIds}-name-error`;
  const emailErrorId = `${fieldIds}-email-error`;
  const passwordErrorId = `${fieldIds}-password-error`;
  const passwordRequirementsId = `${fieldIds}-password-requirements`;
  const errorId = `${fieldIds}-error`;

  const text = copy[mode];
  const formValues = { name, email, password };
  const canSubmit =
    mode === 'forgot-password'
      ? isValidEmail(email.trim())
      : mode === 'update-password'
        ? passwordRequirementsMet(password)
        : isAuthFormValid(mode, formValues);
  const showModeTabs = mode === 'sign-in' || mode === 'sign-up';
  const showDemo = showModeTabs;
  const showEmailField = mode !== 'update-password';
  const showPasswordField = mode !== 'forgot-password';
  const passwordDescribedBy = [
    mode === 'sign-up' || mode === 'update-password' ? passwordRequirementsId : null,
    fieldErrors.password ? passwordErrorId : null,
    !fieldErrors.password && error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;
  const nameDescribedBy = fieldErrors.name ? nameErrorId : error ? errorId : undefined;
  const emailDescribedBy = fieldErrors.email ? emailErrorId : error ? errorId : undefined;

  useEffect(() => {
    hydrateAuthStore();
  }, []);

  useEffect(() => {
    if (auth.status === 'authenticated' && mode !== 'update-password') {
      router.replace(redirectTarget);
    }
  }, [auth.status, mode, redirectTarget, router]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function clearFieldError(field: keyof AuthFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function syncSignInUrl(nextMode: AuthMode) {
    const params = new URLSearchParams();
    if (nextMode !== 'sign-in') {
      params.set('mode', nextMode);
    }
    if (redirectTarget !== DEFAULT_REDIRECT) {
      params.set('redirect', redirectTarget);
    }
    const query = params.toString();
    router.replace(query ? `/sign-in?${query}` : '/sign-in', { scroll: false });
  }

  function handleModeChange(nextMode: AuthMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError(null);
    setFieldErrors({});
    setResetEmailSent(false);
    if (nextMode === 'sign-in' || nextMode === 'sign-up' || nextMode === 'forgot-password') {
      syncSignInUrl(nextMode);
    }
  }

  async function submitPasswordReset(emailValue: string): Promise<boolean> {
    const trimmedEmail = emailValue.trim();
    if (!isValidEmail(trimmedEmail)) {
      setFieldErrors({ email: 'Enter a valid email address.' });
      setError(null);
      return false;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);

    const result = await requestPasswordReset(trimmedEmail);

    if (result.ok) {
      setResetEmailSent(true);
      showToast('Check your email for a reset link.', 'success');
      setSubmitting(false);
      return true;
    }

    setError(result.error);
    setSubmitting(false);
    return false;
  }

  async function handleForgotPasswordClick() {
    if (submitting) return;

    handleModeChange('forgot-password');

    if (isValidEmail(email.trim())) {
      await submitPasswordReset(email);
      return;
    }

    window.requestAnimationFrame(() => {
      emailInputRef.current?.focus();
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (mode === 'forgot-password') {
      await submitPasswordReset(email);
      return;
    }

    if (mode === 'update-password') {
      const nextFieldErrors = validateAuthFields('sign-up', { name: 'User', email: 'user@example.com', password });
      const passwordError = nextFieldErrors.password;
      if (passwordError) {
        setFieldErrors({ password: passwordError });
        setError(null);
        return;
      }

      setFieldErrors({});
      setSubmitting(true);
      setError(null);

      const result = await updatePassword(password);

      if (result.ok) {
        setWelcomeSession('sign-in', result.user.name);
        const firstName = welcomeFirstName(result.user.name);
        showToast(`Password updated. Welcome back, ${firstName}!`, 'success');
        router.refresh();
        router.replace(redirectTarget);
        return;
      }

      setError(result.error);
      setSubmitting(false);
      return;
    }

    const nextFieldErrors = validateAuthFields(mode, formValues);
    if (hasAuthFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setError(null);

    const result =
      mode === 'sign-up'
        ? await signUp({ name, email, password })
        : await signIn({ email, password });

    if (result.ok) {
      const kind = mode === 'sign-up' ? 'sign-up' : 'sign-in';
      setWelcomeSession(kind, result.user.name);
      const firstName = welcomeFirstName(result.user.name);
      showToast(
        kind === 'sign-up' ? `Welcome, ${firstName}!` : `Welcome back, ${firstName}!`,
        'success',
      );
      router.refresh();
      router.replace(redirectTarget);
      return;
    }

    setError(result.error);
    setSubmitting(false);
  }

  async function handleDemoSignIn() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const result = await signInWithDemo();

    if (result.ok) {
      setWelcomeSession('sign-in', result.user.name);
      const firstName = welcomeFirstName(result.user.name);
      showToast(`Welcome back, ${firstName}!`, 'success');
      router.refresh();
      router.replace(redirectTarget);
      return;
    }

    setError(result.error);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {showModeTabs ? (
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
      ) : null}

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

        <div className="space-y-4">
          {mode === 'sign-up' ? (
            <div className="space-y-1.5">
              <FieldLabel htmlFor={nameId}>Name</FieldLabel>
              <Input
                id={nameId}
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFieldError('name');
                }}
                onBlur={() => {
                  if (name.trim()) {
                    setFieldErrors((current) => ({
                      ...current,
                      name: validateAuthField('name', mode, formValues) ?? undefined,
                    }));
                  }
                }}
                placeholder="Ada Lovelace"
                disabled={submitting}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={nameDescribedBy}
                className={cn(fieldErrors.name && authInputErrorClassName)}
              />
              {fieldErrors.name ? <FieldError id={nameErrorId} message={fieldErrors.name} /> : null}
            </div>
          ) : null}

          {showEmailField ? (
            <div className="space-y-1.5">
              <FieldLabel htmlFor={emailId}>Email</FieldLabel>
              <Input
                ref={emailInputRef}
                id={emailId}
                name="email"
                type="text"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError('email');
                }}
                onBlur={() => {
                  if (email.trim()) {
                    setFieldErrors((current) => ({
                      ...current,
                      email: validateAuthField('email', 'sign-in', formValues) ?? undefined,
                    }));
                  }
                }}
                placeholder="you@studio.com"
                disabled={submitting}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={emailDescribedBy}
                className={cn(fieldErrors.email && authInputErrorClassName)}
              />
              {fieldErrors.email ? <FieldError id={emailErrorId} message={fieldErrors.email} /> : null}
              {mode === 'sign-in' ? (
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => void handleForgotPasswordClick()}
                    disabled={submitting}
                    className="text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {showPasswordField ? (
            <div className="space-y-1.5">
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
              <div className="relative">
                <Input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'sign-up' || mode === 'update-password' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError('password');
                  }}
                  onBlur={() => {
                    if (password) {
                      setFieldErrors((current) => ({
                        ...current,
                        password:
                          mode === 'sign-up' || mode === 'update-password'
                            ? validateAuthField('password', 'sign-up', formValues) ?? undefined
                            : validateAuthField('password', 'sign-in', formValues) ?? undefined,
                      }));
                    }
                  }}
                  placeholder={
                    mode === 'sign-up' || mode === 'update-password'
                      ? 'Create a password'
                      : 'Your password'
                  }
                  disabled={submitting}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={passwordDescribedBy}
                  className={cn('pr-11', fieldErrors.password && authInputErrorClassName)}
                />
                <Tooltip
                  content={showPassword ? 'Hide password' : 'Show password'}
                  triggerClassName="absolute inset-y-0 right-0 flex w-11 items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={submitting}
                    className="flex h-full w-full items-center justify-center rounded-r-2xl text-[var(--text-muted)] transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                    )}
                  </button>
                </Tooltip>
              </div>
              {mode === 'sign-up' || mode === 'update-password' ? (
                <PasswordRequirements id={passwordRequirementsId} password={password} />
              ) : null}
              {fieldErrors.password ? (
                <FieldError id={passwordErrorId} message={fieldErrors.password} />
              ) : null}
            </div>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting || !canSubmit || resetEmailSent}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {text.pendingLabel}
            </>
          ) : (
            text.submitLabel
          )}
        </Button>

        {mode === 'forgot-password' || mode === 'update-password' ? (
          <p className="text-center text-sm text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => handleModeChange('sign-in')}
              disabled={submitting}
              className="font-medium text-[var(--text-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Back to sign in
            </button>
          </p>
        ) : null}
      </form>

      {resetEmailSent ? (
        <p
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          Check your email for a password reset link. It may take a minute to arrive.
        </p>
      ) : null}

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

      {showDemo ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
