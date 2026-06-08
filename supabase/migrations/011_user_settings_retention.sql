-- Per-user collaboration retention preferences.
-- Run after 010_collaboration_hygiene.sql.

alter table public.user_settings
  add column if not exists comments_hide_after_days integer not null default 0 check (comments_hide_after_days >= 0),
  add column if not exists activity_hide_after_days integer not null default 0 check (activity_hide_after_days >= 0),
  add column if not exists purge_comments_after_days integer not null default 0 check (purge_comments_after_days >= 0),
  add column if not exists purge_activity_after_days integer not null default 0 check (purge_activity_after_days >= 0);
