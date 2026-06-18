import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { rowToSettings, settingsToRow } from '@/lib/db/settings-mappers';
import { validateImageUpload } from '@/lib/image-upload-validation';
import { createAdminClient } from '@/lib/supabase/admin';
import { CUSTOM_AVATAR_ID, DEFAULT_APP_SETTINGS } from '@/lib/settings-defaults';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const validation = validateImageUpload(file, {
      maxBytes: MAX_BYTES,
      allowedTypes: ALLOWED_TYPES,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const path = `${user.id}/avatar.${validation.extension}`;
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from('avatar-uploads').upload(path, buffer, {
      contentType: validation.contentType,
      upsert: true,
    });

    if (uploadError) {
      console.error('[avatar upload] storage error:', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from('avatar-uploads').getPublicUrl(path);
    const imageUrl = publicUrlData.publicUrl;

    const { data: existingRow } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentSettings = existingRow ? rowToSettings(existingRow) : DEFAULT_APP_SETTINGS;
    const nextSettings = {
      ...currentSettings,
      avatarId: CUSTOM_AVATAR_ID,
      avatarImageUrl: imageUrl,
    };

    const settingsRow = {
      ...settingsToRow(nextSettings, user.id),
      updated_at: new Date().toISOString(),
    };

    const { data: savedRow, error: settingsError } = await supabase
      .from('user_settings')
      .upsert(settingsRow, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (settingsError) {
      console.error('[avatar upload] settings error:', settingsError.message);
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl,
      settings: rowToSettings(savedRow),
      updatedAt: savedRow.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload profile photo';
    console.error('[avatar upload]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingRow } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentSettings = existingRow ? rowToSettings(existingRow) : DEFAULT_APP_SETTINGS;
    const nextSettings = {
      ...currentSettings,
      avatarImageUrl: null,
      avatarId:
        currentSettings.avatarId === CUSTOM_AVATAR_ID
          ? DEFAULT_APP_SETTINGS.avatarId
          : currentSettings.avatarId,
    };

    const settingsRow = {
      ...settingsToRow(nextSettings, user.id),
      updated_at: new Date().toISOString(),
    };

    const { data: savedRow, error: settingsError } = await supabase
      .from('user_settings')
      .upsert(settingsRow, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (settingsError) {
      console.error('[avatar remove] settings error:', settingsError.message);
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    const admin = createAdminClient();
    await admin.storage.from('avatar-uploads').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

    return NextResponse.json({
      settings: rowToSettings(savedRow),
      updatedAt: savedRow.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove profile photo';
    console.error('[avatar remove]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
