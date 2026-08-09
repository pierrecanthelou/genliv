import { useCallback } from 'react'
import { useBooks, useBrain, useDossiers, downloadJson, slugifyFilename, type DossierResume } from '../../../brain'

export interface DossierLibrary {
	/** Live list of every persisted dossier (illisibles first), a VIEW over DossierService. */
	dossiers: DossierResume[]
	/**
	 * Books left behind by the bascule (BookService), read only to name the
	 * transitional empty state (critère 6) — derived inline from `useBooks()`
	 * (KR-013), never mirrored through state. Dies with `BookService` itself
	 * at n° 9 (open_questions).
	 */
	livresHerites: number
	/** Re-validate a readable dossier through DossierService and trigger a client-side file download. */
	download: (id: string) => void
	/** Permanently delete a dossier — readable or not — through DossierService (emits dossier:deleted). */
	remove: (id: string) => void
	/**
	 * Open an already-persisted dossier and navigate to its editor: signals the
	 * opening through DossierService (emits `dossier:opened`, arms cloud
	 * reconciliation, KR-163) THEN navigates — strictly in that order, only
	 * after the signal resolves (KR-004). Called only from a readable card's
	 * title (bascule-editeur it2 lot 3) — never from the `lisible: false` branch.
	 */
	open: (id: string) => void
}

/**
 * Facade over brain for the dossier library view: the live dossier list plus
 * the download and delete actions, all routed through DossierService (a
 * VIEW, never a private copy) so book-library never reaches into another
 * feature. `useBooks()` stays the only legal way to read
 * `BookService.listBooks().length` for the transitional empty state.
 */
export function useDossierLibrary(): DossierLibrary {
	const { dossiers: dossierService, router } = useBrain()
	const dossiers = useDossiers()
	const livresHerites = useBooks().length

	const download = useCallback(
		(id: string) => {
			const dossier = dossierService.exportDossier(id)
			// Absent or turned unreadable between render and click: nothing to export.
			if (dossier === null) return
			downloadJson(`${slugifyFilename(dossier.titre)}.json`, dossier)
		},
		[dossierService],
	)

	const remove = useCallback((id: string) => dossierService.remove(id), [dossierService])

	const open = useCallback(
		(id: string) => {
			// dossiers.open() d'abord (émet dossier:opened), la navigation ensuite —
			// dans cet ordre, après résolution du signal (KR-004).
			dossierService.open(id)
			router.navigate({ name: 'dossier', dossierId: id })
		},
		[dossierService, router],
	)

	return { dossiers, livresHerites, download, remove, open }
}
