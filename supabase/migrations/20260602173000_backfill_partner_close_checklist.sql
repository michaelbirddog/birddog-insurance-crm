with default_close_checklist as (
  select jsonb_agg(
    jsonb_build_object(
      'id', 'default-' || ord::text,
      'label', label,
      'checked', false,
      'order', ord - 1
    )
    order by ord
  ) as items
  from unnest(array[
    'Intro call held',
    'NDA / confidentiality signed',
    'Appetite guide received',
    'Products / lines to write confirmed',
    'Commission / economics agreed',
    'Application + submission docs received',
    'Sample risk submitted',
    'Binding authority / LOA confirmed',
    'Producer agreement executed'
  ]) with ordinality as defaults(label, ord)
)
update public.partners
set close_checklist = default_close_checklist.items,
    updated_at = coalesce(updated_at, now())
from default_close_checklist
where close_checklist is null
   or (jsonb_typeof(close_checklist) = 'array' and jsonb_array_length(close_checklist) = 0);
