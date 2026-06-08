-- Structured change log for board activity replay.
-- Run after 008_board_activity.sql.

alter table public.board_activity
  add column if not exists changes jsonb not null default '[]'::jsonb;
