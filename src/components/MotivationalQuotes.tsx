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

// Gym / fitness cover photos from Unsplash. Stable direct URLs that work
// without an API key. `?w=...&auto=format&fit=crop&q=80` keeps the
// payload small. If a URL ever 404s the dark overlay still looks fine.
const GYM_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571010196384-0c1cb3d4e0e0?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583500178690-f7fd39c43d4b?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&auto=format&fit=crop&q=80',
]

const QUOTES_PER_DAY = 5

/**
 * Hash a YYYY-MM-DD string to a stable 32-bit integer. Different days
 * produce different starting offsets into the pool; same day always
 * produces the same quotes / images.
 */
function hashDate(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

interface DailyPick {
  quotes: string[]
  leftImage: string
  rightImage: string
}

function pickFor(date: Date): DailyPick {
  const seed = date.toISOString().slice(0, 10)
  const h = hashDate(seed)
  const qStart = h % QUOTES.length
  const iStart = h % GYM_IMAGES.length
  const quotes: string[] = []
  for (let i = 0; i < QUOTES_PER_DAY; i++) {
    quotes.push(QUOTES[(qStart + i) % QUOTES.length])
  }
  return {
    quotes,
    leftImage: GYM_IMAGES[iStart % GYM_IMAGES.length],
    // Offset by one so left and right aren't identical on the same day.
    rightImage: GYM_IMAGES[(iStart + 1) % GYM_IMAGES.length],
  }
}

/**
 * Side-margin motivational quotes + cover images.
 *
 * - Picks 5 quotes from a pool of 30 (gym + diet + empowerment, mixed
 *   male/female/neutral) using today's date as the seed. Rotation is
 *   deterministic — two users opening the app on the same day see the
 *   same set.
 * - Also picks two different gym photos per day for the side panels.
 * - Auto-refreshes at the next local midnight so quotes and images
 *   change without a reload.
 * - Hidden below the xl breakpoint so they don't crowd narrow screens.
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

  // 3 on the left, 2 on the right — uneven so the layout feels less
  // mirrored and more editorial.
  const leftQuotes = pick.quotes.slice(0, 3)
  const rightQuotes = pick.quotes.slice(3)

  return (
    <>
      <SidePanel
        side="left"
        imageUrl={pick.leftImage}
        quotes={leftQuotes}
      />
      <SidePanel
        side="right"
        imageUrl={pick.rightImage}
        quotes={rightQuotes}
      />
    </>
  )
}

interface SidePanelProps {
  side: 'left' | 'right'
  imageUrl: string
  quotes: string[]
}

function SidePanel({ side, imageUrl, quotes }: SidePanelProps) {
  const isLeft = side === 'left'
  return (
    <aside
      aria-hidden
      className={
        // pointer-events-none so the panels never steal a click from
        // the centered dashboard content. fixed full-height. visible
        // from xl up.
        isLeft
          ? 'pointer-events-none fixed bottom-0 left-0 top-0 z-0 hidden w-[260px] flex-col justify-center gap-5 overflow-hidden bg-slate-900 px-6 py-12 2xl:flex 2xl:w-[340px]'
          : 'pointer-events-none fixed bottom-0 right-0 top-0 z-0 hidden w-[260px] flex-col justify-center gap-5 overflow-hidden bg-slate-900 px-6 py-12 2xl:flex 2xl:w-[340px]'
      }
      style={{
        backgroundImage: `linear-gradient(${
          isLeft ? '90deg' : '270deg'
        }, rgba(15,23,42,0.55), rgba(15,23,42,0.85)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {quotes.map((q, i) => (
        <blockquote
          key={`${side}-${i}-${q}`}
          className="font-display text-2xl font-normal uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] 2xl:text-3xl"
        >
          <span
            aria-hidden
            className="block text-3xl leading-none text-brand-300 2xl:text-4xl"
          >
            “
          </span>
          {q}
        </blockquote>
      ))}
    </aside>
  )
}