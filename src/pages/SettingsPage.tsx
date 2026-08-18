import { useEffect, useState } from 'react'
import { useNutrition } from '../context/useNutrition'

export function SettingsPage() {
  const { targets, setTargets } = useNutrition()
  const [calories, setCalories] = useState(String(targets.calories))
  const [protein, setProtein] = useState(String(targets.protein))
  const [saved, setSaved] = useState(false)

  // Keep local form in sync if context changes externally.
  useEffect(() => {
    setCalories(String(targets.calories))
    setProtein(String(targets.protein))
  }, [targets.calories, targets.protein])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cal = Number(calories)
    const pro = Number(protein)
    if (!Number.isFinite(cal) || cal <= 0) return
    if (!Number.isFinite(pro) || pro <= 0) return
    setTargets({ calories: cal, protein: pro })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  function handleReset() {
    setCalories('2000')
    setProtein('150')
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Adjust your daily nutrition targets.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="target-cal">
            Daily calorie target (kcal)
          </label>
          <input
            id="target-cal"
            type="number"
            min="0"
            step="50"
            className="input"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="target-pro">
            Daily protein target (g)
          </label>
          <input
            id="target-pro"
            type="number"
            min="0"
            step="5"
            className="input"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={handleReset}
          >
            Reset to defaults
          </button>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-medium text-emerald-600">
                Saved ✓
              </span>
            )}
            <button type="submit" className="btn-primary">
              Save targets
            </button>
          </div>
        </div>
      </form>

      <section className="card p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          About your data
        </h2>
        <p className="text-sm text-slate-500">
          All entries are stored locally in your browser (localStorage). Nothing
          is sent to a server, so clearing your browser data will erase your log.
        </p>
      </section>
    </div>
  )
}
