// Natural-language food parser.
// Turns strings like "two eggs and 100g chicken" into a structured list
// of {name, quantity, unit, calories, protein} rows.
//
// Strategy:
//   1. Normalize the input (lowercase, strip punctuation + filler verbs).
//   2. Split by "and" / "with" / comma / "plus" — each chunk is one item.
//   3. For each chunk: peel off a leading quantity (digit or number word),
//      then fuzzy-match the remaining words against the FOODS list.
//   4. If we found a food with pieceWeight, peel off an optional unit
//      ("g", "scoop", "tbsp"...) — but only if doing so still leaves us
//      a food match. Otherwise the unit was probably the food name itself
//      ("two eggs" → Eggs, not 2 pieces of nothing).
//   5. Default to piece mode for countable foods with small quantities.

import type { FoodTemplate } from '../data/foods'

export interface ParsedFood {
  /** Matched DB row, or null if we couldn't recognize the food. */
  food: FoodTemplate | null
  /** Display name — falls back to whatever the user typed. */
  name: string
  quantity: number
  unit: 'g' | 'piece'
  pieceUnit?: string
  /** Quantity converted to grams. Equals `quantity` in g mode. */
  grams: number
  /** Computed from food + grams. 0 if no food matched. */
  calories: number
  protein: number
  /** 1 = exact DB match, 0 = no match. Useful for UI hints. */
  confidence: 0 | 1
  /** Original chunk this came from — for debugging / editing. */
  rawText: string
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
  dozen: 12,
}

const UNIT_WORDS: Record<string, { unit: 'g' | 'piece'; pieceUnit?: string }> = {
  g: { unit: 'g' },
  gm: { unit: 'g' },
  gram: { unit: 'g' },
  grams: { unit: 'g' },
  scoop: { unit: 'piece', pieceUnit: 'scoop' },
  scoops: { unit: 'piece', pieceUnit: 'scoop' },
  tbsp: { unit: 'piece', pieceUnit: 'tbsp' },
  tbsps: { unit: 'piece', pieceUnit: 'tbsp' },
  tablespoon: { unit: 'piece', pieceUnit: 'tbsp' },
  tablespoons: { unit: 'piece', pieceUnit: 'tbsp' },
  egg: { unit: 'piece', pieceUnit: 'egg' },
  eggs: { unit: 'piece', pieceUnit: 'egg' },
  slice: { unit: 'piece', pieceUnit: 'slice' },
  slices: { unit: 'piece', pieceUnit: 'slice' },
  banana: { unit: 'piece', pieceUnit: 'banana' },
  bananas: { unit: 'piece', pieceUnit: 'banana' },
  apple: { unit: 'piece', pieceUnit: 'apple' },
  apples: { unit: 'piece', pieceUnit: 'apple' },
  mango: { unit: 'piece', pieceUnit: 'mango' },
  mangos: { unit: 'piece', pieceUnit: 'mango' },
  piece: { unit: 'piece' },
  pieces: { unit: 'piece' },
}

export function parseFoodInput(
  text: string,
  foods: FoodTemplate[],
): ParsedFood[] {
  const normalized = text
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .replace(/\b(i had|i ate|i eat|i consumed|i drank|i drink)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return []

  const segments = normalized
    .split(/\s*(?:,|and|with|plus|then|also)\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  return segments.map((seg) => parseSegment(seg, foods))
}

function parseSegment(text: string, foods: FoodTemplate[]): ParsedFood {
  let s = text.replace(/\b(of)\b/g, ' ').replace(/\s+/g, ' ').trim()

  // 1) Peel off a leading quantity (digit, decimal, or number word).
  //    "100g" → 100, "1.5kg" → 1.5, "two" → 2.
  let quantity = 1
  const qtyToken = s.match(/^([a-z]+\d|\d+[a-z]*|\d+(?:\.\d+)?|[a-z]+)\b/i)
  if (qtyToken) {
    const n = parseNumberToken(qtyToken[1])
    if (n !== null) {
      quantity = n
      s = s.slice(qtyToken[0].length).trim()
    }
  }

  // 2) Try to match a food BEFORE stripping units, so words like "eggs"
  //    can resolve to the "Eggs" row instead of being eaten as a unit.
  let food = findFoodInText(s, foods)

  // 3) Optionally peel off a leading unit word. Only consume it if doing so
  //    still leaves a food match (or leaves nothing, meaning the unit was
  //    the whole food — but then we keep the food we already found above).
  let unit: 'g' | 'piece' = 'g'
  let pieceUnit: string | undefined

  const unitToken = s.match(
    /^(g|gm|gram|grams|scoops?|tbsps?|tablespoons?|eggs?|slices?|bananas?|apples?|mangos?|pieces?)\b/,
  )
  if (unitToken) {
    const u = UNIT_WORDS[unitToken[1].toLowerCase()]
    if (u) {
      const remaining = s.slice(unitToken[0].length).trim()
      const rematch = findFoodInText(remaining, foods)
      if (rematch || remaining === '') {
        unit = u.unit
        pieceUnit = u.pieceUnit
        s = remaining
        if (rematch) food = rematch
      }
    }
  }

  // 4) Default to piece mode for countable foods when the user didn't
  //    say "grams" and the quantity looks like a count.
  if (food?.pieceWeight && unit === 'g' && pieceUnit === undefined && quantity <= 20) {
    unit = 'piece'
    pieceUnit = food.pieceUnit
  }

  const grams =
    unit === 'piece' && food?.pieceWeight
      ? food.pieceWeight * quantity
      : quantity

  const calories = food ? Math.round((food.calories * grams) / 100) : 0
  const protein = food ? Math.round((food.protein * grams) / 100 * 10) / 10 : 0

  return {
    food,
    name: food?.name ?? (s || 'Unknown'),
    quantity,
    unit,
    pieceUnit,
    grams,
    calories,
    protein,
    confidence: food ? 1 : 0,
    rawText: text,
  }
}

function parseNumberToken(token: string): number | null {
  const lower = token.toLowerCase()
  if (NUMBER_WORDS[lower] !== undefined) return NUMBER_WORDS[lower]
  const numPart = lower.match(/^(\d+(?:\.\d+)?)/)
  if (numPart) return parseFloat(numPart[1])
  return null
}

/**
 * Find the food whose name shares the most tokens with `text`. Comparison
 * is case-insensitive, plurals collapse (`egg`/`eggs`, `scoop`/`scoops`),
 * and ties go to whichever food appears first in the input list.
 */
function findFoodInText(
  text: string,
  foods: FoodTemplate[],
): FoodTemplate | null {
  if (!text) return null
  const textWords = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2)
  if (textWords.length === 0) return null

  let best: { food: FoodTemplate; score: number } | null = null
  for (const food of foods) {
    const nameWords = food.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 2)
    const matched: string[] = []
    for (const nw of nameWords) {
      if (textWords.some((tw) => tw === nw || tw.startsWith(nw) || nw.startsWith(tw))) {
        matched.push(nw)
      }
    }
    if (matched.length > 0) {
      const score = matched.reduce((a, b) => a + b.length, 0)
      if (!best || score > best.score) {
        best = { food, score }
      }
    }
  }
  return best?.food ?? null
}