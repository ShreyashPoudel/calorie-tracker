// Typed queries for the calorie tracker schema, built on Supabase's
// PostgREST query builder. Each function maps to one or two requests.

import { supabase } from './db'
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

/** Load every logged food, grouped by ISO date. */
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

/** Load the single targets row. Falls back to defaults if absent. */
export async function loadTargets(): Promise<Targets> {
  const { data, error } = await supabase
    .from('targets')
    .select('calories, protein')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return {
    calories: Number(data?.calories ?? 2000),
    protein: Number(data?.protein ?? 150),
  }
}

export async function insertFood(date: string, food: Food): Promise<void> {
  const { error } = await supabase.from('foods').insert({
    id: food.id,
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

export async function upsertTargets(targets: Targets): Promise<void> {
  const { error } = await supabase
    .from('targets')
    .upsert({ id: 1, calories: targets.calories, protein: targets.protein })
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
  const { data, error } = await supabase
    .from('meal_templates')
    .insert({
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