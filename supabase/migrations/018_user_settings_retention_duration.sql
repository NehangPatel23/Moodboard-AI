-- Flexible collaboration retention (amount + unit).
-- Run after 011_user_settings_retention.sql.

alter table public.user_settings
  add column if not exists collaboration_retention jsonb;

update public.user_settings
set collaboration_retention = jsonb_build_object(
  'commentsHide', jsonb_build_object(
    'amount', coalesce(comments_hide_after_days, 0),
    'unit', 'days'
  ),
  'activityHide', jsonb_build_object(
    'amount', coalesce(activity_hide_after_days, 0),
    'unit', 'days'
  ),
  'purgeComments', jsonb_build_object(
    'amount', coalesce(purge_comments_after_days, 0),
    'unit', 'days'
  ),
  'purgeActivity', jsonb_build_object(
    'amount', coalesce(purge_activity_after_days, 0),
    'unit', 'days'
  )
)
where collaboration_retention is null;
