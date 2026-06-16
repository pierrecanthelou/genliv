import type { ReactNode } from 'react'
import type { NodeActionType } from './types'

/**
 * ActionRegistry — the Open/Closed seam for required-action editors (KR-051).
 * The four action-* features each self-register their editor here; node-editor
 * mounts whatever is registered for a node's action type WITHOUT importing any
 * action feature. Adding a new action type requires zero changes to node-editor.
 */
export interface ActionEditorContext {
	bookId: string
	nodeId: string
}

export interface ActionEditor {
	type: NodeActionType
	/** Mono label shown in the « Action requise » SegmentedControl. */
	label: string
	render(ctx: ActionEditorContext): ReactNode
}

export interface ActionRegistry {
	/** Self-registration entry point for action-* features; returns an unregister. */
	register(editor: ActionEditor): () => void
	get(type: NodeActionType): ActionEditor | null
	/** Registered editors in insertion order (drives the SegmentedControl options). */
	list(): ActionEditor[]
}

export function createActionRegistry(): ActionRegistry {
	const editors = new Map<NodeActionType, ActionEditor>()

	return {
		register(editor) {
			editors.set(editor.type, editor)
			return () => {
				if (editors.get(editor.type) === editor) editors.delete(editor.type)
			}
		},
		get(type) {
			return editors.get(type) ?? null
		},
		list() {
			return [...editors.values()]
		},
	}
}
