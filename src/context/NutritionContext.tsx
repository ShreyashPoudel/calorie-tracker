import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
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
import { onAuthChange, supabase } from '../api/db'

export interface NutritionContextValue {
  data: AppData
  targets: Targets
  /** Reusable meal templates (e.g. "Max breakfast"). */
  templates: MealTemplate[]
  /** True once the initial Supabase load has resolved (success or fail). */
  loaded: boolean
  /** Last error from a load or write — surfaced in the UI so silent failures don't bite. */
  error: string | null
  /** Current Supabase user, or null if signed out. */
  user: User | null
  /** Current Supabase session (includes access token + user). */
  session: Session | null
  /** True once we've resolved the initial session (so we don't flash login → app). */
  authLoaded: boolean
  /** True once the user has completed onboarding (i.e. has a targets row). */
  onboarded: boolean
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
  /** Sign the current user out (clears session + local state). */
  signOut: () => Promise<void>
}

// In-memory defaults used while the user hasn't completed onboarding yet.
// Never written to the database until the onboarding wizard runs.
const DEFAULT_TARGETS: Targets = { calories: 2000, protein: 150 }

const DEFAULT_DATA: AppData = {
  version: 1,
  targets: DEFAULT_TARGETS,
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

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [onboarded, setOnboarded] = useState(false)

  // Track the current user id in a ref so async writes can guard against
  // a sign-out that races with an in-flight request.
  const userIdRef = useRef<string | null>(null)
  userIdRef.current = user?.id ?? null

  // ── Auth subscription + initial data load ─────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadForUser(uid: string) {
      try {
        const [grouped, t, tpls] = await Promise.all([
          loadAllFoods(),
          loadTargets(),
          loadTemplates(),
        ])
        if (cancelled || userIdRef.current !== uid) return
        const days: AppData['days'] = {}
        for (const [date, foods] of Object.entries(grouped)) {
          days[date] = { date, foods }
        }
        // No targets row → user hasn't onboarded yet. Keep the in-memory
        // defaults so the OnboardingPage form can prefill, but flag
        // `onboarded = false` so the gate holds them there.
        if (t) {
          setData({ version: 1, days, targets: t })
          setOnboarded(true)
        } else {
          setData({ version: 1, days, targets: DEFAULT_TARGETS })
          setOnboarded(false)
        }
        setTemplates(tpls)
        setError(null)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Couldn't load from Supabase: ${msg}`)
        console.error('Failed to load from Supabase:', err)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    function resetForSignedOut() {
      setData(DEFAULT_DATA)
      setTemplates([])
      setOnboarded(false)
      setLoaded(true)
    }

    const { data: sub } = onAuthChange((_event, newSession) => {
      const previousUid = userIdRef.current
      const nextUid = newSession?.user?.id ?? null
      setSession(newSession)
      setUser(newSession?.user ?? null)
      // Switching users (or signing in/out) resets data state.
      if (previousUid !== nextUid) {
        setLoaded(false)
        if (nextUid) {
          void loadForUser(nextUid)
        } else {
          resetForSignedOut()
        }
      }
    })

    // Resolve the initial session so we don't flash the login screen on
    // a refresh where the user is actually still signed in.
    supabase.auth
      .getSession()
      .then(({ data: { session: initial } }) => {
        if (cancelled) return
        setSession(initial)
        setUser(initial?.user ?? null)
        setAuthLoaded(true)
        if (initial?.user) {
          void loadForUser(initial.user.id)
        } else {
          // Not signed in — just mark data as "loaded" (empty) and let the
          // LoginPage render.
          setLoaded(true)
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('getSession failed:', err)
        setAuthLoaded(true)
        setLoaded(true)
      })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setOnboarded(true)
    void persist(setError, () => upsertTargets(targets))
  }, [])

  const saveTemplate = useCallback(
    async (
      name: string,
      meal: Food['meal'],
      items: TemplateItem[],
    ): Promise<MealTemplate | null> => {
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
      for (const food of newFoods) {
        void persist(setError, () => insertFood(date, food))
      }
      return newFoods
    },
    [templates],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // The onAuthStateChange subscription will reset state, but mirror it
    // here so the UI doesn't have to wait for the next tick.
    setUser(null)
    setSession(null)
    setOnboarded(false)
    setData(DEFAULT_DATA)
    setTemplates([])
  }, [])

  const value = useMemo<NutritionContextValue>(
    () => ({
      data,
      targets: data.targets,
      templates,
      loaded,
      error,
      user,
      session,
      authLoaded,
      onboarded,
      getDay,
      getFoods,
      addFood,
      updateFood,
      deleteFood,
      setTargets,
      saveTemplate,
      removeTemplate,
      applyTemplate,
      signOut,
    }),
    [
      data,
      templates,
      loaded,
      error,
      user,
      session,
      authLoaded,
      onboarded,
      getDay,
      getFoods,
      addFood,
      updateFood,
      deleteFood,
      setTargets,
      saveTemplate,
      removeTemplate,
      applyTemplate,
      signOut,
    ],
  )

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  )
}