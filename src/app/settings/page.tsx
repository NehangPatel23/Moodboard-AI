'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { showToast } from '@/components/shared/toast-store';
import { loadBoards, saveBoards, subscribeBoards } from '@/lib/board-store';
import { cn } from '@/lib/utils';
import type { Board, BoardVisibility } from '@/types/board';

type SettingsState = {
  defaultVisibility: BoardVisibility;
  presentationModeEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  reduceMotionEnabled: boolean;
  focusRingsEnabled: boolean;
};

const SETTINGS_STORAGE_KEY = 'moodboard-settings-v1';
const SETTINGS_META_STORAGE_KEY = 'moodboard-settings-meta-v1';

const DEFAULT_SETTINGS: SettingsState = {
  defaultVisibility: 'private',
  presentationModeEnabled: true,
  keyboardShortcutsEnabled: true,
  reduceMotionEnabled: false,
  focusRingsEnabled: true,
};

function nowIso(): string {
  return new Date().toISOString();
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readSettings(): SettingsState {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<SettingsState>;

    return {
      defaultVisibility: parsed.defaultVisibility === 'shared' ? 'shared' : 'private',
      presentationModeEnabled:
        typeof parsed.presentationModeEnabled === 'boolean'
          ? parsed.presentationModeEnabled
          : DEFAULT_SETTINGS.presentationModeEnabled,
      keyboardShortcutsEnabled:
        typeof parsed.keyboardShortcutsEnabled === 'boolean'
          ? parsed.keyboardShortcutsEnabled
          : DEFAULT_SETTINGS.keyboardShortcutsEnabled,
      reduceMotionEnabled:
        typeof parsed.reduceMotionEnabled === 'boolean'
          ? parsed.reduceMotionEnabled
          : DEFAULT_SETTINGS.reduceMotionEnabled,
      focusRingsEnabled:
        typeof parsed.focusRingsEnabled === 'boolean'
          ? parsed.focusRingsEnabled
          : DEFAULT_SETTINGS.focusRingsEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readLastSavedAt(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(SETTINGS_META_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

function writeLastSavedAt(value: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SETTINGS_META_STORAGE_KEY, value);
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

type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  comingSoon?: boolean;
};

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
    <Card id={id} className="scroll-mt-28 rounded-4xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 border-b border-slate-100 pb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-slate-400">{eyebrow}</p>
        <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
          {title}
        </CardTitle>
        <CardDescription className="max-w-2xl text-slate-500">{description}</CardDescription>
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        enabled ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-slate-950">{label}</p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div
        className={cn(
          'mt-1 flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition',
          enabled ? 'justify-end border-slate-900 bg-slate-900' : 'border-slate-200 bg-slate-100',
        )}
        aria-hidden="true"
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </div>
    </button>
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
          value === 'private' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
        )}
      >
        <Badge variant="secondary">Private</Badge>
        <p className="mt-3 text-sm font-medium text-slate-950">Only you can see new boards.</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Best for drafts, internal exploration, and personal direction work.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChange('shared')}
        aria-pressed={value === 'shared'}
        className={cn(
          'rounded-3xl border p-4 text-left transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
          value === 'shared' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
        )}
      >
        <Badge variant="secondary">Shared</Badge>
        <p className="mt-3 text-sm font-medium text-slate-950">New boards can be shared more easily.</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Good for presentation-ready work and client-facing boards.
        </p>
      </button>
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        destructive
          ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50'
          : 'border-slate-200 bg-white hover:bg-slate-50',
        disabled ? 'cursor-not-allowed opacity-70' : '',
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className={cn('text-sm font-medium', destructive ? 'text-rose-950' : 'text-slate-950')}>
          {title}
        </p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <span
        className={cn(
          'shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em]',
          destructive
            ? 'border-rose-200 bg-white text-rose-500'
            : 'border-slate-200 bg-slate-50 text-slate-400',
        )}
      >
        {badgeLabel}
      </span>
    </button>
  );
}

function NavLink({ href, label, description, comingSoon = false }: { href: string; label: string; description: string; comingSoon?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        'block rounded-3xl border p-4 transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        comingSoon ? 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50/70 opacity-80' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
      aria-disabled={comingSoon}
      tabIndex={comingSoon ? -1 : 0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950">{label}</p>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {comingSoon ? <Badge variant="secondary">Later</Badge> : null}
      </div>
    </a>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readSettings());
    setLastSavedAt(readLastSavedAt());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.style.scrollBehavior = settings.reduceMotionEnabled ? 'auto' : 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'smooth';
    };
  }, [hydrated, settings.reduceMotionEnabled]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const timestamp = nowIso();

    setSettings((current) => {
      const next = { ...current, [key]: value };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });

    setLastSavedAt(timestamp);
    writeLastSavedAt(timestamp);
  };

  const toastToggle = (label: string, enabled: boolean) => {
    showToast(`${label} ${enabled ? 'enabled' : 'disabled'}.`, 'success');
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
    toastToggle('Focus rings', next);
  };

  const handleExportAll = () => {
    const currentBoards = loadBoards();
    const payload = JSON.stringify(currentBoards, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date();
    const stamp = timestamp.toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `moodboard-boards-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    showToast(`Exported ${currentBoards.length} board${currentBoards.length === 1 ? '' : 's'}.`, 'success');
    setLastSavedAt(nowIso());
    writeLastSavedAt(nowIso());
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isBoardArray(parsed)) {
        throw new Error('Invalid board export file.');
      }

      saveBoards(parsed);
      setLastSavedAt(nowIso());
      writeLastSavedAt(nowIso());
      showToast(`Imported ${parsed.length} board${parsed.length === 1 ? '' : 's'}.`, 'success');
    } catch {
      showToast('Could not import that file. Please use a valid JSON export.', 'destructive');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleResetWorkspace = () => {
    saveBoards([]);
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    window.localStorage.removeItem(SETTINGS_META_STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setLastSavedAt(null);
    setResetOpen(false);
    showToast('Workspace reset. All local boards were deleted.', 'destructive');
  };

  const favoriteCount = useMemo(
    () => boards.filter((board) => board.isFavorite).length,
    [boards],
  );

  const sections: SettingsNavItem[] = [
    {
      href: '#workspace',
      label: 'Workspace',
      description: 'Default visibility, palette access, and presentation mode.',
    },
    {
      href: '#accessibility',
      label: 'Accessibility',
      description: 'Keyboard shortcuts, motion, and focus treatment.',
    },
    {
      href: '#data',
      label: 'Data',
      description: 'Import, export, and recovery options.',
    },
    {
      href: '#account-appearance',
      label: 'Account & appearance',
      description: 'Reserved for a future pass.',
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Settings
            </Badge>
            <h1 className="[font-family:var(--font-display),serif] text-[clamp(2.8rem,6vw,5rem)] leading-[0.94] tracking-[-0.04em] text-slate-950">
              Shape how the workspace behaves.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              Adjust defaults, comfort settings, and workspace data controls from one central place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              {hydrated ? 'Saved locally' : 'Loading…'}
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Last updated: {formatRelativeTime(lastSavedAt)}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusPill label="Saved locally" value={hydrated ? 'Yes' : 'Loading…'} />
          <StatusPill label="Last updated" value={formatRelativeTime(lastSavedAt)} />
          <StatusPill label="Boards" value={`${boards.length} stored`} />
          <StatusPill label="Favorites" value={`${favoriteCount} starred`} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Changes are applied immediately and stored locally so the workspace stays in sync across the app.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-950">
                On this page
              </CardTitle>
              <CardDescription>Jump between the main settings groups.</CardDescription>
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
            id="workspace"
            eyebrow="Workspace"
            title="Default behavior"
            description="Set how new boards are created and how the workspace behaves by default."
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Default board visibility
                </p>
                <VisibilityToggle
                  value={settings.defaultVisibility}
                  onChange={handleDefaultVisibilityChange}
                />
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

              <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-rose-500">Danger zone</p>
                    <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-rose-950">
                      Reset workspace data
                    </h3>
                    <p className="max-w-2xl text-sm leading-6 text-rose-950/70">
                      This permanently deletes every saved board and restores the default settings. Use it only when you are ready to start over.
                    </p>
                  </div>
                  <Badge variant="secondary" className="border-rose-200 bg-white text-rose-600">
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

          <SettingsSection
            id="account-appearance"
            eyebrow="Future area"
            title="Account and appearance"
            description="Reserved for a later pass when profile and theme controls are added."
          >
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
              This space is intentionally left open for account controls, appearance preferences, and any future workspace branding options.
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