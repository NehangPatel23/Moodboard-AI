-- Allow invitees to decline board invitations; track when declined.

alter table public.board_invites
  add column if not exists declined_at timestamptz;

alter table public.board_invites
  drop constraint if exists board_invites_status_check;

alter table public.board_invites
  add constraint board_invites_status_check
  check (status in ('pending', 'accepted', 'revoked', 'declined'));
