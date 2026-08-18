@echo off
REM Starts the calorie tracker dev server and opens the browser.
REM Close this window (or press Ctrl+C) to stop the server.

cd /d "%~dp0"

REM If dependencies aren't installed yet, install them.
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

echo Starting Nutrition Tracker...
start "" http://localhost:5173/
call npm run dev
