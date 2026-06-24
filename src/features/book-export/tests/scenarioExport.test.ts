import { exportScenario, isScenarioExport } from '../../../brain'
import { createBrain } from '../../../brain'

describe('exportScenario', () => {
	it('returns a ScenarioExport with the correct format and version', () => {
		const brain = createBrain()
		const book = brain.books.createBook('Mon Aventure')
		const result = exportScenario(book)
		expect(result.format).toBe('genliv-scenario')
		expect(result.version).toBe(1)
		expect(result.book.title).toBe('Mon Aventure')
		expect(result.book.nodes.length).toBeGreaterThan(0)
	})
})

describe('isScenarioExport', () => {
	it('accepts a well-formed ScenarioExport', () => {
		const payload = {
			format: 'genliv-scenario',
			version: 1,
			exportedAt: '2024-01-01T00:00:00.000Z',
			book: { id: 'b1', title: 'T', createdAt: '', updatedAt: '', nodes: [], edges: [] },
		}
		expect(isScenarioExport(payload)).toBe(true)
	})

	it('rejects a play export (wrong format marker)', () => {
		const payload = { format: 'genliv-play', version: 1, book: { id: 'x', title: 'X', nodes: [], edges: [] } }
		expect(isScenarioExport(payload)).toBe(false)
	})

	it('rejects null and primitives', () => {
		expect(isScenarioExport(null)).toBe(false)
		expect(isScenarioExport('string')).toBe(false)
		expect(isScenarioExport(42)).toBe(false)
	})

	it('rejects a payload with wrong version', () => {
		const payload = { format: 'genliv-scenario', version: 2, book: { id: 'b', title: 'T', nodes: [], edges: [] } }
		expect(isScenarioExport(payload)).toBe(false)
	})

	it('rejects a payload with missing book fields', () => {
		expect(isScenarioExport({ format: 'genliv-scenario', version: 1, book: null })).toBe(false)
		expect(isScenarioExport({ format: 'genliv-scenario', version: 1, book: { id: 'b' } })).toBe(false)
	})
})

describe('BookService.importBook', () => {
	beforeEach(() => window.localStorage.clear())

	it('creates a new book with a fresh id from a valid ScenarioExport', () => {
		const brain = createBrain()
		const original = brain.books.createBook('Livre importé')
		const snapshot = exportScenario(original)
		const imported = brain.books.importBook(snapshot)
		expect(imported).not.toBeNull()
		expect(imported!.id).not.toBe(original.id)
		expect(imported!.title).toBe('Livre importé')
	})

	it('returns null for an invalid payload', () => {
		const brain = createBrain()
		expect(brain.books.importBook({ format: 'genliv-play' })).toBeNull()
		expect(brain.books.importBook(null)).toBeNull()
	})

	it('emits book:created after import', () => {
		const brain = createBrain()
		const original = brain.books.createBook('Test')
		const snapshot = exportScenario(original)
		const listener = jest.fn()
		brain.events.on('book:created', listener)
		brain.books.importBook(snapshot)
		expect(listener).toHaveBeenCalled()
	})
})
