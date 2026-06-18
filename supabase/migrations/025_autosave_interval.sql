-- Board editor auto-save interval preference on user_settings

alter table public.user_settings
  add column if not exists autosave_interval text not null default '8s';

alter table public.user_settings
  drop constraint if exists user_settings_autosave_interval_check;

alter table public.user_settings
  add constraint user_settings_autosave_interval_check
  check (autosave_interval in ('off', '5s', '8s', '10s'));
