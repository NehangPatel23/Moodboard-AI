'use client';

export function DashboardHeader() {
  return (
    <section className="space-y-5">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
        Dashboard
      </p>

      <div className="max-w-5xl space-y-4">
        <h2 className="text-[clamp(3.5rem,8vw,5.75rem)] leading-[0.95] text-[#d8d2c8]">
          Curated Spaces
        </h2>

        <p className="max-w-3xl text-base leading-7 text-slate-500 md:text-lg">
          Browse saved boards, revisit directions, and continue shaping ideas into polished visual systems.
        </p>
      </div>
    </section>
  );
}