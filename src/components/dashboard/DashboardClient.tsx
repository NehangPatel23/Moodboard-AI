'use client';

import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { BoardFilterBar } from './BoardFilterBar';
import { BoardGrid } from './BoardGrid';

export function DashboardClient() {
  const [sort, setSort] = useState<'recent' | 'favorite'>('recent');

  return (
    <div className="space-y-10 pb-10">
      <DashboardHeader />
      <BoardFilterBar sort={sort} onSortChange={setSort} />
      <BoardGrid sort={sort} />
    </div>
  );
}