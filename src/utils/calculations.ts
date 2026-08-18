import type { DayLog, Food, MealType, Targets } from '../types/nutrition'
import { MEAL_TYPES } from '../types/nutrition'

export interface MealTotals {
  calories: number
  protein: number
}

export interface DayTotals {
  calories: number
  protein: number
  byMeal: Record<MealType, MealTotals>
}

const emptyMealTotals = (): MealTotals => ({ calories: 0, protein: 0 })

const emptyDayTotals = (): DayTotals => {
  const byMeal = MEAL_TYPES.reduce(
    (acc, meal) => {
      acc[meal] = emptyMealTotals()
      return acc
    },
    {} as Record<MealType, MealTotals>,
  )
  return { calories: 0, protein: 0, byMeal }
}

export function calculateMealTotals(foods: Food[], meal: MealType): MealTotals {
  return foods
    .filter((f) => f.meal === meal)
    .reduce<MealTotals>(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
      }),
      emptyMealTotals(),
    )
}

export function calculateDayTotals(day?: DayLog): DayTotals {
  const totals = emptyDayTotals()
  if (!day) return totals
  for (const food of day.foods) {
    totals.calories += food.calories
    totals.protein += food.protein
    totals.byMeal[food.meal].calories += food.calories
    totals.byMeal[food.meal].protein += food.protein
  }
  // Round to 1 decimal for display.
  totals.calories = Math.round(totals.calories * 10) / 10
  totals.protein = Math.round(totals.protein * 10) / 10
  for (const meal of MEAL_TYPES) {
    totals.byMeal[meal].calories =
      Math.round(totals.byMeal[meal].calories * 10) / 10
    totals.byMeal[meal].protein =
      Math.round(totals.byMeal[meal].protein * 10) / 10
  }
  return totals
}

export interface Remaining {
  /** Positive when consumed < target, negative when over. */
  value: number
  /** "X kcal remaining" or "+X kcal over target" */
  label: string
  /** True when consumed > target. */
  over: boolean
  /** Percentage consumed (0-100+). */
  percent: number
}

export function calculateRemaining(consumed: number, target: number): Remaining {
  const diff = Math.round((target - consumed) * 10) / 10
  const percent = target > 0 ? (consumed / target) * 100 : 0
  if (diff >= 0) {
    return {
      value: diff,
      label: `${formatNumber(diff)} remaining`,
      over: false,
      percent,
    }
  }
  return {
    value: diff,
    label: `+${formatNumber(Math.abs(diff))} over target`,
    over: true,
    percent,
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  // Show as integer when whole, otherwise one decimal.
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? rounded.toLocaleString() : rounded.toFixed(1)
}

export function formatPercent(percent: number): string {
  const rounded = Math.round(percent)
  return `${rounded}%`
}

export interface WeeklyStats {
  days: number
  averageCalories: number
  averageProtein: number
  caloriesGoalDays: number
  proteinGoalDays: number
  /** Oldest → newest */
  series: Array<{ date: string; calories: number; protein: number }>
}

export function calculateWeeklyStats(
  days: Record<string, DayLog>,
  targets: Targets,
  /** Most recent date (inclusive). */
  endDate: string,
): WeeklyStats {
  const end = parseISODate(endDate)
  const series: WeeklyStats['series'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const key = toISODate(d)
    const totals = calculateDayTotals(days[key])
    series.push({ date: key, calories: totals.calories, protein: totals.protein })
  }
  const filled = series.filter((d) => d.calories > 0 || d.protein > 0)
  const count = filled.length || 1
  const sumCal = filled.reduce((a, b) => a + b.calories, 0)
  const sumPro = filled.reduce((a, b) => a + b.protein, 0)
  return {
    days: filled.length,
    averageCalories: Math.round(sumCal / count),
    averageProtein: Math.round((sumPro / count) * 10) / 10,
    caloriesGoalDays: filled.filter((d) => d.calories <= targets.calories).length,
    proteinGoalDays: filled.filter((d) => d.protein >= targets.protein).length,
    series,
  }
}

// ---------- date helpers (kept here to avoid a tiny one-export file) ----
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function shiftDate(key: string, deltaDays: number): string {
  const d = parseISODate(key)
  d.setDate(d.getDate() + deltaDays)
  return toISODate(d)
}

export function formatLongDate(key: string): string {
  const d = parseISODate(key)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(key: string): string {
  const d = parseISODate(key)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
