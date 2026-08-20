import { useState } from 'react'
import type { Food, MealType, TemplateItem } from '../types/nutrition'
import { MEAL_EMOJI, MEAL_LABELS } from '../types/nutrition'
import { calculateMealTotals, formatNumber } from '../utils/calculations'
import { FoodForm } from './FoodForm'
import { FoodItem } from './FoodItem'
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog'
import { TemplatePicker } from './TemplatePicker'

interface MealCardProps {
  meal: MealType
  date: string
  foods: Food[]
  templates: import('../types/nutrition').MealTemplate[]
  onAdd: (food: Omit<Food, 'id'>) => void
  onUpdate: (food: Food) => void
  onDelete: (foodId: string) => void
  onApplyTemplate: (templateId: string) => void
  onSaveTemplate: (name: string, meal: MealType, items: TemplateItem[]) => void
}

export function MealCard({
  meal,
  date,
  foods,
  templates,
  onAdd,
  onUpdate,
  onDelete,
  onApplyTemplate,
  onSaveTemplate,
}: MealCardProps) {
  const [mode, setMode] = useState<'idle' | 'add' | 'template' | 'save' | 'edit'>('idle')
  const [editing, setEditing] = useState<Food | undefined>(undefined)

  const totals = calculateMealTotals(foods, meal)
  const mealFoods = foods.filter((f) => f.meal === meal)
  const hasItems = mealFoods.length > 0
  const templateCount = templates.filter((t) => t.meal === meal).length

  function openAdd() {
    setEditing(undefined)
    setMode('add')
  }

  function openEdit(food: Food) {
    setEditing(food)
    setMode('edit')
  }

  function handleSubmit(draft: Omit<Food, 'id'>) {
    if (editing) {
      onUpdate({ ...draft, id: editing.id })
    } else {
      onAdd(draft)
    }
    setMode('idle')
    setEditing(undefined)
  }

  function closeDialog() {
    setMode('idle')
    setEditing(undefined)
  }

  return (
    <section className="card flex flex-col p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {MEAL_EMOJI[meal]}
          </span>
          <h3 className="text-base font-semibold text-slate-800">
            {MEAL_LABELS[meal]}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => setMode('template')}
            disabled={templates.length === 0}
            title={
              templates.length === 0
                ? 'Save a template from any meal first'
                : `Log one of ${templateCount} template${templateCount === 1 ? '' : 's'} for ${MEAL_LABELS[meal].toLowerCase()}`
            }
          >
            📋 Template
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={openAdd}>
            + Add food
          </button>
        </div>
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
        <button
          type="button"
          onClick={() => setMode('save')}
          disabled={!hasItems}
          className="text-xs font-medium text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-400"
          title={hasItems ? 'Save current items as a reusable template' : 'Log some foods first'}
        >
          💾 Save as template
        </button>
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

      {(mode === 'add' || mode === 'edit') && (
        <FoodForm
          meal={meal}
          date={date}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeDialog}
        />
      )}
      {mode === 'template' && (
        <TemplatePicker
          meal={meal}
          templates={templates}
          onPick={(id) => {
            onApplyTemplate(id)
            closeDialog()
          }}
          onCancel={closeDialog}
        />
      )}
      {mode === 'save' && (
        <SaveAsTemplateDialog
          meal={meal}
          foods={mealFoods}
          onSave={(name, targetMeal, items) => {
            onSaveTemplate(name, targetMeal, items)
            closeDialog()
          }}
          onCancel={closeDialog}
        />
      )}
    </section>
  )
}