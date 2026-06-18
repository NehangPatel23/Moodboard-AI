export type AutosaveInterval = 'off' | '5s' | '8s' | '10s';

export const AUTOSAVE_INTERVAL_OPTIONS: { value: AutosaveInterval; label: string }[] = [
  { value: 'off', label: 'Off — manual save only' },
  { value: '5s', label: 'Every 5 seconds' },
  { value: '8s', label: 'Every 8 seconds (default)' },
  { value: '10s', label: 'Every 10 seconds' },
];

export const DEFAULT_AUTOSAVE_INTERVAL: AutosaveInterval = '8s';

export function normalizeAutosaveInterval(value: unknown): AutosaveInterval {
  if (value === 'off' || value === '5s' || value === '8s' || value === '10s') {
    return value;
  }
  return DEFAULT_AUTOSAVE_INTERVAL;
}

export function autosaveIntervalToMs(interval: AutosaveInterval): number | null {
  switch (interval) {
    case 'off':
      return null;
    case '5s':
      return 5_000;
    case '8s':
      return 8_000;
    case '10s':
      return 10_000;
    default:
      return 8_000;
  }
}
