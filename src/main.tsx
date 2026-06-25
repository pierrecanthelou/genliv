import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
	createBrain,
	BrainProvider,
	createLocalStoragePersistence,
	createCloudflareKVTransport,
} from './brain'
import { CLOUDSYNC_WORKER_URL_KEY, CLOUDSYNC_KEY_KEY } from './brain/persistenceKeys'
import { App } from './App'
import './style.css'

// Read credentials before creating the brain so we can pick the right transport.
// The raw persistence instance is passed through so cloudSettings shares the same
// underlying store (never synced, KR-022/KR-114).
const local = createLocalStoragePersistence()
const workerUrl = local.get<string>(CLOUDSYNC_WORKER_URL_KEY)
const syncKey = local.get<string>(CLOUDSYNC_KEY_KEY)
const transport =
	workerUrl !== null && syncKey !== null
		? createCloudflareKVTransport(workerUrl, syncKey)
		: undefined

const brain = createBrain({ persistence: local, transport })
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
