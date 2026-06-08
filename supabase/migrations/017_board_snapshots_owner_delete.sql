-- Owner-only delete for board snapshots.

drop policy if exists "Board owners can delete snapshots" on public.board_snapshots;

create policy "Board owners can delete snapshots"
  on public.board_snapshots for delete
  to authenticated
  using (public.is_board_owner(board_id));
