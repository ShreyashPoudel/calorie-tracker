-- Recovery script — run this if you hit
--   "column 'user_id' of relation 'targets' contains null values"
-- while running db/auth-migration.sql.
--
-- The first migration adds user_id columns and drops the old targets PK,
-- but tries to add the new PK *before* backfilling — which fails because
-- there's still a row with user_id = NULL. This script picks up where
-- that left off:
--   1. Backfill any remaining NULL user_ids to the first signed-up user
--   2. Add the new PK (idempotent)
--   3. Lock down user_id NOT NULL
--   4. Enable RLS (idempotent)
--   5. Create owner-only policies (idempotent via DROP IF EXISTS)
--
-- Safe to run multiple times.

-- ─── 1. Backfill any NULL user_ids ────────────────────────────────────
UPDATE foods          SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;
UPDATE targets        SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;
UPDATE meal_templates SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;

-- ─── 2. Add per-user PK on targets (idempotent) ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'targets' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE targets ADD PRIMARY KEY (user_id);
  END IF;
END $$;

-- ─── 3. Lock down user_id NOT NULL ──────────────────────────────────
ALTER TABLE foods          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE targets        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE meal_templates ALTER COLUMN user_id SET NOT NULL;

-- ─── 4. Helpful indexes (idempotent) ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_foods_user          ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id);

-- ─── 5. Enable RLS (idempotent) ─────────────────────────────────────
ALTER TABLE foods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- ─── 6. Owner-only policies (idempotent) ────────────────────────────
DROP POLICY IF EXISTS "owner_all_foods"          ON foods;
DROP POLICY IF EXISTS "owner_all_targets"        ON targets;
DROP POLICY IF EXISTS "owner_all_meal_templates" ON meal_templates;

CREATE POLICY "owner_all_foods"
  ON foods FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_all_targets"
  ON targets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_all_meal_templates"
  ON meal_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);