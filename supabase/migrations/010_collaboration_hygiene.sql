-- Per-user read state for board comments and activity + activity delete policy.
-- Run after 009_board_activity_changes.sql.

create table if not exists public.board_collaboration_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  board_id text not null references public.boards (id) on delete cascade,
  comments_last_read_at timestamptz,
  activity_last_read_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, board_id)
);

create index if not exists board_collaboration_state_board_idx
  on public.board_collaboration_state (board_id);

alter table public.board_collaboration_state enable row level security;

create policy "Users can view own collaboration state"
  on public.board_collaboration_state for select
  using (user_id = auth.uid());

create policy "Users can insert own collaboration state"
  on public.board_collaboration_state for insert
  with check (user_id = auth.uid());

create policy "Users can update own collaboration state"
  on public.board_collaboration_state for update
  using (user_id = auth.uid());

create policy "Authors and owners can delete activity"
  on public.board_activity for delete
  using (
    user_id = auth.uid()
    or public.is_board_owner(board_id)
  );
