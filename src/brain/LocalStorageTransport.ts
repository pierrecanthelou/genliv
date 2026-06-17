import type { CloudTransport } from './CloudSyncService'

/**
 * The cloud namespace — a SEPARATE key space simulating the remote store, kept
 * distinct from the app's own `genliv:` keys so the fake cloud never collides
 * with (or is listed by) the local persistence.
 */
const CLOUD_NAMESPACE = 'cloudsync:'

/**
 * LocalStorageTransport — a CloudTransport backed by localStorage, the « cloud »
 * implementation for the LOCAL build target (per the production-target swap): it
 * exercises the full local-first sync machinery (debounced pushes, idle→syncing→
 * synced, last-write-wins reconciliation) with no server. The Cloudflare build
 * target swaps in a real worker-backed transport implementing this same
 * interface. Async by contract (returns Promises) so the async push/pull path is
 * the same as a network transport's.
 */
export function createLocalStorageTransport(storage: Storage = window.localStorage): CloudTransport {
	return {
		push(key: string, value: unknown): Promise<void> {
			storage.setItem(CLOUD_NAMESPACE + key, JSON.stringify(value))
			return Promise.resolve()
		},
		pull(key: string): Promise<unknown | null> {
			const raw = storage.getItem(CLOUD_NAMESPACE + key)
			if (raw === null) return Promise.resolve(null)
			try {
				return Promise.resolve(JSON.parse(raw) as unknown)
			} catch {
				return Promise.resolve(null)
			}
		},
	}
}
