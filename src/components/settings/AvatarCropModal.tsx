'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
import { showToast } from '@/components/shared/toast-store';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { cropImageToBlob } from '@/lib/crop-image';
import { cn } from '@/lib/utils';
import {
  appModalScrimClass,
  appOutlineButtonClass,
  appPrimaryButtonClass,
} from '@/components/shared/app-surface-styles';

type AvatarCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  uploading?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export function AvatarCropModal({
  open,
  imageSrc,
  uploading = false,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploading && !processing) {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel, processing, uploading]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || uploading || processing) {
      return;
    }

    setProcessing(true);

    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);

      if (blob.size > 2 * 1024 * 1024) {
        showToast('Cropped image is too large. Zoom in or choose a smaller photo.', 'destructive');
        return;
      }

      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await onConfirm(file);
    } catch {
      showToast('Could not crop image.', 'destructive');
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !imageSrc || typeof document === 'undefined') {
    return null;
  }

  const busy = uploading || processing;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[10060] flex items-center justify-center px-4 py-6',
        appModalScrimClass,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-elevated)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-(--border)/80 px-5 py-4 md:px-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
            Profile photo
          </p>
          <h2
            id="avatar-crop-title"
            className="mt-1 [font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)"
          >
            Crop your avatar
          </h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Drag to reposition and use the slider to zoom. The circle shows what others will see.
          </p>
        </div>

        <div key={imageSrc} className="relative h-72 bg-(--surface-subtle) sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-2 border-t border-(--border)/80 px-5 py-4 md:px-6">
          <label className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-(--text-muted)">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              disabled={busy}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-(--border) accent-(--text-strong) disabled:opacity-50"
              aria-label="Zoom crop"
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-(--border)/80 px-5 py-4 md:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={cn(appOutlineButtonClass, 'h-10 px-4 disabled:opacity-60')}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !croppedAreaPixels}
            className={cn(appPrimaryButtonClass, 'h-10 px-4 disabled:opacity-60')}
          >
            {busy ? 'Uploading…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
