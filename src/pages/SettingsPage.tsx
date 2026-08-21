import { useEffect, useState } from 'react'
import type { MealTemplate } from '../types/nutrition'
import { MEAL_LABELS, MEAL_EMOJI } from '../types/nutrition'
import { calculateMealTotals, formatNumber } from '../utils/calculations'
import { useNutrition } from '../context/useNutrition'

export function SettingsPage() {
  const { targets, setTargets, templates, removeTemplate } = useNutrition()
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Adjust your daily nutrition targets and manage templates.
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
              <span className="text-xs font-medium text-emerald-400">
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
        <h2 className="mb-1 text-sm font-semibold text-white">
          Meal templates
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Saved from the dashboard via "Save as template". Tap one on any meal
          card to log it instantly.
        </p>

        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
            No templates yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {templates.map((tpl) => (
              <TemplateRow
                key={tpl.id}
                template={tpl}
                onDelete={() => removeTemplate(tpl.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-sm font-semibold text-white">
          About your data
        </h2>
        <p className="text-sm text-slate-400">
          All entries are stored in Supabase (cloud Postgres), so they sync
          across every device you log in from. Templates follow the same
          pattern.
        </p>
      </section>
    </div>
  )
}

function TemplateRow({
  template,
  onDelete,
}: {
  template: MealTemplate
  onDelete: () => void
}) {
  const totals = calculateMealTotals(template.items as never, template.meal)
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{MEAL_EMOJI[template.meal]}</span>
          <span className="font-medium text-white">{template.name}</span>
          <span className="text-xs text-slate-400">
            · {MEAL_LABELS[template.meal]}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-slate-400">
          {template.items.length} item{template.items.length === 1 ? '' : 's'}
          {' · '}
          {formatNumber(totals.calories)} kcal ·{' '}
          {formatNumber(totals.protein)} g protein
        </div>
      </div>
      <button
        type="button"
        className="btn-ghost text-xs text-red-600 hover:bg-red-50"
        onClick={() => {
          if (confirm(`Delete template "${template.name}"?`)) onDelete()
        }}
      >
        Delete
      </button>
    </li>
  )
}