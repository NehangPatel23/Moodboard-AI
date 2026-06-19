-- Backfill invitee_user_id on existing pending invites so invitees see them after migration 030.

update public.board_invites bi
set invitee_user_id = p.id
from public.profiles p
where bi.status = 'pending'
  and bi.invitee_user_id is null
  and lower(bi.email) = lower(p.email);
