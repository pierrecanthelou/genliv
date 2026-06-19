/**
 * brain/ — the application core engine. Drives navigation, cross-feature
 * communication (Event Bus), and service wiring (Service Locator + DI).
 * Feature-agnostic: never imports from features/.
 */
export type { Book, BookNode, Edge, ChoicePrereq, NodeKind, EdgeKind, NodeActionType } from './types'
export type {
	GameObject,
	DecorConfig,
	DecorInteraction,
	DecorReveal,
	TakeableKind,
	SkillRoll,
	TakeableObject,
	PnjConfig,
	PnjGift,
	PnjGiftEffect,
	MonsterConfig,
	TrapConfig,
	RollOutcome,
} from './types'
export { ROLL_OUTCOMES, type RollOutcomeDescriptor } from './outcomes'
export { CHARACTERISTICS, CHARACTERISTIC_VALUES, DEFAULT_CHARACTERISTIC, type Characteristic } from './characteristics'
export { createId } from './utils/id'
export type { EventBus, AppEvents, AppEventName } from './EventBus'
export type { PersistenceService } from './PersistenceService'
export type { SyncStatus } from './types'
export type { CloudSyncService, CloudTransport, CloudSyncOptions } from './CloudSyncService'
export { createLocalStorageTransport } from './LocalStorageTransport'
export { createUIPreferencesService } from './UIPreferencesService'
export type { UIPreferencesService, BookUIPrefs, Viewport } from './UIPreferencesService'
export type { Router, Route } from './Router'
export type { BookService, NodePatch } from './BookService'
export { autoSlot } from './BookService'
export type { SelectionService } from './SelectionService'
export type { ActionRegistry, ActionEditor, ActionEditorContext } from './ActionRegistry'
export type { SlotRegistry, SlotRenderer, SlotContext } from './SlotRegistry'
export { SLOT_NODE_EDITOR_CHOICES } from './SlotRegistry'
export { effectiveKind, endLabel } from './utils/nodeKind'
export { nodeTitle, textLines } from './utils/nodeView'
export { plural } from './utils/plural'
export {
	NODE_KINDS,
	EDGE_KINDS,
	isNodeKind,
	isEdgeKind,
	isStructural,
	canHaveOutgoing,
	canBeTarget,
	edgeNests,
} from './kinds'
export { getNode, getEdge } from './utils/book'
export { collectObjects, findObject } from './utils/objects'
export { deriveAutomaticEdges } from './utils/automaticEdges'
export type { NodeKindDescriptor, EdgeKindDescriptor, BadgeMark } from './kinds'
export { useOpenBook, useBooks } from './hooks'
export { HIT_TARGET_MIN } from './ui'
export {
	createBrain,
	BrainProvider,
	useBrain,
	useRoute,
	useSelectedNode,
	useSyncStatus,
	useSyncPending,
	useUIPreferences,
	useBookViewMode,
	useBookNodePositions,
	type Brain,
	type CreateBrainOptions,
} from './BrainContext'
export * from './components'
