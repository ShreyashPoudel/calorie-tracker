import { formatLongDate, shiftDate } from '../utils/calculations'

interface DateNavProps {
  date: string
  onChange: (date: string) => void
  /** Optional "Today" shortcut shown when viewing past days. */
  onToday?: () => void
}

export function DateNav({ date, onChange, onToday }: DateNavProps) {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isToday = date === todayKey

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => onChange(shiftDate(date, -1))}
          aria-label="Previous day"
        >
          ← Previous
        </button>
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => onChange(shiftDate(date, 1))}
          aria-label="Next day"
        >
          Next →
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2">
        <label className="sr-only" htmlFor="date-picker">
          Select date
        </label>
        <input
          id="date-picker"
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          className="input w-auto"
        />
        {!isToday && onToday && (
          <button type="button" className="btn-ghost text-sm" onClick={onToday}>
            Jump to today
          </button>
        )}
      </div>

      <p className="text-sm font-medium text-slate-400">{formatLongDate(date)}</p>
    </div>
  )
}