import type { Board, TypographyRole } from '@/types/board';

export type DesignSystemColorToken = {
  id: string;
  label: string;
  tokenName: string;
  hex: string;
  usage: string;
};

export type DesignSystemTypographyToken = {
  id: string;
  role: TypographyRole;
  tokenName: string;
  fontName: string;
  note: string;
};

export type DesignSystemTokens = {
  boardTitle: string;
  mood: string;
  colors: DesignSystemColorToken[];
  typography: DesignSystemTypographyToken[];
  brandStrategy?: Board['brandStrategy'];
  generatedAt: string;
};

export type DesignSystemTokenOverrides = {
  colors?: Array<{ id: string; tokenName: string; usage?: string }>;
  typography?: Array<{ id: string; tokenName: string; note?: string }>;
};

export function slugifyTokenName(input: string, fallback = 'token'): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function uniqueTokenNames(
  items: Array<{ id: string; baseName: string }>,
): Map<string, string> {
  const used = new Map<string, number>();
  const result = new Map<string, string>();

  for (const item of items) {
    const base = slugifyTokenName(item.baseName, 'token');
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    result.set(item.id, count === 0 ? base : `${base}-${count + 1}`);
  }

  return result;
}

function defaultColorTokenName(label: string, index: number): string {
  const slug = slugifyTokenName(label);
  return slug === 'token' ? `color-${index + 1}` : slug;
}

function defaultTypographyTokenName(role: TypographyRole): string {
  return role;
}

export function buildDeterministicDesignSystemTokens(board: Board): DesignSystemTokens {
  const colorNames = uniqueTokenNames(
    board.palette.map((color, index) => ({
      id: color.id,
      baseName: defaultColorTokenName(color.label, index),
    })),
  );

  const typographyNames = uniqueTokenNames(
    board.typography.map((item) => ({
      id: item.id,
      baseName: defaultTypographyTokenName(item.role),
    })),
  );

  return {
    boardTitle: board.title,
    mood: board.mood,
    generatedAt: new Date().toISOString(),
    brandStrategy: board.brandStrategy ?? undefined,
    colors: board.palette.map((color, index) => ({
      id: color.id,
      label: color.label,
      tokenName: colorNames.get(color.id) ?? defaultColorTokenName(color.label, index),
      hex: color.hex,
      usage: color.usage,
    })),
    typography: board.typography.map((item) => ({
      id: item.id,
      role: item.role,
      tokenName: typographyNames.get(item.id) ?? defaultTypographyTokenName(item.role),
      fontName: item.fontName,
      note: item.note,
    })),
  };
}

export function applyDesignSystemTokenOverrides(
  board: Board,
  overrides: DesignSystemTokenOverrides,
): DesignSystemTokens {
  const base = buildDeterministicDesignSystemTokens(board);

  const colorOverrideMap = new Map(
    (overrides.colors ?? []).map((item) => [item.id, item]),
  );
  const typographyOverrideMap = new Map(
    (overrides.typography ?? []).map((item) => [item.id, item]),
  );

  const colors = base.colors.map((color) => {
    const override = colorOverrideMap.get(color.id);
    if (!override) return color;

    return {
      ...color,
      tokenName: slugifyTokenName(override.tokenName, color.tokenName),
      usage: override.usage?.trim() || color.usage,
    };
  });

  const typography = base.typography.map((item) => {
    const override = typographyOverrideMap.get(item.id);
    if (!override) return item;

    return {
      ...item,
      tokenName: slugifyTokenName(override.tokenName, item.tokenName),
      note: override.note?.trim() || item.note,
    };
  });

  const dedupedColorNames = uniqueTokenNames(
    colors.map((color) => ({ id: color.id, baseName: color.tokenName })),
  );
  const dedupedTypographyNames = uniqueTokenNames(
    typography.map((item) => ({ id: item.id, baseName: item.tokenName })),
  );

  return {
    ...base,
    colors: colors.map((color) => ({
      ...color,
      tokenName: dedupedColorNames.get(color.id) ?? color.tokenName,
    })),
    typography: typography.map((item) => ({
      ...item,
      tokenName: dedupedTypographyNames.get(item.id) ?? item.tokenName,
    })),
  };
}

function quoteFontFamily(fontName: string): string {
  const trimmed = fontName.trim();
  if (!trimmed) return 'inherit';
  if (trimmed.includes(',')) return trimmed;
  return `'${trimmed.replace(/'/g, "\\'")}', sans-serif`;
}

export function exportDesignSystemCss(tokens: DesignSystemTokens): string {
  const lines = [
    `/* MoodBoard AI Design System — ${tokens.boardTitle} */`,
    `/* Mood: ${tokens.mood} */`,
    '',
    ':root {',
  ];

  for (const color of tokens.colors) {
    lines.push(`  --color-${color.tokenName}: ${color.hex}; /* ${color.label} — ${color.usage} */`);
  }

  if (tokens.colors.length && tokens.typography.length) {
    lines.push('');
  }

  for (const item of tokens.typography) {
    lines.push(
      `  --font-${item.tokenName}: ${quoteFontFamily(item.fontName)}; /* ${item.role} — ${item.note} */`,
    );
  }

  lines.push('}');
  return lines.join('\n');
}

export function exportDesignSystemTailwind(tokens: DesignSystemTokens): string {
  const colorEntries = tokens.colors
    .map((color) => `        '${color.tokenName}': '${color.hex}',`)
    .join('\n');

  const fontEntries = tokens.typography
    .map((item) => {
      const stack = quoteFontFamily(item.fontName)
        .split(',')
        .map((part) => `'${part.trim().replace(/^'|'$/g, '')}'`)
        .join(', ');
      return `        '${item.tokenName}': [${stack}],`;
    })
    .join('\n');

  const sections = [
    '/** @type {import(\'tailwindcss\').Config} */',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
  ];

  if (tokens.colors.length) {
    sections.push('      colors: {', colorEntries, '      },');
  }

  if (tokens.typography.length) {
    sections.push('      fontFamily: {', fontEntries, '      },');
  }

  sections.push('    },', '  },', '};');
  return sections.join('\n');
}

export function exportDesignSystemJson(tokens: DesignSystemTokens): string {
  const payload = {
    $schema: 'moodboard-ai-design-tokens/v1',
    meta: {
      title: tokens.boardTitle,
      mood: tokens.mood,
      generatedAt: tokens.generatedAt,
    },
    color: Object.fromEntries(
      tokens.colors.map((color) => [
        color.tokenName,
        {
          value: color.hex,
          label: color.label,
          usage: color.usage,
        },
      ]),
    ),
    font: Object.fromEntries(
      tokens.typography.map((item) => [
        item.tokenName,
        {
          value: item.fontName,
          role: item.role,
          note: item.note,
        },
      ]),
    ),
    brand: tokens.brandStrategy
      ? {
          positioning: tokens.brandStrategy.positioning,
          voice: tokens.brandStrategy.voice,
          messaging: tokens.brandStrategy.messaging,
        }
      : null,
  };

  return JSON.stringify(payload, null, 2);
}

export function exportDesignSystemMarkdown(tokens: DesignSystemTokens): string {
  const lines = [
    `# ${tokens.boardTitle} — Design System`,
    '',
    `**Mood:** ${tokens.mood}`,
    '',
  ];

  if (tokens.colors.length) {
    lines.push('## Colors', '');
    for (const color of tokens.colors) {
      lines.push(
        `- **${color.label}** (\`--color-${color.tokenName}\`): \`${color.hex}\` — ${color.usage}`,
      );
    }
    lines.push('');
  }

  if (tokens.typography.length) {
    lines.push('## Typography', '');
    for (const item of tokens.typography) {
      lines.push(
        `- **${item.role}** (\`--font-${item.tokenName}\`): ${item.fontName} — ${item.note}`,
      );
    }
    lines.push('');
  }

  if (tokens.brandStrategy) {
    lines.push('## Brand strategy', '');
    lines.push('### Positioning', '', tokens.brandStrategy.positioning, '');
    lines.push('### Voice', '', tokens.brandStrategy.voice, '');
    if (tokens.brandStrategy.messaging.length) {
      lines.push('### Messaging pillars', '');
      for (const message of tokens.brandStrategy.messaging) {
        lines.push(`- ${message}`);
      }
      lines.push('');
    }
  }

  lines.push('## CSS variables', '', '```css', exportDesignSystemCss(tokens), '```', '');
  return lines.join('\n');
}

export type DesignSystemFormat = 'css' | 'tailwind' | 'json' | 'markdown';

export function exportDesignSystemFormat(
  tokens: DesignSystemTokens,
  format: DesignSystemFormat,
): string {
  switch (format) {
    case 'css':
      return exportDesignSystemCss(tokens);
    case 'tailwind':
      return exportDesignSystemTailwind(tokens);
    case 'json':
      return exportDesignSystemJson(tokens);
    case 'markdown':
      return exportDesignSystemMarkdown(tokens);
    default:
      return exportDesignSystemCss(tokens);
  }
}

export function designSystemDownloadExtension(format: DesignSystemFormat): string {
  switch (format) {
    case 'css':
      return 'css';
    case 'tailwind':
      return 'tailwind.config.js';
    case 'json':
      return 'design-tokens.json';
    case 'markdown':
      return 'design-system.md';
    default:
      return 'txt';
  }
}

export function designSystemMimeType(format: DesignSystemFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'markdown':
      return 'text/markdown';
    case 'css':
      return 'text/css';
    default:
      return 'text/plain';
  }
}
