import { useState } from 'react'
import type { Food, MealType } from '../types/nutrition'
import { MEAL_EMOJI, MEAL_LABELS } from '../types/nutrition'
import { calculateMealTotals, formatNumber } from '../utils/calculations'
import { FoodForm } from './FoodForm'
import { FoodItem } from './FoodItem'

interface MealCardProps {
  meal: MealType
  date: string
  foods: Food[]
  onAdd: (food: Omit<Food, 'id'>) => void
  onUpdate: (food: Food) => void
  onDelete: (foodId: string) => void
}

export function MealCard({
  meal,
  date,
  foods,
  onAdd,
  onUpdate,
  onDelete,
}: MealCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Food | undefined>(undefined)

  const totals = calculateMealTotals(foods, meal)

  function openAdd() {
    setEditing(undefined)
    setShowForm(true)
  }

  function openEdit(food: Food) {
    setEditing(food)
    setShowForm(true)
  }

  function handleSubmit(draft: Omit<Food, 'id'>) {
    if (editing) {
      onUpdate({ ...draft, id: editing.id })
    } else {
      onAdd(draft)
    }
    setShowForm(false)
    setEditing(undefined)
  }

  return (
    <section className="card flex flex-col p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {MEAL_EMOJI[meal]}
          </span>
          <h3 className="text-base font-semibold text-slate-800">
            {MEAL_LABELS[meal]}
          </h3>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={openAdd}>
          + Add food
        </button>
      </header>

      {foods.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
          No foods logged for {MEAL_LABELS[meal].toLowerCase()} yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {foods.map((food) => (
            <FoodItem
              key={food.id}
              food={food}
              onEdit={() => openEdit(food)}
              onDelete={() => onDelete(food.id)}
            />
          ))}
        </ul>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="font-medium text-slate-600">
          {MEAL_LABELS[meal]} total
        </span>
        <span className="text-slate-700">
          <strong className="font-semibold text-orange-600">
            {formatNumber(totals.calories)} kcal
          </strong>
          <span className="mx-1.5 text-slate-300">|</span>
          <strong className="font-semibold text-emerald-600">
            {formatNumber(totals.protein)} g
          </strong>
          <span className="text-slate-500"> protein</span>
        </span>
      </footer>

      {showForm && (
        <FoodForm
          meal={meal}
          date={date}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditing(undefined)
          }}
        />
      )}
    </section>
  )
}
