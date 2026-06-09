import { toPng } from 'html-to-image';

export const EXPORT_BACKGROUND_COLOR = '#f8f7f4';
export const EXPORT_CAPTURE_WIDTH = 1200;
export const MIN_EXPORT_PNG_BYTES = 2048;

export function getExportCaptureTarget(container: HTMLElement | null): HTMLElement | null {
  if (!container) return null;
  return container.querySelector<HTMLElement>('[data-board-export]');
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });
}

function createImagePlaceholder(title: string): string {
  const label = title.trim() || 'Reference';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#ece7df"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6f675d" font-family="Georgia, serif" font-size="28">${label.replace(/[<>&'"]/g, '')}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function inlineExportImages(target: HTMLElement): Promise<void> {
  const images = Array.from(target.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute('src')?.trim();
      if (!src || src.startsWith('data:image/')) return;

      const alt = image.getAttribute('alt') ?? 'Reference';

      try {
        const response = await fetch(src, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Image fetch failed (${response.status}).`);
        }

        const blob = await response.blob();
        image.src = await blobToDataUrl(blob);
      } catch {
        image.src = createImagePlaceholder(alt);
      }
    }),
  );
}

async function waitForCaptureReady(node: HTMLElement): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        if (typeof image.decode === 'function') {
          await image.decode().catch(() => undefined);
        }
        return;
      }

      await new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });

      if (typeof image.decode === 'function') {
        await image.decode().catch(() => undefined);
      }
    }),
  );

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 100);
  });
}

async function waitForLayout(node: HTMLElement): Promise<{ width: number; height: number }> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

  const rect = node.getBoundingClientRect();
  const width = Math.ceil(rect.width || node.scrollWidth || node.offsetWidth || EXPORT_CAPTURE_WIDTH);
  const height = Math.ceil(rect.height || node.scrollHeight || node.offsetHeight);

  return { width, height };
}

export function assertExportPng(dataUrl: string): void {
  const base64 = dataUrl.split(',')[1] ?? '';
  const byteLength = Math.floor((base64.length * 3) / 4);
  if (byteLength < MIN_EXPORT_PNG_BYTES) {
    throw new Error('Captured PNG appears blank.');
  }
}

function assertExportContent(target: HTMLElement, height: number): void {
  if (!target.innerText.trim()) {
    throw new Error('Export layout has no text content.');
  }

  if (height < 240) {
    throw new Error('Export layout has no dimensions.');
  }
}

export type ExportBlockCapture = {
  dataUrl: string;
  width: number;
  height: number;
};

async function captureElementPng(element: HTMLElement): Promise<ExportBlockCapture> {
  const { width, height } = await waitForLayout(element);

  if (width < 1 || height < 1) {
    throw new Error('Export block has no dimensions.');
  }

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: EXPORT_BACKGROUND_COLOR,
    width,
    height,
  });

  assertExportPng(dataUrl);
  return { dataUrl, width, height };
}

async function prepareExportTarget(target: HTMLElement): Promise<void> {
  await waitForLayout(target);
  await inlineExportImages(target);
  await waitForCaptureReady(target);
}

export async function captureExportPng(container: HTMLElement): Promise<string> {
  const target = getExportCaptureTarget(container);
  if (!target) {
    throw new Error('Export layout not ready.');
  }

  await prepareExportTarget(target);

  const { width, height } = await waitForLayout(target);
  assertExportContent(target, height);

  if (width < EXPORT_CAPTURE_WIDTH * 0.8) {
    throw new Error('Export layout width is too small.');
  }

  const { dataUrl } = await captureElementPng(target);
  return dataUrl;
}

export async function captureExportBlocks(container: HTMLElement): Promise<ExportBlockCapture[]> {
  const target = getExportCaptureTarget(container);
  if (!target) {
    throw new Error('Export layout not ready.');
  }

  await prepareExportTarget(target);

  const blockElements = Array.from(target.querySelectorAll<HTMLElement>('[data-export-block]'));
  if (!blockElements.length) {
    throw new Error('Export blocks not found.');
  }

  assertExportContent(target, target.scrollHeight);

  const blocks: ExportBlockCapture[] = [];
  for (const element of blockElements) {
    blocks.push(await captureElementPng(element));
  }

  return blocks;
}
