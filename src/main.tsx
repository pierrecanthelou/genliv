import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrain, BrainProvider, createLocalStorageTransport } from './brain'
import { App } from './App'
import './style.css'

// Local build target: the « cloud » is a localStorage-backed transport (a fake
// remote) so the full local-first sync machinery runs without a server. The
// Cloudflare build target swaps in a real worker-backed transport via the same
// CloudTransport interface.
const brain = createBrain({ transport: createLocalStorageTransport() })
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
