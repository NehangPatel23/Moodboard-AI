'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Copy,
  FileText,
  LayoutDashboard,
  Search,
  Settings2,
  Sparkles,
  SquarePen,
  SquarePlus,
  Star,
} from 'lucide-react';
import {
  closeCommandPalette,
  getCommandPaletteSnapshot,
  openCommandPalette,
  subscribeCommandPalette,
} from './command-palette-store';
import {
  duplicateBoardById,
  loadBoards,
  subscribeBoards,
  toggleFavoriteById,
} from '@/lib/board-store';
import { cn } from '@/lib/utils';

type CommandItem = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  icon: ReactNode;
  onSelect: () => void;
};

type CommandSection = {
  title: string;
  items: CommandItem[];
};

const EMPTY_COMMAND_PALETTE_SNAPSHOT = {
  open: false,
  sessionId: 0,
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(item: CommandItem, query: string): boolean {
  if (!query) return true;

  const haystack = [item.title, item.description, ...item.keywords].join(' ').toLowerCase();
  return haystack.includes(query);
}

function CommandPaletteDialog({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const currentBoardMatch = pathname.match(/^\/app\/boards\/([^/]+)(?:\/view)?$/);
  const currentBoardId = currentBoardMatch?.[1] ?? null;
  const currentBoard = currentBoardId
    ? boards.find((board) => board.id === currentBoardId) ?? null
    : null;

  const isCurrentBoardView = pathname.endsWith('/view');

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const sections = useMemo<CommandSection[]>(() => {
    const q = normalize(query);

    const navigateItems: CommandItem[] = [
      {
        id: 'go-dashboard',
        title: 'Go to dashboard',
        description: 'Open the board overview and recent activity.',
        keywords: ['home', 'overview', 'boards'],
        icon: <LayoutDashboard className="h-4 w-4" />,
        onSelect: () => router.push('/app'),
      },
      {
        id: 'create-board',
        title: 'Create new board',
        description: 'Start a board from a prompt or template.',
        keywords: ['new', 'create', 'prompt'],
        icon: <SquarePlus className="h-4 w-4" />,
        onSelect: () => router.push('/app/new'),
      },
      {
        id: 'open-templates',
        title: 'Open templates',
        description: 'Browse starter directions and ready-made flows.',
        keywords: ['template', 'starter', 'preset'],
        icon: <Sparkles className="h-4 w-4" />,
        onSelect: () => router.push('/templates'),
      },
      {
        id: 'open-settings',
        title: 'Open settings',
        description: 'Adjust appearance and app preferences.',
        keywords: ['preferences', 'appearance', 'account'],
        icon: <Settings2 className="h-4 w-4" />,
        onSelect: () => router.push('/settings'),
      },
    ].filter((item) => matchesQuery(item, q));

    const recentBoards = boards
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((board) => {
        if (!q) return true;
        const haystack = [board.title, board.summary, board.prompt, ...board.tags].join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, q ? 8 : 5)
      .map<CommandItem>((board) => ({
        id: `board-${board.id}`,
        title: `Open ${board.title}`,
        description: board.prompt,
        keywords: [board.title, board.summary, board.prompt, ...board.tags],
        icon: <FileText className="h-4 w-4" />,
        onSelect: () => router.push(`/app/boards/${board.id}`),
      }));

    const currentBoardItems: CommandItem[] = currentBoard
      ? [
          {
            id: 'current-board-view-toggle',
            title: isCurrentBoardView ? 'Open board editor' : 'Open presentation view',
            description: isCurrentBoardView
              ? 'Switch to the editable board workspace.'
              : 'Open the clean shareable presentation view.',
            keywords: ['current board', 'editor', 'view', 'presentation'],
            icon: isCurrentBoardView ? (
              <SquarePen className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            ),
            onSelect: () =>
              router.push(
                isCurrentBoardView ? `/app/boards/${currentBoard.id}` : `/app/boards/${currentBoard.id}/view`,
              ),
          },
          {
            id: 'duplicate-current-board',
            title: 'Duplicate current board',
            description: 'Create a copy and keep iterating.',
            keywords: ['duplicate', 'copy', 'clone'],
            icon: <Copy className="h-4 w-4" />,
            onSelect: () => {
              const copy = duplicateBoardById(currentBoard.id);
              if (copy) {
                router.push(`/app/boards/${copy.id}`);
              }
            },
          },
          {
            id: 'toggle-favorite-current-board',
            title: currentBoard.isFavorite
              ? 'Remove current board from favorites'
              : 'Add current board to favorites',
            description: 'Toggle the favorite state for this board.',
            keywords: ['favorite', 'star', 'toggle'],
            icon: <Star className="h-4 w-4" />,
            onSelect: () => {
              toggleFavoriteById(currentBoard.id);
            },
          },
        ].filter((item) => matchesQuery(item, q))
      : [];

    const actionItems: CommandItem[] = [
      {
        id: 'open-command-palette',
        title: 'Open command palette',
        description: 'Focus this search bar from anywhere in the app.',
        keywords: ['search', 'command', 'palette', 'shortcut'],
        icon: <Search className="h-4 w-4" />,
        onSelect: () => openCommandPalette(),
      },
    ].filter((item) => matchesQuery(item, q));

    const output: CommandSection[] = [];

    if (navigateItems.length > 0) {
      output.push({ title: 'Navigate', items: navigateItems });
    }

    if (recentBoards.length > 0) {
      output.push({
        title: q ? `Boards matching “${query.trim()}”` : 'Boards',
        items: recentBoards,
      });
    }

    if (currentBoardItems.length > 0) {
      output.push({ title: 'Current board', items: currentBoardItems });
    }

    if (actionItems.length > 0) {
      output.push({ title: 'Actions', items: actionItems });
    }

    return output;
  }, [boards, currentBoard, isCurrentBoardView, query, router]);

  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const safeActiveIndex = flatItems.length > 0 ? Math.min(activeIndex, flatItems.length - 1) : -1;

  useEffect(() => {
    if (safeActiveIndex < 0) return;

    const activeElement = panelRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${safeActiveIndex}"]`,
    );
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [safeActiveIndex]);

  const close = () => closeCommandPalette();

  const executeCommand = (item: CommandItem) => {
    closeCommandPalette();
    item.onSelect();
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((current) => (current + 1) % flatItems.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((current) => (current - 1 + flatItems.length) % flatItems.length);
      return;
    }

    if (event.key === 'Enter') {
      if (safeActiveIndex >= 0 && flatItems[safeActiveIndex]) {
        event.preventDefault();
        executeCommand(flatItems[safeActiveIndex]);
      }
      return;
    }

    if (event.key === 'Tab') {
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10060] flex items-start justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      aria-describedby="command-palette-description"
      onMouseDown={close}
    >
      <div
        key={sessionId}
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
      >
        <div className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-slate-950/15">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              id="command-palette-title"
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search pages, boards, or actions..."
              aria-describedby="command-palette-description"
              className="h-8 w-full border-0 bg-transparent p-0 text-base text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
          <p id="command-palette-description" className="sr-only">
            Use the search input to quickly navigate boards, templates, settings, and board actions.
            Arrow keys move through results and Enter activates the selected command.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section) => (
                <section key={section.title} aria-label={section.title}>
                  <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
                    {section.title}
                  </h2>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const flatIndex = flatItems.findIndex((candidate) => candidate.id === item.id);
                      const active = flatIndex === safeActiveIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-command-index={flatIndex}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => executeCommand(item)}
                          aria-label={`${item.title}. ${item.description}`}
                          className={cn(
                            'flex w-full items-start gap-4 rounded-[1.4rem] px-4 py-4 text-left transition',
                            active ? 'bg-sky-100/90 ring-1 ring-sky-300/70' : 'hover:bg-slate-50',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm',
                              active ? 'border-sky-200 text-sky-700' : 'border-slate-200 text-slate-500',
                            )}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold tracking-tight text-slate-950">
                              {item.title}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-slate-500">
                              {item.description}
                            </span>
                          </span>

                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                No matching commands
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Try a different keyword, or create a new board from the actions above.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/app/new')}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#020617]"
                >
                  Create board
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/app')}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                >
                  Open dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CommandPalette() {
  const snapshot = useSyncExternalStore(
    subscribeCommandPalette,
    getCommandPaletteSnapshot,
    () => EMPTY_COMMAND_PALETTE_SNAPSHOT,
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        openCommandPalette();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  if (!snapshot.open) return null;

  return <CommandPaletteDialog sessionId={snapshot.sessionId} />;
}