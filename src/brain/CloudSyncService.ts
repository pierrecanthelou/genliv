import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { SyncStatus } from './types'
import { bookKey } from './persistenceKeys'

/**
 * The cloud side of persistence — a swappable transport that pushes/pulls a
 * stored value to/from the backend. Locally the app wires a localStorage-backed
 * transport (a fake remote) so the full sync machinery runs without a server;
 * the real Cloudflare client (worker route + auth) is swapped in for the
 * Cloudflare build target via this same interface. With no transport the store
 * is local-only (`offline`).
 */
export interface CloudTransport {
	push(key: string, value: unknown): Promise<void>
	/** Fetch the cloud value for a key (last-write-wins reconciliation). Optional. */
	pull?(key: string): Promise<unknown | null>
}

export interface CloudSyncOptions {
	/** Debounce window (ms) coalescing rapid writes into one batched push (default 300). */
	debounceMs?: number
}

/**
 * CloudSyncService — a LOCAL-FIRST decorator over a PersistenceService (Liskov:
 * it IS a PersistenceService, so BookService is unchanged). Reads + writes hit
 * the local store SYNCHRONOUSLY, so the app always works offline; when a cloud
 * transport is configured a write also pushes in the background and the sync
 * state moves idle → syncing → synced (or → error). With no transport the store
 * is `offline` (local-only). State changes are broadcast on `sync:status`.
 *
 * Iteration 1: pushes are DEBOUNCED + BATCHED (rapid writes coalesce into one
 * background push), and on `book:opened` the open book is RECONCILED with the
 * cloud last-write-wins (the newer `updatedAt` wins) — adopting a newer cloud
 * copy locally (and notifying views via `book:updated`) or pushing a newer local
 * copy up. Reconciliation is the one place the persistence layer is book-aware
 * (it resolves the book key + emits `book:updated`); everything else stays generic.
 */
export interface CloudSyncService extends PersistenceService {
	status(): SyncStatus
}

/** A persisted value carrying an ISO `updatedAt` — the LWW comparison field. */
interface Timestamped {
	updatedAt?: string
}

export function createCloudSyncService(
	local: PersistenceService,
	events: EventBus,
	transport?: CloudTransport,
	options: CloudSyncOptions = {},
): CloudSyncService {
	const debounceMs = options.debounceMs ?? 300
	let status: SyncStatus = transport === undefined ? 'offline' : 'idle'
	// Pending writes coalesced by key; flushed as one batch after the debounce.
	const pending = new Map<string, unknown>()
	let flushTimer: ReturnType<typeof setTimeout> | null = null

	function setStatus(next: SyncStatus): void {
		if (next === status) return // only emit on a real change (no per-keystroke noise)
		status = next
		events.emit('sync:status', { status })
	}

	function flush(): void {
		flushTimer = null
		if (transport === undefined || pending.size === 0) return
		const batch = [...pending.entries()]
		pending.clear()
		Promise.all(batch.map(([key, value]) => transport.push(key, value)))
			.then(() => setStatus('synced'))
			.catch(() => setStatus('error'))
	}

	function scheduleFlush(key: string, value: unknown): void {
		if (transport === undefined) return // local-only: stay `offline`, never block the write
		pending.set(key, value) // last value per key wins within the window
		setStatus('syncing')
		if (flushTimer !== null) clearTimeout(flushTimer)
		flushTimer = setTimeout(flush, debounceMs)
	}

	/** Last-write-wins reconciliation of one book against the cloud (KR background). */
	function reconcile(bookId: string): void {
		if (transport?.pull === undefined) return
		const key = bookKey(bookId)
		transport
			.pull(key)
			.then((cloud) => {
				const localValue = local.get<Timestamped>(key)
				if (cloud === null) {
					// Cloud has nothing yet: seed it with the local copy.
					if (localValue !== null) scheduleFlush(key, localValue)
					return
				}
				const localAt = localValue?.updatedAt ?? ''
				const cloudAt = (cloud as Timestamped).updatedAt ?? ''
				if (cloudAt > localAt) {
					// Cloud is newer: adopt it locally (write underneath, do NOT re-push)
					// and notify the open views to re-read the changed document.
					local.set(key, cloud)
					events.emit('book:updated', { bookId })
				} else if (localAt > cloudAt) {
					// Local is newer: push it up.
					scheduleFlush(key, localValue)
				}
			})
			.catch(() => setStatus('error'))
	}

	if (transport !== undefined) {
		events.on('book:opened', ({ bookId }) => reconcile(bookId))
	}

	return {
		get<T>(key: string): T | null {
			return local.get<T>(key)
		},
		set<T>(key: string, value: T): void {
			local.set<T>(key, value) // local-first: persist synchronously before any cloud work
			scheduleFlush(key, value) // debounced, batched background push
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
