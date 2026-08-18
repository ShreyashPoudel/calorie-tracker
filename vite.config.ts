import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` controls the URL prefix for emitted asset references. Deploying
// under https://shreyashpoudel.com.np/calorie-tracker/ means every asset
// URL in the built HTML needs to start with `/calorie-tracker/`.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
