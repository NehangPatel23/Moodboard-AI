'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Camera,
  Copy,
  Download,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Search,
  Settings2,
  Share2,
  Sparkles,
  SquarePen,
  SquarePlus,
  Star,
  Wand2,
} from 'lucide-react';
import {
  closeCommandPalette,
  getCommandPaletteSnapshot,
  isCommandPaletteEnabled,
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
import { guardedRouterPush } from '@/lib/board-editor-navigation-guard';
import { dispatchEditorQuickAction } from '@/lib/editor-quick-actions';
import { getBoardTemplates } from '@/lib/ai';

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

const EDITOR_SECTION_COMMANDS = [
  { id: 'section-overview', label: 'Overview', index: 0, keywords: ['overview', 'direction', 'summary'] },
  { id: 'section-palette', label: 'Palette', index: 1, keywords: ['palette', 'color', 'colors'] },
  { id: 'section-typography', label: 'Typography', index: 2, keywords: ['typography', 'fonts', 'type'] },
  { id: 'section-references', label: 'References', index: 3, keywords: ['references', 'images', 'photos'] },
  { id: 'section-notes', label: 'Notes', index: 4, keywords: ['notes', 'ideas'] },
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(item: CommandItem, query: string): boolean {
  if (!query) return true;

  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = [item.title, item.description, ...item.keywords].join(' ').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
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
        onSelect: () => guardedRouterPush(router, '/app'),
      },
      {
        id: 'create-board',
        title: 'Create new board',
        description: 'Start a board from a prompt or template.',
        keywords: ['new', 'create', 'prompt'],
        icon: <SquarePlus className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, '/app/new'),
      },
      {
        id: 'open-templates',
        title: 'Open templates',
        description: 'Browse starter directions and ready-made flows.',
        keywords: ['template', 'starter', 'preset'],
        icon: <Sparkles className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, '/templates'),
      },
      {
        id: 'open-discover',
        title: 'Open discover',
        description: 'Browse all public shared boards.',
        keywords: ['discover', 'public', 'community', 'browse'],
        icon: <Search className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, '/discover'),
      },
      {
        id: 'open-help',
        title: 'Open help',
        description: 'Documentation, FAQs, and getting started guides.',
        keywords: ['help', 'docs', 'support', 'faq'],
        icon: <HelpCircle className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, '/help'),
      },
      {
        id: 'open-settings',
        title: 'Open settings',
        description: 'Adjust appearance and app preferences.',
        keywords: ['preferences', 'appearance', 'account'],
        icon: <Settings2 className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, '/settings'),
      },
    ].filter((item) => matchesQuery(item, q));

    const templates = getBoardTemplates();
    const templateMatchesQuery =
      !q ||
      q.includes('template') ||
      q.includes('starter') ||
      q.includes('preset');

    const templateItems: CommandItem[] = templates
      .filter((template) => {
        if (!q || templateMatchesQuery) return true;
        const item: CommandItem = {
          id: `template-${template.id}`,
          title: template.name,
          description: template.description,
          keywords: [template.name, template.description, template.prompt, ...template.tags, template.mood ?? ''],
          icon: null,
          onSelect: () => undefined,
        };
        return matchesQuery(item, q);
      })
      .slice(0, q ? 8 : 5)
      .map<CommandItem>((template) => ({
        id: `template-${template.id}`,
        title: `Open ${template.name} template`,
        description: template.description,
        keywords: [template.name, template.description, template.prompt, ...template.tags, 'template', 'starter'],
        icon: <LayoutTemplate className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, `/templates?focus=${encodeURIComponent(template.id)}`),
      }));

    const recentBoards = boards
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((board) => {
        if (!q) return true;
        const item: CommandItem = {
          id: `board-${board.id}`,
          title: board.title,
          description: board.summary,
          keywords: [board.title, board.summary, board.prompt, ...board.tags, ...board.tone],
          icon: null,
          onSelect: () => undefined,
        };
        return matchesQuery(item, q);
      })
      .slice(0, q ? 12 : 5)
      .map<CommandItem>((board) => ({
        id: `board-${board.id}`,
        title: `Open ${board.title}`,
        description: board.prompt,
        keywords: [board.title, board.summary, board.prompt, ...board.tags],
        icon: <FileText className="h-4 w-4" />,
        onSelect: () => guardedRouterPush(router, `/app/boards/${board.id}`),
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
              guardedRouterPush(
                router,
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
                guardedRouterPush(router, `/app/boards/${copy.id}`);
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

    const editorSectionItems: CommandItem[] = currentBoard
      ? EDITOR_SECTION_COMMANDS.map((section) => ({
          id: section.id,
          title: `Jump to ${section.label}`,
          description: `Open the ${section.label.toLowerCase()} section in the board editor.`,
          keywords: ['section', 'jump', section.label, ...section.keywords],
          icon: <ArrowRight className="h-4 w-4" />,
          onSelect: () => dispatchEditorQuickAction({ action: 'jump-section', sectionIndex: section.index }),
        })).filter((item) => matchesQuery(item, q))
      : [];

    const editorActionItems: CommandItem[] = currentBoard
      ? [
          {
            id: 'editor-export',
            title: 'Export board',
            description: 'Download JSON, PNG, or PDF for the current board.',
            keywords: ['export', 'download', 'png', 'pdf'],
            icon: <Download className="h-4 w-4" />,
            onSelect: () => dispatchEditorQuickAction({ action: 'export' }),
          },
          {
            id: 'editor-snapshots',
            title: 'Open snapshots',
            description: 'Save, preview, or restore board snapshots.',
            keywords: ['snapshots', 'backup', 'restore'],
            icon: <Camera className="h-4 w-4" />,
            onSelect: () => dispatchEditorQuickAction({ action: 'snapshots' }),
          },
          {
            id: 'editor-share',
            title: 'Collaborate',
            description: 'Manage collaborators and public sharing.',
            keywords: ['share', 'collaborate', 'invite'],
            icon: <Share2 className="h-4 w-4" />,
            onSelect: () => dispatchEditorQuickAction({ action: 'share' }),
          },
        ].filter((item) => matchesQuery(item, q))
      : [];

    const editorAiItems: CommandItem[] =
      currentBoard && !isCurrentBoardView
        ? [
            {
              id: 'ai-suggest-brand',
              title: 'Suggest brand strategy',
              description: 'Generate positioning, voice, and messaging with AI.',
              keywords: ['ai', 'brand', 'strategy', 'positioning', 'voice'],
              icon: <Wand2 className="h-4 w-4" />,
              onSelect: () => dispatchEditorQuickAction({ action: 'suggest-brand' }),
            },
            {
              id: 'ai-suggest-palette',
              title: 'Suggest palette',
              description: 'Refresh board colors from the current direction.',
              keywords: ['ai', 'palette', 'colors', 'colour'],
              icon: <Sparkles className="h-4 w-4" />,
              onSelect: () => dispatchEditorQuickAction({ action: 'suggest-palette' }),
            },
            {
              id: 'ai-suggest-typography',
              title: 'Suggest typography',
              description: 'Generate font pairings for the board mood.',
              keywords: ['ai', 'typography', 'fonts', 'type'],
              icon: <Sparkles className="h-4 w-4" />,
              onSelect: () => dispatchEditorQuickAction({ action: 'suggest-typography' }),
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

    if (templateItems.length > 0) {
      output.push({
        title: q ? `Templates matching “${query.trim()}”` : 'Templates',
        items: templateItems,
      });
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

    if (editorSectionItems.length > 0) {
      output.push({ title: 'Editor sections', items: editorSectionItems });
    }

    if (editorActionItems.length > 0) {
      output.push({ title: 'Editor actions', items: editorActionItems });
    }

    if (editorAiItems.length > 0) {
      output.push({ title: 'AI', items: editorAiItems });
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
      className="fixed inset-0 z-10060 flex items-start justify-center bg-slate-950/45 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-6"
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
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-(--border) bg-(--surface) shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
      >
        <div className="shrink-0 border-b border-(--border) bg-(--surface-elevated) px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-(--border) bg-(--surface-soft) px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-(--ring)">
            <Search className="h-5 w-5 shrink-0 text-(--text-muted)" />
            <input
              id="command-palette-title"
              ref={inputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search pages, boards, or actions..."
              aria-describedby="command-palette-description"
              className="h-8 w-full border-0 bg-transparent p-0 text-base text-(--text-strong) placeholder:text-(--text-muted) focus:outline-none focus:ring-0"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-[11px] font-medium text-(--text-muted) shadow-sm">
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
                  <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.28em] text-(--text-muted)">
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
                            active
                              ? 'bg-(--surface-subtle) ring-1 ring-(--border) shadow-[0_10px_30px_rgba(15,23,42,0.10)]'
                              : 'hover:bg-(--surface-subtle)',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm',
                              active
                                ? 'border-(--border) bg-(--surface) text-(--text-strong)'
                                : 'border-(--border) text-(--text-muted)',
                            )}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold tracking-tight text-(--text-strong)">
                              {item.title}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-(--text-muted)">
                              {item.description}
                            </span>
                          </span>

                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-(--text-muted)" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex min-h-55 flex-col items-center justify-center rounded-3xl border border-dashed border-(--border) bg-(--surface-soft) px-6 text-center">
              <p className="text-lg font-semibold tracking-tight text-(--text-strong)">
                No matching commands
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-(--text-muted)">
                Try a different keyword, or create a new board from the actions above.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => guardedRouterPush(router, '/app/new')}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-(--text-strong) px-4 text-sm font-medium text-(--background) shadow-sm transition hover:opacity-90"
                >
                  Create board
                </button>
                <button
                  type="button"
                  onClick={() => guardedRouterPush(router, '/app')}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-(--border) bg-(--surface) px-4 text-sm font-medium text-(--text-strong) transition hover:bg-(--surface-subtle)"
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
      if (!event.key) return;

      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        if (!isCommandPaletteEnabled()) return;
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