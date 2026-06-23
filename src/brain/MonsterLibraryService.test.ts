import { createMonsterLibraryService } from './MonsterLibraryService'
import { createLocalStoragePersistence } from './PersistenceService'
import { MONSTER_LIBRARY_KEY } from './persistenceKeys'
import type { MonsterConfig } from './types'

const monster = (over: Partial<MonsterConfig> = {}): MonsterConfig => ({
	name: 'Gobelin',
	pv: 10,
	attack: 2,
	defense: 1,
	outcomes: { reussite: '', echec: '' },
	...over,
})

describe('MonsterLibraryService', () => {
	beforeEach(() => window.localStorage.clear())

	it('saves a monster and lists it with a stable library id', () => {
		const lib = createMonsterLibraryService(createLocalStoragePersistence())
		const entry = lib.save(monster({ name: 'Orc' }))
		expect(entry.id).toBeTruthy()
		expect(lib.list()).toHaveLength(1)
		expect(lib.list()[0].config.name).toBe('Orc')
	})

	it('strips node-specific targets when saving (a library monster is book-agnostic)', () => {
		const lib = createMonsterLibraryService(createLocalStoragePersistence())
		const entry = lib.save(monster({ victoryTarget: 'node_1', fleeTarget: 'node_2' }))
		expect(entry.config.victoryTarget).toBeUndefined()
		expect(entry.config.fleeTarget).toBeUndefined()
		// Saving deep-copies: the source is not mutated.
		expect(lib.list()[0].config.pv).toBe(10)
	})

	it('removes a saved monster by id', () => {
		const lib = createMonsterLibraryService(createLocalStoragePersistence())
		const a = lib.save(monster({ name: 'A' }))
		lib.save(monster({ name: 'B' }))
		lib.remove(a.id)
		expect(lib.list().map((m) => m.config.name)).toEqual(['B'])
	})

	it('returns a STABLE snapshot reference between writes (useSyncExternalStore-safe)', () => {
		const lib = createMonsterLibraryService(createLocalStoragePersistence())
		const first = lib.list()
		expect(lib.list()).toBe(first)
		lib.save(monster())
		expect(lib.list()).not.toBe(first)
	})

	it('notifies subscribers on change and stops after unsubscribe', () => {
		const lib = createMonsterLibraryService(createLocalStoragePersistence())
		const listener = jest.fn()
		const off = lib.subscribe(listener)
		lib.save(monster())
		expect(listener).toHaveBeenCalledTimes(1)
		off()
		lib.save(monster())
		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('persists across a reload: a fresh service over the same store reads the library', () => {
		const store = createLocalStoragePersistence()
		createMonsterLibraryService(store).save(monster({ name: 'Persistant' }))
		expect(createMonsterLibraryService(store).list()[0].config.name).toBe('Persistant')
		// Stored under the dedicated key (not a book key).
		expect(window.localStorage.getItem(MONSTER_LIBRARY_KEY)).not.toBeNull()
	})

	it('seedDefaults() migrates legacy free-text capacity to registry id on subsequent launches (BUG)', () => {
		const store = createLocalStoragePersistence()
		const lib = createMonsterLibraryService(store)
		// Simulate an old bestiary entry seeded with free-text capacity.
		const oldTemplate = monster({ templateId: 'gobelin', capacity: 'Vole un objet mineur.' })
		lib.seedDefaults([oldTemplate])
		expect(lib.list()[0].config.capacity).toBe('Vole un objet mineur.')

		// Fresh service (page reload) with updated bestiary using id.
		const newTemplate = monster({ templateId: 'gobelin', capacity: 'vol' })
		const lib2 = createMonsterLibraryService(store)
		lib2.seedDefaults([newTemplate])
		// Migration pass updated the capacity to the new id.
		expect(lib2.list()[0].config.capacity).toBe('vol')
	})

	it('seedDefaults() seeds templates once (idempotent) and does not re-inject after deletion', () => {
		const store = createLocalStoragePersistence()
		const lib = createMonsterLibraryService(store)
		const template = monster({ name: 'Dragon', templateId: 'dragon' })
		lib.seedDefaults([template])
		expect(lib.list()).toHaveLength(1)
		lib.seedDefaults([template])
		expect(lib.list()).toHaveLength(1) // idempotent
		lib.remove(lib.list()[0].id)
		lib.seedDefaults([template])
		expect(lib.list()).toHaveLength(0) // anti-re-injection: deleted entries do not come back
	})
})
