-- Per-member favorite state for collaborative boards (separate from owner is_favorite on boards).

alter table public.board_members
  add column if not exists is_favorite boolean not null default false;
