-- Per-item read/hide overrides + owner-only comment delete policy.
-- Run after 011_user_settings_retention.sql.

create table if not exists public.board_collaboration_item_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  board_id text not null references public.boards (id) on delete cascade,
  item_type text not null check (item_type in ('comment', 'activity')),
  item_id uuid not null,
  is_read boolean,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, board_id, item_type, item_id)
);

create index if not exists board_collaboration_item_state_board_idx
  on public.board_collaboration_item_state (board_id, user_id);

alter table public.board_collaboration_item_state enable row level security;

create policy "Users can view own item state"
  on public.board_collaboration_item_state for select
  using (user_id = auth.uid());

create policy "Users can insert own item state"
  on public.board_collaboration_item_state for insert
  with check (user_id = auth.uid());

create policy "Users can update own item state"
  on public.board_collaboration_item_state for update
  using (user_id = auth.uid());

create policy "Users can delete own item state"
  on public.board_collaboration_item_state for delete
  using (user_id = auth.uid());

drop policy if exists "Authors and owners can delete comments" on public.board_comments;

create policy "Board owners can delete comments"
  on public.board_comments for delete
  using (public.is_board_owner(board_id));
