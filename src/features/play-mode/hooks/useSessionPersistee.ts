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
 * SIGNATURE INCHANGÉE DEPUIS L'ITÉRATION 1 (§ 5 du plan d'itération 2) : c'est le
 * point de rendez-vous qui évite que la scission d'`EcranPartie` et le
 * changement de magasin se croisent.
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
 *
 * `ecrire` est la SEULE méthode du port en it2 : personne ne RELIT cette session
 * — la reprise, la relance et l'effacement (`lire`, `effacer`, `validerSession`)
 * appartiennent à l'itération qui les démontrera (KR-116).
 */
export function useSessionPersistee(dossierId: string, session: EtatSession): void {
	const { sessions } = useBrain()

	useEffect(() => {
		sessions.ecrire(dossierId, session)
	}, [sessions, dossierId, session])
}
