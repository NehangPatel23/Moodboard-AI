export type BoardVisibility = 'private' | 'shared';

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
  isFavorite: boolean;
  visibility: BoardVisibility;
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