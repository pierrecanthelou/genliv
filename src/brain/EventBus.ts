/**
 * EventBus — Observer pattern for decoupled cross-feature messaging.
 * Features never import each other; they emit/observe events here.
 * Typed by AppEvents so payloads stay honest at compile time.
 */
import type { NodeKind, NodeActionType, EdgeKind, SyncStatus } from './types'

export interface AppEvents {
	'book:created': { bookId: string }
	'book:opened': { bookId: string }
	'book:updated': { bookId: string }
	'book:deleted': { bookId: string }
	'node:created': { bookId: string; nodeId: string; kind: NodeKind }
	'node:updated': { bookId: string; nodeId: string }
	'node:deleted': { bookId: string; nodeId: string }
	'node:selected': { bookId: string; nodeId: string | null }
	'edge:created': { bookId: string; edgeId: string; from: string; to: string; kind: EdgeKind }
	'edge:updated': { bookId: string; edgeId: string }
	'edge:deleted': { bookId: string; edgeId: string }
	'action:changed': { bookId: string; nodeId: string; actionType: NodeActionType }
	'monster:savedToLibrary': { bookId: string; nodeId: string }
	'sync:status': { status: SyncStatus; pending: number }
}

export type AppEventName = keyof AppEvents

type Handler<E extends AppEventName> = (payload: AppEvents[E]) => void

export interface EventBus {
	emit<E extends AppEventName>(event: E, payload: AppEvents[E]): void
	on<E extends AppEventName>(event: E, handler: Handler<E>): () => void
}

export function createEventBus(): EventBus {
	const handlers = new Map<AppEventName, Set<Handler<AppEventName>>>()

	return {
		emit(event, payload) {
			const set = handlers.get(event)
			if (!set) return
			// Copy before iterating so a handler may unsubscribe safely.
			for (const handler of [...set]) {
				handler(payload)
			}
		},
		on(event, handler) {
			const set = handlers.get(event) ?? new Set()
			set.add(handler as Handler<AppEventName>)
			handlers.set(event, set)
			return () => {
				set.delete(handler as Handler<AppEventName>)
			}
		},
	}
}
