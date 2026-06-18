-- Notification toast preferences on user_settings

alter table public.user_settings
  add column if not exists autosave_toast_enabled boolean not null default true;

alter table public.user_settings
  add column if not exists remote_save_toast_enabled boolean not null default true;
