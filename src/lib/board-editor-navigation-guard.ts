'use client';

export type BlockedNavigation =
  | { type: 'href'; href: string }
  | { type: 'back' }
  | { type: 'run'; run: () => void };

type BlockHandler = (navigation: BlockedNavigation) => void;

let dirty = false;
let handler: BlockHandler | null = null;

export function setBoardEditorNavigationDirty(value: boolean) {
  dirty = value;
}

export function isBoardEditorNavigationDirty() {
  return dirty;
}

export function registerBoardEditorNavigationBlocker(next: BlockHandler | null) {
  handler = next;
}

export function requestBoardEditorNavigation(
  navigation: BlockedNavigation,
  proceed: () => void,
): boolean {
  if (!dirty || !handler) {
    proceed();
    return false;
  }

  handler(navigation);
  return true;
}

export function guardedRouterPush(router: { push: (href: string) => void }, href: string) {
  requestBoardEditorNavigation({ type: 'href', href }, () => router.push(href));
}
