import {
  EDITOR_SECTION_META,
  normalizeEditorSection,
  type EditorSectionName,
} from '@/lib/editor-sections';
import { cn } from '@/lib/utils';

type EditorSectionBadgeProps = {
  section: EditorSectionName | string | null | undefined;
  className?: string;
  showIcon?: boolean;
};

export function EditorSectionBadge({
  section,
  className,
  showIcon = false,
}: EditorSectionBadgeProps) {
  const normalized = normalizeEditorSection(section);
  const meta = EDITOR_SECTION_META[normalized];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]',
        meta.badgeClass,
        className,
      )}
    >
      {showIcon ? <Icon className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}
