import type { DayLog, Targets } from '../types/nutrition'
import {
  calculateWeeklyStats,
  formatNumber,
  formatShortDate,
} from '../utils/calculations'

interface WeeklySummaryProps {
  days: Record<string, DayLog>
  targets: Targets
  /** The "today" date for the summary window. */
  endDate: string
}

export function WeeklySummary({ days, targets, endDate }: WeeklySummaryProps) {
  const stats = calculateWeeklyStats(days, targets, endDate)
  const maxCal = Math.max(targets.calories, ...stats.series.map((d) => d.calories), 1)

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Last 7 days</h2>
        <span className="text-xs text-slate-500">
          {stats.days} day{stats.days === 1 ? '' : 's'} with data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Avg calories"
          value={`${formatNumber(stats.averageCalories)} kcal`}
        />
        <Stat
          label="Avg protein"
          value={`${formatNumber(stats.averageProtein)} g`}
        />
        <Stat
          label="Calorie goal hit"
          value={`${stats.caloriesGoalDays} / ${stats.days || 7}`}
          success={stats.caloriesGoalDays > 0}
        />
        <Stat
          label="Protein goal hit"
          value={`${stats.proteinGoalDays} / ${stats.days || 7}`}
          success={stats.proteinGoalDays > 0}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Calories by day
        </p>
        <div className="flex h-32 items-end gap-1.5">
          {stats.series.map((d) => {
            const fill = (d.calories / maxCal) * 100
            const over = d.calories > targets.calories
            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                title={`${formatShortDate(d.date)} · ${formatNumber(d.calories)} kcal · ${formatNumber(d.protein)} g protein`}
              >
                <div className="relative w-full overflow-hidden rounded-md bg-slate-100" style={{ height: '100%' }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${over ? 'bg-red-500' : 'bg-calorie-500'} transition-all`}
                    style={{ height: `${Math.max(2, fill)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500">
                  {formatShortDate(d.date)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-calorie-500" />
            Under target
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Over target
          </span>
          <span className="ml-auto">Target: {formatNumber(targets.calories)} kcal</span>
        </div>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  success,
}: {
  label: string
  value: string
  success?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-semibold ${
          success ? 'text-protein-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}