import {
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_PEXELS,
  buildReferenceImageUrl,
  needsReferenceImageUpgrade,
  padReferencesToCount,
  type ReferenceImageInput,
} from '@/lib/reference-images';
import { searchPexelsImage } from '@/lib/pexels';
import type { Board, ReferenceItem } from '@/types/board';

async function resolveReferenceImage(
  input: ReferenceImageInput,
): Promise<{ imageUrl: string; source: string }> {
  const pexelsUrl = await searchPexelsImage(input);
  if (pexelsUrl) {
    return { imageUrl: pexelsUrl, source: REFERENCE_IMAGE_SOURCE_PEXELS };
  }

  return {
    imageUrl: buildReferenceImageUrl(input),
    source: REFERENCE_IMAGE_SOURCE,
  };
}

export async function enrichReferenceItem(
  reference: ReferenceItem,
  board: Pick<Board, 'prompt' | 'mood' | 'palette'>,
  index = 0,
): Promise<ReferenceItem> {
  if (!needsReferenceImageUpgrade(reference)) {
    return reference;
  }

  const input: ReferenceImageInput = {
    title: reference.title,
    category: reference.category,
    mood: board.mood,
    prompt: board.prompt,
    palette: board.palette,
    seed: `${board.prompt}-${reference.title}-${index}`,
  };

  const resolved = await resolveReferenceImage(input);

  return {
    ...reference,
    imageUrl: resolved.imageUrl,
    source: resolved.source,
  };
}

function padBoardReferences(board: Board): Board {
  return {
    ...board,
    references: padReferencesToCount(board.references, board),
  };
}

export async function enrichReferencesSequentially(
  board: Board,
  onReference?: (index: number, reference: ReferenceItem, total: number) => void | Promise<void>,
): Promise<Board> {
  const paddedBoard = padBoardReferences(board);
  const total = paddedBoard.references.length;
  const references: ReferenceItem[] = [];

  for (let index = 0; index < total; index += 1) {
    const enriched = await enrichReferenceItem(
      paddedBoard.references[index],
      paddedBoard,
      index,
    );
    references.push(enriched);
    await onReference?.(index, enriched, total);
  }

  const changed =
    references.length !== board.references.length ||
    references.some(
      (reference, index) =>
        reference.imageUrl !== board.references[index]?.imageUrl ||
        reference.source !== board.references[index]?.source ||
        reference.title !== board.references[index]?.title,
    );

  if (!changed) {
    return board;
  }

  return { ...board, references };
}

export async function enrichBoardReferences(board: Board): Promise<Board> {
  const paddedBoard = padBoardReferences(board);

  const references = await Promise.all(
    paddedBoard.references.map((reference, index) =>
      enrichReferenceItem(reference, paddedBoard, index),
    ),
  );

  const changed =
    references.length !== board.references.length ||
    references.some(
      (reference, index) =>
        reference.imageUrl !== board.references[index]?.imageUrl ||
        reference.source !== board.references[index]?.source ||
        reference.title !== board.references[index]?.title,
    );

  if (!changed) {
    return board;
  }

  return { ...board, references };
}
