// Supabase client used by the React app.
// URL and anon key come from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// in .env (see .env.example).

import { createClient } from '@supabase/supabase-js'

/**
 * Strip any path the user accidentally appended to the URL.
 * The Supabase JS client builds REST/auth/storage URLs itself, so a value
 * like `https://x.supabase.co/rest/v1/` would produce double-paths like
 * `/rest/v1/rest/v1/foods` → 404. We trim anything after the host.
 */
function normalizeUrl(raw: string): string {
  return raw.replace(/\/(rest|auth|storage|realtime|functions).*$/, '').replace(/\/+$/, '')
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!rawUrl || !key) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env',
  )
}

const url = normalizeUrl(rawUrl)

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
})