import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	type CibleCopilote,
	type Dossier,
	type PropositionResolue,
	type ReponseCopilote,
} from '../../../brain'

/** Unique rôle de l'itération 1 — hors périmètre : tout ce qui n'est pas une
 *  fiche personnage. */
const ROLE = 'personnage-prose' as const

export type EtatDemande =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: PropositionResolue }
	| { phase: 'echec'; reponse: ReponseCopilote }
	| { phase: 'decide'; issue: 'accepte' | 'refuse' }

export interface UseDemandeCopiloteResult {
	etat: EtatDemande
	/** Ne fait RIEN si un appel est déjà en vol — le garde est un `enVolRef`, PAS
	 *  le `disabled` du bouton : deux clics synchrones passent avant le re-rendu
	 *  (critère 1, mutant obligatoire). */
	lancer: (cible: CibleCopilote) => void
	annuler: () => void
	accepter: () => void
	refuser: () => void
}

/**
 * LA BOUCLE « DEMANDER » — lancer/annuler un aller-retour vers le copilote, et
 * rien d'autre. `accepter()`/`refuser()` sont de PURES transitions d'ÉTAT
 * D'ÉCRAN, jamais un appel à `DossierService.update` : l'écriture réelle est
 * orchestrée par `PanneauCopilote.tsx`, qui appelle `accepter()` SEULEMENT
 * après un `update()` réussi — ce qui laisse le panneau garder la proposition
 * affichée (et rendre les anomalies) si le SSOT la refuse (critère 4). Cette
 * séparation est ce qui permet à `EtatDemande` de rester la forme FIGÉE du § 4.1
 * (`{phase:'decide', issue}` ne porte aucune charge d'écriture).
 *
 * `dossier` est un PARAMÈTRE, jamais lu via `useOpenDossier` ici : un seul
 * abonnement au dossier suffit pour tout le panneau (`PanneauCopilote.tsx`),
 * même discipline que `useEcritureIdentite`/`useSocleEcriturePersonnages`.
 */
export function useDemandeCopilote(dossier: Dossier | null): UseDemandeCopiloteResult {
	const { copilote } = useBrain()
	const [etat, setEtat] = useState<EtatDemande>({ phase: 'repos' })
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

	function lancer(cible: CibleCopilote): void {
		if (enVolRef.current || dossier === null) return
		enVolRef.current = true
		const controleur = new AbortController()
		controleurRef.current = controleur
		setEtat({ phase: 'en-cours' })
		copilote
			.demander(ROLE, dossier, cible, controleur.signal)
			.then((reponse) => {
				// Un abandon VOULU (Annuler/Échap) a DÉJÀ ramené l'état à `repos` — cette
				// réponse tardive (« annule ») ne doit rien écraser derrière lui.
				if (controleur.signal.aborted) return
				setEtat(
					reponse.statut === 'propose'
						? { phase: 'proposition', proposition: reponse.proposition }
						: { phase: 'echec', reponse },
				)
			})
			.catch(() => {
				// `CopiloteService.demander` est TOTAL aujourd'hui : il range toute panne
				// dans son union et ne rejette jamais. Sans cette branche, le jour où il
				// rejetterait, la phase resterait `en-cours` POUR TOUJOURS — panneau mort,
				// sans trace. Une promesse rompue est une indisponibilité comme une autre.
				if (controleur.signal.aborted) return
				setEtat({ phase: 'echec', reponse: { statut: 'indisponible', raison: 'injoignable' } })
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

	function accepter(): void {
		setEtat({ phase: 'decide', issue: 'accepte' })
	}

	function refuser(): void {
		setEtat({ phase: 'decide', issue: 'refuse' })
	}

	return { etat, lancer, annuler, accepter, refuser }
}
