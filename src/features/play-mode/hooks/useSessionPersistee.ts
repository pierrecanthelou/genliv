import { useEffect } from 'react'
import { useBrain, type EtatSession } from '../../../brain'

/**
 * RANGE LA SESSION OUVERTE sous la clé du dossier joué, via le PORT DE STOCKAGE
 * DE SESSION (`useBrain().sessions`, `brain/MagasinDeSession.ts`).
 *
 * UN `useEffect` LÉGITIME, et il faut le dire parce que la règle voisine dit le
 * contraire : ce n'est PAS un miroir d'état dérivé (KR-013/113), c'est une
 * SYNCHRONISATION AVEC UN SYSTÈME EXTERNE — le magasin de persistance. Aucune
 * valeur ne revient de l'effet vers le rendu.
 *
 * ET SURTOUT PAS DEPUIS UN INITIALISEUR `useState` : ce serait un effet de bord
 * pendant le rendu, DOUBLÉ en `StrictMode`. `PersistenceService` est synchrone,
 * donc l'écriture est résolue avant toute navigation ultérieure (KR-004).
 *
 * CONTRAT KR-305 : `sessions.lire` est appelée DANS L'INITIALISEUR de son
 * `useState` (AiguillagePartie), AVANT le premier montage de ce hook. Conséquence :
 * si une session est périmée ou illisible, ce hook ne monte PAS, donc `ecrire`
 * n'est jamais appelé — la session reste rangée telle quelle jusqu'à ce qu'une
 * nouvelle soit écrite.
 *
 * LA QUESTION EST TRANCHÉE — CECI REMPLACE L'AVERTISSEMENT ⚠ DE L'ITÉRATION 1,
 * DEVENU FAUX : `useBrain().sessions` n'est PLUS le décorateur de synchronisation
 * (`useBrain().persistence`, alias `sync`), c'est le magasin de session étroit
 * câblé sur le magasin BRUT (`createMagasinDeSession(local)`,
 * `BrainContext.tsx`). La session d'une partie est un état PAR APPAREIL — même
 * doctrine que les préférences d'interface (KR-022), la librairie de monstres et
 * les réglages du worker, tous câblés sur `local`, hors file de synchronisation.
 * `MagasinDeSession.test.ts` le PROUVE : `brain.sync.pendingCount()` reste à
 * ZÉRO après une écriture de session, et monte à UN dans le MÊME test pour une
 * écriture de dossier — sans quoi l'assertion à zéro serait vraie par
 * construction (BUG-084).
 *
 * La clé vient de `dossierSessionKey` (`brain/persistenceKeys.ts`), composée à
 * l'intérieur du port : une feature n'écrit jamais une clé en dur, ni ne touche
 * `localStorage` (KR-011/111).
 */
export function useSessionPersistee(dossierId: string, session: EtatSession): void {
	const { sessions } = useBrain()

	useEffect(() => {
		sessions.ecrire(dossierId, session)
	}, [sessions, dossierId, session])
}
