/**
 * brain/ — the application core engine. Drives navigation, cross-feature
 * communication (Event Bus), and service wiring (Service Locator + DI).
 * Feature-agnostic: never imports from features/.
 */
export type { Book, BookNode, Edge, NodeKind, EdgeKind, NodeActionType } from './types'
export type { EventBus, AppEvents, AppEventName } from './EventBus'
export type { PersistenceService } from './PersistenceService'
export type { Router, Route } from './Router'
export type { BookService, NodePatch } from './BookService'
export { autoSlot } from './BookService'
export type { SelectionService } from './SelectionService'
export type { ActionRegistry, ActionEditor, ActionEditorContext } from './ActionRegistry'
export type { SlotRegistry, SlotRenderer, SlotContext } from './SlotRegistry'
export { SLOT_NODE_EDITOR_CHOICES } from './SlotRegistry'
export { effectiveKind, endLabel } from './utils/nodeKind'
export { nodeTitle, textLines, DEFAULT_NODE_TITLES } from './utils/nodeView'
export { useOpenBook, useBooks } from './hooks'
export {
	createBrain,
	BrainProvider,
	useBrain,
	useRoute,
	useSelectedNode,
	type Brain,
	type CreateBrainOptions,
} from './BrainContext'
export * from './components'
