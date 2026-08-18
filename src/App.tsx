import { useState } from 'react'
import { NutritionProvider } from './context/NutritionContext'
import { useNutrition } from './context/useNutrition'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
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
  const { error, loaded } = useNutrition()

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => setRoute('dashboard')}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-base text-white">
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
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  route === item.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
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
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                route === item.id
                  ? 'text-brand-700'
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
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      Loading from Supabase…
    </div>
  )
}
