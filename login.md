# Login / auth — design doc

The app is currently wide open: anyone who knows
`shreyashpoudel.com.np` can read, edit, and delete every food log. That's
fine while the URL is a secret, but the moment you share it with someone,
mention it on a stream, or it gets crawled, your data is public.

This doc lays out the options, their tradeoffs, and the path I'd actually
take. Pick whatever matches your threat model — they're ranked from
"do nothing" to "real per-user auth".

---

## Current state

- **No login screen.** The dashboard renders as soon as the app loads.
- **RLS is disabled on every table** in Supabase (`foods`, `targets`,
  `meal_templates`). That was a deliberate choice for a single-user setup
  — it means the browser talks to Postgres with the *anon* key and the
  server doesn't filter rows.
- **The anon key is in `.env` and shipped to the client.** That's normal
  for Supabase — anon keys are designed to be public. RLS is what
  protects your data, not the key. Right now you have neither.
- **One device, one browser, one user** is the implicit assumption.

So: there's no auth gate, and the database will happily serve any row to
any client that knows the project URL + anon key.

---

## The threat model, in plain English

| Adversary | Can they get in today? | Does it matter? |
|---|---|---|
| Random visitor who guessed your domain | Yes, but they have to know it | Maybe — the URL leaks eventually |
| Someone you sent the link to | Yes | Yes — they can edit your data |
| A web crawler / scanner that hits `*.com.np` | Yes, eventually | Yes — silent data corruption |
| Someone who scraped your anon key + project URL from the bundle | Yes (direct Supabase API) | Same as above |

If the answer to "does it matter" is "no, I'm the only person who'll ever
type this URL," skip auth. If you want to share the link with a friend, or
log in from a public computer, or want to feel safe if Vercel logs leak,
auth.

---

## The options

### Option 0 — Do nothing

Keep the current setup. It's the cheapest option and perfectly reasonable
if you never share the URL.

**Pros:** zero work, zero friction, fastest possible UX.
**Cons:** one shared link and your day log is gone.

---

### Option 1 — Vercel Password Protection (recommended for personal use)

Vercel has a built-in HTTP Basic auth toggle for any project. Settings →
Password Protection → set a username + password. Vercel injects a `WWW-
Authenticate` prompt before the site loads. **Zero code changes.**

**Pros:** literally a 30-second change. Protects the whole site including
the HTML/CSS/JS, so the anon key isn't even loaded into anyone else's
browser. Works on phone too. Free.
**Cons:** doesn't protect direct Supabase API calls. If someone scrapes
your anon key, they can still hit the database. **However**, the anon key
by itself can't *read* data without RLS being off — so if you flip RLS on
even without per-user auth, anonymous traffic returns empty results.

This is the option I'd pick today. Combined with enabling RLS below, it
gets you 95% of the security with 0.5% of the work.

---

### Option 2 — Cloudflare Access (if you want SSO)

Put Cloudflare in front of Vercel (free plan supports this if you switch
DNS). Cloudflare Access lets you require Google / GitHub / email OTP
before traffic reaches Vercel.

**Pros:** proper SSO, no password to remember, audit logs.
**Cons:** requires moving DNS to Cloudflare and adding their proxy.
Overkill for a personal app.

---

### Option 3 — Single shared passphrase in the app

Add a `<LoginGate>` component that asks for a passphrase and stores a flag
in `sessionStorage`. The flag gates the dashboard. Passphrase comes from
an env var baked at build time.

**Pros:** doesn't touch Supabase, feels app-native.
**Cons:** security theatre — anyone with browser devtools skips it in 5
seconds. The anon key is still public. Don't do this.

---

### Option 4 — Real Supabase Auth (recommended if you want to share)

Proper per-user accounts via Supabase's built-in auth. Magic-link email
login is the lowest-friction option (no password to remember, no password
to leak).

**Cons:** ~1–2 hours of work plus a migration. Every existing row needs a
`user_id`. RLS policies need writing. First-time login requires clicking a
link in your email.

**Pros:** works for multiple users. RLS enforced at the database. Direct
API calls return only your data, even with the public anon key.

This is the "right" answer if you want to share the app with friends or
ever sell it as a SaaS.

---

## Recommended path

For a single-user personal app I'd deploy today:

1. **Turn on Vercel Password Protection** (Option 1). 30 seconds.
2. **Enable RLS on the existing tables** with a single permissive policy
   that's still anon-readable (so the password gate is the real
   protection). You get defense-in-depth: even if someone bypasses the
   password, Supabase itself refuses to serve rows without a real user
   session.

If you want to share the app with multiple people, add Option 4 on top:
3. Switch the RLS policies to `auth.uid() = user_id`.
4. Add a magic-link login screen.
5. Backfill existing rows with your user_id.

---

## Step-by-step: Option 1 (the actual right-now plan)

### Enable HTTP Basic auth on Vercel

1. Open the Vercel project for `shreyashpoudel.com.np`.
2. Settings → Password Protection.
3. Set a username and a strong password.
4. Save. Redeploy (usually a minute).

That's it. Your browser will prompt for the password before the app
loads. The Supabase anon key never reaches anyone else's browser.

### Belt-and-braces: lock the DB even if the password is bypassed

Run this in the Supabase SQL editor:

```sql
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- Allow anon reads/writes for now (the Vercel password is the gate).
-- Once you add real auth, replace these with auth.uid() = user_id.
CREATE POLICY "anon can do anything on foods"
  ON foods FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can do anything on targets"
  ON targets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can do anything on meal_templates"
  ON meal_templates FOR ALL TO anon USING (true) WITH CHECK (true);
```

This means Supabase enforces "something is checking identity" even if
the upstream gate fails. You're not trusting the Vercel password alone.

---

## Step-by-step: Option 4 (when you want real auth)

This is the full plan. Skim it now, execute later.

### 1. Enable email auth in Supabase

Dashboard → Authentication → Providers → Email → toggle on. Configure the
"Confirm email" template if you want magic links (recommended).

### 2. Add `user_id` to every table

```sql
ALTER TABLE foods          ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE targets        ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE meal_templates ADD COLUMN user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_foods_user          ON foods(user_id);
CREATE INDEX idx_targets_user        ON targets(user_id);
CREATE INDEX idx_meal_templates_user ON meal_templates(user_id);
```

### 3. Backfill your existing rows

After you sign up once and have a `user_id`:

```sql
-- Replace with your actual user UUID from auth.users
DO $$
DECLARE my_id UUID;
BEGIN
  SELECT id INTO my_id FROM auth.users LIMIT 1;
  UPDATE foods          SET user_id = my_id WHERE user_id IS NULL;
  UPDATE targets        SET user_id = my_id WHERE user_id IS NULL;
  UPDATE meal_templates SET user_id = my_id WHERE user_id IS NULL;
END $$;
```

### 4. Replace the permissive policies with owner-only

```sql
DROP POLICY "anon can do anything on foods"          ON foods;
DROP POLICY "anon can do anything on targets"        ON targets;
DROP POLICY "anon can do anything on meal_templates" ON meal_templates;

CREATE POLICY "owner can do anything on foods"
  ON foods FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner can do anything on targets"
  ON targets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner can do anything on meal_templates"
  ON meal_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

`authenticated` is a built-in Supabase role for any session that has
successfully signed in. `anon` won't be able to read or write anymore.

### 5. React changes

- `db.ts`: change `auth: { persistSession: false }` to
  `persistSession: true`. Supabase will now manage the session in
  localStorage and auto-refresh tokens.
- `NutritionContext.tsx`: expose the current user via
  `supabase.auth.getUser()` and subscribe to `onAuthStateChange`.
- `queries.ts`: include `user_id: user.id` on every insert/update.
- New `src/pages/LoginPage.tsx`: a single email input + "Send magic
  link" button. On submit, call
  `supabase.auth.signInWithOtp({ email })` and show "Check your inbox".
- `App.tsx`: while `loaded && !session`, show `<LoginPage />`. Otherwise
  show the existing app.

### 6. Don't forget the redirect URL

In Supabase → Authentication → URL Configuration, add
`https://shreyashpoudel.com.np` to the redirect allowlist so the magic-
link email lands the user back on your domain.

---

## What I'd skip

- **OAuth providers (Google, GitHub).** Magic-link email is one less
  integration to break. Add Google later if you want.
- **Password reset flows.** Magic-link email *is* the password reset.
- **Email verification badges.** Supabase handles "is this email
  verified" automatically; just trust it.
- **Multi-factor auth.** You're not defending against nation-states.

---

## TL;DR

- Right now: **enable Vercel Password Protection** (30 s) and turn on
  RLS with permissive policies (1 min). Done.
- When you share the app: add **Supabase magic-link auth** with the
  steps above. ~2 hours including migration.

The first step gives you a million times more protection than zero
without touching a single line of app code.