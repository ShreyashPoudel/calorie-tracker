import { useId, useState } from 'react'
import type { Food, MealType, TemplateItem } from '../types/nutrition'
import { MEAL_LABELS } from '../types/nutrition'
import { calculateMealTotals, formatNumber } from '../utils/calculations'

interface SaveAsTemplateDialogProps {
  meal: MealType
  foods: Food[]
  onSave: (name: string, meal: MealType, items: TemplateItem[]) => void
  onCancel: () => void
}

/**
 * Dialog that captures a name + meal-type for the current meal's foods
 * and saves them as a reusable template.
 */
export function SaveAsTemplateDialog({
  meal,
  foods,
  onSave,
  onCancel,
}: SaveAsTemplateDialogProps) {
  const headingId = useId()
  const [name, setName] = useState('')
  const [selectedMeal, setSelectedMeal] = useState<MealType>(meal)
  const [error, setError] = useState<string | null>(null)

  const totals = calculateMealTotals(foods, meal)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please give the template a name.')
      return
    }
    const items: TemplateItem[] = foods
      .filter((f) => f.meal === meal)
      .map(({ name, meal: m, quantity, grams, unit, pieceUnit, calories, protein }) => ({
        name,
        meal: m,
        quantity,
        grams,
        unit,
        pieceUnit,
        calories,
        protein,
      }))
    onSave(trimmed, selectedMeal, items)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-semibold">
            Save as template
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-2 py-1 text-base"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="tpl-name">
              Template name
            </label>
            <input
              id="tpl-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Max breakfast"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="tpl-meal">
              Which meal does this belong to?
            </label>
            <select
              id="tpl-meal"
              className="input"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value as MealType)}
            >
              {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Will save <strong className="font-semibold">{foods.length}</strong>{' '}
            item{foods.length === 1 ? '' : 's'} totalling{' '}
            <strong className="font-semibold text-slate-800">
              {formatNumber(totals.calories)} kcal
            </strong>{' '}
            ·{' '}
            <strong className="font-semibold text-slate-800">
              {formatNumber(totals.protein)} g protein
            </strong>
            .
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save template
          </button>
        </div>
      </div>
    </div>
  )
}