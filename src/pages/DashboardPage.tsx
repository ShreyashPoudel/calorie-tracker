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
import { WeeklySummary } from '../components/WeeklySummary'

export function DashboardPage() {
  const {
    data,
    targets,
    getFoods,
    addFood,
    updateFood,
    deleteFood,
  } = useNutrition()

  const today = useMemo(() => toISODate(new Date()), [])
  const [date, setDate] = useState<string>(today)

  const foods = getFoods(date)
  const totals = calculateDayTotals(data.days[date])

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

      <div className="grid gap-4 sm:grid-cols-2">
        {MEAL_TYPES.map((meal) => (
          <MealCard
            key={meal}
            meal={meal}
            date={date}
            foods={foodsFor(meal)}
            onAdd={(draft) => addFood(date, draft)}
            onUpdate={(food) => updateFood(date, food)}
            onDelete={(id) => deleteFood(date, id)}
          />
        ))}
      </div>

      <WeeklySummary
        days={data.days}
        targets={targets}
        endDate={date}
      />
    </div>
  )
}
