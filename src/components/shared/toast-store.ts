'use client';

export type ToastTone = 'default' | 'success' | 'destructive';
export type ToastPhase = 'enter' | 'visible' | 'exit';

export type ToastState = {
  id: number;
  message: string;
  tone: ToastTone;
  phase: ToastPhase;
};

type Listener = () => void;

let currentToast: ToastState | null = null;
let toastId = 0;
let enterTimer: number | null = null;
let exitTimer: number | null = null;
let clearTimer: number | null = null;

const listeners = new Set<Listener>();

const ENTER_MS = 20;
const VISIBLE_MS = 2400;
const EXIT_MS = 260;

function emit() {
  listeners.forEach((listener) => listener());
}

function clearTimers() {
  if (enterTimer !== null) {
    window.clearTimeout(enterTimer);
    enterTimer = null;
  }

  if (exitTimer !== null) {
    window.clearTimeout(exitTimer);
    exitTimer = null;
  }

  if (clearTimer !== null) {
    window.clearTimeout(clearTimer);
    clearTimer = null;
  }
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot(): ToastState | null {
  return currentToast;
}

export function showToast(message: string, tone: ToastTone = 'default'): void {
  if (typeof window === 'undefined') return;

  toastId += 1;
  clearTimers();

  currentToast = {
    id: toastId,
    message,
    tone,
    phase: 'enter',
  };

  emit();

  enterTimer = window.setTimeout(() => {
    if (!currentToast || currentToast.id !== toastId) return;

    currentToast = {
      ...currentToast,
      phase: 'visible',
    };

    emit();
  }, ENTER_MS);

  exitTimer = window.setTimeout(() => {
    if (!currentToast || currentToast.id !== toastId) return;

    currentToast = {
      ...currentToast,
      phase: 'exit',
    };

    emit();
  }, ENTER_MS + VISIBLE_MS);

  clearTimer = window.setTimeout(() => {
    if (!currentToast || currentToast.id !== toastId) return;

    currentToast = null;
    emit();
  }, ENTER_MS + VISIBLE_MS + EXIT_MS);
}

export function dismissToast(): void {
  if (typeof window === 'undefined') return;
  if (!currentToast) return;

  clearTimers();

  const activeId = currentToast.id;
  currentToast = {
    ...currentToast,
    phase: 'exit',
  };

  emit();

  clearTimer = window.setTimeout(() => {
    if (!currentToast || currentToast.id !== activeId) return;

    currentToast = null;
    emit();
  }, EXIT_MS);
}