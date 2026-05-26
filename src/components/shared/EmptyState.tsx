import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-4xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6">
        <Link
          href={actionHref}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white! shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}