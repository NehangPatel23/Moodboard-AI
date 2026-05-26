import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
        <div className="space-y-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full max-w-2xl" />
          <Skeleton className="h-6 w-5/6" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-85 rounded-4xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44 rounded-4xl" />
        <Skeleton className="h-44 rounded-4xl" />
        <Skeleton className="h-44 rounded-4xl" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-105 rounded-4xl" />
        <Skeleton className="h-105 rounded-4xl" />
      </div>

      <div className="mt-6 rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="mt-4 h-6 w-4/5" />
      </div>
    </main>
  );
}