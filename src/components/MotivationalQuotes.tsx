import { useEffect, useState } from 'react'

// Mix of gym, healthy-diet, and self-empowerment quotes — some lean
// male-coded, some female-coded, some gender-neutral. Drawn daily using
// a hash of today's date so the rotation is deterministic and "changes
// daily" the user can verify tomorrow without it being random.
const QUOTES: string[] = [
  // Strength / discipline (broadly male-coded gym energy)
  'Strength is built one rep at a time.',
  "The only bad workout is the one you didn't do.",
  'Discipline is doing what needs to be done, even when you don’t want to.',
  'Don’t count the reps — make the reps count.',
  'Push yourself, because no one else is going to do it for you.',
  'Sweat is just fat crying.',
  'Iron sharpens iron.',
  'The clock is ticking. Are you becoming the person you want to be?',
  'Be the hardest worker in the room.',

  // Strength / self-belief (broadly female-coded empowerment)
  'Strong is beautiful.',
  "Lift like a girl — they'll tremble.",
  'She believed she could, so she did.',
  'A girl who lifts is unstoppable.',
  'Empowered women empower women.',
  'Fit is the new pretty.',
  'You are stronger than you think.',
  'Train like a beast, look like a beauty.',
  'Your body is your home — furnish it well.',

  // Nutrition / diet
  "You can't outrun a bad diet.",
  'Eat meat. Lift heavy. Repeat.',
  'Protein builds the body you train for.',
  'Abs are made in the kitchen.',
  'Healthy eating is a form of self-respect.',
  "Don't diet. Eat for your goals.",
  'Real food. Real results.',
  'Nourish your body. It carries your soul.',
  'Every meal is a choice. Choose well.',

  // Mixed / gender-neutral
  'Progress, not perfection.',
  "You don't have to be extreme, just consistent.",
]

// Per-side gradient palettes. Cycle by date so the panels don't look
// identical on the same day. Pairs are picked so left + right are
// always visually distinct.
const GRADIENT_PAIRS: Array<{ left: string; right: string }> = [
  {
    left: 'from-brand-700 via-brand-600 to-orange-500',
    right: 'from-purple-700 via-pink-600 to-rose-500',
  },
  {
    left: 'from-slate-800 via-brand-700 to-brand-500',
    right: 'from-indigo-800 via-purple-700 to-fuchsia-600',
  },
  {
    left: 'from-emerald-800 via-teal-700 to-cyan-500',
    right: 'from-rose-800 via-pink-600 to-orange-500',
  },
  {
    left: 'from-orange-700 via-rose-600 to-pink-500',
    right: 'from-cyan-800 via-sky-700 to-indigo-600',
  },
  {
    left: 'from-violet-800 via-purple-700 to-pink-500',
    right: 'from-slate-800 via-slate-700 to-brand-600',
  },
  {
    left: 'from-amber-700 via-orange-600 to-red-500',
    right: 'from-blue-800 via-indigo-700 to-violet-600',
  },
  {
    left: 'from-fuchsia-800 via-pink-600 to-rose-500',
    right: 'from-emerald-800 via-green-700 to-teal-600',
  },
]

const QUOTES_PER_DAY = 5

function hashDate(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

interface DailyPick {
  quotes: string[]
  palette: { left: string; right: string }
}

function pickFor(date: Date): DailyPick {
  const seed = date.toISOString().slice(0, 10)
  const h = hashDate(seed)
  const qStart = h % QUOTES.length
  const pStart = h % GRADIENT_PAIRS.length
  const quotes: string[] = []
  for (let i = 0; i < QUOTES_PER_DAY; i++) {
    quotes.push(QUOTES[(qStart + i) % QUOTES.length])
  }
  return {
    quotes,
    palette: GRADIENT_PAIRS[pStart],
  }
}

/**
 * Side-margin motivational quote panels for the dashboard.
 *
 * - Picks 5 quotes + a gradient palette from pools using today's date
 *   as a seed — deterministic and changes daily.
 * - No external images; gradients + SVG dot pattern overlay + animated
 *   blob orbs render reliably on any network.
 * - Auto-refreshes at the next local midnight.
 * - Hidden below xl so they don't crowd narrow screens.
 */
export function MotivationalQuotes() {
  const [pick, setPick] = useState<DailyPick>(() => pickFor(new Date()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function scheduleNext() {
      const now = new Date()
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        5,
      )
      const ms = Math.max(1000, tomorrow.getTime() - now.getTime())
      timer = setTimeout(() => {
        setPick(pickFor(new Date()))
        scheduleNext()
      }, ms)
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [])

  // 3 on the left, 2 on the right — uneven for editorial feel.
  const leftQuotes = pick.quotes.slice(0, 3)
  const rightQuotes = pick.quotes.slice(3)

  return (
    <>
      <SidePanel
        side="left"
        gradient={pick.palette.left}
        quotes={leftQuotes}
      />
      <SidePanel
        side="right"
        gradient={pick.palette.right}
        quotes={rightQuotes}
      />
    </>
  )
}

function SidePanel({
  side,
  gradient,
  quotes,
}: {
  side: 'left' | 'right'
  gradient: string
  quotes: string[]
}) {
  return (
    <aside
      aria-hidden
      className={
        // pointer-events-none so the panels never steal a click from
        // the centered dashboard. Full viewport height. Hidden below xl.
        'pointer-events-none fixed bottom-0 top-0 z-0 hidden w-[280px] overflow-hidden xl:block 2xl:w-[360px] ' +
        (side === 'left' ? 'left-0' : 'right-0')
      }
    >
      {/* Gradient base */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Animated orbs */}
      <div
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        style={{ animation: 'orb-drift-1 14s ease-in-out infinite' }}
      />
      <div
        className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-black/30 blur-3xl"
        style={{ animation: 'orb-drift-2 18s ease-in-out infinite' }}
      />
      <div
        className="absolute left-10 top-1/2 h-56 w-56 rounded-full bg-white/5 blur-3xl"
        style={{ animation: 'orb-drift-3 22s ease-in-out infinite' }}
      />

      {/* Dot pattern overlay */}
      <DotPattern />

      {/* Top/bottom vignette for text contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      {/* Quotes */}
      <div
        className={
          'relative flex h-full flex-col justify-center gap-6 px-6 py-12 ' +
          (side === 'left' ? 'items-start text-left' : 'items-end text-right')
        }
      >
        {quotes.map((q, i) => (
          <QuoteCard key={`${side}-${i}-${q}`} quote={q} index={i} />
        ))}
      </div>
    </aside>
  )
}

function QuoteCard({ quote, index }: { quote: string; index: number }) {
  return (
    <div
      className="max-w-[240px] animate-[fadeInUp_600ms_ease-out_both]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-display text-3xl leading-none text-white/70">
          “
        </span>
        <span className="h-px w-10 bg-white/40" />
      </div>
      <p className="font-display text-2xl font-normal uppercase leading-[1.05] tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] 2xl:text-3xl">
        {quote}
      </p>
    </div>
  )
}

/** Repeating dot grid as inline SVG — adds texture without a network call. */
function DotPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
    >
      <defs>
        <pattern
          id="dot-grid"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  )
}