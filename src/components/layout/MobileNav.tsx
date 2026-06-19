'use client';

import { usePathname } from 'next/navigation';
import { Compass, LayoutDashboard, Plus, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuardedLink } from '@/components/shared/GuardedLink';

const items = [
  { href: '/app', label: 'Boards', icon: LayoutDashboard },
  { href: '/app/new', label: 'New', icon: Plus },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/app') {
    return pathname === '/app' || pathname.startsWith('/app/boards');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <GuardedLink
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl px-1.5 py-2 text-[10px] font-medium transition',
                active
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-strong)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)]',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </GuardedLink>
          );
        })}
      </div>
    </nav>
  );
}
