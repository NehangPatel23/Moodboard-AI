import { cn } from '@/lib/utils';

const emojiFontStack =
  'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, emoji, sans-serif';

type AvatarEmojiProps = {
  emoji: string;
  className?: string;
  size?: 'picker' | 'display';
};

export function AvatarEmoji({ emoji, className, size = 'picker' }: AvatarEmojiProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none flex shrink-0 items-center justify-center whitespace-nowrap leading-none',
        size === 'picker' && 'h-7 w-7 text-[1.125rem]',
        className,
      )}
      style={{ fontFamily: emojiFontStack }}
    >
      {emoji}
    </span>
  );
}

export { emojiFontStack };
