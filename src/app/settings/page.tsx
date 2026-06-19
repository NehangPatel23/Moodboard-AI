'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { PageLabel } from '@/components/shared/PageLabel';
import { showToast } from '@/components/shared/toast-store';
import { loadBoards, saveBoards, subscribeBoards } from '@/lib/board-store';
import { cn } from '@/lib/utils';
import {
  appSectionClass,
} from '@/components/shared/app-surface-styles';
import {
  clearLastSavedAt,
  applyServerSettings,
  CUSTOM_AVATAR_ID,
  DEFAULT_APP_SETTINGS,
  getWorkspaceInitials,
  INITIALS_AVATAR_ID,
  readAppSettings,
  readLastSavedAt,
  resolveThemeMode,
  saveAppSettings,
  subscribeAppSettings,
  updateAppSettings,
  WORKSPACE_AVATAR_ACCENTS,
  WORKSPACE_AVATARS,
  writeLastSavedAt,
  type AppSettings,
  type ThemeMode,
} from '@/lib/settings-store';
import { WorkspaceAvatar } from '@/components/layout/WorkspaceAvatar';
import { AvatarCropModal } from '@/components/settings/AvatarCropModal';
import { AvatarEmoji } from '@/components/settings/AvatarEmoji';
import { validateImageUpload } from '@/lib/image-upload-validation';
import { apiFetch } from '@/lib/api-client';
import {
  getServerAuthSnapshot,
  readAuthState,
  subscribeAuth,
  updateAuthUserName,
} from '@/lib/auth-store';
import {
  clampRetentionDuration,
  isRetentionNever,
  NEVER_RETENTION,
  RETENTION_UNITS,
  type RetentionDuration,
  type RetentionUnit,
} from '@/lib/retention-duration';
import type { Board, BoardVisibility } from '@/types/board';
import { SNAPSHOT_LIMIT_OPTIONS } from '@/lib/settings-defaults';
import {
  AUTOSAVE_INTERVAL_OPTIONS,
  type AutosaveInterval,
} from '@/lib/autosave-interval';
import { Monitor, Moon, SunMedium } from 'lucide-react';

type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  comingSoon?: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function formatRelativeTime(value: string | null): string {
  if (!value) return 'Not yet saved';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet saved';

  const delta = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(delta / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function isBoardArray(value: unknown): value is Board[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<Board>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.prompt === 'string' &&
      typeof candidate.summary === 'string'
    );
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}


function SettingsSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card
      id={id}
      className="scroll-mt-28 rounded-4xl border border-(--border) bg-(--surface-elevated)"
    >
      <CardHeader className="space-y-3 border-b border-(--border)/70 pb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-(--text-muted)">
          {eyebrow}
        </p>
        <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
          {title}
        </CardTitle>
        <CardDescription className="max-w-2xl text-(--text-muted)">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-3xl border p-4 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        enabled
          ? 'border-(--border) bg-(--surface-muted)'
          : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-(--text-strong)">{label}</p>
        <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
      </div>

      <div
        className={cn(
          'mt-1 flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors',
          enabled ? 'justify-end bg-(--text-strong)' : 'justify-start bg-(--surface-muted)',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full shadow-sm transition-colors',
            enabled ? 'bg-(--background)' : 'bg-(--text-muted)',
          )}
        />
      </div>
    </button>
  );
}

function RetentionSelect({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: RetentionDuration;
  onChange: (value: RetentionDuration) => void;
}) {
  const enabled = !isRetentionNever(value);

  function handleToggle(nextEnabled: boolean) {
    if (!nextEnabled) {
      onChange(NEVER_RETENTION);
      return;
    }

    onChange(
      clampRetentionDuration({
        amount: value.amount > 0 ? value.amount : 7,
        unit: value.unit ?? 'days',
      }),
    );
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const amount = Number(event.target.value);
    if (!Number.isFinite(amount)) return;
    onChange(clampRetentionDuration({ amount, unit: value.unit }));
  }

  function handleUnitChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(
      clampRetentionDuration({
        amount: value.amount > 0 ? value.amount : 1,
        unit: event.target.value as RetentionUnit,
      }),
    );
  }

  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--text-strong)">{label}</p>
        <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-(--text-strong)">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => handleToggle(event.target.checked)}
          className="h-4 w-4 rounded border-(--border)"
        />
        Enable limit
      </label>

      {enabled ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Input
            type="number"
            min={1}
            value={value.amount}
            onChange={handleAmountChange}
            aria-label={`${label} amount`}
            className="h-11 rounded-2xl border-(--border) bg-(--surface-elevated)"
          />
          <select
            value={value.unit}
            onChange={handleUnitChange}
            aria-label={`${label} unit`}
            className="h-11 rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring)"
          >
            {RETENTION_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

function SnapshotLimitSelect({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--text-strong)">{label}</p>
        <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="mt-3 h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring) sm:max-w-xs"
      >
        {SNAPSHOT_LIMIT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AutosaveIntervalSelect({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: AutosaveInterval;
  onChange: (value: AutosaveInterval) => void;
}) {
  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--text-strong)">{label}</p>
        <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AutosaveInterval)}
        aria-label={label}
        className="mt-3 h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring) sm:max-w-xs"
      >
        {AUTOSAVE_INTERVAL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: BoardVisibility;
  onChange: (value: BoardVisibility) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange('private')}
        aria-pressed={value === 'private'}
        className={cn(
          'rounded-3xl border p-4 text-left transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          value === 'private'
            ? 'border-(--border) bg-(--surface-muted)'
            : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
        )}
      >
        <Badge variant="secondary" className="bg-(--text-strong) text-(--background)">
          Private
        </Badge>
        <p className="mt-3 text-sm font-medium text-(--text-strong)">Only you can see new boards.</p>
        <p className="mt-1 text-sm leading-6 text-(--text-muted)">
          Best for drafts, internal exploration, and personal direction work.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChange('shared')}
        aria-pressed={value === 'shared'}
        className={cn(
          'rounded-3xl border p-4 text-left transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          value === 'shared'
            ? 'border-(--border) bg-(--surface-muted)'
            : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
        )}
      >
        <Badge variant="secondary" className="bg-(--text-strong) text-(--background)">
          Shared
        </Badge>
        <p className="mt-3 text-sm font-medium text-(--text-strong)">New boards can be shared more easily.</p>
        <p className="mt-1 text-sm leading-6 text-(--text-muted)">
          Good for presentation-ready work and client-facing boards.
        </p>
      </button>
    </div>
  );
}

function ThemeToggle({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}) {
  const items: Array<{
    value: ThemeMode;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      value: 'system',
      label: 'System',
      description: 'Follow your device theme automatically.',
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Keep the editorial light palette on.',
      icon: <SunMedium className="h-4 w-4" />,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Use the dark workspace theme.',
      icon: <Moon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => {
        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={active}
            className={cn(
              'rounded-3xl border p-4 text-left transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
              active
                ? 'border-(--text-strong) bg-(--surface-muted) shadow-[var(--shadow-card)]'
                : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border',
                  active
                    ? 'border-(--text-strong) bg-(--text-strong) text-(--background)'
                    : 'border-(--border) bg-(--surface-subtle) text-(--text-muted)',
                )}
              >
                {item.icon}
              </div>
              {active ? (
                <Badge variant="secondary" className="bg-(--text-strong) text-(--background)">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-(--surface) text-(--text-muted)">
                  Select
                </Badge>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-(--text-strong)">{item.label}</p>
            <p className="mt-1 text-sm leading-6 text-(--text-muted)">{item.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function ActionRow({
  title,
  description,
  badgeLabel,
  onClick,
  destructive = false,
  disabled = false,
}: {
  title: string;
  description: string;
  badgeLabel: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-3xl border p-5 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        destructive
          ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/10 dark:hover:bg-rose-500/20'
          : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
        disabled ? 'cursor-not-allowed opacity-70' : '',
      )}
    >
      <div className="min-w-0 space-y-1">
        <p
          className={cn(
            'text-sm font-medium',
            destructive ? 'text-rose-950 dark:text-rose-100' : 'text-(--text-strong)',
          )}
        >
          {title}
        </p>
        <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
      </div>

      <span
        className={cn(
          'shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em]',
          destructive
            ? 'border-rose-200 bg-white text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-300'
            : 'border-(--border) bg-(--surface-soft) text-(--text-muted)',
        )}
      >
        {badgeLabel}
      </span>
    </button>
  );
}

function NavLink({
  href,
  label,
  description,
  comingSoon = false,
}: {
  href: string;
  label: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        'block rounded-3xl border p-4 transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        comingSoon
          ? 'cursor-not-allowed border-dashed border-(--border) bg-(--surface-soft) opacity-80'
          : 'border-(--border) bg-(--surface) hover:bg-(--surface-subtle)',
      )}
      aria-disabled={comingSoon}
      tabIndex={comingSoon ? -1 : 0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-(--text-strong)">{label}</p>
          <p className="text-sm leading-6 text-(--text-muted)">{description}</p>
        </div>
        {comingSoon ? (
          <Badge variant="secondary" className="bg-(--surface) text-(--text-muted)">
            Later
          </Badge>
        ) : null}
      </div>
    </a>
  );
}

const avatarPickerRowClass = 'flex flex-wrap gap-2';

function AvatarTile({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-(--surface-elevated) transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-1 focus-visible:ring-offset-(--background)',
        selected
          ? 'border-(--text-strong)/40 ring-1 ring-(--text-strong) ring-offset-1 ring-offset-(--surface)'
          : 'border-(--border) hover:border-(--text-muted)/30 hover:bg-(--surface-subtle)',
      )}
    >
      {children}
    </button>
  );
}

function AccentSwatch({
  color,
  label,
  selected,
  onSelect,
}: {
  color: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label} accent`}
      title={label}
      className={cn(
        'h-8 w-8 shrink-0 rounded-full border border-black/10 transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-1 focus-visible:ring-offset-(--background)',
        selected
          ? 'ring-2 ring-(--text-strong) ring-offset-1 ring-offset-(--surface)'
          : 'hover:ring-2 hover:ring-(--border) hover:ring-offset-1 hover:ring-offset-(--surface)',
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function AvatarPhotoTile({
  selected,
  imageUrl,
  uploading,
  onPickPhoto,
  onRemovePhoto,
}: {
  selected: boolean;
  imageUrl: string | null;
  uploading: boolean;
  onPickPhoto: () => void;
  onRemovePhoto?: () => void;
}) {
  return (
    <div className="relative h-10 w-10 shrink-0">
      <button
        type="button"
        onClick={onPickPhoto}
        aria-pressed={selected}
        aria-label="Upload profile photo"
        title="Upload profile photo"
        disabled={uploading}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-(--surface-elevated) transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-1 focus-visible:ring-offset-(--background)',
          'disabled:cursor-wait disabled:opacity-70',
          selected
            ? 'border-(--text-strong)/40 ring-1 ring-(--text-strong) ring-offset-1 ring-offset-(--surface)'
            : 'border-(--border) hover:border-(--text-muted)/30 hover:bg-(--surface-subtle)',
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-(--text-muted)" aria-hidden="true" />
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded avatar preview tile
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-4 w-4 text-(--text-muted)" aria-hidden="true" />
        )}
      </button>

      {imageUrl && onRemovePhoto ? (
        <button
          type="button"
          aria-label="Remove profile photo"
          title="Remove profile photo"
          disabled={uploading}
          onClick={(event) => {
            event.stopPropagation();
            onRemovePhoto();
          }}
          className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-600"
        >
          <X className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-(--text-muted)">{label}</p>
      <p className="mt-2 text-sm font-medium text-(--text-strong)">{value}</p>
    </div>
  );
}

function KeyCap({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-(--border) bg-(--surface) px-2 text-xs font-medium text-(--text-strong) shadow-sm">
      {children}
    </kbd>
  );
}

const KEYBOARD_SHORTCUTS: Array<{ action: string; keys: ReactNode }> = [
  {
    action: 'Open the command palette',
    keys: (
      <>
        <KeyCap>⌘</KeyCap>
        <span className="text-(--text-muted)">/</span>
        <KeyCap>Ctrl</KeyCap>
        <span className="text-(--text-muted)">+</span>
        <KeyCap>K</KeyCap>
      </>
    ),
  },
  {
    action: 'Move between board sections',
    keys: (
      <>
        <KeyCap>←</KeyCap>
        <KeyCap>→</KeyCap>
        <span className="text-(--text-muted)">or</span>
        <KeyCap>Space</KeyCap>
      </>
    ),
  },
  {
    action: 'Close a dialog or leave presentation',
    keys: <KeyCap>Esc</KeyCap>,
  },
];

function ShortcutsReference({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-(--border) bg-(--surface-soft) p-5 transition',
        enabled ? '' : 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          Keyboard shortcuts
        </p>
        {!enabled ? (
          <Badge variant="secondary" className="bg-(--surface) text-(--text-muted)">
            Disabled
          </Badge>
        ) : null}
      </div>

      <ul className="mt-4 space-y-3">
        {KEYBOARD_SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.action}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border)/60 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm text-(--text-strong)">{shortcut.action}</span>
            <span className="flex items-center gap-1.5">{shortcut.keys}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  const settings = useSyncExternalStore(
    subscribeAppSettings,
    readAppSettings,
    () => DEFAULT_APP_SETTINGS,
  );

  const lastSavedAt = useSyncExternalStore(
    subscribeAppSettings,
    readLastSavedAt,
    () => null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const closeCropModal = useCallback(() => {
    setCropImageSrc((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setCropModalOpen(false);
  }, []);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const displayNameSaveTimerRef = useRef<number | null>(null);

  const savedDisplayName =
    auth.status === 'authenticated' && auth.user ? auth.user.name : '';
  const displayName = nameDraft ?? savedDisplayName;

  const persistDisplayName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === savedDisplayName) {
      return;
    }

    void apiFetch<{ name: string }>('/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify({ name: trimmed }),
    })
      .then((data) => {
        updateAuthUserName(data.name);
        setNameDraft(null);
      })
      .catch(() => {
        showToast('Could not update your name.', 'destructive');
      });
  };

  const scheduleDisplayNameSave = (value: string) => {
    if (displayNameSaveTimerRef.current !== null) {
      window.clearTimeout(displayNameSaveTimerRef.current);
    }

    displayNameSaveTimerRef.current = window.setTimeout(() => {
      persistDisplayName(value);
      displayNameSaveTimerRef.current = null;
    }, 600);
  };

  const handleDisplayNameChange = (value: string) => {
    const next = value.slice(0, 40);
    setNameDraft(next);
    scheduleDisplayNameSave(next);
  };

  const handleDisplayNameBlur = () => {
    if (displayNameSaveTimerRef.current !== null) {
      window.clearTimeout(displayNameSaveTimerRef.current);
      displayNameSaveTimerRef.current = null;
    }

    persistDisplayName(displayName);
  };

  const avatarInitialsSource = savedDisplayName || settings.workspaceName;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateAppSettings({ [key]: value } as Partial<AppSettings>);
  };

  const toastToggle = (label: string, enabled: boolean) => {
    showToast(`${label} ${enabled ? 'enabled' : 'disabled'}.`, 'success');
  };

  const handleWorkspaceNameChange = (value: string) => {
    updateSetting('workspaceName', value.slice(0, 40));
  };

  const handleWorkspaceTaglineChange = (value: string) => {
    updateSetting('workspaceTagline', value.slice(0, 60));
  };

  const handleAvatarAccentChange = (value: string) => {
    updateSetting('avatarAccent', value);
    showToast('Workspace accent updated.', 'success');
  };

  const handleAvatarChange = (value: string) => {
    updateAppSettings({ avatarId: value, avatarImageUrl: null });
    showToast('Workspace avatar updated.', 'success');
  };

  const handleAvatarPhotoPick = async () => {
    if (
      settings.avatarId === CUSTOM_AVATAR_ID &&
      settings.avatarImageUrl &&
      !uploadingAvatar
    ) {
      try {
        const response = await fetch(settings.avatarImageUrl);
        if (!response.ok) {
          throw new Error('Could not load current photo');
        }

        const blob = await response.blob();
        setCropImageSrc((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return URL.createObjectURL(blob);
        });
        setCropModalOpen(true);
        return;
      } catch {
        showToast('Could not re-crop the current photo. Choose a new file instead.', 'destructive');
      }
    }

    avatarPhotoInputRef.current?.click();
  };

  const handleRemoveAvatarPhoto = async () => {
    if (uploadingAvatar) {
      return;
    }

    setUploadingAvatar(true);

    try {
      const data = await apiFetch<{
        settings: AppSettings;
        updatedAt: string;
      }>('/api/profile/avatar/upload', {
        method: 'DELETE',
      });

      applyServerSettings(data.settings, data.updatedAt);
      showToast('Profile photo removed.', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not remove profile photo.';
      showToast(message, 'destructive');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validation = validateImageUpload(file, {
      maxBytes: 8 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.ok) {
      showToast(validation.error, 'destructive');
      return;
    }

    setCropImageSrc((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
    setCropModalOpen(true);
  };

  const uploadAvatarPhoto = async (file: File) => {
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiFetch<{
        imageUrl: string;
        settings: AppSettings;
        updatedAt: string;
      }>('/api/profile/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      applyServerSettings(data.settings, data.updatedAt);
      closeCropModal();
      showToast('Profile photo updated.', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not upload profile photo.';
      showToast(message, 'destructive');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDefaultVisibilityChange = (value: BoardVisibility) => {
    updateSetting('defaultVisibility', value);
    showToast(`Default visibility set to ${value === 'private' ? 'Private' : 'Shared'}.`, 'success');
  };

  const handlePresentationModeToggle = () => {
    const next = !settings.presentationModeEnabled;
    updateSetting('presentationModeEnabled', next);
    toastToggle('Presentation mode', next);
  };

  const handleKeyboardShortcutsToggle = () => {
    const next = !settings.keyboardShortcutsEnabled;
    updateSetting('keyboardShortcutsEnabled', next);
    toastToggle('Keyboard shortcuts', next);
  };

  const handleReduceMotionToggle = () => {
    const next = !settings.reduceMotionEnabled;
    updateSetting('reduceMotionEnabled', next);
    toastToggle('Reduce motion', next);
  };

  const handleFocusRingsToggle = () => {
    const next = !settings.focusRingsEnabled;
    updateSetting('focusRingsEnabled', next);
    toastToggle('Strong focus rings', next);
  };

  const handleAutosaveToastToggle = () => {
    const next = !settings.autosaveToastEnabled;
    updateSetting('autosaveToastEnabled', next);
    toastToggle('Auto-save toasts', next);
  };

  const handleRemoteSaveToastToggle = () => {
    const next = !settings.remoteSaveToastEnabled;
    updateSetting('remoteSaveToastEnabled', next);
    toastToggle('Remote save toasts', next);
  };

  const handleThemeChange = (value: ThemeMode) => {
    updateSetting('themeMode', value);
    showToast(
      value === 'system' ? 'Theme set to System.' : `${capitalize(value)} mode enabled.`,
      'success',
    );
  };

  const handleExportAll = () => {
    try {
      const currentBoards = loadBoards();
      const payload = JSON.stringify(currentBoards, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `moodboard-boards-${stamp}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast(`Exported ${currentBoards.length} board${currentBoards.length === 1 ? '' : 's'}.`, 'success');
      writeLastSavedAt(nowIso());
    } catch {
      showToast('Export failed.', 'destructive');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isBoardArray(parsed)) {
        throw new Error('Invalid board file.');
      }

      saveBoards(parsed);
      writeLastSavedAt(nowIso());
      showToast(`Imported ${parsed.length} board${parsed.length === 1 ? '' : 's'}.`, 'success');
    } catch {
      showToast('Could not import that file.', 'destructive');
    } finally {
      setImporting(false);
    }
  };

  const handleResetWorkspace = () => {
    try {
      saveBoards([]);
      saveAppSettings(DEFAULT_APP_SETTINGS);
      clearLastSavedAt();
      setResetOpen(false);
      showToast('Workspace reset. All boards were deleted.', 'success');
    } catch {
      showToast('Workspace reset failed.', 'destructive');
    }
  };

  const handleResetPreferences = () => {
    try {
      saveAppSettings(DEFAULT_APP_SETTINGS);
      writeLastSavedAt(nowIso());
      showToast('Preferences restored to defaults. Your boards are untouched.', 'success');
    } catch {
      showToast('Could not reset preferences.', 'destructive');
    }
  };

  const favoriteCount = useMemo(() => boards.filter((board) => board.isFavorite).length, [boards]);
  const resolvedTheme = resolveThemeMode(settings.themeMode);

  const sections: SettingsNavItem[] = [
    { href: '#profile', label: 'Profile', description: 'Workspace name and avatar.' },
    { href: '#workspace', label: 'Workspace', description: 'Default behavior and sharing.' },
    { href: '#editor', label: 'Editor', description: 'Board editing preferences.' },
    { href: '#notifications', label: 'Notifications', description: 'Auto-save and collaboration toasts.' },
    { href: '#collaboration', label: 'Collaboration', description: 'Comments, activity, and cleanup.' },
    { href: '#accessibility', label: 'Accessibility', description: 'Motion, shortcuts, and focus.' },
    { href: '#appearance', label: 'Appearance', description: 'Light, dark, or system theme.' },
    { href: '#data', label: 'Data', description: 'Import, export, and reset.' },
  ];

  return (
    <div className="space-y-8">
      <section className={`${appSectionClass} bg-(--surface-elevated) shadow-[var(--shadow-card)]`}>
        <div className="flex gap-4 md:gap-6">
          <PageLabel label="Settings" />

          <div className="flex-1">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="[font-family:var(--font-display),serif] text-[clamp(2.8rem,6vw,5rem)] leading-[0.94] tracking-[-0.04em] text-(--text-strong)">
              Configure your workspace and preferences.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base">
              Fine-tune how MoodBoard AI behaves, how it feels, and how you work across the app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportAll}
              className="rounded-full border-(--border) bg-(--surface) text-(--text-strong) hover:bg-(--surface-subtle) hover:text-(--text-strong)"
            >
              Export boards
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusPill label="Last updated" value={formatRelativeTime(lastSavedAt)} />
          <StatusPill label="Boards" value={`${boards.length} stored`} />
          <StatusPill label="Favorites" value={`${favoriteCount} starred`} />
          <StatusPill label="Persistence" value="Cloud synced" />
        </div>
            <p className="mt-4 text-sm leading-6 text-(--text-muted)">
              Changes are applied immediately and saved to your account so the workspace stays in sync across devices.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <Card className="rounded-4xl border border-(--border) bg-(--surface-elevated)">
            <CardHeader className="space-y-2">
              <CardTitle className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)">
                On this page
              </CardTitle>
              <CardDescription className="text-(--text-muted)">
                Jump between the main settings groups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.map((section) => (
                <NavLink
                  key={section.href}
                  href={section.href}
                  label={section.label}
                  description={section.description}
                  comingSoon={section.comingSoon ?? false}
                />
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <SettingsSection
            id="profile"
            eyebrow="Profile"
            title="Profile & workspace"
            description="Your name appears on Discover, public boards, and in the account menu. Workspace details customize the sidebar."
          >
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-3xl border border-(--border) bg-(--surface-soft) p-4">
                <WorkspaceAvatar
                  className="h-16 w-16 shrink-0 rounded-2xl text-lg"
                  emojiClassName="text-4xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-(--text-strong)">
                    {displayName || auth.user?.name || 'Your name'}
                  </p>
                  <p className="truncate text-sm text-(--text-muted)">
                    {settings.workspaceTagline || 'Creative direction workspace'}
                  </p>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Your name
                </span>
                <Input
                  key={auth.user?.id ?? 'guest'}
                  value={displayName}
                  maxLength={40}
                  onChange={(event) => handleDisplayNameChange(event.target.value)}
                  onBlur={handleDisplayNameBlur}
                  placeholder="Nehang Patel"
                  autoComplete="name"
                />
                <p className="text-xs leading-5 text-(--text-muted)">
                  Shown on creator profiles, public board attribution, and your account menu.
                </p>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                    Workspace name
                  </span>
                  <Input
                    value={settings.workspaceName}
                    maxLength={40}
                    onChange={(event) => handleWorkspaceNameChange(event.target.value)}
                    placeholder="MoodBoard AI"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                    Tagline
                  </span>
                  <Input
                    value={settings.workspaceTagline}
                    maxLength={60}
                    onChange={(event) => handleWorkspaceTaglineChange(event.target.value)}
                    placeholder="Creative direction workspace"
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-(--border) bg-(--surface-soft) p-3.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Avatar
                </p>

                <input
                  ref={avatarPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => void handleAvatarPhotoSelected(event)}
                />

                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-(--text-muted)">People</p>
                    <div className={avatarPickerRowClass}>
                      <AvatarPhotoTile
                        selected={settings.avatarId === CUSTOM_AVATAR_ID}
                        imageUrl={settings.avatarImageUrl}
                        uploading={uploadingAvatar}
                        onPickPhoto={handleAvatarPhotoPick}
                        onRemovePhoto={
                          settings.avatarId === CUSTOM_AVATAR_ID && settings.avatarImageUrl
                            ? () => void handleRemoveAvatarPhoto()
                            : undefined
                        }
                      />

                      <AvatarTile
                        selected={settings.avatarId === INITIALS_AVATAR_ID}
                        label="Use initials"
                        onClick={() => handleAvatarChange(INITIALS_AVATAR_ID)}
                      >
                        <span className="text-[11px] font-semibold tracking-tight text-(--text-strong)">
                          {getWorkspaceInitials(avatarInitialsSource)}
                        </span>
                      </AvatarTile>

                      {WORKSPACE_AVATARS.filter((avatar) => avatar.group === 'people').map((avatar) => (
                        <AvatarTile
                          key={avatar.id}
                          selected={settings.avatarId === avatar.id}
                          label={avatar.label}
                          onClick={() => handleAvatarChange(avatar.id)}
                        >
                          <AvatarEmoji emoji={avatar.emoji} />
                        </AvatarTile>
                      ))}
                    </div>
                    <p className="text-xs text-(--text-muted)">
                      Tap the camera tile to choose a photo, crop it, then upload (JPEG, PNG, or WebP, max 8 MB source).
                      {settings.avatarId === CUSTOM_AVATAR_ID && settings.avatarImageUrl ? (
                        <>
                          {' '}
                          Tap again to re-crop the current photo.
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-(--text-muted)">Symbols</p>
                    <div className={avatarPickerRowClass}>
                      {WORKSPACE_AVATARS.filter((avatar) => avatar.group === 'symbols').map((avatar) => (
                        <AvatarTile
                          key={avatar.id}
                          selected={settings.avatarId === avatar.id}
                          label={avatar.label}
                          onClick={() => handleAvatarChange(avatar.id)}
                        >
                          <AvatarEmoji emoji={avatar.emoji} />
                        </AvatarTile>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-(--border)/80 pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                    Accent color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WORKSPACE_AVATAR_ACCENTS.map(({ value, label }) => {
                      const active = settings.avatarAccent.toLowerCase() === value.toLowerCase();

                      return (
                        <AccentSwatch
                          key={value}
                          color={value}
                          label={label}
                          selected={active}
                          onSelect={() => handleAvatarAccentChange(value)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="workspace"
            eyebrow="Workspace"
            title="Default behavior"
            description="Set how new boards are created and how the workspace behaves by default."
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Default board visibility
                </p>
                <VisibilityToggle value={settings.defaultVisibility} onChange={handleDefaultVisibilityChange} />
              </div>

              <div className="space-y-3">
                <ToggleRow
                  label="Presentation mode"
                  description="Show the share view in a focused, presentation-friendly layout."
                  enabled={settings.presentationModeEnabled}
                  onToggle={handlePresentationModeToggle}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="editor"
            eyebrow="Editor"
            title="Board editing"
            description="Control how boards save while you work in the editor."
          >
            <AutosaveIntervalSelect
              label="Auto-save interval"
              description="Automatically save board changes after you pause editing. Manual Save changes is always available."
              value={settings.autosaveInterval}
              onChange={(value) => updateSetting('autosaveInterval', value)}
            />
          </SettingsSection>

          <SettingsSection
            id="notifications"
            eyebrow="Notifications"
            title="Editor toasts"
            description="Choose when MoodBoard AI shows success toasts during editing and collaboration."
          >
            <div className="space-y-3">
              <ToggleRow
                label="Auto-save toasts"
                description="Show a toast when background auto-save completes successfully."
                enabled={settings.autosaveToastEnabled}
                onToggle={handleAutosaveToastToggle}
              />
              <ToggleRow
                label="Remote save toasts"
                description="Show a toast when a collaborator saves and your board reloads."
                enabled={settings.remoteSaveToastEnabled}
                onToggle={handleRemoteSaveToastToggle}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            id="collaboration"
            eyebrow="Collaboration"
            title="Comments and activity"
            description="Control what you see on boards and how old collaboration history is handled."
          >
            <div className="space-y-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Your view
              </p>
              <RetentionSelect
                label="Hide comments older than"
                description="Older comments stay on the board for collaborators but disappear from your panels."
                value={settings.commentsHideAfter}
                onChange={(value) => updateSetting('commentsHideAfter', value)}
              />
              <RetentionSelect
                label="Hide activity older than"
                description="Older save history stays on the board for collaborators but disappears from your activity panel."
                value={settings.activityHideAfter}
                onChange={(value) => updateSetting('activityHideAfter', value)}
              />

              <div className="border-t border-(--border) pt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Board cleanup (owners)
                </p>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  When you open comments or activity on a board you own, items older than these limits
                  are permanently deleted for everyone.
                </p>
              </div>

              <RetentionSelect
                label="Delete comments older than"
                description="Permanently removes old comments from boards you own. Use with care on shared boards."
                value={settings.purgeCommentsAfter}
                onChange={(value) => updateSetting('purgeCommentsAfter', value)}
              />
              <RetentionSelect
                label="Delete activity older than"
                description="Permanently removes old save history from boards you own, including replay details."
                value={settings.purgeActivityAfter}
                onChange={(value) => updateSetting('purgeActivityAfter', value)}
              />

              <div className="border-t border-(--border) pt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Snapshots (owners)
                </p>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                  Control how many snapshots each of your boards can keep. Collaborators follow your
                  limits on boards you own.
                </p>
              </div>

              <SnapshotLimitSelect
                label="Maximum snapshots per board"
                description="When a limit is set, older snapshots can be removed automatically or block new saves."
                value={settings.snapshotMaxPerBoard}
                onChange={(value) => updateSetting('snapshotMaxPerBoard', value)}
              />
              <ToggleRow
                label="Auto-prune oldest snapshots"
                description="When enabled, saving a new snapshot removes the oldest ones beyond your limit. When disabled, new saves are blocked at the limit."
                enabled={settings.snapshotAutoPrune}
                onToggle={() => updateSetting('snapshotAutoPrune', !settings.snapshotAutoPrune)}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            id="accessibility"
            eyebrow="Accessibility"
            title="Comfort and control"
            description="Keep the interface predictable, readable, and easy to navigate."
          >
            <div className="space-y-3">
              <ToggleRow
                label="Keyboard shortcuts"
                description="Enable keyboard navigation and shortcuts, including Cmd/Ctrl + K for the command palette."
                enabled={settings.keyboardShortcutsEnabled}
                onToggle={handleKeyboardShortcutsToggle}
              />
              <ToggleRow
                label="Reduce motion"
                description="Limit motion and use simpler transitions when possible."
                enabled={settings.reduceMotionEnabled}
                onToggle={handleReduceMotionToggle}
              />
              <ToggleRow
                label="Strong focus rings"
                description="Make focus states easier to see while tabbing through the app."
                enabled={settings.focusRingsEnabled}
                onToggle={handleFocusRingsToggle}
              />
            </div>

            <ShortcutsReference enabled={settings.keyboardShortcutsEnabled} />
          </SettingsSection>

          <SettingsSection
            id="appearance"
            eyebrow="Appearance"
            title="Theme"
            description="Choose light, dark, or follow your system preference."
          >
            <div className="space-y-3">
              <ThemeToggle value={settings.themeMode} onChange={handleThemeChange} />
              <div className="rounded-3xl border border-(--border) bg-(--surface-soft) p-4 text-sm leading-6 text-(--text-muted)">
                <>
                  Currently applied:{' '}
                  <span className="font-medium text-(--text-strong)">{capitalize(resolvedTheme)}</span>
                  {settings.themeMode === 'system'
                    ? ' from your system preference.'
                    : ' based on your selection.'}
                </>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="data"
            eyebrow="Data"
            title="Import, export, and recovery"
            description="Move your workspace in and out of the app with clear, guarded actions."
          >
            <div className="space-y-4">
              <ActionRow
                title="Import boards"
                description="Bring in a JSON export from another workspace or earlier backup."
                badgeLabel={importing ? 'Importing' : 'JSON'}
                onClick={handleImportClick}
              />

              <ActionRow
                title="Export boards"
                description="Download the full board collection as a JSON backup."
                badgeLabel="Backup"
                onClick={handleExportAll}
              />

              <ActionRow
                title="Reset preferences"
                description="Restore settings and the workspace identity to their defaults. Your saved boards are kept."
                badgeLabel="Settings"
                onClick={handleResetPreferences}
              />

              <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/70 p-5 shadow-sm dark:border-rose-500/25 dark:bg-rose-500/10 dark:shadow-none">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-rose-500 dark:text-rose-400">
                      Danger zone
                    </p>
                    <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-rose-950 dark:text-rose-100">
                      Reset workspace data
                    </h3>
                    <p className="max-w-2xl text-sm leading-6 text-rose-950/70 dark:text-rose-200/70">
                      This permanently deletes every saved board and restores the default settings. Use it only when you are ready to start over.
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border-rose-200 bg-white text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/50 dark:text-rose-300"
                  >
                    Irreversible
                  </Badge>
                </div>

                <div className="mt-5">
                  <ActionRow
                    title="Reset workspace"
                    description="Delete all saved boards, clear local settings, and return the app to its initial state."
                    badgeLabel="Delete all"
                    destructive
                    onClick={() => setResetOpen(true)}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        uploading={uploadingAvatar}
        onCancel={closeCropModal}
        onConfirm={uploadAvatarPhoto}
      />

      <ConfirmationModal
        open={resetOpen}
        title="Reset the workspace?"
        description="This will permanently delete all saved boards, clear local settings, and restore the default workspace configuration. This cannot be undone."
        confirmLabel="Delete everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleResetWorkspace}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}