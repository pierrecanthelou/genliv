import type { PersistenceService } from './PersistenceService'
import type { MonsterConfig } from './types'
import { MONSTER_LIBRARY_KEY } from './persistenceKeys'
import { createId } from './utils/id'

/** One reusable monster in the library — a stable id + its config (node-specific targets stripped). */
export interface SavedMonster {
	id: string
	config: MonsterConfig
}

/**
 * MonsterLibraryService — a persisted, CROSS-BOOK library of reusable monsters
 * (« la librairie du générateur », action-monster iter 3). Unlike the within-book
 * PNJ/object references (which resolve live), a library monster is INSTANTIATED
 * as an independent COPY into a node (different books cannot share a live
 * reference). Persisted through the raw local store under MONSTER_LIBRARY_KEY
 * (not a book document, not cloud-synced). Reads come from an in-memory cache so
 * a snapshot reference is stable between writes (useSyncExternalStore-safe).
 */
export interface MonsterLibraryService {
	/** The saved monsters (a stable cached reference until the next write). */
	list(): SavedMonster[]
	/** Save a monster to the library (node-specific targets stripped); returns the entry. */
	save(config: MonsterConfig): SavedMonster
	/** Remove a saved monster by its library id. */
	remove(id: string): void
	/** Subscribe to library changes (for useSyncExternalStore). Returns an unsubscribe. */
	subscribe(listener: () => void): () => void
}

/**
 * A library monster carries no node-specific targets — those reference nodes in a
 * particular book and are meaningless once reused elsewhere. Loot keeps its data
 * but is re-cloned on instantiate (a fresh object id) by the caller.
 */
function toLibraryConfig(config: MonsterConfig): MonsterConfig {
	const clone = JSON.parse(JSON.stringify(config)) as MonsterConfig
	delete clone.victoryTarget
	delete clone.fleeTarget
	return clone
}

export function createMonsterLibraryService(local: PersistenceService): MonsterLibraryService {
	let cache: SavedMonster[] = local.get<SavedMonster[]>(MONSTER_LIBRARY_KEY) ?? []
	const listeners = new Set<() => void>()

	function commit(next: SavedMonster[]): void {
		cache = next
		local.set(MONSTER_LIBRARY_KEY, next)
		for (const listener of [...listeners]) listener()
	}

	return {
		list() {
			return cache
		},
		save(config) {
			const entry: SavedMonster = { id: createId('monster'), config: toLibraryConfig(config) }
			commit([...cache, entry])
			return entry
		},
		remove(id) {
			commit(cache.filter((m) => m.id !== id))
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}
