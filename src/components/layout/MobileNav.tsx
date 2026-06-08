'use client';

import { LayoutDashboard, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuardedLink } from '@/components/shared/GuardedLink';

const items = [
  { href: '/app', label: 'Boards', icon: LayoutDashboard },
  { href: '/app/new', label: 'New', icon: Plus },
  { href: '/templates', label: 'Templates', icon: Sparkles },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <GuardedLink
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium text-[var(--text-muted)]',
                'hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)]',
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