export type BoardVisibility = 'private' | 'shared';

export type BoardMemberRole = 'editor' | 'viewer';

export type BoardRole = 'owner' | BoardMemberRole;

export type BoardMember = {
  userId: string;
  name: string;
  email: string;
  role: BoardMemberRole;
  createdAt: string;
};

export type BoardInvite = {
  id: string;
  email: string;
  role: BoardMemberRole;
  status: 'pending' | 'accepted' | 'revoked';
  token: string;
  createdAt: string;
  acceptedAt?: string;
};

export type BoardComment = {
  id: string;
  boardId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  isHidden?: boolean;
};

export type BoardActivityAction = 'saved';

export type BoardActivityChangeAction = 'added' | 'removed' | 'updated';

export type BoardActivityChange = {
  kind: 'field' | 'palette' | 'typography' | 'reference' | 'note';
  action: BoardActivityChangeAction;
  section: string;
  label: string;
  summary: string;
  before?: string | null;
  after?: string | null;
};

export type BoardActivityEvent = {
  id: string;
  boardId: string;
  userId: string;
  actorName: string;
  action: BoardActivityAction;
  summary: string | null;
  changes: BoardActivityChange[];
  createdAt: string;
  isRead?: boolean;
  isHidden?: boolean;
};

export type CollaborationItemType = 'comment' | 'activity';

export type CollaborationItemStateInput = {
  type: CollaborationItemType;
  id: string;
  isRead?: boolean;
  isHidden?: boolean;
};

export type BoardCollaborationStateResponse = {
  commentsLastReadAt: string | null;
  activityLastReadAt: string | null;
  unreadComments: number;
  unreadActivity: number;
};

export type PaletteItem = {
  id: string;
  label: string;
  hex: string;
  usage: string;
};

export type TypographyRole = 'heading' | 'body' | 'accent';

export type TypographyItem = {
  id: string;
  role: TypographyRole;
  fontName: string;
  note: string;
};

export type ReferenceItem = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  source?: string;
  position?: { x: number; y: number };
};

export type NoteType = 'idea' | 'instruction' | 'keyword';

export type NoteItem = {
  id: string;
  text: string;
  type: NoteType;
  position?: { x: number; y: number };
};

export type Board = {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  mood: string;
  tone: string[];
  tags: string[];
  palette: PaletteItem[];
  typography: TypographyItem[];
  references: ReferenceItem[];
  notes: NoteItem[];
  createdAt: string;
  updatedAt: string;
  lastSavedByName?: string | null;
  isFavorite: boolean;
  visibility: BoardVisibility;
  role?: BoardRole;
};

export type BoardSnapshot = {
  id: string;
  boardId: string;
  userId: string;
  actorName: string;
  label: string | null;
  boardData: Board;
  createdAt: string;
};

export type BoardTemplatePaletteItem = {
  label: string;
  hex: string;
  usage: string;
};

export type BoardTemplateTypographyItem = {
  role: TypographyRole;
  fontName: string;
  note: string;
};

export type BoardTemplateReferenceItem = {
  title: string;
  category: string;
  source?: string;
  imageUrl?: string;
};

export type BoardTemplateNoteItem = {
  text: string;
  type: NoteType;
};

export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  tags: string[];

  mood?: string;
  summary?: string;
  tone?: string[];

  palette?: BoardTemplatePaletteItem[];
  typography?: BoardTemplateTypographyItem[];
  references?: BoardTemplateReferenceItem[];
  notes?: BoardTemplateNoteItem[];
};

export type BoardDraftInput = {
  prompt: string;
  title?: string;
  tags?: string[];
  visibility?: BoardVisibility;
};