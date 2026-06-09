-- Per-user last-read timestamp for board snapshots (unread badge for collaborators).

alter table public.board_collaboration_state
  add column if not exists snapshots_last_read_at timestamptz;
