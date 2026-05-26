import { Skeleton } from '@/components/ui/skeleton';
import { GenerationLoader } from '@/components/creation/GenerationLoader';

export default function Loading() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-4/5" />
      </section>

      <GenerationLoader />
    </div>
  );
}