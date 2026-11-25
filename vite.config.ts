import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' mantém caminhos relativos (imagens/web/…, curriculo/…), como no site atual
export default defineConfig({
  plugins: [react()],
  base: './',
})
