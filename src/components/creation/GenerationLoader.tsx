import { Skeleton } from '@/components/ui/skeleton';

export function GenerationLoader() {
  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 lg:max-w-xl">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </div>

        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-64 rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
    </div>
  );
}