'use client';

type Listener = () => void;

const STORAGE_KEY = 'moodboard-sidebar-collapsed-v1';

const listeners = new Set<Listener>();
let storageListenerAttached = false;
let cached: boolean | null = null;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === STORAGE_KEY) {
    cached = null;
    emit();
  }
}

function ensureStorageListener(): void {
  if (storageListenerAttached || typeof window === 'undefined') return;
  window.addEventListener('storage', handleStorageEvent);
  storageListenerAttached = true;
}

export function readSidebarCollapsed(): boolean {
  if (cached !== null) return cached;
  if (!canUseStorage()) {
    cached = false;
    return cached;
  }

  cached = window.localStorage.getItem(STORAGE_KEY) === 'true';
  return cached;
}

export function getServerSidebarCollapsed(): boolean {
  return false;
}

export function setSidebarCollapsed(next: boolean): void {
  cached = next;
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
  }
  emit();
}

export function toggleSidebarCollapsed(): void {
  setSidebarCollapsed(!readSidebarCollapsed());
}

export function subscribeSidebar(listener: Listener): () => void {
  listeners.add(listener);
  ensureStorageListener();

  return () => {
    listeners.delete(listener);
  };
}
