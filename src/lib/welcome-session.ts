const WELCOME_SESSION_KEY = 'moodboard-auth-welcome';
const WELCOME_SHOWN_KEY = 'moodboard-auth-welcome-shown';

export type WelcomeSession = {
  name: string;
  kind: 'sign-in' | 'sign-up';
};

function parseWelcomeSession(raw: string): WelcomeSession | null {
  try {
    const parsed = JSON.parse(raw) as WelcomeSession;
    if (parsed?.kind !== 'sign-in' && parsed?.kind !== 'sign-up') {
      return null;
    }

    return {
      kind: parsed.kind,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'there',
    };
  } catch {
    return null;
  }
}

export function setWelcomeSession(kind: WelcomeSession['kind'], name: string): void {
  if (typeof window === 'undefined') return;

  const payload: WelcomeSession = {
    kind,
    name: name.trim() || 'there',
  };

  sessionStorage.setItem(WELCOME_SESSION_KEY, JSON.stringify(payload));
  sessionStorage.removeItem(WELCOME_SHOWN_KEY);
}

export function consumeWelcomeSession(): WelcomeSession | null {
  if (typeof window === 'undefined') return null;
  if (sessionStorage.getItem(WELCOME_SHOWN_KEY) === '1') return null;

  const raw = sessionStorage.getItem(WELCOME_SESSION_KEY);
  if (!raw) return null;

  return parseWelcomeSession(raw);
}

export function markWelcomeSessionShown(): void {
  if (typeof window === 'undefined') return;
  if (!sessionStorage.getItem(WELCOME_SESSION_KEY)) return;

  sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
  sessionStorage.removeItem(WELCOME_SESSION_KEY);
}

export function welcomeFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === 'there') return 'there';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
