import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { SyncStatus } from './types'
import { bookKey, CLOUDSYNC_QUEUE_KEY } from './persistenceKeys'

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
 *
 * Iteration 2: the pending pushes are an OFFLINE QUEUE persisted locally
 * (`CLOUDSYNC_QUEUE_KEY`), so an unconfirmed write survives a reload and is
 * flushed on reconnect (on the next write, on `retry()`, or on startup). A failed
 * push keeps the queue (status → `error`) and `pendingCount()` surfaces the
 * « N changements en attente » count alongside the status on `sync:status`.
 */
export interface CloudSyncService extends PersistenceService {
	status(): SyncStatus
	/** How many writes are queued (pushed locally, not yet confirmed to the cloud). */
	pendingCount(): number
	/**
	 * The storage keys with a write still queued (not yet confirmed to the cloud).
	 * Generic by key — the decorator stays book-agnostic (KR-094); a book-aware
	 * consumer maps bookKey(id) onto this to show per-book « non synchronisé ».
	 */
	pendingKeys(): string[]
	/** Retry the offline queue now (e.g. on reconnect); a no-op when empty/offline. */
	retry(): void
	/**
	 * Book ids currently in CONFLICT — both sides diverged (local has unpushed edits
	 * AND the cloud copy is newer), so reconciliation did NOT silently overwrite
	 * either (iter 3). Resolved via resolveConflict.
	 */
	conflicts(): string[]
	/**
	 * Resolve a book's conflict: keep the local version (`local` — push it up) or
	 * adopt the cloud version (`cloud` — overwrite local, discard the queued local
	 * edit). Clears the conflict and notifies (book:updated on adopt). No-op if the
	 * book is not in conflict.
	 */
	resolveConflict(bookId: string, choice: 'local' | 'cloud'): void
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
	// The OFFLINE QUEUE: writes pushed locally but not yet confirmed to the cloud,
	// coalesced by key (last value wins) and PERSISTED so they survive a reload and
	// flush on reconnect (iter 2). Loaded from the local store at startup.
	const queue = new Map<string, unknown>(local.get<[string, unknown][]>(CLOUDSYNC_QUEUE_KEY) ?? [])
	let flushTimer: ReturnType<typeof setTimeout> | null = null
	let flushing = false
	// Books in CONFLICT, by bookId → the cloud value awaiting resolution. Transient
	// (in-memory; re-detected on the next book:opened) — never silently overwritten.
	const conflictMap = new Map<string, unknown>()

	function persistQueue(): void {
		// Persist via the UNDERLYING local store, never the decorated set — the queue
		// is local metadata and must not itself be pushed (no echo loop).
		local.set(CLOUDSYNC_QUEUE_KEY, [...queue.entries()])
	}

	// Emit only on a real STATUS change (no per-keystroke noise). The pending count
	// rides every emit and is re-read by useSyncPending; offline, the status toggles
	// syncing↔error per write so the « N en attente » count stays live.
	function setStatus(next: SyncStatus): void {
		if (next === status) return
		status = next
		events.emit('sync:status', { status, pending: queue.size })
	}

	function flush(): void {
		flushTimer = null
		if (transport === undefined || flushing || queue.size === 0) return
		flushing = true
		setStatus('syncing')
		const batch = [...queue.entries()]
		Promise.all(batch.map(([key, value]) => transport.push(key, value)))
			.then(() => {
				// Drop only the entries we actually pushed; a newer write to the same key
				// during the in-flight push keeps its (different) value queued.
				for (const [key, value] of batch) if (queue.get(key) === value) queue.delete(key)
				persistQueue()
				if (queue.size === 0) setStatus('synced')
				else scheduleFlush() // newer writes arrived during the push → push them too
			})
			.catch(() => setStatus('error')) // queue retained → « N en attente » surfaces, retried later
			.finally(() => {
				flushing = false
			})
	}

	function scheduleFlush(): void {
		if (transport === undefined) return
		if (flushTimer !== null) clearTimeout(flushTimer)
		flushTimer = setTimeout(flush, debounceMs)
	}

	/** Queue a write for the background push (local-only stores stay `offline`). */
	function queuePush(key: string, value: unknown): void {
		if (transport === undefined) return // local-only: stay `offline`, never block the write
		queue.set(key, value) // last value per key wins within the window
		persistQueue()
		setStatus('syncing')
		scheduleFlush()
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
					if (localValue !== null) queuePush(key, localValue)
					return
				}
				const localAt = localValue?.updatedAt ?? ''
				const cloudAt = (cloud as Timestamped).updatedAt ?? ''
				if (cloudAt > localAt) {
					if (queue.has(key)) {
						// CONFLICT (iter 3): local has UNPUSHED edits (key still queued) AND the
						// cloud moved to a newer version — both diverged. Do NOT silently LWW;
						// stash the cloud copy and surface a resolution affordance instead.
						conflictMap.set(bookId, cloud)
						events.emit('sync:conflict', { bookId })
					} else {
						// Cloud is newer and local is clean (no unpushed edits): safe to adopt it
						// locally (write underneath, do NOT re-push) and notify open views.
						local.set(key, cloud)
						events.emit('book:updated', { bookId })
					}
				} else if (localAt > cloudAt) {
					// Local is newer: push it up.
					queuePush(key, localValue)
				}
			})
			.catch(() => setStatus('error'))
	}

	if (transport !== undefined) {
		events.on('book:opened', ({ bookId }) => reconcile(bookId))
		// A backlog persisted from a previous session: flush it on (re)start.
		if (queue.size > 0) {
			setStatus('syncing')
			scheduleFlush()
		}
	}

	return {
		get<T>(key: string): T | null {
			return local.get<T>(key)
		},
		set<T>(key: string, value: T): void {
			local.set<T>(key, value) // local-first: persist synchronously before any cloud work
			queuePush(key, value) // queue + debounced, batched background push
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
		pendingCount(): number {
			return queue.size
		},
		pendingKeys(): string[] {
			return [...queue.keys()]
		},
		retry(): void {
			if (flushTimer !== null) {
				clearTimeout(flushTimer)
				flushTimer = null
			}
			flush()
		},
		conflicts(): string[] {
			return [...conflictMap.keys()]
		},
		resolveConflict(bookId, choice): void {
			const cloud = conflictMap.get(bookId)
			if (cloud === undefined) return
			conflictMap.delete(bookId)
			const key = bookKey(bookId)
			if (choice === 'cloud') {
				// Adopt the cloud version: overwrite local + discard the queued local edit
				// (write underneath, never the decorated set — no echo loop).
				local.set(key, cloud)
				queue.delete(key)
				persistQueue()
				events.emit('book:updated', { bookId })
			} else {
				// Keep local: (re)queue the local copy so it pushes over the cloud.
				const localValue = local.get(key)
				if (localValue !== null) queuePush(key, localValue)
			}
			// Notify conflict subscribers to re-read (the book is no longer in conflict).
			events.emit('sync:conflict', { bookId })
		},
	}
}
