import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Layers3, LayoutDashboard, Plus, Settings2, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/app', label: 'My Boards', icon: LayoutDashboard },
  { href: '/app/new', label: 'New Board', icon: Plus },
  { href: '/templates', label: 'Templates', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white/75 px-5 py-6 backdrop-blur md:flex md:flex-col">
      <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-950">MoodBoard AI</div>
          <div className="text-xs text-slate-500">Creative direction workspace</div>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition',
                'hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <Badge variant="outline" className="mb-3">
          MVP workspace
        </Badge>
        <p className="text-sm leading-6 text-slate-600">
          Turn rough ideas into clean, editable creative boards with mood, palette, type, and references.
        </p>
      </div>
    </aside>
  );
}