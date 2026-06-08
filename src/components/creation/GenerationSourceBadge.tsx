import { Badge } from '@/components/ui/badge';
import { GEMINI_GRADIENT } from '@/lib/gemini-brand';
import { cn } from '@/lib/utils';

type GenerationSource = 'gemini' | 'mock';

type GenerationSourceBadgeProps = {
  source: GenerationSource;
  className?: string;
};

export function GenerationSourceBadge({ source, className }: GenerationSourceBadgeProps) {
  if (source === 'gemini') {
    return (
      <span
        className={cn(
          'gemini-source-badge inline-flex w-fit items-center rounded-full border border-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-[0_2px_10px_rgba(147,197,253,0.3)] dark:border-slate-900/15',
          className,
        )}
        style={{ backgroundImage: GEMINI_GRADIENT, color: '#0f172a' }}
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
