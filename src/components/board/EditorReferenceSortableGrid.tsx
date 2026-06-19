'use client';

import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReferenceItem } from '@/types/board';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

type EditorReferenceSortableGridProps = {
  references: ReferenceItem[];
  sortable: boolean;
  children: (reference: ReferenceItem, index: number, controls: ReactNode) => ReactNode;
  onReorder: (nextReferences: ReferenceItem[]) => void;
};

function SortableReferenceItem({
  id,
  index,
  total,
  sortable,
  onMove,
  children,
}: {
  id: string;
  index: number;
  total: number;
  sortable: boolean;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const moveControls = sortable ? (
    <div
      className={cn(
        'absolute left-3 top-3 z-20 flex items-center gap-1 transition-opacity',
        isDragging
          ? 'opacity-100'
          : 'pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100',
      )}
    >
      <Tooltip content="Drag to reorder" triggerClassName="inline-flex">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border) bg-(--surface-elevated)/95 text-(--text-muted) shadow-sm transition hover:bg-(--surface-subtle) hover:text-(--text-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
          aria-label={`Drag reference ${index + 1} of ${total}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </Tooltip>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          aria-label={`Move reference ${index + 1} up`}
          tooltip="Move up"
          className="h-8 w-8 rounded-full border border-(--border) bg-(--surface-elevated)/95 text-(--text-muted) shadow-sm hover:bg-(--surface-subtle) hover:text-(--text-strong) disabled:opacity-40"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index >= total - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label={`Move reference ${index + 1} down`}
          tooltip="Move down"
          className="h-8 w-8 rounded-full border border-(--border) bg-(--surface-elevated)/95 text-(--text-muted) shadow-sm hover:bg-(--surface-subtle) hover:text-(--text-strong) disabled:opacity-40"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group/card relative', isDragging ? 'z-30 opacity-90' : undefined)}
    >
      {moveControls}
      {children}
    </div>
  );
}

export function EditorReferenceSortableGrid({
  references,
  sortable,
  children,
  onReorder,
}: EditorReferenceSortableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= references.length || from === to) return;
    onReorder(arrayMove(references, from, to));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = references.findIndex((item) => item.id === active.id);
    const newIndex = references.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    onReorder(arrayMove(references, oldIndex, newIndex));
  };

  const grid = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {references.map((reference, index) => (
        <SortableReferenceItem
          key={reference.id}
          id={reference.id}
          index={index}
          total={references.length}
          sortable={sortable}
          onMove={handleMove}
        >
          {children(reference, index, null)}
        </SortableReferenceItem>
      ))}
    </div>
  );

  if (!sortable) {
    return grid;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={references.map((item) => item.id)} strategy={rectSortingStrategy}>
        {grid}
      </SortableContext>
    </DndContext>
  );
}
