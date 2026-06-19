-- Public board view counts (incremented on share page visits).

alter table public.boards
  add column if not exists view_count bigint not null default 0;

create index if not exists boards_shared_view_count_idx
  on public.boards (view_count desc)
  where visibility = 'shared';
