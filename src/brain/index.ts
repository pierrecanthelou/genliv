/**
 * brain/ — the application core engine. Drives navigation, cross-feature
 * communication (Event Bus), and service wiring (Service Locator + DI).
 * Feature-agnostic: never imports from features/.
 */
export type { Book, BookNode, Edge, NodeKind, EdgeKind } from './types'
export type { EventBus, AppEvents, AppEventName } from './EventBus'
export type { PersistenceService } from './PersistenceService'
export type { Router, Route } from './Router'
export type { BookService } from './BookService'
export { autoSlot } from './BookService'
export { createBrain, BrainProvider, useBrain, useRoute, type Brain, type CreateBrainOptions } from './BrainContext'
export * from './components'
