/**
 * Router — drives navigation for the whole app. A tiny in-memory router
 * (no URL coupling yet) exposing the current route + navigate + subscribe.
 * Lives in brain so features navigate through a contract, never directly.
 */
export type Route = { name: 'home' } | { name: 'editor'; bookId: string }

export interface Router {
	current(): Route
	navigate(route: Route): void
	subscribe(listener: (route: Route) => void): () => void
}

export function createRouter(initial: Route = { name: 'home' }): Router {
	let route = initial
	const listeners = new Set<(route: Route) => void>()

	return {
		current() {
			return route
		},
		navigate(next) {
			route = next
			for (const listener of [...listeners]) {
				listener(route)
			}
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}
