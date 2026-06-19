'use client';

import type { Board, NoteType } from '@/types/board';
import { ReferenceSourceLabel } from '@/components/board/ReferenceSourceLabel';
import { EXPORT_BACKGROUND_COLOR, EXPORT_CAPTURE_WIDTH } from '@/lib/export-capture';

type BoardExportCaptureProps = {
  board: Board;
  layout?: 'fixed' | 'fluid';
};

const EXPORT_COLORS = {
  background: EXPORT_BACKGROUND_COLOR,
  text: '#1a1816',
  muted: '#6f675d',
  subtle: '#8a8175',
  border: '#d8d0c4',
  surface: '#ffffff',
  surfaceSubtle: '#ece7df',
} as const;

const serif = 'Georgia, "Times New Roman", serif';

function chunkItems<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function noteTypeLabel(type: NoteType): string {
  if (type === 'instruction') return 'Instruction';
  if (type === 'keyword') return 'Keyword';
  return 'Idea';
}

export function BoardExportCapture({ board, layout = 'fixed' }: BoardExportCaptureProps) {
  const isFluid = layout === 'fluid';

  return (
    <div
      data-board-export
      style={{
        width: isFluid ? '100%' : EXPORT_CAPTURE_WIDTH,
        maxWidth: isFluid ? '100%' : EXPORT_CAPTURE_WIDTH,
        boxSizing: 'border-box',
        padding: '48px',
        fontFamily: serif,
        backgroundColor: EXPORT_COLORS.background,
        color: EXPORT_COLORS.text,
      }}
    >
      <header
        data-export-block="header"
        style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: `1px solid ${EXPORT_COLORS.border}` }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: EXPORT_COLORS.subtle,
          }}
        >
          MoodBoard AI
        </p>
        <h1
          style={{
            margin: '12px 0 0',
            fontSize: '48px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 400,
          }}
        >
          {board.title}
        </h1>
        {board.summary ? (
          <p
            style={{
              margin: '16px 0 0',
              maxWidth: '768px',
              fontSize: '18px',
              lineHeight: 1.75,
              color: EXPORT_COLORS.muted,
            }}
          >
            {board.summary}
          </p>
        ) : null}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '14px',
            color: EXPORT_COLORS.muted,
          }}
        >
          {board.mood ? <span>Mood: {board.mood}</span> : null}
          {board.tone.length ? <span>Tone: {board.tone.join(', ')}</span> : null}
        </div>
      </header>

      {board.tags.length ? (
        <section style={{ marginBottom: '40px' }}>
          <div data-export-block="tags">
            <h2
              style={{
                margin: 0,
                fontSize: '14px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: EXPORT_COLORS.subtle,
              }}
            >
              Tags
            </h2>
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              {board.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    border: `1px solid ${EXPORT_COLORS.border}`,
                    backgroundColor: EXPORT_COLORS.surface,
                    fontSize: '14px',
                    color: EXPORT_COLORS.text,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {board.brandStrategy ? (
        <section style={{ marginBottom: '40px' }}>
          <div data-export-block="brand-strategy">
            <h2
              style={{
                margin: 0,
                fontSize: '14px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: EXPORT_COLORS.subtle,
              }}
            >
              Brand strategy
            </h2>
            <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: EXPORT_COLORS.subtle,
                  }}
                >
                  Positioning
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '15px', lineHeight: 1.7, color: EXPORT_COLORS.text }}>
                  {board.brandStrategy.positioning}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: EXPORT_COLORS.subtle,
                  }}
                >
                  Voice
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '15px', lineHeight: 1.7, color: EXPORT_COLORS.text }}>
                  {board.brandStrategy.voice}
                </p>
              </div>
              {board.brandStrategy.messaging.length ? (
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: EXPORT_COLORS.subtle,
                    }}
                  >
                    Messaging pillars
                  </p>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: EXPORT_COLORS.text }}>
                    {board.brandStrategy.messaging.map((message) => (
                      <li key={message} style={{ marginBottom: '6px', fontSize: '15px', lineHeight: 1.6 }}>
                        {message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {board.palette.length ? (
        <section style={{ marginBottom: '40px' }}>
          <h2
            data-export-block="palette-heading"
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: EXPORT_COLORS.subtle,
            }}
          >
            Palette
          </h2>
          {chunkItems(board.palette, 4).map((row, rowIndex, rows) => (
            <div
              key={`palette-row-${rowIndex}`}
              data-export-block={`palette-row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '16px',
                marginBottom: rowIndex < rows.length - 1 ? '16px' : '40px',
              }}
            >
              {row.map((color) => (
                <div
                  key={color.id}
                  style={{
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: `1px solid ${EXPORT_COLORS.border}`,
                  }}
                >
                  <div style={{ height: '96px', backgroundColor: color.hex }} />
                  <div style={{ padding: '12px', backgroundColor: EXPORT_COLORS.surface }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{color.label}</p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '12px',
                        color: EXPORT_COLORS.muted,
                      }}
                    >
                      {color.hex}
                    </p>
                    {color.usage ? (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: EXPORT_COLORS.subtle }}>
                        {color.usage}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}

      {board.typography.length ? (
        <section style={{ marginBottom: '40px' }}>
          <h2
            data-export-block="typography-heading"
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: EXPORT_COLORS.subtle,
            }}
          >
            Typography
          </h2>
          {chunkItems(board.typography, 3).map((row, rowIndex, rows) => (
            <div
              key={`typography-row-${rowIndex}`}
              data-export-block={`typography-row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '16px',
                marginBottom: rowIndex < rows.length - 1 ? '16px' : '40px',
              }}
            >
              {row.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${EXPORT_COLORS.border}`,
                    backgroundColor: EXPORT_COLORS.surface,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: EXPORT_COLORS.subtle,
                    }}
                  >
                    {item.role}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '24px' }}>{item.fontName}</p>
                  {item.note ? (
                    <p style={{ margin: '8px 0 0', fontSize: '14px', color: EXPORT_COLORS.muted }}>
                      {item.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}

      {board.references.length ? (
        <section style={{ marginBottom: board.notes.length ? '40px' : 0 }}>
          <h2
            data-export-block="references-heading"
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: EXPORT_COLORS.subtle,
            }}
          >
            References
          </h2>
          {chunkItems(board.references, 3).map((row, rowIndex, rows) => (
            <div
              key={`references-row-${rowIndex}`}
              data-export-block={`references-row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '16px',
                marginBottom: rowIndex < rows.length - 1 ? '16px' : 0,
              }}
            >
              {row.map((reference) => (
                <div
                  key={reference.id}
                  style={{
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: `1px solid ${EXPORT_COLORS.border}`,
                    backgroundColor: EXPORT_COLORS.surface,
                  }}
                >
                  {reference.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reference.imageUrl}
                      alt={reference.title}
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        aspectRatio: '4 / 3',
                        fontSize: '14px',
                        backgroundColor: EXPORT_COLORS.surfaceSubtle,
                        color: EXPORT_COLORS.subtle,
                      }}
                    >
                      No image
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{reference.title}</p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '12px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: EXPORT_COLORS.subtle,
                      }}
                    >
                      {reference.category} ·{' '}
                      <ReferenceSourceLabel
                        source={reference.source}
                        imageUrl={reference.imageUrl}
                        iconClassName="h-2.5 w-2.5"
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}

      {board.notes.length ? (
        <section>
          <h2
            data-export-block="notes-heading"
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: EXPORT_COLORS.subtle,
            }}
          >
            Notes
          </h2>
          {chunkItems(board.notes, 2).map((row, rowIndex, rows) => (
            <div
              key={`notes-row-${rowIndex}`}
              data-export-block={`notes-row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '16px',
                marginBottom: rowIndex < rows.length - 1 ? '16px' : 0,
              }}
            >
              {row.map((note) => (
                <div
                  key={note.id}
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${EXPORT_COLORS.border}`,
                    backgroundColor: EXPORT_COLORS.surface,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: EXPORT_COLORS.subtle,
                    }}
                  >
                    {noteTypeLabel(note.type)}
                  </p>
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: EXPORT_COLORS.text,
                    }}
                  >
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
