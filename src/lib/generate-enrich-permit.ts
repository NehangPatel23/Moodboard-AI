const PERMIT_TTL_MS = 5 * 60_000;

type EnrichPermit = {
  boardId: string;
  expiresAt: number;
};

const permits = new Map<string, EnrichPermit>();

function permitKey(userId: string, boardId: string): string {
  return `${userId}:${boardId}`;
}

export function issueEnrichPermit(userId: string, boardId: string): void {
  permits.set(permitKey(userId, boardId), {
    boardId,
    expiresAt: Date.now() + PERMIT_TTL_MS,
  });
}

export function consumeEnrichPermit(userId: string, boardId: string): boolean {
  const key = permitKey(userId, boardId);
  const permit = permits.get(key);

  if (!permit || Date.now() > permit.expiresAt) {
    permits.delete(key);
    return false;
  }

  permits.delete(key);
  return permit.boardId === boardId;
}
