import { rowToBoard } from '@/lib/db/board-mappers';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings-defaults';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Board } from '@/types/board';
import type { PublicProfile, PublicProfileResponse } from '@/types/profile';

const MAX_SHARED_BOARDS = 48;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProfileRow = {
  id: string;
  name: string;
};

type SettingsRow = {
  workspace_name: string;
  workspace_tagline: string;
  avatar_accent: string;
  avatar_id: string;
  avatar_image_url: string | null;
};

export function isValidProfileId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function mapPublicProfile(profile: ProfileRow, settings: SettingsRow | null): PublicProfile {
  return {
    id: profile.id,
    name: profile.name,
    workspaceName: settings?.workspace_name?.trim() || profile.name,
    workspaceTagline:
      settings?.workspace_tagline?.trim() || DEFAULT_APP_SETTINGS.workspaceTagline,
    avatarId: settings?.avatar_id?.trim() || DEFAULT_APP_SETTINGS.avatarId,
    avatarAccent: settings?.avatar_accent?.trim() || DEFAULT_APP_SETTINGS.avatarAccent,
    avatarImageUrl: settings?.avatar_image_url?.trim() || null,
  };
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfileResponse | null> {
  if (!isValidProfileId(userId)) {
    return null;
  }

  const admin = createAdminClient();

  const { data: profileRow, error: profileError } = await admin
    .from('profiles')
    .select('id, name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profileRow) {
    return null;
  }

  const { data: settingsRow } = await admin
    .from('user_settings')
    .select('workspace_name, workspace_tagline, avatar_accent, avatar_id, avatar_image_url')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: boardRows, error: boardsError } = await admin
    .from('boards')
    .select('*')
    .eq('user_id', userId)
    .eq('visibility', 'shared')
    .order('updated_at', { ascending: false })
    .limit(MAX_SHARED_BOARDS);

  if (boardsError) {
    throw new Error(boardsError.message);
  }

  const profile = mapPublicProfile(profileRow as ProfileRow, (settingsRow as SettingsRow | null) ?? null);
  const boards: Board[] = (boardRows ?? []).map((row) => {
    const board = rowToBoard(row);
    return {
      ...board,
      creatorId: profile.id,
      creatorName: profile.name,
    };
  });

  return { profile, boards };
}
