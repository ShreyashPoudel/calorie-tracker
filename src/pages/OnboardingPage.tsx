import { useId, useState } from 'react'
import { useNutrition } from '../context/useNutrition'
import { formatNumber } from '../utils/calculations'

/**
 * First-run wizard shown right after signup. Collects daily calorie +
 * protein targets, persists them via `setTargets`, and trusts the
 * NutritionContext to flip `onboarded = true` so the shell renders
 * the dashboard.
 */
export function OnboardingPage() {
  const headingId = useId()
  const { targets, setTargets, user, signOut } = useNutrition()

  const [calories, setCalories] = useState(String(targets.calories))
  const [protein, setProtein] = useState(String(targets.protein))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    const cal = Number(calories)
    const pro = Number(protein)
    if (!Number.isFinite(cal) || cal <= 0) {
      setError('Enter a positive number for calories.')
      return
    }
    if (!Number.isFinite(pro) || pro <= 0) {
      setError('Enter a positive number for protein.')
      return
    }
    setError(null)
    setSubmitting(true)
    // setTargets is fire-and-forget — errors are surfaced via the
    // context's error banner. onboarded flips true optimistically.
    setTargets({ calories: Math.round(cal), protein: Math.round(pro) })
    setSubmitting(false)
  }

  const firstName = (user?.email ?? '').split('@')[0]

  return (
    <div className="min-h-full bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-lg text-white">
              🍽️
            </span>
            <div>
              <h1 className="text-base font-semibold leading-tight text-slate-900">
                Nutrition Tracker
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Calories · Protein
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Sign out before finishing setup?')) void signOut()
            }}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>

        <section aria-labelledby={headingId} className="card p-5">
          <h2 id={headingId} className="text-xl font-semibold text-slate-900">
            Welcome{firstName ? `, ${firstName}` : ''} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Two quick numbers and you're set. You can change these anytime
            from Settings.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="onb-cal">
                Daily calorie target{' '}
                <span className="font-normal text-slate-400">(kcal)</span>
              </label>
              <input
                id="onb-cal"
                type="number"
                min="0"
                step="50"
                inputMode="numeric"
                className="input"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Rough guide: 2000 kcal to maintain, 1500 to cut, 2500+ to
                bulk. Adjust based on your body weight and activity.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="onb-pro">
                Daily protein target{' '}
                <span className="font-normal text-slate-400">(g)</span>
              </label>
              <input
                id="onb-pro"
                type="number"
                min="0"
                step="5"
                inputMode="numeric"
                className="input"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Rough guide: 1.6–2.2 g per kg of body weight. For a 70 kg
                adult that's 110–150 g.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                {formatNumber(Number(calories) || 0)} kcal ·{' '}
                {formatNumber(Number(protein) || 0)} g protein per day
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                Get started
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}