import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>

        <Skeleton className="mt-6 h-12 w-full max-w-4xl" />
        <Skeleton className="mt-3 h-4 w-44" />
        <Skeleton className="mt-4 h-4 w-1/2" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Skeleton className="h-105 rounded-4xl" />
          <Skeleton className="h-130 rounded-4xl" />
          <Skeleton className="h-105 rounded-4xl" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-105 rounded-4xl" />
          <Skeleton className="h-130 rounded-4xl" />
        </div>
      </div>
    </div>
  );
}