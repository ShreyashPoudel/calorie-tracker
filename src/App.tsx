import { useState } from 'react'
import { NutritionProvider } from './context/NutritionContext'
import { useNutrition } from './context/useNutrition'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'

type Route = 'dashboard' | 'history' | 'settings'

const NAV: Array<{ id: Route; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Today', icon: '📊' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function Shell() {
  const [route, setRoute] = useState<Route>('dashboard')
  const [historyDate, setHistoryDate] = useState<string | null>(null)
  const {
    error,
    loaded,
    authLoaded,
    user,
    onboarded,
    signOut,
  } = useNutrition()

  if (!authLoaded) return <FullPageSpinner message="Loading…" />
  if (!user) return <LoginPage />
  if (!onboarded) return <OnboardingPage />

  const email = user.email ?? ''
  const shortEmail = email.length > 18 ? email.slice(0, 16) + '…' : email

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => setRoute('dashboard')}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-base text-white shadow-sm">
              🍽️
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight text-slate-900">
                Nutrition Tracker
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Calories · Protein
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    route === item.id
                      ? 'bg-brand-500/10 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setRoute(item.id)}
                >
                  <span className="mr-1" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
            <UserMenu email={shortEmail} onSignOut={signOut} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-28">
        {error && <ErrorBanner message={error} />}
        {!loaded && !error && <LoadingNotice />}
        {route === 'dashboard' && <DashboardPage />}
        {route === 'history' && (
          <HistoryPage
            selectedDate={historyDate}
            onSelectDate={setHistoryDate}
          />
        )}
        {route === 'settings' && <SettingsPage />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                route === item.id
                  ? 'text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setRoute(item.id)}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function UserMenu({
  email,
  onSignOut,
}: {
  email: string
  onSignOut: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        title={email}
      >
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-semibold text-white"
        >
          {email.slice(0, 1).toUpperCase() || '?'}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">
          {email || 'Account'}
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">
              Signed in as
              <div className="truncate font-medium text-slate-800">
                {email}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false)
                if (confirm('Sign out?')) void onSignOut()
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FullPageSpinner({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500"
        />
        {message}
      </div>
    </div>
  )
}

function App() {
  return (
    <NutritionProvider>
      <Shell />
    </NutritionProvider>
  )
}

export default App

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      <span aria-hidden className="mt-0.5 text-base">
        ⚠️
      </span>
      <p className="flex-1 leading-snug">{message}</p>
    </div>
  )
}

function LoadingNotice() {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
      Loading from Supabase…
    </div>
  )
}