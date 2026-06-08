-- Public bucket for user-uploaded reference images
insert into storage.buckets (id, name, public)
values ('reference-uploads', 'reference-uploads', true)
on conflict (id) do nothing;

-- Authenticated users may upload to their own folder via service role API;
-- public read for moodboard display.
create policy "Public read reference uploads"
  on storage.objects for select
  using (bucket_id = 'reference-uploads');
