/**
 * L'ORCHESTRATEUR DU TOUR DE JEU — n° 10 `moteur-interprete`, lot 2 (`interprete-feature`).
 *
 * DEUX RESPONSABILITÉS DISJOINTES:
 *  · Orchestrer l'appel au copilote — demander, vérifier le statut, re-résoudre
 *    (`apresInterpretation`), et appliquer le résultat à la session.
 *  · Implémenter le verrou de tour (KR-265) — EXACTEMENT UN appel en vol à tout
 *    moment, les appels concurrents sont ignorés.
 *
 * TROIS RAPPELS EXPOSÉS:
 *  · `executeAction(saisie)` — appelé par `PlayerInputBar` sur soumission du formulaire.
 *  · `getGestelabel(id)` — mapping CommandeId → label pour afficher les gestes
 *    possibles.
 *  · (Implicitement) le state `(avis, isLocked)` utilisé par le rendu — `session` N'EN FAIT
 *    PAS PARTIE : c'est un PARAMÈTRE lu à chaque rendu, jamais un miroir local (voir la
 *    docstring de `useTourDeJeu` ci-dessous, KR-013).
 *
 * PÉRIMÈTRE ÉLARGI: seul fichier de `play-mode/` autorisé à importer `CopiloteService`
 * (exclusion nommée `[useTourDeJeu.ts]` du test `moteurSansIA.test.ts`).
 */
import { useRef, useState } from 'react'
import { COMMANDES } from '../../../brain/dossier/commandes'
import {
	apresInterpretation,
	type AvisInterprete,
	type CibleInterprete,
	type Dossier,
	type EchecCopilote,
	type EtatSession,
	useBrain,
} from '../../../brain'

export interface UseTourDeJeuResult {
	readonly executeAction: (saisie: string) => Promise<void>
	readonly getGestelabel: (id: string) => string
	readonly avis: AvisInterprete | EchecCopilote | null
	readonly isLocked: boolean
}

/**
 * @param dossier — gelé à l'ouverture de la session
 * @param session — session COURANTE, telle que `PartieEnCours` la tient dans son propre
 *   `useState` : LUE À CHAQUE RENDU, JAMAIS COPIÉE ICI (KR-013). Une copie locale (un second
 *   `useState(session)`) serait une SECONDE source de vérité qui ne se resynchronise sur
 *   rien : le canal console (`ConsoleCommandes`, dans le même écran) avance la session du
 *   PARENT indépendamment de ce hook, et une copie figée au premier rendu écraserait ce
 *   progrès console au prochain `executeAction` (perte silencieuse d'une commande acceptée).
 *   `executeAction` referme sur le `session` du rendu où elle a été (re)créée — c'est
 *   pourquoi elle ne doit JAMAIS lire un état interne, seulement ce paramètre.
 * @param onSessionChange — callback pour persister la session mise à jour (écrit l'état du PARENT)
 * @returns tuple orchestrateur + rendu : `executeAction`, `getGestelabel`, `avis`, `isLocked`
 */
export function useTourDeJeu(
	dossier: Dossier,
	session: EtatSession,
	onSessionChange: (session: EtatSession) => void,
): UseTourDeJeuResult {
	const { copilote } = useBrain()
	const [avis, setAvis] = useState<AvisInterprete | EchecCopilote | null>(null)
	const [isLocked, setIsLocked] = useState(false)

	// VERROU DE TOUR (KR-265) — `useRef` pour l'état de l'appel en vol, sans rendu.
	// On ne verrouille QUE pendant l'appel réseau, et on déverrouille dès qu'il revient,
	// qu'il soit succès ou erreur.
	const lockedRef = useRef(false)

	// IMPLÉMENTATION DE `executeAction` : le cœur de l'orchestration.
	async function executeAction(saisie: string): Promise<void> {
		// VERROU : déjà verrouillé ? On sort tout de suite (appel ignoré).
		if (lockedRef.current) return

		// Posons le verrou et en notifions l'écran.
		lockedRef.current = true
		setIsLocked(true)

		try {
			// ÉTAPE 1 : Appeler le copilote avec la saisie et la session courante.
			const cible: CibleInterprete = { role: 'interprete', saisie, session }
			const reponse = await copilote.demander(dossier, cible)

			// ÉTAPE 2 : Vérifier le statut. Si c'est une erreur, afficher la bannière
			// directement (pas d'appel à `apresInterpretation`).
			if (reponse.statut !== 'propose') {
				setAvis(reponse)
				return
			}

			// ÉTAPE 3 : Succès — re-résoudre via `apresInterpretation`.
			const { session: nouvelleSession, avis: nouvelAvis } = apresInterpretation(
				dossier,
				session,
				reponse.proposition,
				saisie,
			)

			// ÉTAPE 4 : Persister la session mise à jour — chez le PARENT uniquement
			// (KR-013) : le prochain rendu de `PartieEnCours` repassera cette session,
			// à jour, dans le paramètre `session` ci-dessus.
			onSessionChange(nouvelleSession)

			// ÉTAPE 5 : Afficher l'avis (qui peut être 'aucun' si commande acceptée).
			setAvis(nouvelAvis)
		} finally {
			// DÉVERROUILLAGE : toujours levé, même en cas d'erreur.
			lockedRef.current = false
			setIsLocked(false)
		}
	}

	// CONVERSION CommandeId → label : utilisée par le composant pour afficher
	// les gestes possibles quand `avis.type === 'non_reconnu'`.
	function getGestelabel(id: string): string {
		const cmd = COMMANDES[id as keyof typeof COMMANDES]
		return cmd?.label ?? `(geste #${id})`
	}

	return {
		executeAction,
		getGestelabel,
		avis,
		isLocked,
	}
}
