'use client';

import type { Board } from '@/types/board';
import { getReferenceSourceLabel } from '@/lib/reference-source-label';

type BoardExportCaptureProps = {
  board: Board;
};

export function BoardExportCapture({ board }: BoardExportCaptureProps) {
  return (
    <div
      data-board-export
      className="w-[1200px] bg-[#f7f4ef] p-12 text-[#1a1816]"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <header className="mb-10 border-b border-[#d8d0c4] pb-8">
        <p className="text-xs uppercase tracking-[0.32em] text-[#8a8175]">MoodBoard AI</p>
        <h1 className="mt-3 text-5xl leading-tight tracking-tight">{board.title}</h1>
        {board.summary ? (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5c554c]">{board.summary}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#6f675d]">
          {board.mood ? <span>Mood: {board.mood}</span> : null}
          {board.tone.length ? <span>Tone: {board.tone.join(', ')}</span> : null}
        </div>
      </header>

      {board.palette.length ? (
        <section className="mb-10">
          <h2 className="mb-4 text-sm uppercase tracking-[0.24em] text-[#8a8175]">Palette</h2>
          <div className="grid grid-cols-4 gap-4">
            {board.palette.map((color) => (
              <div key={color.id} className="overflow-hidden rounded-2xl border border-[#d8d0c4]">
                <div className="h-24" style={{ backgroundColor: color.hex }} />
                <div className="space-y-1 bg-white p-3">
                  <p className="text-sm font-medium">{color.label}</p>
                  <p className="font-mono text-xs text-[#6f675d]">{color.hex}</p>
                  {color.usage ? <p className="text-xs text-[#8a8175]">{color.usage}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {board.typography.length ? (
        <section className="mb-10">
          <h2 className="mb-4 text-sm uppercase tracking-[0.24em] text-[#8a8175]">Typography</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {board.typography.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#d8d0c4] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a8175]">{item.role}</p>
                <p className="mt-2 text-2xl">{item.fontName}</p>
                {item.note ? <p className="mt-2 text-sm text-[#6f675d]">{item.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {board.references.length ? (
        <section>
          <h2 className="mb-4 text-sm uppercase tracking-[0.24em] text-[#8a8175]">References</h2>
          <div className="grid grid-cols-3 gap-4">
            {board.references.map((reference) => (
              <div key={reference.id} className="overflow-hidden rounded-2xl border border-[#d8d0c4] bg-white">
                {reference.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reference.imageUrl}
                    alt={reference.title}
                    className="aspect-[4/3] w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#ece7df] text-sm text-[#8a8175]">
                    No image
                  </div>
                )}
                <div className="space-y-1 p-4">
                  <p className="font-medium">{reference.title}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a8175]">
                    {reference.category} · {getReferenceSourceLabel(reference.source, reference.imageUrl)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
