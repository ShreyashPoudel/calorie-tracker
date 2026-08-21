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

const QUOTES_PER_DAY = 5

/**
 * Hash a YYYY-MM-DD string to a stable 32-bit integer. Different days
 * produce different starting offsets into the pool; same day always
 * produces the same quotes.
 */
function hashDate(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

function pickQuotes(date: Date): string[] {
  const seed = date.toISOString().slice(0, 10)
  const start = hashDate(seed) % QUOTES.length
  const picked: string[] = []
  for (let i = 0; i < QUOTES_PER_DAY; i++) {
    picked.push(QUOTES[(start + i) % QUOTES.length])
  }
  return picked
}

/**
 * Side-margin motivational quotes for the dashboard.
 *
 * - Hidden on narrow screens (the dashboard already fills the viewport).
 * - Picks 5 quotes per day from a pool of 30+ using today's date as
 *   the seed. Rotation is deterministic, so two users opening the app
 *   on the same day see the same set.
 * - Auto-refreshes at the next local-midnight so the quotes change
 *   without a page reload.
 */
export function MotivationalQuotes() {
  const [quotes, setQuotes] = useState<string[]>(() => pickQuotes(new Date()))

  useEffect(() => {
    // Tick once at the next local midnight, then every midnight after.
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
        setQuotes(pickQuotes(new Date()))
        scheduleNext()
      }, ms)
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [])

  // 3 on the left, 2 on the right — uneven so the layout feels less
  // mirrored and more editorial.
  const left = quotes.slice(0, 3)
  const right = quotes.slice(3)

  return (
    <>
      <aside
        aria-hidden
        className="pointer-events-none fixed left-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 xl:flex xl:max-w-[200px]"
      >
        {left.map((q, i) => (
          <QuoteCard key={`l-${i}-${q}`} quote={q} accent="left" />
        ))}
      </aside>
      <aside
        aria-hidden
        className="pointer-events-none fixed right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 xl:flex xl:max-w-[200px]"
      >
        {right.map((q, i) => (
          <QuoteCard key={`r-${i}-${q}`} quote={q} accent="right" />
        ))}
      </aside>
    </>
  )
}

function QuoteCard({
  quote,
  accent,
}: {
  quote: string
  accent: 'left' | 'right'
}) {
  return (
    <figure
      className={
        accent === 'left'
          ? 'rounded-xl border border-slate-100 bg-white/70 px-4 py-3 text-left text-xs italic leading-relaxed text-slate-600 shadow-sm backdrop-blur'
          : 'rounded-xl border border-slate-100 bg-white/70 px-4 py-3 text-right text-xs italic leading-relaxed text-slate-600 shadow-sm backdrop-blur'
      }
    >
      <span
        aria-hidden
        className={
          accent === 'left'
            ? 'mb-1 block text-base leading-none text-brand-400'
            : 'mb-1 block text-base leading-none text-brand-400'
        }
      >
        “
      </span>
      <blockquote className="m-0">{quote}</blockquote>
    </figure>
  )
}