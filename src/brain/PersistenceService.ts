/**
 * PersistenceService — the only gateway to durable storage (KR-011/111).
 * Interface-first so the localStorage implementation can be swapped for a
 * cloud-backed one (cloud-sync feature) without touching callers (Liskov).
 */
export interface PersistenceService {
	get<T>(key: string): T | null
	set<T>(key: string, value: T): void
	remove(key: string): void
	/** All stored keys beginning with `prefix` (for listing collections). */
	keys(prefix: string): string[]
}

export function createLocalStoragePersistence(storage: Storage = window.localStorage): PersistenceService {
	return {
		get<T>(key: string): T | null {
			const raw = storage.getItem(key)
			if (raw === null) return null
			try {
				return JSON.parse(raw) as T
			} catch {
				return null
			}
		},
		set<T>(key: string, value: T): void {
			storage.setItem(key, JSON.stringify(value))
		},
		remove(key: string): void {
			storage.removeItem(key)
		},
		keys(prefix: string): string[] {
			const result: string[] = []
			for (let i = 0; i < storage.length; i++) {
				const key = storage.key(i)
				if (key !== null && key.startsWith(prefix)) {
					result.push(key)
				}
			}
			return result
		},
	}
}
