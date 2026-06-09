export type RetentionUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export type RetentionDuration = {
  amount: number;
  unit: RetentionUnit;
};

export const RETENTION_UNITS: RetentionUnit[] = ['minutes', 'hours', 'days', 'weeks'];

export const NEVER_RETENTION: RetentionDuration = { amount: 0, unit: 'days' };

export function isRetentionNever(duration: RetentionDuration): boolean {
  return duration.amount <= 0;
}

export function retentionFromLegacyDays(days: number): RetentionDuration {
  if (days <= 0) return NEVER_RETENTION;
  return { amount: days, unit: 'days' };
}

const UNIT_LIMITS: Record<RetentionUnit, { min: number; max: number }> = {
  minutes: { min: 1, max: 525600 },
  hours: { min: 1, max: 8760 },
  days: { min: 1, max: 365 },
  weeks: { min: 1, max: 52 },
};

export function clampRetentionDuration(duration: RetentionDuration): RetentionDuration {
  if (isRetentionNever(duration)) return NEVER_RETENTION;

  const unit = RETENTION_UNITS.includes(duration.unit) ? duration.unit : 'days';
  const limits = UNIT_LIMITS[unit];
  const amount = Math.min(limits.max, Math.max(limits.min, Math.floor(duration.amount)));

  return { amount, unit };
}

export function normalizeRetentionDuration(value: unknown, legacyDays?: number): RetentionDuration {
  if (value && typeof value === 'object' && 'amount' in value && 'unit' in value) {
    const candidate = value as { amount: unknown; unit: unknown };
    const amount = typeof candidate.amount === 'number' ? candidate.amount : Number(candidate.amount);
    const unit = candidate.unit;

    if (
      Number.isFinite(amount) &&
      typeof unit === 'string' &&
      RETENTION_UNITS.includes(unit as RetentionUnit)
    ) {
      return clampRetentionDuration({ amount, unit: unit as RetentionUnit });
    }
  }

  if (typeof legacyDays === 'number') {
    return retentionFromLegacyDays(legacyDays);
  }

  return NEVER_RETENTION;
}

export function getCutoffIso(duration: RetentionDuration): string | null {
  if (isRetentionNever(duration)) return null;

  const cutoff = new Date();

  switch (duration.unit) {
    case 'minutes':
      cutoff.setMinutes(cutoff.getMinutes() - duration.amount);
      break;
    case 'hours':
      cutoff.setHours(cutoff.getHours() - duration.amount);
      break;
    case 'days':
      cutoff.setDate(cutoff.getDate() - duration.amount);
      break;
    case 'weeks':
      cutoff.setDate(cutoff.getDate() - duration.amount * 7);
      break;
    default:
      return null;
  }

  return cutoff.toISOString();
}

export function formatRetentionDuration(duration: RetentionDuration): string {
  if (isRetentionNever(duration)) return 'Never';
  const unitLabel =
    duration.amount === 1 ? duration.unit.slice(0, -1) : duration.unit;
  return `${duration.amount} ${unitLabel}`;
}

export type CollaborationRetentionJson = {
  commentsHide?: RetentionDuration;
  activityHide?: RetentionDuration;
  purgeComments?: RetentionDuration;
  purgeActivity?: RetentionDuration;
};

export function parseCollaborationRetentionJson(
  value: unknown,
  legacy?: {
    commentsHideAfterDays?: number;
    activityHideAfterDays?: number;
    purgeCommentsAfterDays?: number;
    purgeActivityAfterDays?: number;
  },
): CollaborationRetentionJson {
  const parsed = value && typeof value === 'object' ? (value as CollaborationRetentionJson) : {};

  return {
    commentsHide: normalizeRetentionDuration(
      parsed.commentsHide,
      legacy?.commentsHideAfterDays,
    ),
    activityHide: normalizeRetentionDuration(
      parsed.activityHide,
      legacy?.activityHideAfterDays,
    ),
    purgeComments: normalizeRetentionDuration(
      parsed.purgeComments,
      legacy?.purgeCommentsAfterDays,
    ),
    purgeActivity: normalizeRetentionDuration(
      parsed.purgeActivity,
      legacy?.purgeActivityAfterDays,
    ),
  };
}

export function collaborationRetentionToJson(
  settings: Pick<
    import('@/lib/settings-defaults').AppSettings,
    'commentsHideAfter' | 'activityHideAfter' | 'purgeCommentsAfter' | 'purgeActivityAfter'
  >,
): CollaborationRetentionJson {
  return {
    commentsHide: settings.commentsHideAfter,
    activityHide: settings.activityHideAfter,
    purgeComments: settings.purgeCommentsAfter,
    purgeActivity: settings.purgeActivityAfter,
  };
}
