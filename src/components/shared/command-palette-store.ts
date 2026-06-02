'use client';

export type CommandPaletteSnapshot = {
  open: boolean;
  sessionId: number;
};

type Listener = () => void;

const SETTINGS_STORAGE_KEY = 'moodboard-settings-v1';

let snapshot: CommandPaletteSnapshot = {
  open: false,
  sessionId: 0,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readKeyboardShortcutsEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return true;

    const parsed = JSON.parse(raw) as { keyboardShortcutsEnabled?: boolean };
    return parsed.keyboardShortcutsEnabled !== false;
  } catch {
    return true;
  }
}

export function isCommandPaletteEnabled(): boolean {
  return readKeyboardShortcutsEnabled();
}

export function subscribeCommandPalette(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCommandPaletteSnapshot(): CommandPaletteSnapshot {
  return snapshot;
}

export function openCommandPalette(): void {
  snapshot = {
    open: true,
    sessionId: snapshot.sessionId + 1,
  };
  emit();
}

export function closeCommandPalette(): void {
  if (!snapshot.open) return;

  snapshot = {
    ...snapshot,
    open: false,
  };
  emit();
}