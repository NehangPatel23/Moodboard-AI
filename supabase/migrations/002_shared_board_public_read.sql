-- Allow anonymous and authenticated users to read boards marked as shared.
-- Owners retain full access via existing "Users can view own boards" policy.

create policy "Anyone can view shared boards"
  on public.boards for select
  using (visibility = 'shared');
