import { cn } from '@/lib/utils';

type AppIconProps = {
  className?: string;
};

/** MoodBoard AI brand mark — matches public/icon.svg (favicon). */
export function AppIcon({ className }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={cn('h-11 w-11 shrink-0', className)}
      fill="none"
    >
      <rect width="32" height="32" rx="8" fill="#0f172a" />
      <rect x="6" y="8" width="8" height="8" rx="2" fill="#f472b6" />
      <rect x="16" y="8" width="10" height="5" rx="2" fill="#38bdf8" />
      <rect x="6" y="18" width="12" height="6" rx="2" fill="#a78bfa" />
      <rect x="20" y="15" width="6" height="9" rx="2" fill="#34d399" />
    </svg>
  );
}
