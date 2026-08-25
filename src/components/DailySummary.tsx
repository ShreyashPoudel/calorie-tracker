import type { Targets } from '../types/nutrition'
import {
  calculateRemaining,
  formatNumber,
  formatPercent,
} from '../utils/calculations'
import { ProgressBar } from './ProgressBar'

interface DailySummaryProps {
  calories: number
  protein: number
  targets: Targets
}

export function DailySummary({
  calories,
  protein,
  targets,
}: DailySummaryProps) {
  const calRemaining = calculateRemaining(calories, targets.calories)
  const proRemaining = calculateRemaining(protein, targets.protein)

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-base font-semibold">
        Today's progress
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Calories */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <span aria-hidden>🔥</span> Calories
            </span>
            <span className="text-sm font-medium text-slate-500">
              {formatPercent(calRemaining.percent)}
            </span>
          </div>
          <p className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            {formatNumber(calories)}{' '}
            <span className="text-base font-medium text-slate-500">
              / {formatNumber(targets.calories)} kcal
            </span>
          </p>
          <ProgressBar percent={calRemaining.percent} color="calorie" />
          <p
            className={`mt-2 text-sm font-medium ${
              calRemaining.over ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            {calRemaining.label}
          </p>
        </div>

        {/* Protein */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <span aria-hidden>💪</span> Protein
            </span>
            <span className="text-sm font-medium text-slate-500">
              {formatPercent(proRemaining.percent)}
            </span>
          </div>
          <p className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            {formatNumber(protein)}{' '}
            <span className="text-base font-medium text-slate-500">
              / {formatNumber(targets.protein)} g
            </span>
          </p>
          <ProgressBar percent={proRemaining.percent} color="protein" />
          <p
            className={`mt-2 text-sm font-medium ${
              proRemaining.over ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            {proRemaining.label}
          </p>
        </div>
      </div>
    </section>
  )
}