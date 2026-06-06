import { Skeleton } from '@/components/ui/skeleton';

export function AuthFormFallback() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-full" />

      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-44" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>

      <Skeleton className="h-11 w-full rounded-full" />

      <div className="flex items-center gap-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>

      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
