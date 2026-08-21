import { formatPercent } from '../utils/calculations'

interface ProgressBarProps {
  /** Percentage consumed. */
  percent: number
  /** Bar color. */
  color?: 'calorie' | 'protein' | 'brand'
  /** Optional caption rendered on the right of the bar. */
  caption?: string
}

/**
 * Visual progress bar. Caps the fill at 100% but keeps the caption
 * accurate (so users see "115%" if they go over).
 */
export function ProgressBar({
  percent,
  color = 'brand',
  caption,
}: ProgressBarProps) {
  const fill = Math.max(0, Math.min(100, percent))
  const barColor =
    color === 'calorie'
      ? 'bg-calorie-500'
      : color === 'protein'
        ? 'bg-protein-500'
        : 'bg-brand-500'
  const overFill = percent > 100 ? Math.min(100, percent - 100) : 0

  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${fill}%` }}
        />
        {overFill > 0 && (
          <div
            className="-mt-2.5 h-full bg-red-500 opacity-70 transition-all"
            style={{ width: `${overFill}%` }}
          />
        )}
      </div>
      {caption !== undefined ? (
        <p className="mt-1 text-xs font-medium text-slate-400">{caption}</p>
      ) : (
        <p className="mt-1 text-xs font-medium text-slate-400">
          {formatPercent(percent)}
        </p>
      )}
    </div>
  )
}