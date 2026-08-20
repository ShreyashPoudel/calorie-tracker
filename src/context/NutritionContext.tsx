import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  Food,
  MealTemplate,
  Targets,
  TemplateItem,
} from '../types/nutrition'
import {
  createTemplate as createTemplateRow,
  deleteFoodRow,
  deleteTemplate as deleteTemplateRow,
  insertFood,
  loadAllFoods,
  loadTargets,
  loadTemplates,
  updateFoodRow,
  upsertTargets,
} from '../api/queries'

export interface NutritionContextValue {
  data: AppData
  targets: Targets
  /** Reusable meal templates (e.g. "Max breakfast"). */
  templates: MealTemplate[]
  /** True once the initial Supabase load has resolved (success or fail). */
  loaded: boolean
  /** Last error from a load or write — surfaced in the UI so silent failures don't bite. */
  error: string | null
  /** Foods for a specific date; returns empty array if no log exists. */
  getFoods: (date: string) => Food[]
  /** Get or create a day log for a date. */
  getDay: (date: string) => { date: string; foods: Food[] }
  addFood: (date: string, food: Omit<Food, 'id'>) => Food
  updateFood: (date: string, food: Food) => void
  deleteFood: (date: string, foodId: string) => void
  setTargets: (targets: Targets) => void
  /** Save the given items as a reusable meal template. */
  saveTemplate: (name: string, meal: Food['meal'], items: TemplateItem[]) => Promise<MealTemplate | null>
  /** Delete a template by id. */
  removeTemplate: (id: string) => void
  /** Add every item in a template to the given date (returns the new foods). */
  applyTemplate: (date: string, templateId: string) => Food[]
}

const DEFAULT_DATA: AppData = {
  version: 1,
  targets: { calories: 2000, protein: 150 },
  days: {},
}

// oxlint-disable-next-line react(only-export-components)
// Context lives next to the provider so the file is the single source of
// truth for the nutrition domain state. Fast Refresh is a DX nicety, not
// a correctness requirement.
export const NutritionContext = createContext<NutritionContextValue | null>(null)

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Apply a local mutation and persist it to Postgres. Errors are logged but
 * not thrown — the UI keeps working off the optimistic local state, so a
 * flaky connection won't lock the user out of their own data.
 */
function persist(
  setError: (msg: string) => void,
  fn: () => Promise<void>,
): Promise<void> {
  return fn().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    setError(`Supabase write failed: ${msg}`)
    console.warn('Supabase write failed:', err)
  })
}

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initial load from Postgres.
  useEffect(() => {
    let cancelled = false
    Promise.all([loadAllFoods(), loadTargets(), loadTemplates()])
      .then(([grouped, targets, tpls]) => {
        if (cancelled) return
        const days: AppData['days'] = {}
        for (const [date, foods] of Object.entries(grouped)) {
          days[date] = { date, foods }
        }
        setData({ version: 1, days, targets })
        setTemplates(tpls)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Couldn't load from Supabase: ${msg}`)
        console.error('Failed to load from Supabase:', err)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getDay = useCallback(
    (date: string) => data.days[date] ?? { date, foods: [] },
    [data.days],
  )

  const getFoods = useCallback(
    (date: string) => data.days[date]?.foods ?? [],
    [data.days],
  )

  const addFood = useCallback(
    (date: string, draft: Omit<Food, 'id'>): Food => {
      const food: Food = { ...draft, id: makeId() }
      setData((prev) => {
        const existing = prev.days[date]?.foods ?? []
        const days = { ...prev.days, [date]: { date, foods: [...existing, food] } }
        return { ...prev, days }
      })
      void persist(setError, () => insertFood(date, food))
      return food
    },
    [],
  )

  const updateFood = useCallback(
    (date: string, food: Food) => {
      setData((prev) => {
        const existing = prev.days[date]?.foods ?? []
        const days = {
          ...prev.days,
          [date]: {
            date,
            foods: existing.map((f) => (f.id === food.id ? food : f)),
          },
        }
        return { ...prev, days }
      })
      void persist(setError, () => updateFoodRow(date, food))
    },
    [],
  )

  const deleteFood = useCallback((date: string, foodId: string) => {
    setData((prev) => {
      const existing = prev.days[date]?.foods ?? []
      const next = existing.filter((f) => f.id !== foodId)
      const days = { ...prev.days }
      if (next.length === 0) {
        delete days[date]
      } else {
        days[date] = { date, foods: next }
      }
      return { ...prev, days }
    })
    void persist(setError, () => deleteFoodRow(foodId))
  }, [])

  const setTargets = useCallback((targets: Targets) => {
    setData((prev) => ({ ...prev, targets }))
    void persist(setError, () => upsertTargets(targets))
  }, [])

  const saveTemplate = useCallback(
    async (
      name: string,
      meal: Food['meal'],
      items: TemplateItem[],
    ): Promise<MealTemplate | null> => {
      // Optimistically create a local row so the new template shows up
      // instantly. If the Supabase write fails, roll it back.
      const optimistic: MealTemplate = {
        id: makeId(),
        name,
        meal,
        items,
        createdAt: new Date().toISOString(),
      }
      setTemplates((prev) => [optimistic, ...prev])
      try {
        const saved = await createTemplateRow({ name, meal, items })
        // Replace the optimistic row with the server-assigned one.
        setTemplates((prev) =>
          prev.map((t) => (t.id === optimistic.id ? saved : t)),
        )
        return saved
      } catch (err) {
        setTemplates((prev) => prev.filter((t) => t.id !== optimistic.id))
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Couldn't save template: ${msg}`)
        console.error('Failed to save template:', err)
        return null
      }
    },
    [],
  )

  const removeTemplate = useCallback((id: string) => {
    // Snapshot for rollback if the delete fails.
    const snapshot = templates
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    void persist(setError, () => deleteTemplateRow(id)).catch(() => {
      setTemplates(snapshot)
    })
  }, [templates])

  const applyTemplate = useCallback(
    (date: string, templateId: string): Food[] => {
      const tpl = templates.find((t) => t.id === templateId)
      if (!tpl || tpl.items.length === 0) return []
      const newFoods: Food[] = tpl.items.map((item) => ({
        ...item,
        id: makeId(),
      }))
      setData((prev) => {
        const existing = prev.days[date]?.foods ?? []
        return {
          ...prev,
          days: {
            ...prev.days,
            [date]: { date, foods: [...existing, ...newFoods] },
          },
        }
      })
      // Persist each new food individually — they each get their own id.
      for (const food of newFoods) {
        void persist(setError, () => insertFood(date, food))
      }
      return newFoods
    },
    [templates],
  )

  const value = useMemo<NutritionContextValue>(
    () => ({
      data,
      targets: data.targets,
      templates,
      loaded,
      error,
      getDay,
      getFoods,
      addFood,
      updateFood,
      deleteFood,
      setTargets,
      saveTemplate,
      removeTemplate,
      applyTemplate,
    }),
    [
      data,
      templates,
      loaded,
      error,
      getDay,
      getFoods,
      addFood,
      updateFood,
      deleteFood,
      setTargets,
      saveTemplate,
      removeTemplate,
      applyTemplate,
    ],
  )

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  )
}