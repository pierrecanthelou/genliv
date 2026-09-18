import { useEffect, useRef, useState } from 'react'
import type { EchecCopilote } from '../../../brain'

/**
 * QUATRE phases. La machine d'APPEL, et rien d'autre : la phase `'decide'`
 * SORT (§ 8, TL-13, plan it2) — avec une décision PAR LIGNE (carte 2) elle est
 * inexprimable, et elle doublait `decisionAffichee`/`decisions`, déjà portés
 * par la carte. `accepter()`/`refuser()` disparaissent avec elle : MESURÉ,
 * aucun test de la feature n'assertait `'decide'` avant ce lot — la sortir ne
 * casse aucun témoin.
 *
 * La branche d'échec porte `EchecCopilote` et non la réponse entière :
 * `'propose'` cesse d'être un statut représentable sur un échec.
 */
export type EtatDemande<P> =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: P }
	| { phase: 'echec'; echec: EchecCopilote }

export interface UseDemandeCopiloteResult<C, P> {
	etat: EtatDemande<P>
	/** Ne fait RIEN si un appel est déjà en vol — le garde est `enVolRef`, PAS le
	 *  `disabled` du bouton : deux clics synchrones passent avant le re-rendu. */
	lancer: (cible: C) => void
	annuler: () => void
}

/**
 * LA BOUCLE « DEMANDER » — GÉNÉRIQUE sur la cible `C` et la proposition `P`,
 * paramétrée par le `demander` de SON appelant : chaque carte lie son propre
 * rôle littéral (`copilote.demander('personnage-prose', dossier, cible, signal)`
 * ou `copilote.demander('indice-detenteurs', dossier, cible, signal)`) avant de
 * passer la fonction résultante ici — le hook lui-même ne connaît ni le rôle,
 * ni `useBrain()`, ni `dossier`.
 *
 * `demander` est LU AU MOMENT DE L'APPEL, jamais stocké dans un `ref` ni
 * capturé par un effet (KR-004) : `lancer` est redéfinie à chaque rendu et
 * capture donc toujours la DERNIÈRE closure passée par l'appelant.
 *
 * INCHANGÉS depuis l'itération 1, et à NE PAS réécrire : l'abandon au
 * démontage, la garde `controleur.signal.aborted` sur la résolution tardive,
 * la branche `.catch` (une promesse rompue est une indisponibilité), et surtout
 * le `.finally` qui ne rouvre le garde QUE si `controleurRef.current === controleur`
 * (BUG-099 — séquence Lancer(A) → Annuler → Lancer(B), son test dédié).
 */
export function useDemandeCopilote<C, P>(
	demander: (cible: C, signal: AbortSignal) => Promise<{ statut: 'propose'; proposition: P } | EchecCopilote>,
): UseDemandeCopiloteResult<C, P> {
	const [etat, setEtat] = useState<EtatDemande<P>>({ phase: 'repos' })
	// Le garde « un appel en vol » — voir la docstring de `lancer` ci-dessus.
	const enVolRef = useRef(false)
	const controleurRef = useRef<AbortController | null>(null)

	// L'AbortController est abandonné au démontage (Timer Safety, docs/WORKFLOW.md) :
	// un composant démonté ne doit laisser aucun appel dériver derrière lui.
	useEffect(() => {
		return () => {
			controleurRef.current?.abort()
		}
	}, [])

	function lancer(cible: C): void {
		if (enVolRef.current) return
		enVolRef.current = true
		const controleur = new AbortController()
		controleurRef.current = controleur
		setEtat({ phase: 'en-cours' })
		demander(cible, controleur.signal)
			.then((reponse) => {
				// Un abandon VOULU (Annuler/Échap) a DÉJÀ ramené l'état à `repos` — cette
				// réponse tardive (« annule ») ne doit rien écraser derrière lui.
				if (controleur.signal.aborted) return
				setEtat(
					reponse.statut === 'propose'
						? { phase: 'proposition', proposition: reponse.proposition }
						: { phase: 'echec', echec: reponse },
				)
			})
			.catch(() => {
				// `demander` est TOTAL aujourd'hui : il range toute panne dans son union
				// et ne rejette jamais. Sans cette branche, le jour où il rejetterait, la
				// phase resterait `en-cours` POUR TOUJOURS — panneau mort, sans trace.
				if (controleur.signal.aborted) return
				setEtat({ phase: 'echec', echec: { statut: 'indisponible', raison: 'injoignable' } })
			})
			.finally(() => {
				// LE GARDE EST RENDU PAR L'APPEL COURANT, JAMAIS PAR CELUI QUI SE TERMINE.
				// Séquence Lancer(A) → Annuler → Lancer(B) : quand A se résout, B est en
				// vol. Un `enVolRef.current = false` inconditionnel rouvrirait le garde
				// sous B — et `disabled` n'est que la FACE VISIBLE du ref, jamais le garde
				// lui-même (docstring de `lancer`).
				if (controleurRef.current === controleur) enVolRef.current = false
			})
	}

	function annuler(): void {
		controleurRef.current?.abort()
		enVolRef.current = false
		setEtat({ phase: 'repos' })
	}

	return { etat, lancer, annuler }
}
