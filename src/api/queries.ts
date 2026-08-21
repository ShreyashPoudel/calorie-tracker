// Typed queries for the calorie tracker schema, built on Supabase's
// PostgREST query builder. Each function maps to one or two requests.
//
// All reads/writes are scoped to the signed-in user via RLS policies on
// the foods / targets / meal_templates tables. We still pass `user_id`
// explicitly on inserts so the row is owned correctly from the start.

import { requireUser, supabase } from './db'
import type { Food, MealTemplate, Targets } from '../types/nutrition'

interface FoodRow {
  id: string
  date: string
  meal: Food['meal']
  name: string
  quantity: number
  grams: number
  unit: Food['unit']
  piece_unit: string | null
  calories: number
  protein: number
  created_at?: string
}

function rowToFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    meal: row.meal,
    quantity: Number(row.quantity),
    grams: Number(row.grams),
    unit: row.unit,
    pieceUnit: row.piece_unit ?? undefined,
    calories: Number(row.calories),
    protein: Number(row.protein),
  }
}

/** Load every logged food for the signed-in user, grouped by ISO date. */
export async function loadAllFoods(): Promise<Record<string, Food[]>> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  const grouped: Record<string, Food[]> = {}
  for (const row of (data ?? []) as FoodRow[]) {
    ;(grouped[row.date] ??= []).push(rowToFood(row))
  }
  return grouped
}

/**
 * Load the current user's targets row.
 * Returns `null` (not defaults) when no row exists, so the context can
 * tell fresh signups apart from users who just haven't opened settings.
 */
export async function loadTargets(): Promise<Targets | null> {
  const user = await requireUser()
  const { data, error } = await supabase
    .from('targets')
    .select('calories, protein')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    calories: Number(data.calories),
    protein: Number(data.protein),
  }
}

export async function insertFood(date: string, food: Food): Promise<void> {
  const user = await requireUser()
  const { error } = await supabase.from('foods').insert({
    id: food.id,
    user_id: user.id,
    date,
    meal: food.meal,
    name: food.name,
    quantity: food.quantity,
    grams: food.grams,
    unit: food.unit,
    piece_unit: food.pieceUnit ?? null,
    calories: food.calories,
    protein: food.protein,
  })
  if (error) throw error
}

export async function updateFoodRow(date: string, food: Food): Promise<void> {
  const { error } = await supabase
    .from('foods')
    .update({
      meal: food.meal,
      name: food.name,
      quantity: food.quantity,
      grams: food.grams,
      unit: food.unit,
      piece_unit: food.pieceUnit ?? null,
      calories: food.calories,
      protein: food.protein,
    })
    .eq('id', food.id)
    .eq('date', date)
  if (error) throw error
}

export async function deleteFoodRow(foodId: string): Promise<void> {
  const { error } = await supabase.from('foods').delete().eq('id', foodId)
  if (error) throw error
}

/**
 * Upsert the current user's targets row. Keys the row on `user_id` so each
 * user has exactly one targets row — first call creates it, subsequent
 * calls update it.
 */
export async function upsertTargets(targets: Targets): Promise<void> {
  const user = await requireUser()
  const { error } = await supabase
    .from('targets')
    .upsert(
      { user_id: user.id, calories: targets.calories, protein: targets.protein },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}

// ─── Meal templates ─────────────────────────────────────────────────────

interface TemplateRow {
  id: string
  name: string
  meal: MealTemplate['meal']
  items: unknown
  created_at: string
}

function rowToTemplate(row: TemplateRow): MealTemplate {
  return {
    id: row.id,
    name: row.name,
    meal: row.meal,
    items: Array.isArray(row.items) ? (row.items as MealTemplate['items']) : [],
    createdAt: row.created_at,
  }
}

export async function loadTemplates(): Promise<MealTemplate[]> {
  const { data, error } = await supabase
    .from('meal_templates')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as TemplateRow[]).map(rowToTemplate)
}

export async function createTemplate(
  template: Omit<MealTemplate, 'id' | 'createdAt'>,
): Promise<MealTemplate> {
  const user = await requireUser()
  const { data, error } = await supabase
    .from('meal_templates')
    .insert({
      user_id: user.id,
      name: template.name,
      meal: template.meal,
      items: template.items,
    })
    .select('*')
    .single()
  if (error) throw error
  return rowToTemplate(data as TemplateRow)
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('meal_templates').delete().eq('id', id)
  if (error) throw error
}