export const AUTH_PASSWORD_MIN_LENGTH = 8;

const PASSWORD_SPECIAL_CHAR_PATTERN = /[#.\-?!@$%^&*]/;

export type AuthMode = 'sign-in' | 'sign-up';

export type AuthFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export type AuthFormValues = {
  name: string;
  email: string;
  password: string;
};

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAuthField(
  field: keyof AuthFieldErrors,
  mode: AuthMode,
  values: AuthFormValues,
): string | null {
  return validateAuthFields(mode, values)[field] ?? null;
}

export function validateAuthFields(mode: AuthMode, values: AuthFormValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (mode === 'sign-up') {
    if (!values.name.trim()) {
      errors.name = 'Enter your name.';
    }
  }

  const trimmedEmail = values.email.trim();
  if (!trimmedEmail) {
    errors.email = 'Enter an email address.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = mode === 'sign-up' ? 'Enter a password.' : 'Enter your password.';
  } else if (mode === 'sign-up' && !passwordRequirementsMet(values.password)) {
    errors.password = 'Password does not meet all requirements.';
  }

  return errors;
}

export function hasAuthFieldErrors(errors: AuthFieldErrors): boolean {
  return Boolean(errors.name || errors.email || errors.password);
}

export function isAuthFormValid(mode: AuthMode, values: AuthFormValues): boolean {
  return !hasAuthFieldErrors(validateAuthFields(mode, values));
}

export const authInputErrorClassName =
  'border-red-500! focus-visible:ring-red-500/35 focus-visible:ring-offset-0';

export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
  fullWidth?: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'min-length',
      label: `Min. ${AUTH_PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= AUTH_PASSWORD_MIN_LENGTH,
    },
    {
      id: 'lowercase',
      label: 'Include lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'Include uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Include number',
      met: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'Include a special character: #.-?!@$%^&*',
      met: PASSWORD_SPECIAL_CHAR_PATTERN.test(password),
      fullWidth: true,
    },
  ];
}

export function passwordRequirementsMet(password: string): boolean {
  return getPasswordRequirements(password).every((requirement) => requirement.met);
}
