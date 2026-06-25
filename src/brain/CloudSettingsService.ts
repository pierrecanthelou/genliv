import type { PersistenceService } from './PersistenceService'
import { CLOUDSYNC_WORKER_URL_KEY, CLOUDSYNC_KEY_KEY } from './persistenceKeys'

/** Read/write the Cloudflare worker credentials via the raw local store (never synced, KR-114). */
export interface CloudSettingsService {
	getWorkerUrl(): string | null
	setWorkerUrl(url: string | null): void
	getSyncKey(): string | null
	setSyncKey(key: string | null): void
	isConfigured(): boolean
}

export function createCloudSettings(local: PersistenceService): CloudSettingsService {
	const getWorkerUrl = () => local.get<string>(CLOUDSYNC_WORKER_URL_KEY)
	const getSyncKey = () => local.get<string>(CLOUDSYNC_KEY_KEY)
	return {
		getWorkerUrl,
		setWorkerUrl(url) {
			if (url !== null && url !== '') local.set(CLOUDSYNC_WORKER_URL_KEY, url)
			else local.remove(CLOUDSYNC_WORKER_URL_KEY)
		},
		getSyncKey,
		setSyncKey(key) {
			if (key !== null && key !== '') local.set(CLOUDSYNC_KEY_KEY, key)
			else local.remove(CLOUDSYNC_KEY_KEY)
		},
		isConfigured: () => getWorkerUrl() !== null && getSyncKey() !== null,
	}
}
