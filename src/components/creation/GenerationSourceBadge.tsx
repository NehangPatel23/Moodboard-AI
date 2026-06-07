import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type GenerationSource = 'gemini' | 'mock';

type GenerationSourceBadgeProps = {
  source: GenerationSource;
  className?: string;
};

const GEMINI_GRADIENT =
  'linear-gradient(135deg, #b8d8fc 0%, #d4c8f5 24%, #f5c8d8 48%, #fde8b8 72%, #c8f0d8 100%)';

export function GenerationSourceBadge({ source, className }: GenerationSourceBadgeProps) {
  if (source === 'gemini') {
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-full border border-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[0_2px_10px_rgba(147,197,253,0.3)] dark:border-slate-900/15',
          className,
        )}
        style={{ backgroundImage: GEMINI_GRADIENT }}
      >
        Powered by Gemini
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'w-fit rounded-full border-(--border) bg-(--surface) px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-(--text-muted)',
        className,
      )}
    >
      Demo generation
    </Badge>
  );
}
