import { useMemo, useSyncExternalStore } from 'react'
import { useBrain } from './BrainContext'
import type { AppEventName } from './EventBus'
import type { DossierResume } from './DossierService'
import type { Dossier } from './dossier/types'
import type { Book } from './tree'
import { checkBookHealth, type StructuralWarning } from './utils/bookHealth'

/**
 * Shared brain hooks. Views (tree-canvas, and the dossier sections to come) read
 * the open book live from BookService — the single source of truth — by
 * subscribing to the event bus, NOT by mirroring props through useEffect
 * (KR-013/113). Each view stays a VIEW, holding no private copy (KR-020).
 */
// These are CURATED SUBSETS of AppEvents — which events should make a book VIEW
// re-read — not a duplication of the bus: the `AppEventName[]` type rejects any
// name that is not a real event, so the literals can't drift from EventBus.
const BOOK_MUTATION_EVENTS: AppEventName[] = [
	'book:opened',
	'book:updated',
	'node:created',
	'node:updated',
	'node:deleted',
	'edge:created',
	'edge:updated',
	'edge:deleted',
]

/** List membership/content changes on create, delete, or a rename (book:updated). */
const BOOK_LIST_EVENTS: AppEventName[] = ['book:created', 'book:updated', 'book:deleted']

/**
 * Les trois événements qui changent la LISTE des dossiers : un import
 * (`dossier:created`), une suppression (`dossier:deleted`), et l'adoption d'une
 * copie cloud plus récente (`dossier:updated`) — cette dernière change le titre
 * ou la date d'une carte, donc la liste rendue. `dossier:opened` n'y est pas :
 * ouvrir ne change rien à ce que l'accueil montre.
 */
const DOSSIER_LIST_EVENTS: AppEventName[] = ['dossier:created', 'dossier:updated', 'dossier:deleted']

/**
 * Les deux événements qui changent le DOSSIER OUVERT sous les yeux de l'auteur.
 * `dossier:updated` a DEUX émetteurs depuis la n° 3 : l'adoption cloud
 * (`CloudSyncService.reconcileDossier`, qui écrit le magasin local PUIS émet) et
 * `DossierService.update`, le premier chemin d'écriture de l'éditeur — l'édition
 * d'une fiche n'a donc demandé AUCUNE ligne ici, et toutes les vues abonnées en
 * profitent d'un coup, ce qui était exactement le pari de cette liste.
 * `dossier:deleted` fait retomber la vue à `null` plutôt que de laisser un
 * document fantôme à l'écran. `dossier:created` n'y est PAS : semer un dossier
 * ne change rien à celui qui est ouvert — c'est une affaire de LISTE
 * (`DOSSIER_LIST_EVENTS`).
 */
const DOSSIER_MUTATION_EVENTS: AppEventName[] = ['dossier:updated', 'dossier:deleted']

export function useOpenBook(bookId: string | null): Book | null {
	const { books, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: Book | null = bookId !== null ? books.getBook(bookId) : null
		return {
			subscribe(onChange: () => void): () => void {
				const offs = BOOK_MUTATION_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = bookId !== null ? books.getBook(bookId) : null
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): Book | null => snapshot,
		}
	}, [books, events, bookId])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * Live structural health check of an open book (KR-145). Runs `checkBookHealth`
 * on every book mutation (same events as `useOpenBook`) and returns warnings
 * immediately, without the author having to trigger an export. Dead-ends and
 * dangling edge targets appear as soon as they are created and disappear the
 * moment they are resolved.
 */
export function useBookHealth(bookId: string | null): StructuralWarning[] {
	const book = useOpenBook(bookId)
	return useMemo(() => {
		if (book === null) return []
		return checkBookHealth(book)
	}, [book])
}

/**
 * Live list of all persisted books (book-library). A VIEW over BookService:
 * the snapshot is cached and only recomputed on book:created / book:deleted,
 * so useSyncExternalStore gets a stable reference between those events (no
 * re-render loop) and the list stays a pure read of the SSOT (KR-020).
 */
export function useBooks(): Book[] {
	const { books, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: Book[] = books.listBooks()
		return {
			subscribe(onChange: () => void): () => void {
				const offs = BOOK_LIST_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = books.listBooks()
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): Book[] => snapshot,
		}
	}, [books, events])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * Live list of every persisted dossier (bibliothèque). Calque exact de `useBooks`
 * sur `DossierService.list()` : l'instantané est CACHÉ en clôture et n'est
 * recalculé que sur les trois événements de liste, de sorte que
 * `useSyncExternalStore` reçoive une référence STABLE entre deux mutations — une
 * liste fraîche à chaque appel de `getSnapshot` reboucle le rendu à l'infini.
 * La vue reste une pure lecture de la source de vérité (KR-020/013) : aucun
 * miroir `useEffect`, aucune copie privée. Filtrer ou trier cet instantané se
 * fait sur une COPIE — muter le tableau rendu casserait la stabilité de la
 * référence (KR-071).
 */
export function useDossiers(): DossierResume[] {
	const { dossiers, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: DossierResume[] = dossiers.list()
		return {
			subscribe(onChange: () => void): () => void {
				const offs = DOSSIER_LIST_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = dossiers.list()
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): DossierResume[] => snapshot,
		}
	}, [dossiers, events])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * Le DOSSIER OUVERT, lu en direct depuis `DossierService` — jumeau de
 * `useOpenBook`, sur les événements du dossier. C'est ce qui rend l'écran
 * d'édition sensible à une adoption cloud survenue PENDANT qu'il est ouvert :
 * le titre et les dix compteurs de sections se remettent à jour sans remontage
 * (report explicite de l'itération 2 de `bascule-editeur`).
 *
 * L'instantané est CACHÉ en clôture et n'est recalculé que sur événement : c'est
 * l'exigence de `useSyncExternalStore` (KR-071/013). `DossierService.get()`
 * re-valide et GÈLE, donc il rend un objet NEUF à chaque appel — l'appeler
 * depuis `getSnapshot` reboucherait le rendu sur lui-même, sans fin.
 *
 * Aucun filtrage sur l'identifiant porté par l'événement, exactement comme
 * `useOpenBook` : la re-lecture est idempotente, et un filtre ferait de ce hook
 * un cousin du sien plutôt qu'un jumeau — deux règles d'abonnement à tenir
 * alignées à la main.
 */
export function useOpenDossier(dossierId: string | null): Dossier | null {
	const { dossiers, events } = useBrain()

	const store = useMemo(() => {
		let snapshot: Dossier | null = dossierId !== null ? dossiers.get(dossierId) : null
		return {
			subscribe(onChange: () => void): () => void {
				const offs = DOSSIER_MUTATION_EVENTS.map((name) =>
					events.on(name, () => {
						snapshot = dossierId !== null ? dossiers.get(dossierId) : null
						onChange()
					}),
				)
				return () => offs.forEach((off) => off())
			},
			getSnapshot: (): Dossier | null => snapshot,
		}
	}, [dossiers, events, dossierId])

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
