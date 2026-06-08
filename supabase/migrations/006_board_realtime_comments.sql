-- Real-time board sync + board comments.
-- Run after 005_backfill_profiles.sql.

-- Broadcast board row updates to collaborators via Supabase Realtime.
alter publication supabase_realtime add table public.boards;

create table if not exists public.board_comments (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_comments_board_created_idx
  on public.board_comments (board_id, created_at desc);

alter table public.board_comments enable row level security;

create policy "Board participants can view comments"
  on public.board_comments for select
  using (
    public.is_board_owner(board_id)
    or public.is_board_member(board_id)
  );

create policy "Board participants can add comments"
  on public.board_comments for insert
  with check (
    user_id = auth.uid()
    and (
      public.is_board_owner(board_id)
      or public.is_board_member(board_id)
    )
  );

create policy "Authors and owners can delete comments"
  on public.board_comments for delete
  using (
    user_id = auth.uid()
    or public.is_board_owner(board_id)
  );

alter publication supabase_realtime add table public.board_comments;
