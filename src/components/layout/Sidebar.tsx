'use client';

import { usePathname } from 'next/navigation';
import { Fragment, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { GuardedLink } from '@/components/shared/GuardedLink';
import { Tooltip } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';
import {
  getServerSidebarCollapsed,
  readSidebarCollapsed,
  subscribeSidebar,
  toggleSidebarCollapsed,
} from '@/components/layout/sidebar-store';
import { WorkspaceAvatar } from '@/components/layout/WorkspaceAvatar';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/new', label: 'Create Board', icon: Plus },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/app') {
    return pathname === '/app' || pathname.startsWith('/app/boards');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const settings = useSyncExternalStore(
    subscribeAppSettings,
    readAppSettings,
    () => DEFAULT_APP_SETTINGS,
  );
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    readSidebarCollapsed,
    getServerSidebarCollapsed,
  );

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 hidden border-r border-[var(--border)] bg-[var(--surface-soft)] py-6 backdrop-blur-xl transition-[width] duration-200 md:flex md:flex-col',
        collapsed ? 'w-20 px-3' : 'w-72 px-5',
      )}
    >
      {collapsed ? (
        <Tooltip content={settings.workspaceName} side="right" triggerClassName="block w-full">
          <GuardedLink
            href="/"
            className={cn(
              'flex items-center rounded-2xl transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
              'justify-center py-2',
            )}
          >
            <WorkspaceAvatar className="h-11 w-11 shrink-0 rounded-2xl text-sm" emojiClassName="text-2xl" />
          </GuardedLink>
        </Tooltip>
      ) : (
        <GuardedLink
          href="/"
          className={cn(
            'flex items-center rounded-2xl transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
            'gap-3 px-3 py-2',
          )}
        >
          <WorkspaceAvatar className="h-11 w-11 shrink-0 rounded-2xl text-sm" emojiClassName="text-2xl" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-strong)]">
              {settings.workspaceName}
            </div>
            <div className="truncate text-xs text-[var(--text-muted)]">{settings.workspaceTagline}</div>
          </div>
        </GuardedLink>
      )}

      <div className="mt-8">
        {!collapsed ? (
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Workspace
          </p>
        ) : (
          <div className="mx-auto h-px w-8 bg-[var(--border)]" aria-hidden="true" />
        )}
      </div>

      <nav className="mt-3 flex flex-col gap-1" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          const link = (
            <GuardedLink
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-2xl py-3 text-sm font-medium transition',
                collapsed ? 'justify-center' : 'gap-3 px-3',
                active
                  ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-strong)]',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]')} />
              {!collapsed ? <span>{item.label}</span> : null}
            </GuardedLink>
          );

          return (
            <Fragment key={item.href}>
              {collapsed ? (
                <Tooltip content={item.label} side="right" triggerClassName="block w-full">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="mt-auto w-full">
        <Tooltip
          content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          side="right"
          disabled={!collapsed}
          triggerClassName={collapsed ? 'flex w-full justify-center' : undefined}
        >
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center rounded-2xl py-3 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
              collapsed ? 'w-full justify-center' : 'w-full gap-3 px-3',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}