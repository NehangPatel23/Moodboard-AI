-- Restrict board activity deletion to board owners only.
-- Run after 012_collaboration_item_state.sql.

drop policy if exists "Authors and owners can delete activity" on public.board_activity;

create policy "Board owners can delete activity"
  on public.board_activity for delete
  using (public.is_board_owner(board_id));
