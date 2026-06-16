import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrain, BrainProvider } from './brain'
import { App } from './App'
import './style.css'

const brain = createBrain()
const container = document.getElementById('root')

if (container === null) {
	throw new Error('Root container #root introuvable')
}

createRoot(container).render(
	<StrictMode>
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>
	</StrictMode>,
)
