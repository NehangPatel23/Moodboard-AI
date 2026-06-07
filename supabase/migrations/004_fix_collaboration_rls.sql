-- Fix infinite RLS recursion between boards and board_members policies.
-- Run after 003_board_collaboration.sql.

create or replace function public.is_board_owner(p_board_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
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
    select 1
    from public.board_members bm
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
    select 1
    from public.board_members bm
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
