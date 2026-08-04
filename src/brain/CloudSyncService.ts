import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import type { SyncStatus } from './types'
import type { Book, BookNode } from './tree'
import {
	bookKey,
	BOOK_KEY_PREFIX,
	bookContentKey,
	bookImageKey,
	bookImagesManifestKey,
	dossierKey,
	CLOUDSYNC_QUEUE_KEY,
} from './persistenceKeys'
import { DOSSIER_SCHEMA, type Dossier } from './dossier/types'

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
 *
 * Iteration 5: Book PAYLOAD SPLITTING — illustrations and PNJ portraits are
 * extracted from the book JSON before pushing to the cloud and stored as separate
 * KV entries (bookImageKey). A manifest key (bookImagesManifestKey) tracks which
 * image keys belong to the book. Each key is independently addressable; no full
 * book blob is ever pushed. The local store still
 * holds the full book (with images) at bookKey — splitting is a transport concern
 * only. Legacy books (stored at the plain bookKey) are migrated transparently on
 * first reconcile.
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

	/** Queue several entries atomically and schedule a debounced flush. */
	function queueMultiple(entries: Array<[string, unknown]>): void {
		if (transport === undefined) return
		for (const [k, v] of entries) queue.set(k, v)
		persistQueue()
		setStatus('syncing')
		scheduleFlush()
	}

	// ── Book payload splitting (iter 5) ──────────────────────────────────────
	// Book-awareness here is intentional: splitting images from content is a
	// transport-layer optimisation so text edits don't re-push megabytes of
	// unchanged image data. The local store is untouched (always full book).

	function isBook(value: unknown): value is Book {
		return (
			typeof value === 'object' &&
			value !== null &&
			typeof (value as Record<string, unknown>).id === 'string' &&
			Array.isArray((value as Record<string, unknown>).nodes)
		)
	}

	/**
	 * Reconnaissance de la forme DOSSIER (KR-163). Un dossier n'a pas de `nodes` :
	 * sans ce prédicat il retomberait en poussée monolithique par DÉFAUT — ce qui
	 * est la bonne route (aucun champ ne porte de data URL au schéma 1, donc aucun
	 * découpage de clés), mais par accident et non par décision, et surtout
	 * `reconcile()` n'étant armé que par `book:opened`, AUCUNE réconciliation cloud
	 * n'aurait lieu sur un dossier sans qu'un seul test rougisse.
	 */
	function isDossier(value: unknown): value is Dossier & Timestamped {
		return (
			typeof value === 'object' &&
			value !== null &&
			(value as Record<string, unknown>).schema === DOSSIER_SCHEMA &&
			typeof (value as Record<string, unknown>).id === 'string'
		)
	}

	/** True when `key` is the plain book key (not a split :content/:img:/:images key). */
	function isRawBookKey(key: string): boolean {
		if (!key.startsWith(BOOK_KEY_PREFIX)) return false
		// After the prefix the plain key is just the bookId (a UUID with no colons).
		// Split keys append :content, :img:…, or :images — all contain a colon.
		return !key.slice(BOOK_KEY_PREFIX.length).includes(':')
	}

	/**
	 * Strip illustration and pnj.portrait data URLs from a Book and return them
	 * as a map of imageKey → dataUrl. The returned `content` Book has those fields
	 * set to undefined (omitted from JSON.stringify), so the pushed payload is small.
	 */
	function splitBook(bookId: string, book: Book): { content: Book; images: Map<string, string> } {
		const images = new Map<string, string>()
		const nodes: BookNode[] = book.nodes.map((node) => {
			const n: BookNode = { ...node }
			if (typeof n.illustration === 'string') {
				images.set(bookImageKey(bookId, n.id, 'illustration'), n.illustration)
				n.illustration = undefined
			}
			if (n.pnj !== undefined && typeof n.pnj.portrait === 'string') {
				images.set(bookImageKey(bookId, n.id, 'portrait'), n.pnj.portrait)
				n.pnj = { ...n.pnj, portrait: undefined }
			}
			return n
		})
		return { content: { ...book, nodes }, images }
	}

	/** Reattach image data URLs into a content-only Book using the pull results. */
	function reassembleBook(content: unknown, imageEntries: Array<[string, unknown]>): Book {
		const book = JSON.parse(JSON.stringify(content)) as Book
		for (const [imgKey, dataUrl] of imageEntries) {
			if (typeof dataUrl !== 'string') continue
			// Key shape: …:img:{nodeId}:{field}
			const afterImg = imgKey.split(':img:')[1]
			if (!afterImg) continue
			const colonIdx = afterImg.indexOf(':')
			if (colonIdx === -1) continue
			const nodeId = afterImg.slice(0, colonIdx)
			const field = afterImg.slice(colonIdx + 1)
			const node = book.nodes.find((n) => n.id === nodeId)
			if (!node) continue
			if (field === 'illustration') {
				node.illustration = dataUrl
			} else if (field === 'portrait' && node.pnj !== undefined) {
				node.pnj = { ...node.pnj, portrait: dataUrl }
			}
		}
		return book
	}

	/** Remove all queue entries that belong to bookId (legacy + split keys). */
	function clearBookFromQueue(bookId: string): void {
		const prefix = bookKey(bookId) // 'genliv:book:{id}'
		queue.delete(prefix)
		for (const k of [...queue.keys()]) {
			if (k.startsWith(prefix + ':')) queue.delete(k)
		}
	}

	/** True if any queue entry belongs to this book (pending local changes). */
	function hasPendingBookChanges(bookId: string): boolean {
		const prefix = bookKey(bookId)
		if (queue.has(prefix)) return true
		for (const k of queue.keys()) {
			if (k.startsWith(prefix + ':')) return true
		}
		return false
	}

	/** Push a book to the queue in split format (content + images + manifest). */
	function queueBookSplit(bookId: string, book: Book): void {
		const { content, images } = splitBook(bookId, book)
		queueMultiple([
			[bookContentKey(bookId), content],
			[bookImagesManifestKey(bookId), [...images.keys()]],
			...images.entries(),
		])
	}

	// ──────────────────────────────────────────────────────────────────────────

	/** Last-write-wins reconciliation of one book against the cloud. */
	function reconcile(bookId: string): void {
		if (transport?.pull === undefined) return

		const pull = transport.pull.bind(transport)
		const legacyKey = bookKey(bookId)

		async function run(): Promise<void> {
			// Try the split content key first; fall back to the legacy monolithic key.
			// The content key value is valid only when it carries a `nodes` array —
			// otherwise the transport returned some other value (e.g. a legacy full
			// book stored at a colliding key, or a test stub that returns the same
			// object for all keys). Migration: first cloud push is always split; old
			// books in KV were stored at the legacy key and are read via the fallback.
			const cloudContent = await pull(bookContentKey(bookId))
			let cloudBook: (Book & Timestamped) | null

			if (cloudContent !== null && Array.isArray((cloudContent as Book).nodes)) {
				// New split format: reassemble from content + manifest images.
				const manifest = (await pull(bookImagesManifestKey(bookId))) as string[] | null
				const imgKeys = Array.isArray(manifest) ? manifest : []
				const imageEntries = await Promise.all(
					imgKeys.map(async (imgKey) => [imgKey, await pull(imgKey)] as [string, unknown]),
				)
				cloudBook = reassembleBook(cloudContent, imageEntries) as Book & Timestamped
			} else {
				// Legacy format (pre-split) or no cloud data yet.
				cloudBook = (await pull(legacyKey)) as (Book & Timestamped) | null
			}

			const localBook = local.get<Book & Timestamped>(legacyKey)

			if (cloudBook === null) {
				// Cloud has nothing yet: seed it with the local copy.
				if (localBook !== null && isBook(localBook)) queueBookSplit(localBook.id, localBook)
				return
			}

			const localAt = localBook?.updatedAt ?? ''
			const cloudAt = cloudBook.updatedAt ?? ''

			if (cloudAt > localAt) {
				if (hasPendingBookChanges(bookId)) {
					// CONFLICT (iter 3): local has UNPUSHED edits AND the cloud moved to a
					// newer version — both diverged. Surface a resolution affordance.
					conflictMap.set(bookId, cloudBook)
					events.emit('sync:conflict', { bookId })
				} else {
					// Cloud is newer and local is clean: adopt it and notify views.
					local.set(legacyKey, cloudBook)
					events.emit('book:updated', { bookId })
				}
			} else if (localAt > cloudAt) {
				// Local is newer: push it up. Split format for proper Books;
				// fallback to the legacy key for any other value (type-narrowing safety).
				if (isBook(localBook)) {
					queueBookSplit(localBook.id, localBook)
				} else if (localBook !== null) {
					queuePush(legacyKey, localBook)
				}
			}
		}

		run().catch(() => setStatus('error'))
	}

	/**
	 * Réconciliation dernier-écrit-gagne d'un DOSSIER, sur `updatedAt` (KR-163).
	 * Le dossier se pousse et se tire ENTIER, sous sa propre clé : pas de découpage
	 * (aucun champ ne porte de data URL au schéma 1), donc pas de manifeste ni de
	 * clés d'image à recomposer.
	 *
	 * Le gel n'a PAS lieu ici : `deepFreeze` n'a qu'un seul site d'appel, la sortie
	 * de `validateDossier` (KR-166). Un dossier adopté ici entre dans le magasin
	 * local et ressort GELÉ par `DossierService.get`, qui le re-valide (désaccord 6) —
	 * jamais brut. L'écriture cloud d'un document non validé reste ouverte et
	 * traitée en n° 9 (seconde porte au démarrage de session).
	 */
	function reconcileDossier(dossierId: string): void {
		if (transport?.pull === undefined) return

		const pull = transport.pull.bind(transport)
		const key = dossierKey(dossierId)

		async function run(): Promise<void> {
			const cloudValue = await pull(key)
			const localDossier = local.get<Dossier & Timestamped>(key)

			if (!isDossier(cloudValue)) {
				// Rien en face, ou une valeur qui n'est PAS un dossier : on ne l'adopte
				// jamais (elle écraserait le local). Cloud vide → on l'ensemence.
				if (isDossier(localDossier)) queuePush(key, localDossier)
				return
			}

			const localAt = localDossier?.updatedAt ?? ''
			const cloudAt = cloudValue.updatedAt ?? ''

			if (cloudAt > localAt) {
				// Écrit sous le magasin LOCAL, jamais par le `set` décoré : sinon la copie
				// qu'on vient de tirer repartirait aussitôt en poussée (boucle d'écho).
				local.set(key, cloudValue)
				events.emit('dossier:updated', { dossierId })
			} else if (localAt > cloudAt && isDossier(localDossier)) {
				queuePush(key, localDossier)
			}
		}

		run().catch(() => setStatus('error'))
	}

	if (transport !== undefined) {
		events.on('book:opened', ({ bookId }) => reconcile(bookId))
		events.on('dossier:opened', ({ dossierId }) => reconcileDossier(dossierId))
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
			if (isRawBookKey(key) && isBook(value)) {
				// Split book payload: push content without images + images separately.
				// Each key is independently addressable; no N-MB monolith is ever pushed.
				queueBookSplit(value.id, value)
			} else {
				queuePush(key, value) // all other keys pushed as-is
			}
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
				// Adopt cloud: overwrite local (full book with images), clear ALL queued
				// entries for this book (legacy + split keys), then notify views.
				local.set(key, cloud)
				clearBookFromQueue(bookId)
				persistQueue()
				events.emit('book:updated', { bookId })
			} else {
				// Keep local: (re)push the local copy in split format.
				const localValue = local.get<Book>(key)
				if (localValue !== null && isBook(localValue)) queueBookSplit(localValue.id, localValue)
			}
			// Notify conflict subscribers to re-read (the book is no longer in conflict).
			events.emit('sync:conflict', { bookId })
		},
	}
}
