-- Team collaboration: board members and email invites.
-- Uses security definer helpers to avoid RLS recursion (see 004 if upgrading from an earlier 003).

create table if not exists public.board_members (
  board_id text not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create index if not exists board_members_user_id_idx on public.board_members (user_id);

create table if not exists public.board_invites (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.boards (id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists board_invites_board_id_idx on public.board_invites (board_id);
create index if not exists board_invites_email_idx on public.board_invites (lower(email));
create unique index if not exists board_invites_pending_unique_idx
  on public.board_invites (board_id, lower(email))
  where status = 'pending';

alter table public.board_members enable row level security;
alter table public.board_invites enable row level security;

-- Helper functions (security definer bypasses RLS for ownership checks)
create or replace function public.is_board_owner(p_board_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.boards b
    where b.id = p_board_id and b.user_id = auth.uid()
  );
$$;

create or replace function public.is_board_member(p_board_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.board_members bm
    where bm.board_id = p_board_id and bm.user_id = auth.uid()
  );
$$;

create or replace function public.is_board_editor(p_board_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.board_members bm
    where bm.board_id = p_board_id and bm.user_id = auth.uid() and bm.role = 'editor'
  );
$$;

grant execute on function public.is_board_owner(text) to authenticated;
grant execute on function public.is_board_member(text) to authenticated;
grant execute on function public.is_board_editor(text) to authenticated;

drop policy if exists "Members can view collaborator boards" on public.boards;
drop policy if exists "Editors can update collaborator boards" on public.boards;
drop policy if exists "Board participants can view members" on public.board_members;
drop policy if exists "Owners can add members" on public.board_members;
drop policy if exists "Owners and members can remove membership" on public.board_members;
drop policy if exists "Owners can view board invites" on public.board_invites;
drop policy if exists "Owners can create invites" on public.board_invites;
drop policy if exists "Owners and invitees can update invites" on public.board_invites;
drop policy if exists "Owners can delete invites" on public.board_invites;

create policy "Members can view collaborator boards"
  on public.boards for select
  using (public.is_board_member(id));

create policy "Editors can update collaborator boards"
  on public.boards for update
  using (public.is_board_editor(id));

create policy "Board participants can view members"
  on public.board_members for select
  using (
    user_id = auth.uid()
    or public.is_board_owner(board_id)
    or public.is_board_member(board_id)
  );

create policy "Owners can add members"
  on public.board_members for insert
  with check (public.is_board_owner(board_id));

create policy "Owners and members can remove membership"
  on public.board_members for delete
  using (user_id = auth.uid() or public.is_board_owner(board_id));

create policy "Owners can view board invites"
  on public.board_invites for select
  using (
    public.is_board_owner(board_id)
    or (
      status = 'pending'
      and lower(email) = lower((
        select p.email from public.profiles p where p.id = auth.uid()
      ))
    )
  );

create policy "Owners can create invites"
  on public.board_invites for insert
  with check (invited_by = auth.uid() and public.is_board_owner(board_id));

create policy "Owners and invitees can update invites"
  on public.board_invites for update
  using (
    public.is_board_owner(board_id)
    or lower(email) = lower((
      select p.email from public.profiles p where p.id = auth.uid()
    ))
  );

create policy "Owners can delete invites"
  on public.board_invites for delete
  using (public.is_board_owner(board_id));
