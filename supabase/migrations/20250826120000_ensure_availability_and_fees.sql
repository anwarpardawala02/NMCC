-- Ensure club_fees and availability exist in the public schema with required policies and triggers
-- Club fees table (idempotent) - aligns with existing schema provided
create table if not exists public.club_fees (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  fixture_id uuid references public.fixtures(id),
  category text check (category = any (array['Match Fee','Squad Fee','Nets','Chai','Other'])),
  amount numeric(10,2) not null,
  paid_on date default now(),
  notes text
);

-- Basic indexes
create index if not exists club_fees_player_id_idx on public.club_fees (player_id);
create index if not exists club_fees_fixture_id_idx on public.club_fees (fixture_id);

-- Availability table (idempotent)
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references public.fixtures(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  status text check (status in ('Available','Not Available')),
  responded_on timestamptz default now(),
  unique (fixture_id, player_id)
);

alter table public.availability enable row level security;

-- Policies (dev-friendly: allow read/insert/update for everyone)
-- Note: These are permissive for development; tighten for production.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'availability' AND p.policyname = 'availability_read_policy'
  ) THEN
    CREATE POLICY availability_read_policy ON public.availability FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'availability' AND p.policyname = 'availability_insert_policy'
  ) THEN
    CREATE POLICY availability_insert_policy ON public.availability FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'availability' AND p.policyname = 'availability_update_policy_dev'
  ) THEN
    -- In dev, allow updates by anyone so upsert works without Supabase Auth
    CREATE POLICY availability_update_policy_dev ON public.availability FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Trigger to create a match fee when a player marks Available
create or replace function public.add_match_fee_on_available()
returns trigger as $$
begin
  if new.status = 'Available' then
    if not exists (
      select 1 from public.club_fees
      where player_id = new.player_id
        and fixture_id = new.fixture_id
        and category = 'Match Fee'
    ) then
      insert into public.club_fees (
        player_id, fixture_id, category, amount, paid_on, notes
      )
      values (
        new.player_id,
        new.fixture_id,
        'Match Fee',
        25.00,
        null,
        (
          select 'Match fee for ' || f.opponent || ' (' || new.fixture_id || ')'
          from public.fixtures f
          where f.id = new.fixture_id
        )
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'add_match_fee_trigger'
      AND n.nspname = 'public'
      AND c.relname = 'availability'
  ) THEN
    CREATE TRIGGER add_match_fee_trigger
    AFTER INSERT OR UPDATE ON public.availability
    FOR EACH ROW
    WHEN (NEW.status = 'Available')
    EXECUTE FUNCTION public.add_match_fee_on_available();
  END IF;
END $$;
