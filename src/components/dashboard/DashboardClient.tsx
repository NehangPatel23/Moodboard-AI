'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DashboardHeader } from './DashboardHeader';
import { BoardFilterBar, type BoardSort, type VisibilityFilter } from './BoardFilterBar';
import { BoardGrid } from './BoardGrid';

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort: BoardSort = searchParams.get('sort') === 'favorite' ? 'favorite' : 'recent';

  const visibilityParam = searchParams.get('visibility');
  const visibility: VisibilityFilter =
    visibilityParam === 'shared' || visibilityParam === 'private' ? visibilityParam : 'all';

  const replaceParams = (mutate: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    mutate(nextParams);

    const queryString = nextParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const handleSortChange = (value: BoardSort) => {
    replaceParams((params) => {
      if (value === 'recent') {
        params.delete('sort');
      } else {
        params.set('sort', value);
      }
    });
  };

  const handleVisibilityChange = (value: VisibilityFilter) => {
    replaceParams((params) => {
      if (value === 'all') {
        params.delete('visibility');
      } else {
        params.set('visibility', value);
      }
    });
  };

  return (
    <div className="space-y-10 pb-10">
      <DashboardHeader />
      <BoardFilterBar
        sort={sort}
        onSortChange={handleSortChange}
        visibility={visibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <BoardGrid sort={sort} visibility={visibility} />
    </div>
  );
}
