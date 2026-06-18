-- User-published board templates (community browse; no payments)

create table if not exists public.board_templates (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  prompt text not null default '',
  tags text[] not null default '{}',
  template_json jsonb not null,
  is_public boolean not null default false,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_templates_owner_user_id_idx
  on public.board_templates (owner_user_id);

create index if not exists board_templates_public_idx
  on public.board_templates (is_public, updated_at desc)
  where is_public = true;

alter table public.board_templates enable row level security;

drop policy if exists board_templates_select_public on public.board_templates;
create policy board_templates_select_public
  on public.board_templates
  for select
  using (is_public = true or owner_user_id = auth.uid());

drop policy if exists board_templates_insert_owner on public.board_templates;
create policy board_templates_insert_owner
  on public.board_templates
  for insert
  with check (owner_user_id = auth.uid());

drop policy if exists board_templates_update_owner on public.board_templates;
create policy board_templates_update_owner
  on public.board_templates
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists board_templates_delete_owner on public.board_templates;
create policy board_templates_delete_owner
  on public.board_templates
  for delete
  using (owner_user_id = auth.uid());
