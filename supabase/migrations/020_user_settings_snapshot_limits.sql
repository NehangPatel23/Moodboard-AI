-- Owner preferences for board snapshot limits (count cap + optional auto-prune).

alter table public.user_settings
  add column if not exists snapshot_max_per_board integer not null default 25
    check (snapshot_max_per_board >= 0),
  add column if not exists snapshot_auto_prune boolean not null default true;
