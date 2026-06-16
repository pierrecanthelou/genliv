import { createSelectionService } from './SelectionService'
import { createEventBus } from './EventBus'

function setup() {
	const events = createEventBus()
	const selection = createSelectionService(events)
	return { events, selection }
}

describe('SelectionService', () => {
	it('holds the selected node id and notifies subscribers', () => {
		const { selection } = setup()
		let ticks = 0
		selection.subscribe(() => {
			ticks += 1
		})
		selection.select('book_1', 'node_a')
		expect(selection.getSelected()).toBe('node_a')
		expect(ticks).toBe(1)
	})

	it('emits node:selected carrying the book and node', () => {
		const { events, selection } = setup()
		const seen: Array<string | null> = []
		events.on('node:selected', ({ nodeId }) => seen.push(nodeId))
		selection.select('book_1', 'node_a')
		selection.select('book_1', null)
		expect(seen).toEqual(['node_a', null])
	})

	it('is idempotent: re-selecting the same node does not re-emit', () => {
		const { events, selection } = setup()
		let emits = 0
		events.on('node:selected', () => {
			emits += 1
		})
		selection.select('book_1', 'node_a')
		selection.select('book_1', 'node_a')
		expect(emits).toBe(1)
	})

	it('clears selection when a different book is opened (no cross-book bleed)', () => {
		const { events, selection } = setup()
		selection.select('book_1', 'node_a')
		events.emit('book:opened', { bookId: 'book_2' })
		expect(selection.getSelected()).toBeNull()
	})
})
