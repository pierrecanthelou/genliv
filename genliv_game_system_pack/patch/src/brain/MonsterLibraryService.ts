import type { PersistenceService } from './PersistenceService'
import type { MonsterConfig } from './types'
import { MONSTER_LIBRARY_KEY, MONSTER_LIBRARY_SEEDED_KEY } from './persistenceKeys'
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
	/**
	 * Seed the canonical bestiary (§ 4) ONCE. Idempotent: it runs only if the seed
	 * marker is unset, so a user who later deletes bestiary entries is not
	 * re-seeded on the next launch. Entries already present (by templateId) are not
	 * duplicated. No-op after the first successful seed.
	 */
	seedDefaults(templates: MonsterConfig[]): void
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
		seedDefaults(templates) {
			// One-time guard (KR-011): a deleted bestiary entry must NOT come back.
			if (local.get<boolean>(MONSTER_LIBRARY_SEEDED_KEY) === true) return
			const existing = new Set(cache.map((m) => m.config.templateId).filter((t): t is string => t !== undefined))
			const added = templates
				.filter((t) => t.templateId === undefined || !existing.has(t.templateId))
				.map((config) => ({ id: createId('monster'), config: toLibraryConfig(config) }))
			local.set(MONSTER_LIBRARY_SEEDED_KEY, true)
			if (added.length > 0) commit([...cache, ...added])
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}
