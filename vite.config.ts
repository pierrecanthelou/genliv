import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PWA-oriented React app. Single source of truth lives in brain/BookService;
// features are isolated and talk only through brain/ contracts.
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
	},
})
