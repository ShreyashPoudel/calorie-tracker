import { useId, useState } from 'react'
import { supabase } from '../api/db'

type Mode = 'signin' | 'signup'

/**
 * Email + password auth screen. A single form flips between "Sign in"
 * and "Create account" with a toggle link. Supabase's auth state
 * listener in `NutritionContext` picks up the resulting session and
 * routes the user to the dashboard (or the onboarding wizard if they
 * just signed up).
 */
export function LoginPage() {
  const formId = useId()
  const headingId = useId()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (err) throw err
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Decorative background orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-sm px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-lg text-white shadow-lg shadow-brand-900/50">
            🍽️
          </span>
          <div>
            <h1 className="text-base font-semibold leading-tight text-white">
              Nutrition Tracker
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              Calories · Protein
            </p>
          </div>
        </div>

        <section
          aria-labelledby={headingId}
          className="card p-6"
        >
          <h2 id={headingId} className="mb-1 text-lg font-semibold text-white">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            {isSignup
              ? 'Pick an email and a password — you’ll set your daily goals next.'
              : 'Sign in to log your meals.'}
          </p>

          <form id={formId} onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignup && (
                <p className="mt-1 text-[11px] text-slate-500">
                  At least 6 characters.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="btn-primary w-full"
            >
              {submitting
                ? isSignup
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-brand-300 hover:text-brand-200"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  type="button"
                  className="font-medium text-brand-300 hover:text-brand-200"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Your data lives in Supabase and is scoped to your account.
        </p>
      </div>
    </div>
  )
}