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
      <h2 className="mb-4 text-base font-semibold text-white">
        Today's progress
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Calories */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <span aria-hidden>🔥</span> Calories
            </span>
            <span className="text-sm font-medium text-slate-400">
              {formatPercent(calRemaining.percent)}
            </span>
          </div>
          <p className="mb-2 text-2xl font-bold tracking-tight text-white">
            {formatNumber(calories)}{' '}
            <span className="text-base font-medium text-slate-400">
              / {formatNumber(targets.calories)} kcal
            </span>
          </p>
          <ProgressBar percent={calRemaining.percent} color="calorie" />
          <p
            className={`mt-2 text-sm font-medium ${
              calRemaining.over ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {calRemaining.label}
          </p>
        </div>

        {/* Protein */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <span aria-hidden>💪</span> Protein
            </span>
            <span className="text-sm font-medium text-slate-400">
              {formatPercent(proRemaining.percent)}
            </span>
          </div>
          <p className="mb-2 text-2xl font-bold tracking-tight text-white">
            {formatNumber(protein)}{' '}
            <span className="text-base font-medium text-slate-400">
              / {formatNumber(targets.protein)} g
            </span>
          </p>
          <ProgressBar percent={proRemaining.percent} color="protein" />
          <p
            className={`mt-2 text-sm font-medium ${
              proRemaining.over ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {proRemaining.label}
          </p>
        </div>
      </div>
    </section>
  )
}