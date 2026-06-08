-- Board snapshots for manual save and restore.
-- Run after 014_reference_uploads_storage.sql.

create table if not exists public.board_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_name text not null default 'Collaborator',
  label text,
  board_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists board_snapshots_board_created_idx
  on public.board_snapshots (board_id, created_at desc);

alter table public.board_snapshots enable row level security;

create policy "Board participants can view snapshots"
  on public.board_snapshots for select
  using (
    public.is_board_owner(board_id)
    or public.is_board_member(board_id)
  );
