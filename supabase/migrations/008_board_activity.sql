-- Board activity log for realtime edit history.
-- Run after 007_collaboration_polish.sql.

create table if not exists public.board_activity (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_name text not null default 'Collaborator',
  action text not null default 'saved' check (action in ('saved')),
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists board_activity_board_created_idx
  on public.board_activity (board_id, created_at desc);

alter table public.board_activity enable row level security;

create policy "Board participants can view activity"
  on public.board_activity for select
  using (
    public.is_board_owner(board_id)
    or public.is_board_member(board_id)
  );

alter publication supabase_realtime add table public.board_activity;
