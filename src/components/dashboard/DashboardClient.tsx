'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DashboardHeader } from './DashboardHeader';
import {
  BoardFilterBar,
  type AccessFilter,
  type BoardSort,
  type VisibilityFilter,
} from './BoardFilterBar';
import { BoardGrid } from './BoardGrid';

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort: BoardSort = searchParams.get('sort') === 'favorite' ? 'favorite' : 'recent';

  const visibilityParam = searchParams.get('visibility');
  const visibility: VisibilityFilter =
    visibilityParam === 'shared' ||
    visibilityParam === 'private' ||
    visibilityParam === 'collaborating'
      ? visibilityParam
      : 'all';

  const accessParam = searchParams.get('access');
  const access: AccessFilter =
    accessParam === 'edit' || accessParam === 'view' ? accessParam : 'all';

  const accessApplies = visibility === 'collaborating';
  const effectiveAccess = accessApplies ? access : 'all';

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
        params.delete('access');
      } else {
        params.set('visibility', value);
      }

      if (value !== 'collaborating') {
        params.delete('access');
      }
    });
  };

  const handleAccessChange = (value: AccessFilter) => {
    replaceParams((params) => {
      params.set('visibility', 'collaborating');

      if (value === 'all') {
        params.delete('access');
      } else {
        params.set('access', value);
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
        access={access}
        onAccessChange={handleAccessChange}
      />
      <BoardGrid sort={sort} visibility={visibility} access={effectiveAccess} />
    </div>
  );
}
