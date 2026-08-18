import { useContext } from 'react'
import {
  NutritionContext,
  type NutritionContextValue,
} from './NutritionContext'
import type { Food, MealType } from '../types/nutrition'

export function useNutrition(): NutritionContextValue {
  const ctx = useContext(NutritionContext)
  if (!ctx) {
    throw new Error('useNutrition must be used within a NutritionProvider')
  }
  return ctx
}

/** Convenience selector for a single meal — keeps call sites short. */
export function useMealFoods(date: string, meal: MealType): Food[] {
  const { getFoods } = useNutrition()
  return getFoods(date).filter((f) => f.meal === meal)
}
