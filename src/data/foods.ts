// Built-in food database. Values are per 100g by default; some foods also
// have per-piece data so the form can offer a "piece" unit shortcut.
export interface FoodTemplate {
  name: string
  /** kcal per 100g */
  calories: number
  /** grams of protein per 100g */
  protein: number
  /** Average weight in grams of one piece (enables per-piece entry). */
  pieceWeight?: number
  /** Human-readable label for a single piece, e.g. "egg" or "banana". */
  pieceUnit?: string
}

export const FOODS: FoodTemplate[] = [
  { name: 'Chicken breast', calories: 165, protein: 31 },
  { name: 'Chicken thigh', calories: 209, protein: 26 },
  {
    name: 'Protein powder',
    calories: 366.67,
    protein: 86.67,
    pieceWeight: 30,
    pieceUnit: 'scoop',
  },
  // 1 large egg ≈ 50 g → ~78 kcal, ~6.5 g protein
  {
    name: 'Eggs',
    calories: 155,
    protein: 13,
    pieceWeight: 50,
    pieceUnit: 'egg',
  },
  { name: 'Tofu', calories: 90, protein: 10 },
  // Soya chunks (dry / TVP) — log the dry weight you measure before soaking
  { name: 'Soya chunks', calories: 345, protein: 52 },
  { name: 'Rice (cooked)', calories: 130, protein: 2.7 },
  // { name: 'Roti', calories: 297, protein: 9 },
  { name: 'Dal (cooked)', calories: 116, protein: 7 },
  { name: 'Milk', calories: 42, protein: 3.4 },
  { name: 'Curd (yogurt)', calories: 59, protein: 3.5 },
  // 1 medium banana (with skin) ≈ 118 g → ~105 kcal, ~1.3 g protein
  {
    name: 'Banana',
    calories: 89,
    protein: 1.3,
    pieceWeight: 118,
    pieceUnit: 'banana',
  },
  // // 1 medium apple ≈ 182 g → ~95 kcal, ~0.5 g protein
  // {
  //   name: 'Apple',
  //   calories: 52,
  //   protein: 0.3,
  //   pieceWeight: 182,
  //   pieceUnit: 'apple',
  // },
  // // 1 medium mango ≈ 200 g → ~120 kcal, ~1.6 g protein
  // {
  //   name: 'Mango',
  //   calories: 60,
  //   protein: 0.8,
  //   pieceWeight: 200,
  //   pieceUnit: 'mango',
  // },
  { name: 'Oats (dry)', calories: 389, protein: 16.9 },
  // { name: 'Peanut butter', calories: 588, protein: 25 },
  // 1 scoop (≈ 30 g) → exactly 110 kcal, 26 g protein per scoop.
  // Per-100g derived so "1 scoop" lands on the user's exact numbers.
  
  { name: 'Paneer', calories: 265, protein: 18 },
  // { name: 'Mixed vegetables', calories: 65, protein: 2.5 },
  { name: 'Potato', calories: 77, protein: 2 },
  // { name: 'Sweet potato', calories: 86, protein: 1.6 },
  { name: 'Lentils (dry)', calories: 353, protein: 25 },
  // { name: 'Almonds', calories: 579, protein: 21 },
  { name: 'Greek yogurt', calories: 97, protein: 9 },
  // 1 slice whole-wheat bread ≈ 30 g → ~74 kcal, ~3.9 g protein
  {
    name: 'Bread (whole wheat)',
    calories: 247,
    protein: 13,
    pieceWeight: 30,
    pieceUnit: 'slice',
  },
  // 1 tbsp cooking oil ≈ 14 g → ~120 kcal, 0 g protein per tbsp.
  // Per-100g derived so "1 tbsp" lands on the standard 120 kcal figure.
  {
    name: 'Oil (cooking)',
    calories: 857,
    protein: 0,
    pieceWeight: 14,
    pieceUnit: 'tbsp',
  },
  // Ghee (clarified butter) — 1 tbsp ≈ 14 g → ~126 kcal, 0 g protein.
  {
    name: 'Ghee',
    calories: 900,
    protein: 0,
    pieceWeight: 14,
    pieceUnit: 'tbsp',
  }, {
    name: 'Cheura',
    calories: 350,
    protein: 0,
  },
  {
    name: 'Hukkah',
    calories: 20,
    protein: 0,
  }
]

export function findFood(name: string): FoodTemplate | undefined {
  return FOODS.find((f) => f.name.toLowerCase() === name.toLowerCase())
}
