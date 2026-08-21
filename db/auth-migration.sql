-- One-time migration to add Supabase Auth + per-user RLS.
--
-- Run this in the Supabase SQL editor in this exact order:
--   1. Sign up on the deployed app (your Vercel URL) so auth.users has at
--      least one row (your new account).
--   2. Paste & run everything below in the SQL editor.
--   3. Refresh the app — your existing data should be visible.
--
-- After running this, you MUST also (Dashboard → Authentication → Providers
-- → Email) uncheck "Confirm email" so new users sign in immediately.
--
-- If you previously hit "column 'user_id' contains null values" while
-- running this script, run db/auth-recovery.sql instead — it picks up
-- where the partial run left off.

-- ─── 1. Add user_id to all three tables ────────────────────────────────
-- Nullable at this stage so existing rows aren't blocked by FK constraint.
ALTER TABLE foods          ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE targets        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE meal_templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ─── 2. Drop the old singleton PK + CHECK on targets ───────────────────
-- Old design was a singleton keyed on id=1; we'll re-add PK on user_id
-- below (after backfill, otherwise it'd fail on existing NULLs).
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_pkey;
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_id_check;

-- ─── 3. Backfill existing rows to the first user ──────────────────────
-- Safe to re-run; only touches rows whose user_id is still NULL.
-- MUST happen before adding the new PK on targets.
UPDATE foods          SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;
UPDATE targets        SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;
UPDATE meal_templates SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL;

-- ─── 4. Rebuild `targets` PK to be per-user ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'targets' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE targets ADD PRIMARY KEY (user_id);
  END IF;
END $$;

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_foods_user          ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id);

-- ─── 5. Lock down user_id from now on ─────────────────────────────────
-- Belt + braces: the RLS policy below is the real check, but this stops
-- a bug from inserting a NULL user_id in the first place.
ALTER TABLE foods          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE targets        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE meal_templates ALTER COLUMN user_id SET NOT NULL;

-- ─── 6. Enable RLS with owner-only policies ───────────────────────────
ALTER TABLE foods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

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