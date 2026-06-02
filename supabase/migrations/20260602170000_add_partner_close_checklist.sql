alter table public.partners
  add column if not exists close_checklist jsonb not null default '[]'::jsonb;

comment on column public.partners.close_checklist is 'Path to Close checklist JSON array of {id,label,checked,order} items for partnership close tracking.';
