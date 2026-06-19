-- Realtime broadcast authorization for live field sync (topic: board-fields:{board_id}).
-- Required when Supabase Realtime "Allow public access" is disabled.

create or replace function public.board_id_from_fields_topic()
returns text
language sql
stable
as $$
  select case
    when (select realtime.topic()) like 'board-fields:%'
    then substring((select realtime.topic()) from 14)
    else null
  end;
$$;

grant execute on function public.board_id_from_fields_topic() to authenticated;

drop policy if exists "Board participants can receive field sync" on realtime.messages;
drop policy if exists "Board participants can send field sync" on realtime.messages;

create policy "Board participants can receive field sync"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'board-fields:%'
    and (
      public.is_board_owner(public.board_id_from_fields_topic())
      or public.is_board_member(public.board_id_from_fields_topic())
    )
  );

create policy "Board participants can send field sync"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'board-fields:%'
    and (
      public.is_board_owner(public.board_id_from_fields_topic())
      or public.is_board_member(public.board_id_from_fields_topic())
    )
  );
