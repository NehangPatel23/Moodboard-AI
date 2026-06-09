-- Persist AI-generated brand strategy on boards (positioning, voice, messaging).

alter table public.boards
  add column if not exists brand_strategy jsonb;
