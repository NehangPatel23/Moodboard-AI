import { cn } from '@/lib/utils';

type AppIconProps = {
  className?: string;
};

/** MoodBoard AI brand mark. Used in the landing header and the app top bar. */
export function AppIcon({ className }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={cn('h-11 w-11 shrink-0 text-(--text-strong)', className)}
      fill="none"
    >
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="13"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      <rect
        x="8.5"
        y="8.5"
        width="31"
        height="31"
        rx="11"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <path
        d="M15.5 31V17L24 26.5L32.5 17V31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
