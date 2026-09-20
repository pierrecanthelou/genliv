/**
 * Router — drives navigation for the whole app. A tiny in-memory router
 * (no URL coupling yet) exposing the current route + navigate + subscribe.
 * Lives in brain so features navigate through a contract, never directly.
 */
/**
 * Les quatre écrans de l'application. `dossier` est ADDITIVE (n° 2 `bascule-editeur`,
 * itération 2) : elle ouvre l'écran d'édition d'un dossier d'aventure, désigné par
 * son `dossierId`, qui est aussi sa clé de stockage.
 *
 * `partie` est ADDITIVE à son tour (n° 9 `moteur-dossier`, itération 1) : elle
 * monte l'écran de partie sur le MÊME `dossierId`. C'EST LE SEUL RENDEZ-VOUS
 * ENTRE `bascule-editeur` ET `play-mode`, et c'est ce qui rend la jonction
 * réalisable sans un seul import croisé : l'éditeur navigue, la racine de
 * composition monte le shell, et aucune des deux features ne connaît l'autre.
 * AUCUN événement `partie:*` en regard — la variante a déjà son unique abonné,
 * et une famille d'événements sans abonné externe serait un contrat sans lecteur.
 *
 * `editor`/`bookId` reste — c'est un CHEMIN MORT, celui du livre-arbre, dont la
 * démolition appartient à la n° 9. Le retirer ici casserait `EditorScreen`,
 * `TreeCanvas` et `ConflictDialog` pour un gain nul.
 *
 * Deux champs distincts (`bookId`, `dossierId`) plutôt qu'un `id` partagé : un
 * livre et un dossier ne se convertissent JAMAIS l'un en l'autre (KR-167), et un
 * nom de champ commun inviterait exactement ce passage. `partie` porte donc
 * `dossierId`, jamais un `id` neutre, pour la même raison.
 */
export type Route =
	| { name: 'home' }
	| { name: 'editor'; bookId: string }
	| { name: 'dossier'; dossierId: string }
	| { name: 'partie'; dossierId: string }

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
