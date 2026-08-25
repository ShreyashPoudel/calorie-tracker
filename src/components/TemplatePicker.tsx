import { useId, useState } from 'react'
import type { MealTemplate, MealType } from '../types/nutrition'
import { MEAL_LABELS } from '../types/nutrition'
import { calculateMealTotals, formatNumber } from '../utils/calculations'

interface TemplatePickerProps {
  /** Templates to choose from. May include templates for other meals — they'll be filtered. */
  templates: MealTemplate[]
  meal: MealType
  onPick: (templateId: string) => void
  onCancel: () => void
}

/**
 * Modal that lists saved meal templates for the current meal and lets the
 * user pick one to log. Shows the per-item breakdown + the rolled-up totals
 * so they know what they're about to log before they confirm.
 */
export function TemplatePicker({
  templates,
  meal,
  onPick,
  onCancel,
}: TemplatePickerProps) {
  const headingId = useId()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Show templates that match this meal first, but also expose other meals
  // so the user can still log "lunch" items into dinner if they want.
  const forMeal = templates.filter((t) => t.meal === meal)
  const others = templates.filter((t) => t.meal !== meal)

  const selected = selectedId
    ? templates.find((t) => t.id === selectedId)
    : undefined
  const totals = selected
    ? calculateMealTotals(selected.items as never, meal)
    : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-semibold">
            Log from template
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

        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No templates saved yet. Log a meal first, then tap
            <br />
            <strong className="font-semibold text-slate-800">
              Save as template
            </strong>{' '}
            to reuse it later.
          </p>
        ) : (
          <>
            {forMeal.length > 0 && (
              <TemplateList
                heading={`${MEAL_LABELS[meal]} templates`}
                templates={forMeal}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            {others.length > 0 && (
              <TemplateList
                heading="Other meals"
                templates={others}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}

            {selected && totals && (
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <strong className="font-semibold text-slate-900">
                  Will log {selected.items.length} item
                  {selected.items.length === 1 ? '' : 's'}:
                </strong>{' '}
                {formatNumber(totals.calories)} kcal ·{' '}
                {formatNumber(totals.protein)} g protein
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedId}
            onClick={() => selectedId && onPick(selectedId)}
          >
            Log template
          </button>
        </div>
      </div>
    </div>
  )
}

function TemplateList({
  heading,
  templates,
  selectedId,
  onSelect,
}: {
  heading: string
  templates: MealTemplate[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="mb-3">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {heading}
      </h3>
      <ul className="space-y-1.5">
        {templates.map((tpl) => {
          const totals = calculateMealTotals(tpl.items as never, tpl.meal)
          const isSelected = selectedId === tpl.id
          return (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => onSelect(tpl.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-900">{tpl.name}</span>
                  <span className="text-xs text-slate-500">
                    {tpl.items.length} item{tpl.items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {formatNumber(totals.calories)} kcal ·{' '}
                  {formatNumber(totals.protein)} g protein
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}