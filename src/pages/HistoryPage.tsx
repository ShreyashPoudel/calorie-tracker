import { useMemo } from 'react'
import { useNutrition } from '../context/useNutrition'
import type { DayLog } from '../types/nutrition'
import {
  calculateDayTotals,
  formatLongDate,
  formatShortDate,
} from '../utils/calculations'
import { MEAL_LABELS } from '../types/nutrition'
import type { Food } from '../types/nutrition'

interface HistoryPageProps {
  /** Optional date to deep-link into (from the table row click). */
  selectedDate?: string | null
  onSelectDate?: (date: string | null) => void
}

export function HistoryPage({ selectedDate, onSelectDate }: HistoryPageProps) {
  const { data, targets } = useNutrition()

  const entries = useMemo(() => {
    return (Object.values(data.days) as DayLog[])
      .map((day) => {
        const totals = calculateDayTotals(day)
        return {
          date: day.date,
          calories: totals.calories,
          protein: totals.protein,
          foods: day.foods,
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [data.days])

  const detail = selectedDate
    ? entries.find((e) => e.date === selectedDate)
    : undefined

  function quantityLabel(food: Food): string {
    const qty = food.quantity % 1 === 0 ? food.quantity.toString() : food.quantity.toFixed(1)
    if (food.unit === 'piece') {
      const unit = food.pieceUnit ?? 'piece'
      return `${qty} ${food.quantity === 1 ? unit : `${unit}s`}`
    }
    return `${qty}g`
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review previous days. Click a row to see the full breakdown.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No history yet. Log a food on the dashboard to get started.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Calories</th>
                  <th className="px-4 py-2.5 font-medium">Protein</th>
                  <th className="px-4 py-2.5 font-medium">Calorie goal</th>
                  <th className="px-4 py-2.5 font-medium">Protein goal</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => {
                  const calHit = row.calories <= targets.calories
                  const proHit = row.protein >= targets.protein
                  return (
                    <tr
                      key={row.date}
                      className="cursor-pointer border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50"
                      onClick={() => onSelectDate?.(row.date)}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {formatShortDate(row.date)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {row.calories.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {row.protein.toFixed(1)}g
                      </td>
                      <td className="px-4 py-2.5">
                        <GoalIcon hit={calHit} />
                      </td>
                      <td className="px-4 py-2.5">
                        <GoalIcon hit={proHit} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <section className="card p-5">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                {formatLongDate(detail.date)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {detail.foods.length} food
                {detail.foods.length === 1 ? '' : 's'} logged
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => onSelectDate?.(null)}
            >
              ✕ Close
            </button>
          </header>

          {detail.foods.length === 0 ? (
            <p className="text-sm text-slate-500">No foods logged.</p>
          ) : (
            <div className="space-y-4">
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map(
                (meal) => {
                  const items: Food[] = detail.foods.filter(
                    (f) => f.meal === meal,
                  )
                  if (items.length === 0) return null
                  return (
                    <div key={meal}>
                      <h3 className="mb-1.5 text-sm font-semibold text-slate-800">
                        {MEAL_LABELS[meal]}
                      </h3>
                      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                        {items.map((food) => (
                          <li
                            key={food.id}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-slate-900">
                              {food.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {quantityLabel(food)} · {food.calories} kcal · {food.protein}g protein
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                },
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function GoalIcon({ hit }: { hit: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
        hit ? 'bg-protein-500/15 text-protein-700' : 'bg-amber-500/15 text-amber-700'
      }`}
      title={hit ? 'Goal met' : 'Goal not met'}
    >
      {hit ? '✅' : '⚠️'}
    </span>
  )
}