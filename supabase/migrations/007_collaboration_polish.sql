-- Collaboration polish: denormalized display names for realtime payloads.
-- Run after 006_board_realtime_comments.sql.

-- Who last saved the board (conflict banner attribution).
alter table public.boards
  add column if not exists last_saved_by_name text;

-- Author display name at comment write time (realtime INSERT payloads).
alter table public.board_comments
  add column if not exists author_name text;

update public.board_comments bc
  set author_name = coalesce(p.name, 'Collaborator')
  from public.profiles p
  where bc.user_id = p.id
    and bc.author_name is null;

alter table public.board_comments
  alter column author_name set default 'Collaborator';

update public.board_comments
  set author_name = 'Collaborator'
  where author_name is null;

alter table public.board_comments
  alter column author_name set not null;
