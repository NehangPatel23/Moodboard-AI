'use client';

import { Button } from '@/components/ui/button';
import {
  editorConflictBannerClass,
  editorConflictOutlineButtonClass,
  editorConflictPrimaryButtonClass,
} from '@/components/board/board-editor-styles';

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
      className={editorConflictBannerClass}
    >
      <p>{label}. Reload to see their version, or keep editing your draft.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onKeepEditing}
          className={editorConflictOutlineButtonClass}
        >
          Keep editing
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onReload}
          className={editorConflictPrimaryButtonClass}
        >
          Reload
        </Button>
      </div>
    </div>
  );
}
