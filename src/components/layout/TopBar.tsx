import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type TopBarProps = {
  title: string;
  description?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
};

export function TopBar({
  title,
  description,
  primaryActionHref = '/app/new',
  primaryActionLabel = 'New Board',
}: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={primaryActionHref}
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white! shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            {primaryActionLabel}
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-11" placeholder="Search boards, tags, or prompts" />
        </div>
      </div>
    </header>
  );
}