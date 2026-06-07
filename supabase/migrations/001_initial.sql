-- MoodBoard AI — initial schema with Row Level Security

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Boards
create table public.boards (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  prompt text not null default '',
  summary text not null default '',
  mood text not null default '',
  tone jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  palette jsonb not null default '[]'::jsonb,
  typography jsonb not null default '[]'::jsonb,
  "references" jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index boards_user_id_idx on public.boards (user_id);
create index boards_user_updated_idx on public.boards (user_id, updated_at desc);

-- Per-user settings
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workspace_name text not null default 'MoodBoard AI',
  workspace_tagline text not null default 'Creative direction workspace',
  avatar_accent text not null default '#cbd5e1',
  avatar_id text not null default 'artist',
  default_visibility text not null default 'private' check (default_visibility in ('private', 'shared')),
  presentation_mode_enabled boolean not null default true,
  keyboard_shortcuts_enabled boolean not null default true,
  reduce_motion_enabled boolean not null default false,
  focus_rings_enabled boolean not null default true,
  theme_mode text not null default 'system' check (theme_mode in ('system', 'light', 'dark')),
  updated_at timestamptz not null default now()
);

-- Auto-create profile + default settings on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.user_settings enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Boards
create policy "Users can view own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- User settings
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);
