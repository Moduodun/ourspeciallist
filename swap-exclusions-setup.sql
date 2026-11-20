-- Run once in the Supabase SQL Editor.
-- Stores pairs that must not be matched in a Surprise Swap draw.
create table if not exists swap_exclusions (
  id text primary key,
  swap_id text not null references surprise_swaps(id) on delete cascade,
  giver_id text not null references swap_participants(id) on delete cascade,
  receiver_id text not null references swap_participants(id) on delete cascade,
  unique (swap_id, giver_id, receiver_id)
);

alter table swap_exclusions enable row level security;

-- Only the organiser of the swap can see or change its exclusions
create policy "Organisers manage exclusions"
on swap_exclusions for all to authenticated
using (exists (
  select 1 from surprise_swaps s
  where s.id = swap_exclusions.swap_id and s.organiser_id = auth.uid()
))
with check (exists (
  select 1 from surprise_swaps s
  where s.id = swap_exclusions.swap_id and s.organiser_id = auth.uid()
));
