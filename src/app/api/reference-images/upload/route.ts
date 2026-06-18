import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { checkGenerateRateLimit } from '@/lib/generate-rate-limit';
import { validateImageUpload } from '@/lib/image-upload-validation';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = checkGenerateRateLimit(user.id);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rate.retryAfterSec} seconds.` },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    const boardId = String(formData.get('boardId') ?? '').trim();
    const referenceId = String(formData.get('referenceId') ?? '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!boardId || !referenceId) {
      return NextResponse.json({ error: 'boardId and referenceId are required' }, { status: 400 });
    }

    const access = await getBoardAccess(user.id, boardId);
    if (!access.canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validation = validateImageUpload(file, {
      maxBytes: MAX_BYTES,
      allowedTypes: ALLOWED_TYPES,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const safeReferenceId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${user.id}/${boardId}/${safeReferenceId}.${validation.extension}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage.from('reference-uploads').upload(path, buffer, {
      contentType: validation.contentType,
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = admin.storage.from('reference-uploads').getPublicUrl(path);

    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
