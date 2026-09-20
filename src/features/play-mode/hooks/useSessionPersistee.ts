import { useEffect } from 'react'
import { useBrain, dossierSessionKey, type EtatSession } from '../../../brain'

/**
 * RANGE LA SESSION OUVERTE sous la clé du dossier joué.
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
 * La clé vient de `dossierSessionKey` (`brain/persistenceKeys.ts`) : une feature
 * n'écrit jamais une clé en dur, ni ne touche `localStorage` (KR-011/111).
 *
 * En it1 personne ne RELIT cette session : la reprise, la relance et l'effacement
 * appartiennent à it2, avec le port de stockage. Écrire dès maintenant est ce qui
 * donne sa prémisse à KR-251 — une session née ici doit rester lisible demain.
 *
 * ⚠ CONSÉQUENCE NON CHOISIE, ET MESURÉE : `useBrain().persistence` N'EST PAS un
 * `PersistenceService` nu — c'est le DÉCORATEUR de synchronisation
 * (`BrainContext.tsx:101` : `persistence: sync`), dont `set()` fait `local.set()`
 * PUIS `queuePush(clé, valeur)` pour toute clé non-livre
 * (`CloudSyncService.ts:415-423`). Donc chaque montage de l'aperçu POUSSE la
 * session vers le nuage et fait passer `sync:status` à `syncing` sous les yeux de
 * l'auteur ; et `remove()` n'étant PAS propagé (`:425-427`), l'effacement d'it2
 * laisserait l'entrée distante orpheline.
 *
 * Ce n'est pas ce que la doctrine maison fait de l'état PAR APPAREIL : préférences
 * d'interface (KR-022), librairie de monstres et réglages du worker sont tous
 * câblés sur le magasin BRUT (`BrainContext.tsx:84-94`), hors file de
 * synchronisation. La question « la session d'une partie est-elle un document
 * synchronisé ou un état d'appareil ? » n'a été posée par personne au raffinage :
 * elle est inscrite en `open_questions` et appartient au PORT DE STOCKAGE d'it2,
 * qui doit la trancher AVANT d'envelopper ce hook — et traiter la suppression
 * côté distant. Rien ne casse aujourd'hui : aucune collision de préfixe, et
 * `useBookPending` filtre sur les clés de livre.
 */
export function useSessionPersistee(dossierId: string, session: EtatSession): void {
	const { persistence } = useBrain()

	useEffect(() => {
		persistence.set(dossierSessionKey(dossierId), session)
	}, [persistence, dossierId, session])
}
