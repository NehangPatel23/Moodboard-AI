import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
      <div className="max-w-2xl">
        <Badge className="mb-5" variant="outline">
          AI creative direction workspace
        </Badge>
        <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
          Turn rough ideas into a beautiful visual board.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          MoodBoard AI helps designers, founders, and creators transform vague prompts into palettes, typography,
          references, and clear creative direction.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white! shadow-sm transition hover:bg-[#020617] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            Create a board
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            View my boards
          </Link>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[#020617] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Prompt</p>
            <p className="mt-3 text-lg leading-7">
              “soft luxury wellness brand for women aged 25–40”
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Generated mood</p>
            <p className="mt-3 text-xl font-medium text-slate-950">Calm luxury</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ivory, sage, muted gold, charcoal.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Creative summary</p>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              A calm, elevated identity built around restraint, warmth, and trust.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}