import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-12">
      <div className="rounded-4xl border border-slate-200 bg-[#020617] px-6 py-10 text-white md:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Start with a prompt. Leave with a creative direction.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Build a moodboard that looks polished, feels intentional, and is easy to iterate on.
          </p>
          <div className="mt-7">
            <Link
              href="/app/new"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-slate-950! shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
            >
              Create your first board
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}