-- Profile photo URL + storage bucket for user avatars

alter table public.user_settings
  add column if not exists avatar_image_url text;

insert into storage.buckets (id, name, public)
values ('avatar-uploads', 'avatar-uploads', true)
on conflict (id) do nothing;

create policy "Public read avatar uploads"
  on storage.objects for select
  using (bucket_id = 'avatar-uploads');
