import type { EventBus } from './EventBus'

/**
 * SelectionService — the single source of truth for which node is selected
 * in the open book (KR-024). Both tree-canvas (and later outline-view) and
 * node-editor read/write selection here, so the canvas highlight and the
 * editor panel never diverge. Setting selection emits node:selected; opening
 * a different book clears it. No feature keeps a competing copy.
 */
export interface SelectionService {
	getSelected(): string | null
	/** Select a node (or clear with null) within a book; emits node:selected. */
	select(bookId: string, nodeId: string | null): void
	subscribe(listener: () => void): () => void
}

export function createSelectionService(events: EventBus): SelectionService {
	let selected: string | null = null
	const listeners = new Set<() => void>()

	function notify(): void {
		for (const listener of [...listeners]) listener()
	}

	// A different book is now open: stale selection must not bleed across books.
	events.on('book:opened', () => {
		if (selected !== null) {
			selected = null
			notify()
		}
	})

	return {
		getSelected() {
			return selected
		},
		select(bookId, nodeId) {
			if (nodeId === selected) return // idempotent: no redundant emit/render
			selected = nodeId
			notify()
			events.emit('node:selected', { bookId, nodeId })
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}
