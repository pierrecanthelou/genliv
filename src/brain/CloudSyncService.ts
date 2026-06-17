import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { SyncStatus } from './types'

/**
 * The cloud side of persistence — a swappable transport that pushes a stored
 * value to the backend. The real implementation (a Cloudflare worker client)
 * lands later; when no transport is configured the store is local-only.
 */
export interface CloudTransport {
	push(key: string, value: unknown): Promise<void>
}

/**
 * CloudSyncService — a LOCAL-FIRST decorator over a PersistenceService (Liskov:
 * it IS a PersistenceService, so BookService is unchanged). Reads + writes hit
 * the local store SYNCHRONOUSLY, so the app always works offline; when a cloud
 * transport is configured a write also pushes in the background and the sync
 * state moves idle → syncing → synced (or → error). With no transport the
 * store is `offline` (local-only). State changes are broadcast on `sync:status`.
 */
export interface CloudSyncService extends PersistenceService {
	status(): SyncStatus
}

export function createCloudSyncService(
	local: PersistenceService,
	events: EventBus,
	transport?: CloudTransport,
): CloudSyncService {
	let status: SyncStatus = transport === undefined ? 'offline' : 'idle'

	function setStatus(next: SyncStatus): void {
		if (next === status) return // only emit on a real change (no per-keystroke noise)
		status = next
		events.emit('sync:status', { status })
	}

	function pushToCloud(key: string, value: unknown): void {
		if (transport === undefined) return // local-only: stay `offline`, never block the write
		setStatus('syncing')
		transport
			.push(key, value)
			.then(() => setStatus('synced'))
			.catch(() => setStatus('error'))
	}

	return {
		get<T>(key: string): T | null {
			return local.get<T>(key)
		},
		set<T>(key: string, value: T): void {
			local.set<T>(key, value) // local-first: persist synchronously before any cloud work
			pushToCloud(key, value)
		},
		remove(key: string): void {
			local.remove(key)
		},
		keys(prefix: string): string[] {
			return local.keys(prefix)
		},
		status(): SyncStatus {
			return status
		},
	}
}
