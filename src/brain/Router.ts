/**
 * Router — drives navigation for the whole app. A tiny in-memory router
 * (no URL coupling yet) exposing the current route + navigate + subscribe.
 * Lives in brain so features navigate through a contract, never directly.
 */
/**
 * Les trois écrans de l'application. `dossier` est ADDITIVE (n° 2 `bascule-editeur`,
 * itération 2) : elle ouvre l'écran d'édition d'un dossier d'aventure, désigné par
 * son `dossierId`, qui est aussi sa clé de stockage.
 *
 * `editor`/`bookId` reste — c'est un CHEMIN MORT, celui du livre-arbre, dont la
 * démolition appartient à la n° 9. Le retirer ici casserait `EditorScreen`,
 * `TreeCanvas` et `ConflictDialog` pour un gain nul.
 *
 * Deux champs distincts (`bookId`, `dossierId`) plutôt qu'un `id` partagé : un
 * livre et un dossier ne se convertissent JAMAIS l'un en l'autre (KR-167), et un
 * nom de champ commun inviterait exactement ce passage.
 */
export type Route = { name: 'home' } | { name: 'editor'; bookId: string } | { name: 'dossier'; dossierId: string }

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
