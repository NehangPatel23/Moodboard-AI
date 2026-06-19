-- Link pending invites to known users for reliable matching on accept.

alter table public.board_invites
  add column if not exists invitee_user_id uuid references auth.users (id) on delete set null;

create index if not exists board_invites_invitee_user_id_idx
  on public.board_invites (invitee_user_id)
  where status = 'pending';
