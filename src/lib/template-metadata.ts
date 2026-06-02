import { safeParse } from '@/lib/utils';

const STORAGE_KEY = 'moodboard-ai:template-metadata';
const TEMPLATE_METADATA_EVENT = 'moodboard-ai:template-metadata-updated';

type TemplateMetadata = {
  usageCount: number;
  lastOpenedAt: string | null;
  lastUsedAt: string | null;
};

type TemplateMetadataStore = Record<string, TemplateMetadata>;

const EMPTY_METADATA: TemplateMetadata = {
  usageCount: 0,
  lastOpenedAt: null,
  lastUsedAt: null,
};

let cachedMetadata: TemplateMetadataStore = {};
let hydratedFromStorage = false;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeMetadataEntry(entry?: Partial<TemplateMetadata>): TemplateMetadata {
  return {
    usageCount: typeof entry?.usageCount === 'number' && Number.isFinite(entry.usageCount) ? entry.usageCount : 0,
    lastOpenedAt: typeof entry?.lastOpenedAt === 'string' ? entry.lastOpenedAt : null,
    lastUsedAt: typeof entry?.lastUsedAt === 'string' ? entry.lastUsedAt : null,
  };
}

function notifyTemplateMetadataChanged(): void {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(TEMPLATE_METADATA_EVENT));
}

function readTemplateMetadataFromStorage(): TemplateMetadataStore {
  if (!canUseStorage()) return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse<Record<string, Partial<TemplateMetadata>>>(raw, {});

  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, normalizeMetadataEntry(value)]),
  );
}

function writeTemplateMetadata(next: TemplateMetadataStore): void {
  cachedMetadata = next;

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  notifyTemplateMetadataChanged();
}

export function hydrateTemplateMetadataStore(): void {
  if (!canUseStorage() || hydratedFromStorage) return;

  hydratedFromStorage = true;
  cachedMetadata = readTemplateMetadataFromStorage();
  notifyTemplateMetadataChanged();
}

export function subscribeTemplateMetadata(callback: () => void): () => void {
  if (!canUseStorage()) return () => undefined;

  const handler = () => callback();
  window.addEventListener(TEMPLATE_METADATA_EVENT, handler);

  return () => {
    window.removeEventListener(TEMPLATE_METADATA_EVENT, handler);
  };
}

export function loadTemplateMetadata(): TemplateMetadataStore {
  return cachedMetadata;
}

export function getTemplateMetadata(templateId: string): TemplateMetadata {
  return cachedMetadata[templateId] ?? EMPTY_METADATA;
}

export function recordTemplateOpen(templateId: string): TemplateMetadata {
  const current = getTemplateMetadata(templateId);
  const nextEntry: TemplateMetadata = {
    ...current,
    lastOpenedAt: nowIso(),
  };

  writeTemplateMetadata({
    ...cachedMetadata,
    [templateId]: nextEntry,
  });

  return nextEntry;
}

export function recordTemplateUse(templateId: string): TemplateMetadata {
  const current = getTemplateMetadata(templateId);
  const nextEntry: TemplateMetadata = {
    usageCount: current.usageCount + 1,
    lastOpenedAt: nowIso(),
    lastUsedAt: nowIso(),
  };

  writeTemplateMetadata({
    ...cachedMetadata,
    [templateId]: nextEntry,
  });

  return nextEntry;
}