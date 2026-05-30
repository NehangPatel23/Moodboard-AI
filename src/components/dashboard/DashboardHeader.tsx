'use client';

export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
          Dashboard
        </p>

        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
          My Boards
        </h2>

        <p className="max-w-3xl text-base leading-7 text-slate-500">
          Browse saved moodboards, revisit ideas, and create new creative directions.
        </p>
      </div>
    </section>
  );
}