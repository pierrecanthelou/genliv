import type { ReactNode } from 'react'

/**
 * SlotRegistry — the Open/Closed seam for one feature to fill a named region
 * owned by another, without either importing the other. The host (e.g.
 * node-editor) renders whatever is registered for its slot id; a provider
 * feature (e.g. choice-linking) registers a renderer at the composition root.
 * Mirrors ActionRegistry, but for arbitrary panel slots.
 */
export interface SlotContext {
	bookId: string
	nodeId: string
}

export type SlotRenderer = (ctx: SlotContext) => ReactNode

export interface SlotRegistry {
	/** Register a renderer for a slot id; returns an unregister fn. */
	register(slotId: string, render: SlotRenderer): () => void
	get(slotId: string): SlotRenderer | null
}

export function createSlotRegistry(): SlotRegistry {
	const renderers = new Map<string, SlotRenderer>()
	return {
		register(slotId, render) {
			renderers.set(slotId, render)
			return () => {
				if (renderers.get(slotId) === render) renderers.delete(slotId)
			}
		},
		get(slotId) {
			return renderers.get(slotId) ?? null
		},
	}
}

/** Slot id constants (avoid stringly-typed drift across features). */
export const SLOT_NODE_EDITOR_CHOICES = 'node-editor:choices'
