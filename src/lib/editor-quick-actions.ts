'use client';

export type EditorQuickAction = 'export' | 'snapshots' | 'share' | 'jump-section';

export type EditorQuickActionDetail = {
  action: EditorQuickAction;
  sectionIndex?: number;
};

export const EDITOR_QUICK_ACTION_EVENT = 'moodboard:editor-quick-action';

export function dispatchEditorQuickAction(detail: EditorQuickActionDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<EditorQuickActionDetail>(EDITOR_QUICK_ACTION_EVENT, { detail }));
}

export function subscribeEditorQuickAction(
  listener: (detail: EditorQuickActionDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: Event) => {
    listener((event as CustomEvent<EditorQuickActionDetail>).detail);
  };

  window.addEventListener(EDITOR_QUICK_ACTION_EVENT, handler);
  return () => window.removeEventListener(EDITOR_QUICK_ACTION_EVENT, handler);
}
