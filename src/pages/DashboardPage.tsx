import { useMemo, useState } from 'react'
import { MEAL_TYPES } from '../types/nutrition'
import type { MealType } from '../types/nutrition'
import { useNutrition } from '../context/useNutrition'
import {
  calculateDayTotals,
  toISODate,
} from '../utils/calculations'
import { DateNav } from '../components/DateNav'
import { DailySummary } from '../components/DailySummary'
import { MealCard } from '../components/MealCard'
// import { QuickAdd } from '../components/QuickAdd'
import { WeeklySummary } from '../components/WeeklySummary'

export function DashboardPage() {
  const {
    data,
    targets,
    templates,
    getFoods,
    addFood,
    updateFood,
    deleteFood,
    applyTemplate,
    saveTemplate,
  } = useNutrition()

  const today = useMemo(() => toISODate(new Date()), [])
  const [date, setDate] = useState<string>(today)
  // const [quickAddOpen, setQuickAddOpen] = useState(false)

  const foods = getFoods(date)
  const totals = calculateDayTotals(data.days[date])

  // Collect every distinct food name the user has ever logged — used by
  // QuickAdd's parser to match items that aren't in the built-in DB.
  // const knownNames = useMemo(() => {
  //   const seen = new Set<string>()
  //   for (const day of Object.values(data.days)) {
  //     for (const f of day.foods) seen.add(f.name)
  //   }
  //   return Array.from(seen)
  // }, [data.days])

  function foodsFor(meal: MealType) {
    return foods.filter((f) => f.meal === meal)
  }

  return (
    <div className="space-y-5">
      <DateNav
        date={date}
        onChange={setDate}
        onToday={() => setDate(today)}
      />

      <DailySummary
        calories={totals.calories}
        protein={totals.protein}
        targets={targets}
      />

      {/* Quick add feature — temporarily disabled. */}
      {/* <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Meals</h2>
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="btn-primary text-sm"
          title="Type or speak a sentence like 'two eggs and a banana' to log several foods at once"
        >
          ✨ Quick add
        </button>
      </div> */}
      <h2 className="text-sm font-semibold text-slate-700">Meals</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {MEAL_TYPES.map((meal) => (
          <MealCard
            key={meal}
            meal={meal}
            date={date}
            foods={foodsFor(meal)}
            templates={templates}
            onAdd={(draft) => addFood(date, draft)}
            onUpdate={(food) => updateFood(date, food)}
            onDelete={(id) => deleteFood(date, id)}
            onApplyTemplate={(id) => applyTemplate(date, id)}
            onSaveTemplate={(name, targetMeal, items) =>
              saveTemplate(name, targetMeal, items)
            }
          />
        ))}
      </div>

      <WeeklySummary
        days={data.days}
        targets={targets}
        endDate={date}
      />

      {/* {quickAddOpen && (
        <QuickAdd
          date={date}
          knownNames={knownNames}
          onAdd={(d, draft) => addFood(d, draft)}
          onClose={() => setQuickAddOpen(false)}
        />
      )} */}
    </div>
  )
}
