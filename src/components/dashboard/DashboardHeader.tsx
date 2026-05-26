import { Badge } from '@/components/ui/badge';

export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-3">
      <Badge variant="outline" className="w-fit">
        Dashboard
      </Badge>
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">My Boards</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Browse saved moodboards, revisit ideas, and create new creative directions from prompts.
        </p>
      </div>
    </section>
  );
}