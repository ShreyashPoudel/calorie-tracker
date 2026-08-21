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

// `persistSession: true` is required so the browser keeps the Supabase
// session in localStorage and rehydrates it on reload — otherwise the
// user would be logged out on every refresh.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Returns the currently signed-in session, or null if not logged in. */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Subscribes to auth state changes (sign-in, sign-out, token refresh). */
export function onAuthChange(
  cb: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(cb)
}

/** Throws if there's no signed-in user. Used by writes that need user_id. */
export async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in')
  return data.user
}