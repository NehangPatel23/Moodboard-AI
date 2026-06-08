-- Realtime Presence authorization for board editor channels (topic: board:{board_id}).
-- Required when Supabase Realtime "Allow public access" is disabled (recommended for production).

create or replace function public.board_id_from_presence_topic()
returns text
language sql
stable
as $$
  select case
    when (select realtime.topic()) like 'board:%'
    then substring((select realtime.topic()) from 7)
    else null
  end;
$$;

grant execute on function public.board_id_from_presence_topic() to authenticated;

drop policy if exists "Board participants can receive presence" on realtime.messages;
drop policy if exists "Board participants can track presence" on realtime.messages;

create policy "Board participants can receive presence"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'presence'
    and (select realtime.topic()) like 'board:%'
    and (
      public.is_board_owner(public.board_id_from_presence_topic())
      or public.is_board_member(public.board_id_from_presence_topic())
    )
  );

create policy "Board participants can track presence"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and (select realtime.topic()) like 'board:%'
    and (
      public.is_board_owner(public.board_id_from_presence_topic())
      or public.is_board_member(public.board_id_from_presence_topic())
    )
  );
