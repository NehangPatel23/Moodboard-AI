import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-11 w-full md:max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-4xl border border-slate-200 bg-white/85 p-4 shadow-sm"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-8 w-4/5" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-4 h-28 rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}