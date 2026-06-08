import { enrichReferencesSequentially } from '@/lib/enrich-board-references';
import { consumeEnrichPermit } from '@/lib/generate-enrich-permit';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { validateBoardPayload } from '@/lib/validate-board-payload';
import type { Board, ReferenceItem } from '@/types/board';

type EnrichEvent =
  | { type: 'start'; total: number }
  | { type: 'reference'; index: number; reference: ReferenceItem }
  | { type: 'complete'; board: Board }
  | { type: 'error'; message: string };

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return new Response(JSON.stringify({ type: 'error', message: 'Unauthorized' } satisfies EnrichEvent) + '\n', {
      status: 401,
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  }

  let body: { board?: unknown };
  try {
    body = (await request.json()) as { board?: unknown };
  } catch {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Invalid JSON body' } satisfies EnrichEvent) + '\n',
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } },
    );
  }

  const validated = validateBoardPayload(body.board);
  if ('error' in validated) {
    return new Response(
      JSON.stringify({ type: 'error', message: validated.error } satisfies EnrichEvent) + '\n',
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } },
    );
  }

  const { board } = validated;

  if (!consumeEnrichPermit(user.id, board.id)) {
    return new Response(
      JSON.stringify({
        type: 'error',
        message: 'Enrich not permitted. Generate a draft first.',
      } satisfies EnrichEvent) + '\n',
      { status: 403, headers: { 'Content-Type': 'application/x-ndjson' } },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const write = (event: EnrichEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        let started = false;

        const enrichedBoard = await enrichReferencesSequentially(board, async (index, reference, total) => {
          if (!started) {
            write({ type: 'start', total });
            started = true;
          }

          write({ type: 'reference', index, reference });
        });

        if (!started) {
          write({ type: 'start', total: enrichedBoard.references.length });
        }

        write({ type: 'complete', board: enrichedBoard });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Enrichment failed';
        write({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
    },
  });
}
