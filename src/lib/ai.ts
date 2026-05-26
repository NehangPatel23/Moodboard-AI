import type { BoardTemplate } from '@/types/board';
import { createBoardFromPrompt, getTemplates } from './board-store';
import type { Board } from '@/types/board';

export type GeneratedBoardDraft = {
  board: Board;
  followUpPrompt: string;
};

export function getBoardTemplates(): BoardTemplate[] {
  return getTemplates();
}

export function getQuickPromptSuggestions(): string[] {
  return [
    'soft, modern brand for a skincare startup',
    'moody bedroom inspiration',
    'editorial campaign for a fashion drop',
    'landing page vibe for a fintech app',
    'luxury wellness brand for women aged 25-40',
  ];
}

export function generateBoardDraft(prompt: string): GeneratedBoardDraft {
  const board = createBoardFromPrompt({ prompt });
  const followUpPrompt = buildFollowUpPrompt(board);
  return { board, followUpPrompt };
}

function buildFollowUpPrompt(board: Board): string {
  return `Refine the direction for ${board.title.toLowerCase()} with a ${board.mood} mood, ${board.tone.join(
    ', ',
  )} tone, and a palette centered on ${board.palette
    .map((item) => item.label.toLowerCase())
    .slice(0, 3)
    .join(', ')}.`;
}