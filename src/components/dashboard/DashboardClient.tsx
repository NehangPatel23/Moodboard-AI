'use client';

import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { BoardFilterBar } from './BoardFilterBar';
import { BoardGrid } from './BoardGrid';

export function DashboardClient() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'favorite'>('recent');

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <BoardFilterBar
        query={query}
        sort={sort}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />
      <BoardGrid query={query} sort={sort} />
    </div>
  );
}