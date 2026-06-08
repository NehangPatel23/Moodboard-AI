'use client';

import { Button } from '@/components/ui/button';

type RemoteUpdateBannerProps = {
  savedByName: string | null;
  onReload: () => void;
  onKeepEditing: () => void;
};

export function RemoteUpdateBanner({ savedByName, onReload, onKeepEditing }: RemoteUpdateBannerProps) {
  const label = savedByName ? `${savedByName} saved changes` : 'Someone saved changes';

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p>{label}. Reload to see their version, or keep editing your draft.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onKeepEditing}
          className="rounded-full border-amber-300 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/50"
        >
          Keep editing
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onReload}
          className="rounded-full bg-amber-900 text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
        >
          Reload
        </Button>
      </div>
    </div>
  );
}
