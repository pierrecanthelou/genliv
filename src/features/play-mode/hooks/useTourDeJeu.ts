/**
 * L'ORCHESTRATEUR DU TOUR DE JEU — n° 10 `moteur-interprete`, lot 2 (`interprete-feature`).
 *
 * TROIS RESPONSABILITÉS :
 *  · Orchestrer l'appel à R1 (interprete) — demander, vérifier le statut, re-résoudre
 *    (`apresInterpretation`), et appliquer le résultat à la session (ÉTAPE 1-4).
 *  · Orchestrer l'appel à R3 (narrateur) après persistance de R1 — UNIQUEMENT si
 *    `avis.type === 'aucun'` (une commande acceptée), dans le même verrou de tour
 *    (ÉTAPE 5-7, lot 2).
 *  · Implémenter le verrou de tour (KR-265) — EXACTEMENT UN appel en vol à tout
 *    moment (R1 ET R3), les appels concurrents sont ignorés.
 *
 * SIX RAPPELS EXPOSÉS, PLUS UN STATE INTERNE :
 *  · `executeAction(saisie)` — appelé par `PlayerInputBar` sur soumission du formulaire,
 *    retourne `true` si un pas a été consommé (avis.type === 'aucun' après R1), `false`
 *    sinon. Corrige la fermeture périmée d'it1 (BUG-132).
 *  · `getGestelabel(id)` — mapping CommandeId → label pour afficher les gestes
 *    possibles.
 *  · `isLocked` — state du verrou pendant toute la chaîne R1→exécution→R3.
 *  · `issueNarrateur` — state de l'issue de R3, null avant réponse, avec `tour`
 *    pour éviter un affichage périmé au tour suivant.
 *  · `pasEnCours()` — lit le verrou, pour refuser la console pendant le vol (lot 2).
 *  · `avis` — état de R1, nul avant la 1ère soumission, puis AvisInterprete ou EchecCopilote.
 *  · `session` N'EN FAIT PAS PARTIE : c'est un PARAMÈTRE lu à chaque rendu, jamais
 *    un miroir local (voir ci-dessous, KR-013).
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
	type CibleNarrateur,
	type Dossier,
	type EchecCopilote,
	type EtatSession,
	useBrain,
	consignerNarration,
} from '../../../brain'

/** L'ISSUE DE L'APPEL R3 (narrateur) — l'avis reçu, avec le tour pour éviter une
 *  affichage périmé au pas suivant. Deux variantes : succès (statut 'raconte' +
 *  suggestions) ou dégradation (contexte trop long, etc., statut 'degrade'). */
export type IssueNarrateur =
	| { readonly tour: number; readonly statut: 'raconte'; readonly suggestions: readonly string[] }
	| { readonly tour: number; readonly statut: 'degrade' }

export interface UseTourDeJeuResult {
	readonly executeAction: (saisie: string) => Promise<boolean>
	readonly getGestelabel: (id: string) => string
	readonly avis: AvisInterprete | EchecCopilote | null
	readonly isLocked: boolean
	readonly issueNarrateur: IssueNarrateur | null
	readonly pasEnCours: () => boolean
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
 * @returns tuple orchestrateur + rendu : `executeAction`, `getGestelabel`, `avis`, `isLocked`,
 *   `issueNarrateur`, `pasEnCours`
 */
export function useTourDeJeu(
	dossier: Dossier,
	session: EtatSession,
	onSessionChange: (session: EtatSession) => void,
): UseTourDeJeuResult {
	const { copilote } = useBrain()
	const [avis, setAvis] = useState<AvisInterprete | EchecCopilote | null>(null)
	const [isLocked, setIsLocked] = useState(false)
	const [issueNarrateur, setIssueNarrateur] = useState<IssueNarrateur | null>(null)

	// VERROU DE TOUR (KR-265) — `useRef` pour l'état de l'appel en vol, sans rendu.
	// On ne verrouille QUE pendant toute la chaîne R1→exécution→R3, et on déverrouille
	// dès que tout revient, qu'il soit succès ou erreur.
	const lockedRef = useRef(false)

	// IMPLÉMENTATION DE `executeAction` : le cœur de l'orchestration R1 et R3.
	async function executeAction(saisie: string): Promise<boolean> {
		// VERROU : déjà verrouillé ? On sort tout de suite (appel ignoré).
		if (lockedRef.current) return false

		// Posons le verrou et en notifions l'écran.
		lockedRef.current = true
		setIsLocked(true)

		try {
			// ──────────────────────────────────────────────────────────
			// R1 (INTERPRETE) — traduction de la saisie
			// ──────────────────────────────────────────────────────────

			// ÉTAPE 1 : Appeler le copilote avec la saisie et la session courante.
			const cible: CibleInterprete = { role: 'interprete', saisie, session }
			const reponse = await copilote.demander(dossier, cible)

			// ÉTAPE 2 : Vérifier le statut. Si c'est une erreur, afficher la bannière
			// directement (pas d'appel à `apresInterpretation`).
			if (reponse.statut !== 'propose') {
				setAvis(reponse)
				return false
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

			// ──────────────────────────────────────────────────────────
			// R3 (NARRATEUR) — récit du pas (lot 2, orchestration)
			// ──────────────────────────────────────────────────────────
			// Appeler R3 UNIQUEMENT si la commande a été acceptée (`avis.type === 'aucun'`)
			// ET que les trois conditions de la signature de lot 1 sont remplies.
			const pasAccepte = 'type' in nouvelAvis && nouvelAvis.type === 'aucun'
			if (pasAccepte) {
				// ÉTAPE 6 : Appeler R3 avec la session déjà persistée (S1)
				const cibleNarrateur: CibleNarrateur = {
					role: 'narrateur',
					saisie,
					session: nouvelleSession, // S1 DÉJÀ PERSISTÉE
				}
				const reponseNarrateur = await copilote.demander(dossier, cibleNarrateur)

				// ÉTAPE 7 : Traiter la réponse de R3
				if (reponseNarrateur.statut === 'propose') {
					// Succès R3 — écrire le récit sur la session
					const { suggestions } = reponseNarrateur.proposition
					const sessionAvecRecit = consignerNarration(
						nouvelleSession,
						nouvelleSession.horloge.tour,
						reponseNarrateur.proposition,
					)
					onSessionChange(sessionAvecRecit)
					setIssueNarrateur({
						tour: nouvelleSession.horloge.tour,
						statut: 'raconte',
						suggestions,
					})
				} else {
					// Échec R3 (contexte trop long, indisponible, etc.) — le pas reste acquis,
					// juste pas de récit, signaler la dégradation à l'écran
					setIssueNarrateur({
						tour: nouvelleSession.horloge.tour,
						statut: 'degrade',
					})
				}
			}

			// Retourner true si le pas a été consommé (commande acceptée)
			return pasAccepte
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

	// LECTEUR DU VERROU — utilisé par la console pour refuser les soumissions
	// pendant que la chaîne R1→exécution→R3 est en vol (lot 2).
	function pasEnCours(): boolean {
		return lockedRef.current
	}

	return {
		executeAction,
		getGestelabel,
		avis,
		isLocked,
		issueNarrateur,
		pasEnCours,
	}
}
