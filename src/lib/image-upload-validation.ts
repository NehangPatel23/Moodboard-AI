export type ImageUploadValidationResult =
  | { ok: true; contentType: string; extension: string }
  | { ok: false; error: string; status: number };

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);
const HEIC_EXTENSIONS = new Set(['heic', 'heif']);

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function extensionFromFilename(filename: string): string | null {
  const parts = filename.trim().split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop()?.toLowerCase();
  return ext || null;
}

export function extensionForImageType(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export function validateImageUpload(
  file: File,
  options: { maxBytes: number; allowedTypes: readonly string[] },
): ImageUploadValidationResult {
  const extension = extensionFromFilename(file.name);

  if (file.type && HEIC_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      status: 400,
      error: 'HEIC is not supported — export as JPEG or PNG first.',
    };
  }

  if (extension && HEIC_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      status: 400,
      error: 'HEIC is not supported — export as JPEG or PNG first.',
    };
  }

  let contentType = file.type.trim();

  if (!contentType && extension) {
    contentType = EXTENSION_TO_MIME[extension] ?? '';
  }

  if (!contentType || !options.allowedTypes.includes(contentType)) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported image type. Use ${formatAllowedTypes(options.allowedTypes)}.`,
    };
  }

  if (file.size > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024));
    return {
      ok: false,
      status: 400,
      error: `Image must be ${maxMb} MB or smaller.`,
    };
  }

  return {
    ok: true,
    contentType,
    extension: extensionForImageType(contentType),
  };
}

function formatAllowedTypes(types: readonly string[]): string {
  const labels = types.map((type) => {
    switch (type) {
      case 'image/jpeg':
        return 'JPEG';
      case 'image/png':
        return 'PNG';
      case 'image/webp':
        return 'WebP';
      case 'image/gif':
        return 'GIF';
      default:
        return type;
    }
  });

  if (labels.length <= 1) {
    return labels[0] ?? 'a supported image type';
  }

  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}
