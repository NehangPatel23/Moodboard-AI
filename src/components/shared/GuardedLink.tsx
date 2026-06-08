'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import {
  isBoardEditorNavigationDirty,
  requestBoardEditorNavigation,
} from '@/lib/board-editor-navigation-guard';

type GuardedLinkProps = ComponentProps<typeof Link>;

function resolveHref(href: GuardedLinkProps['href']) {
  if (typeof href === 'string') return href;
  if (typeof href === 'object' && href.pathname) return href.pathname;
  return '';
}

export function GuardedLink({ href, onClick, ...props }: GuardedLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const targetHref = resolveHref(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (!targetHref || targetHref === pathname || !isBoardEditorNavigationDirty()) {
          return;
        }

        event.preventDefault();
        requestBoardEditorNavigation({ type: 'href', href: targetHref }, () => router.push(targetHref));
      }}
      {...props}
    />
  );
}
