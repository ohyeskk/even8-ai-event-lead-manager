create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  company text not null default '' check (char_length(company) <= 160),
  email text not null check (char_length(email) <= 254),
  event text not null default '' check (char_length(event) <= 160),
  notes text not null default '' check (char_length(notes) <= 4000),
  follow_up_status text not null default 'New'
    check (follow_up_status in ('New', 'Contacted', 'Follow-up due', 'Qualified', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- The app calls Supabase from server-side API routes with a secret key.
-- Keep table privileges away from public client roles; RLS remains enabled.
revoke all on table public.leads from anon, authenticated, public;
grant select, insert, update, delete on table public.leads to service_role;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_follow_up_status_idx on public.leads (follow_up_status);

-- Optional fictional rows for a first-run demo. Run once after creating the table.
insert into public.leads (name, company, email, event, notes, follow_up_status)
values
  ('Maya Chen', 'Northstar Studio', 'maya.chen@example.com', 'Design Forward 2026', 'Interested in collaborating on the spring launch. Send the event recap and ask about a short intro call.', 'Follow-up due'),
  ('Arjun Mehta', 'Paperplane Labs', 'arjun.mehta@example.com', 'Design Forward 2026', 'Runs community events for product teams; asked about attendee gifting and sustainable packaging.', 'Contacted'),
  ('Sofia Alvarez', 'Common Ground', 'sofia.alvarez@example.com', 'Good Things Summit', 'Loved the panel on brand storytelling. Mention the case study we discussed.', 'Qualified')
on conflict do nothing;
