import type { Food } from '../types/nutrition'
import { formatNumber } from '../utils/calculations'

interface FoodItemProps {
  food: Food
  onEdit: () => void
  onDelete: () => void
}

/** Human label for the quantity column, e.g. "2 eggs", "150 g". */
function quantityLabel(food: Food): string {
  const qty = formatNumber(food.quantity)
  if (food.unit === 'piece') {
    const unit = food.pieceUnit ?? 'piece'
    return `${qty} ${qty === '1' ? unit : `${unit}s`}`
  }
  return `${qty} g`
}

export function FoodItem({ food, onEdit, onDelete }: FoodItemProps) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {food.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{quantityLabel(food)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-calorie-500/10 px-2 py-0.5 font-medium text-calorie-700">
            <span className="h-1.5 w-1.5 rounded-full bg-calorie-500" aria-hidden />
            {formatNumber(food.calories)} kcal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-protein-500/10 px-2 py-0.5 font-medium text-protein-700">
            <span className="h-1.5 w-1.5 rounded-full bg-protein-500" aria-hidden />
            {formatNumber(food.protein)} g protein
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="btn-ghost px-2 py-1 text-xs"
          aria-label={`Edit ${food.name}`}
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn-ghost px-2 py-1 text-xs"
          aria-label={`Delete ${food.name}`}
        >
          🗑️
        </button>
      </div>
    </li>
  )
}