-- Section context on board comments (overview, palette, typography, references, notes).

alter table public.board_comments
  add column if not exists section text
  check (
    section is null
    or section in ('overview', 'palette', 'typography', 'references', 'notes')
  );

update public.board_comments
set section = 'overview'
where section is null;
