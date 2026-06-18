import type { BoardTemplate } from '@/types/board';
import { boardTemplates } from '@/lib/mock-data';

export type BoardTemplateRow = {
  id: string;
  owner_user_id: string;
  name: string;
  description: string;
  prompt: string;
  tags: string[] | null;
  template_json: BoardTemplate;
  is_public: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityTemplateRecord = BoardTemplate & {
  source: 'curated' | 'community';
  ownerUserId?: string;
  ownerName?: string;
  isPublic?: boolean;
  useCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function rowToCommunityTemplate(
  row: BoardTemplateRow,
  ownerName?: string | null,
): CommunityTemplateRecord {
  const template = row.template_json;
  return {
    ...template,
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    tags: row.tags ?? template.tags ?? [],
    source: 'community',
    ownerUserId: row.owner_user_id,
    ownerName: ownerName ?? undefined,
    isPublic: row.is_public,
    useCount: row.use_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function curatedTemplates(): CommunityTemplateRecord[] {
  return boardTemplates.map((template) => ({
    ...template,
    source: 'curated' as const,
  }));
}
