# Feature ideas for the calorie tracker

A brainstorm of features that could extend the app, grouped by area. Each
item lists what it does, why it's useful, and a rough complexity estimate.

---

## 📝 Logging & input

### Quick-add / re-log
Re-add yesterday's breakfast (or any past meal) with one tap. Common when
you eat similar things most days.
**Complexity:** low — clone a day's `Food[]` into a new date.

### Meal templates
Save frequently-eaten meals ("my usual breakfast: 3 eggs + 2 roti + chai")
as a named template, then log the whole template with one tap. Per-100g
macros multiply automatically.
**Complexity:** medium — new `templates` table + UI to manage them.

### Barcode / package scan
Scan a packaged food's barcode and pull nutrition data from Open Food Facts
or similar.
**Complexity:** medium-high — needs camera access + third-party API.

### Voice / quick note entry
"I had two eggs and a banana" → parsed and auto-filled.
**Complexity:** high — NLP parsing + speech recognition.

### Copy day
Duplicate an entire day's log to today. Useful for cheat days or repetitive
meal plans.
**Complexity:** low — clone `foods` rows for the target date.

---

## 📊 Tracking & analytics

### Macro history charts
Line / bar chart of calories and protein over the last 7, 30, or 90 days.
Surface trends you can't see in the table view.
**Complexity:** medium — pick a chart lib (Recharts / Chart.js) + new page.

### Streak tracking
How many days in a row you've hit your protein target. Single big number on
the dashboard, full list in history.
**Complexity:** low-medium — derived from existing data.

### Macro distribution chart
Pie / stacked bar of protein/carbs/fat split. Requires adding carbs + fat
columns to the schema (right now we only track calories + protein).
**Complexity:** medium — schema migration + chart.

### Body weight log
Track weight over time, plot it next to average daily calories — see if
you're trending toward your goal.
**Complexity:** medium — new `weights` table + chart.

### Meal-time heatmap
When do you eat? Calendar heatmap of meals per hour-of-day. Surfaces late-
night snacking patterns.
**Complexity:** medium — needs a `logged_at` timestamp on foods (currently
we only store `date`).

### Per-meal averages
Average calories + protein per meal across the last 30 days. Helps you see
which meal is your biggest.
**Complexity:** low — pure calculation on existing data.

---

## 🎯 Goals & planning

### Macro goals beyond calories + protein
Add carbs / fat / fiber targets. Most packaged foods already list them, and
people following specific diets (keto, IIFYM) care.
**Complexity:** medium — schema + form + display.

### Goal presets
"Bulk" / "Cut" / "Maintain" presets that pick reasonable calorie + protein
numbers from your body weight.
**Complexity:** low — preset table + one-click apply.

### Plan vs actual
Set tomorrow's plan in advance ("breakfast: oats + whey, 500 kcal"). The
dashboard shows progress against plan, not just total budget.
**Complexity:** medium — `planned_foods` table + plan/edit UI.

### Weekly goal (e.g. "average 150g protein")
Track 7-day rolling average instead of per-day hit/miss. Less punishing on
rest days.
**Complexity:** low — derived metric.

---

## 🔁 Sync & sharing

### Multi-device real-time sync
You already sync via Supabase. But changes don't propagate live — a phone
update only shows up on the laptop after a refresh. Supabase Realtime
channels fix this.
**Complexity:** medium — subscribe to row changes, optimistic-merge.

### Export to CSV
Download all your data for use in Excel / Google Sheets.
**Complexity:** low — generate CSV client-side.

### Share weekly summary
Generate a screenshot or link of your weekly stats.
**Complexity:** low for screenshot; medium for shareable link.

### Backup / restore
Download all data as JSON; upload to restore. Useful before any schema
migration.
**Complexity:** low — JSON dump + import.

---

## 🥗 Food database

### User-added shared foods
When a user logs a custom food, optionally add it to a shared `user_foods`
table so other users (if you ever add auth) benefit from each other.
**Complexity:** medium — new table + merge logic.

### Search-as-you-type
Currently the dropdown is a flat list. Add a search input that filters
in-memory.
**Complexity:** low — controlled input filtering the `FOODS` array.

### Recent foods
Show the 5 most recently logged foods at the top of the dropdown — saves
scrolling for things you eat daily.
**Complexity:** low — derived from existing data.

### Micronutrients
Vitamins, minerals, omega-3, etc. Either via Open Food Facts for packaged
items or a hand-curated subset for the built-in DB.
**Complexity:** high — data sourcing + storage + UI.

### "Did you mean…" suggestions
For typos / common misspellings of food names.
**Complexity:** low — fuzzy-match on `findFood()`.

---

## 📱 UX & mobile

### PWA / install-to-home-screen
Add `manifest.json` + service worker so the app installs like a native app
on iOS / Android. Works fully offline once installed (the data already
loads fast from Supabase).
**Complexity:** medium — `vite-plugin-pwa` + icons.

### Daily reminder notification
"Pm reminder: log your dinner" via the Notifications API.
**Complexity:** medium — service worker + permission flow + schedule.

### Apple Health / Google Fit sync
Push today's calories + protein to the system health app. Requires HealthKit
(native iOS) or Health Connect (Android) — likely needs Capacitor wrapper.

### Quick-log widget
iOS Lock Screen / Android home-screen widget showing today's totals.
**Complexity:** high — needs native shell.

### Swipe-to-delete on food items
Currently there's a delete button. Swipe gesture would be faster on mobile.
**Complexity:** low — touch event handlers.

### Dark mode
Auto / toggle dark theme. Easy to add since Tailwind config already exists.
**Complexity:** low — `dark:` classes + toggle in settings.

---

## 🧠 Smart / AI

### Calorie estimation from photo
Snap a photo of your plate → estimate calories + protein via a vision model.
**Complexity:** high — vision API + photo storage.

### Pattern detection
"You consistently under-eat on Tuesdays" or "Your protein is highest on
days you log breakfast first". Weekly insight cards on the dashboard.
**Complexity:** medium — pure analysis on existing data.

### Habit recommendations
"Add ~30g protein at lunch to hit your goal" — based on rolling average.
**Complexity:** low — derived suggestion.

---

## 🛠️ Plumbing / quality of life

### Undo / redo
Last 5 actions reversible. Especially useful when you accidentally delete a
whole meal.
**Complexity:** medium — action history stack.

### Offline mode
Queue writes when offline, replay on reconnect. Supabase already has
patterns for this; you'd add a local IndexedDB cache.
**Complexity:** medium-high.

### Internationalization (i18n)
Hindi / Nepali translations. Relevant given the user's primary language.
**Complexity:** medium — `react-i18next` + extract all strings.

### Unit preferences (metric ↔ imperial)
Show "170 g" or "6 oz" depending on user choice. Doesn't change data, just
display.
**Complexity:** low — formatter + setting.

### Time zone handling
Currently dates are interpreted as local. Cross-time-zone usage (travel)
gets confusing. Add explicit TZ-aware date handling.
**Complexity:** medium.

### Better date picker
Currently uses +/- day buttons. Add a calendar popover for jumping to a
specific date.
**Complexity:** low — date picker lib or custom popover.

---

## Suggested next-up ordering

If you want a single recommended roadmap, the highest value-to-effort ratio
items are:

1. **Recent foods** in the dropdown (effort: 15 min, daily-life win)
2. **Macro history chart** (effort: 1–2 hr, big "wow" factor)
3. **PWA / install-to-home-screen** (effort: 1 hr, unlocks mobile use)
4. **Meal templates** (effort: 2–3 hr, biggest logging-time saver)
5. **Body weight log + chart** (effort: 2 hr, completes the feedback loop)
6. **Streak tracking** (effort: 30 min, motivational)

Start with whatever scratches your own itch first — the codebase is small
enough that any of these is a reasonable weekend project.