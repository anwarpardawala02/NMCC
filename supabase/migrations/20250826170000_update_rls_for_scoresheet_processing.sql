-- Strengthen RLS for scoresheet processing flow
-- - Enable and add policies for match_details (insert/update by admins & fixture managers)
-- - Allow admins & fixture managers to manage player_statistics (in addition to any existing rules)
-- - Allow admins & fixture managers to insert players (when OCR creates missing NMCC players)

-- Match details RLS (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND t.tablename = 'match_details'
  ) THEN
    -- table may not exist in some environments
    RAISE NOTICE 'match_details table not found; skipping RLS enable.';
  ELSE
    EXECUTE 'ALTER TABLE match_details ENABLE ROW LEVEL SECURITY';

    -- Anyone can read match details
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_details' AND policyname = 'Anyone can view match details'
    ) THEN
      CREATE POLICY "Anyone can view match details" ON match_details FOR SELECT USING (true);
    END IF;

    -- Admins & fixture managers can insert
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_details' AND policyname = 'Admins and fixture managers can insert match details'
    ) THEN
      CREATE POLICY "Admins and fixture managers can insert match details" ON match_details FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM players
          WHERE id::text = auth.uid()::text AND role IN ('admin','fixture_manager')
        )
      );
    END IF;

    -- Admins & fixture managers can update
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'match_details' AND policyname = 'Admins and fixture managers can update match details'
    ) THEN
      CREATE POLICY "Admins and fixture managers can update match details" ON match_details FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM players
          WHERE id::text = auth.uid()::text AND role IN ('admin','fixture_manager')
        )
      );
    END IF;
  END IF;
END$$;

-- Player statistics RLS: ensure admins & fixture managers can manage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND t.tablename = 'player_statistics'
  ) THEN
    -- enable if not already
    BEGIN
      EXECUTE 'ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN others THEN
      -- ignore if already enabled
      NULL;
    END;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_statistics' AND policyname = 'Admins and fixture managers can manage statistics'
    ) THEN
      CREATE POLICY "Admins and fixture managers can manage statistics" ON player_statistics FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM players
          WHERE id::text = auth.uid()::text AND role IN ('admin','fixture_manager')
        )
      );
    END IF;
  END IF;
END$$;

-- Players: allow admins & fixture managers to insert players (in addition to existing rules)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND t.tablename = 'players'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'players' AND policyname = 'Admins and fixture managers can insert players'
    ) THEN
      CREATE POLICY "Admins and fixture managers can insert players" ON players FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM players
          WHERE id::text = auth.uid()::text AND role IN ('admin','fixture_manager')
        )
      );
    END IF;
  END IF;
END$$;
