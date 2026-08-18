-- Run this once in the Supabase SQL editor
-- (https://app.supabase.com/project/_/sql) to create the tables the
-- calorie tracker expects.

CREATE TABLE IF NOT EXISTS targets (
  id        INT PRIMARY KEY DEFAULT 1,
  calories  INT NOT NULL DEFAULT 2000,
  protein   INT NOT NULL DEFAULT 150,
  CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS foods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  name        TEXT NOT NULL,
  quantity    NUMERIC NOT NULL,
  grams       NUMERIC NOT NULL,
  unit        TEXT NOT NULL CHECK (unit IN ('g', 'piece')),
  piece_unit  TEXT,
  calories    NUMERIC NOT NULL,
  protein     NUMERIC NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_date ON foods(date);

-- Seed default targets (idempotent).
INSERT INTO targets (id, calories, protein) VALUES (1, 2000, 150)
  ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: Supabase enables Row Level Security by default. This app uses
-- the anon key, so we need to either:
--   (a) disable RLS on both tables (simplest for single-user apps):
--         ALTER TABLE targets DISABLE ROW LEVEL SECURITY;
--         ALTER TABLE foods   DISABLE ROW LEVEL SECURITY;
--   or (b) leave RLS enabled and add permissive policies, e.g.:
--         ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
--         CREATE POLICY "anon all" ON targets FOR ALL TO anon USING (true) WITH CHECK (true);
--         ALTER TABLE foods   ENABLE ROW LEVEL SECURITY;
--         CREATE POLICY "anon all" ON foods   FOR ALL TO anon USING (true) WITH CHECK (true);
-- Pick (a) for personal use, (b) if you'll ever expose this to other users.
ALTER TABLE targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE foods   DISABLE ROW LEVEL SECURITY;