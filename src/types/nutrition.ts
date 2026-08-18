// Shared domain types for the calorie/protein tracker.
// Kept intentionally small so they can map cleanly to a backend later.

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner'

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner']

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
}

export const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🍳',
  lunch: '🍛',
  snacks: '🍌',
  dinner: '🍗',
}

/** How a food's quantity was entered. */
export type FoodUnit = 'g' | 'piece'

export interface Food {
  id: string
  name: string
  meal: MealType
  /** grams (when `unit === 'g'`) or number of pieces (when `unit === 'piece'`). */
  quantity: number
  /** Always grams internally; pieces are converted on save so totals stay simple. */
  grams: number
  /** Display unit — `'g'` (default) or `'piece'`. */
  unit: FoodUnit
  /** Optional human-readable label for a single piece (e.g. "egg"). */
  pieceUnit?: string
  /** total kcal for the entry (already scaled by quantity) */
  calories: number
  /** total grams of protein for the entry (already scaled by quantity) */
  protein: number
}

export interface DayLog {
  /** ISO date key, e.g. "2026-08-17" */
  date: string
  foods: Food[]
}

export interface Targets {
  calories: number
  protein: number
}

export interface AppData {
  /** Schema version for forward-compat migrations. */
  version: 1
  targets: Targets
  /** Date-keyed map of day logs. Sparse — only days with entries are stored. */
  days: Record<string, DayLog>
}
