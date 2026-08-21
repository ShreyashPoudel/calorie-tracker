-- Reference schema for the calorie tracker.
-- This is documentation only — Supabase owns the live schema. To bootstrap
-- a fresh project, run schema.sql + auth-migration.sql in order.

CREATE TABLE IF NOT EXISTS foods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','snacks','dinner')),
  name        TEXT NOT NULL,
  quantity    NUMERIC NOT NULL,
  grams       NUMERIC NOT NULL,
  unit        TEXT NOT NULL CHECK (unit IN ('g','piece')),
  piece_unit  TEXT,
  calories    NUMERIC NOT NULL,
  protein     NUMERIC NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foods_user ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_foods_user_date ON foods(user_id, date);

CREATE TABLE IF NOT EXISTS targets (
  -- Per-user singleton: one targets row per auth user. PK is user_id.
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calories  INT NOT NULL DEFAULT 2000,
  protein   INT NOT NULL DEFAULT 150
);

CREATE TABLE IF NOT EXISTS meal_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','snacks','dinner')),
  items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id);

-- RLS: every table is owner-scoped. The anon role has no policies, so
-- unauthenticated requests get empty results. Service role bypasses RLS
-- (used only by server-side migrations / cron if you ever add them).
ALTER TABLE foods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_foods"          ON foods          FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_targets"        ON targets        FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_meal_templates" ON meal_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);