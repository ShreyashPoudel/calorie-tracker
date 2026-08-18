# Calorie Tracker

A clean, responsive web app for tracking daily calories and protein, built with
React + TypeScript + Vite + Tailwind. Data lives in Supabase (Postgres) so it
syncs across every device you open the app on.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 3
- Supabase (`@supabase/supabase-js`) for storage
- localStorage-free — all persistence is via Supabase REST

## Local development

```bash
npm install
cp .env.example .env       # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                # http://localhost:5173
```

You also need the database schema once:

1. Open the Supabase SQL editor for your project
2. Paste `db/schema.sql` and run it

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## Deploy

The repo is wired for Vercel. Set these two env vars in the Vercel project
settings (so the build-time bundle has Supabase credentials):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then `git push` — Vercel builds `dist/` automatically.

## Project layout

```
src/
  api/         Supabase client + typed queries
  components/  UI components (cards, forms, progress bars)
  context/     NutritionProvider + useNutrition hook
  data/        Built-in food database (FOODS)
  pages/       DashboardPage, HistoryPage, SettingsPage
  types/       Shared domain types
  utils/       Pure calculations + date helpers
db/
  schema.sql   Run this once in the Supabase SQL editor
```