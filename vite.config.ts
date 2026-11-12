import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages (https://hosoden.github.io/Nazori/) で公開するための設定
  base: '/Nazori/',
  plugins: [react()],
})
