import { useEffect, useId, useMemo, useState } from 'react'
import type { Food, FoodUnit, MealType } from '../types/nutrition'
import { MEAL_LABELS } from '../types/nutrition'
import { FOODS, findFood } from '../data/foods'

interface FoodFormProps {
  meal: MealType
  /** When provided, the form pre-fills with this food for editing. */
  initial?: Food
  onSubmit: (food: Omit<Food, 'id'>) => void
  onCancel: () => void
  // Reserved for future per-day context (e.g. day-specific presets).
  date?: string
}

type FormState = {
  name: string
  /** User-entered quantity — interpreted as grams or pieces depending on `unit`. */
  quantity: string
  calories: string
  protein: string
  /** Empty string means "custom entry, not from database". */
  selected: string
  unit: FoodUnit
}

function toFormState(food?: Food): FormState {
  if (!food) {
    return {
      name: '',
      quantity: '',
      calories: '',
      protein: '',
      selected: '',
      unit: 'g',
    }
  }
  const matched = findFood(food.name)
  return {
    name: food.name,
    quantity: String(food.quantity),
    calories: String(food.calories),
    protein: String(food.protein),
    selected: matched ? matched.name : '',
    unit: food.unit,
  }
}

/** Compute grams + totals from a quantity + unit, given a food template (or none). */
function computeFromTemplate(
  template: ReturnType<typeof findFood>,
  quantity: number,
  unit: FoodUnit,
): { grams: number; calories: number; protein: number } | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  if (unit === 'g') {
    if (!template) return null
    return {
      grams: quantity,
      calories: (template.calories * quantity) / 100,
      protein: (template.protein * quantity) / 100,
    }
  }
  // unit === 'piece'
  if (!template || !template.pieceWeight) return null
  const grams = template.pieceWeight * quantity
  return {
    grams,
    calories: (template.calories * grams) / 100,
    protein: (template.protein * grams) / 100,
  }
}

/**
 * Modal form for adding or editing a food item.
 * Selecting a food from the database auto-fills macros so the user only has to
 * enter the quantity — in grams OR pieces (e.g. "2 eggs") for foods that have
 * per-piece data.
 */
export function FoodForm({
  meal,
  initial,
  onSubmit,
  onCancel,
  date: _date,
}: FoodFormProps) {
  const headingId = useId()
  const [state, setState] = useState<FormState>(() => toFormState(initial))
  const [error, setError] = useState<string | null>(null)

  const template = state.selected ? findFood(state.selected) : undefined
  const pieceAvailable = Boolean(template?.pieceWeight)

  const isEditing = Boolean(initial)

  const title = useMemo(
    () => `${isEditing ? 'Edit' : 'Add to'} ${MEAL_LABELS[meal]}`,
    [isEditing, meal],
  )

  // When the user picks a DB food that supports pieces, default to piece mode.
  useEffect(() => {
    if (!template?.pieceWeight) return
    setState((s) => (s.unit === 'piece' ? s : { ...s, unit: 'piece' }))
  }, [template])

  // Auto-fill calories/protein when the inputs make it possible.
  useEffect(() => {
    if (!template) return
    const qty = Number(state.quantity)
    const result = computeFromTemplate(template, qty, state.unit)
    if (!result) return
    setState((s) => ({
      ...s,
      // Always overwrite the name when a DB food is picked — the dropdown
      // selection is the user's explicit choice of what they're logging.
      name: template.name,
      calories: String(Math.round(result.calories * 10) / 10),
      protein: String(Math.round(result.protein * 10) / 10),
    }))
  }, [template, state.quantity, state.unit])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function handleUnitChange(next: FoodUnit) {
    setState((s) => ({ ...s, unit: next, quantity: '', calories: '', protein: '' }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = state.name.trim()
    const quantity = Number(state.quantity)
    const calories = Number(state.calories)
    const protein = Number(state.protein)
    if (!name) return setError('Please enter a food name.')
    if (!Number.isFinite(quantity) || quantity <= 0)
      return setError('Quantity must be greater than 0.')
    if (!Number.isFinite(calories) || calories < 0)
      return setError('Calories must be a non-negative number.')
    if (!Number.isFinite(protein) || protein < 0)
      return setError('Protein must be a non-negative number.')

    // Convert pieces → grams if needed, so all downstream math is in grams.
    let grams = quantity
    if (state.unit === 'piece') {
      const weightPerPiece = template?.pieceWeight
      grams = weightPerPiece ? weightPerPiece * quantity : quantity
    }

    setError(null)
    onSubmit({
      name,
      meal,
      quantity,
      grams,
      unit: state.unit,
      pieceUnit: template?.pieceUnit,
      calories,
      protein,
    })
  }

  const quantityLabel =
    state.unit === 'piece'
      ? template?.pieceUnit
        ? `Number of ${template.pieceUnit}s`
        : 'Number of pieces'
      : 'Quantity (g)'
  const quantityPlaceholder = state.unit === 'piece' ? '1' : '100'

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
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-2 py-1 text-base"
            aria-label="Close"
          >
            �
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="food-db">
              Pick from database (optional)
            </label>
            <select
              id="food-db"
              className="input"
              value={state.selected}
              onChange={(e) => update('selected', e.target.value)}
            >
              <option value="">— Custom food —</option>
              {FOODS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.calories} kcal · {f.protein} g per 100g
                  {f.pieceWeight ? ` · 1 ${f.pieceUnit} ≈ ${f.pieceWeight} g` : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="food-name">
              Food name
            </label>
            <input
              id="food-name"
              type="text"
              className="input"
              value={state.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Chicken breast"
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0" htmlFor="food-qty">
                {quantityLabel}
              </label>
              <div
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium"
                role="radiogroup"
                aria-label="Quantity unit"
              >
                <UnitButton
                  active={state.unit === 'g'}
                  disabled={!template}
                  onClick={() => handleUnitChange('g')}
                >
                  grams
                </UnitButton>
                <UnitButton
                  active={state.unit === 'piece'}
                  disabled={!pieceAvailable}
                  onClick={() => handleUnitChange('piece')}
                >
                  pieces
                </UnitButton>
              </div>
            </div>
            <input
              id="food-qty"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="input"
              value={state.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder={quantityPlaceholder}
            />
            {state.unit === 'piece' && template?.pieceWeight && (
              <p className="mt-1 text-xs text-slate-500">
                1 {template.pieceUnit} ≈ {template.pieceWeight} g
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="food-cal">
                Calories
              </label>
              <input
                id="food-cal"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="input"
                value={state.calories}
                onChange={(e) => update('calories', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label" htmlFor="food-pro">
                Protein (g)
              </label>
              <input
                id="food-pro"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="input"
                value={state.protein}
                onChange={(e) => update('protein', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {state.selected && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              Auto-filled from database. Adjust calories/protein if needed.
            </p>
          )}

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
          <button type="submit" className="btn-primary">
            {isEditing ? 'Save changes' : 'Add food'}
          </button>
        </div>
      </form>
    </div>
  )
}

function UnitButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 transition-colors ${
        active
          ? 'bg-white text-brand-700 shadow-sm'
          : 'text-slate-600 hover:text-slate-800'
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-600`}
    >
      {children}
    </button>
  )
}
