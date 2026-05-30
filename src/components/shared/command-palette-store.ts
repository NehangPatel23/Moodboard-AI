'use client';

export type CommandPaletteSnapshot = {
  open: boolean;
  sessionId: number;
};

type Listener = () => void;

let snapshot: CommandPaletteSnapshot = {
  open: false,
  sessionId: 0,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
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