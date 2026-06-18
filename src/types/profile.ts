import type { Board } from '@/types/board';

export type PublicProfile = {
  id: string;
  name: string;
  workspaceName: string;
  workspaceTagline: string;
  avatarId: string;
  avatarAccent: string;
  avatarImageUrl: string | null;
};

export type PublicProfileResponse = {
  profile: PublicProfile;
  boards: Board[];
};
