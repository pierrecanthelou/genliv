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
 *    moment, sur TOUTE la chaîne R1→exécution→R2→attente du clic « Lancer »→
 *    résolution→R3 (it2, `moteur-arbitre`) : si R2 pose une `CarteJet`, le
 *    verrou reste tenu jusqu'à ce que `lancerLeDe` le relâche dans son propre
 *    `finally` — jamais entre les deux, le temps que le joueur regarde la carte.
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
import type { CibleActeur } from '../../../brain/copilote/types'
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
	doitArbitrer,
	consignerJet,
	issueDuJet,
	xpDuJet,
	crediterXp,
	type Characteristic,
	type ChallengeTier,
	type CibleArbitre,
} from '../../../brain'

/** L'ISSUE DE L'APPEL R3 (narrateur) — l'avis reçu, avec le tour pour éviter une
 *  affichage périmé au pas suivant. Deux variantes : succès (statut 'raconte' +
 *  suggestions) ou dégradation (contexte trop long, etc., statut 'degrade'). */
export type IssueNarrateur =
	| { readonly tour: number; readonly statut: 'raconte'; readonly suggestions: readonly string[] }
	| { readonly tour: number; readonly statut: 'degrade' }

export interface CarteJetState {
	readonly carac: Characteristic
	readonly tc: ChallengeTier
	readonly enjeuReussite: string
	readonly enjeuEchec: string
	readonly resultat?: { readonly roll: number; readonly success: boolean; readonly characteristicValue: number }
}

export interface UseTourDeJeuResult {
	readonly executeAction: (saisie: string) => Promise<boolean>
	readonly getGestelabel: (id: string) => string
	readonly avis: AvisInterprete | EchecCopilote | null
	readonly isLocked: boolean
	readonly issueNarrateur: IssueNarrateur | null
	readonly pasEnCours: () => boolean
	readonly carteJet: CarteJetState | null
	readonly lancerLeDe: () => Promise<void>
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
	const [carteJet, setCarteJet] = useState<CarteJetState | null>(null)

	// VERROU DE TOUR (KR-265) — `useRef` pour l'état de l'appel en vol, sans rendu.
	// On ne verrouille QUE pendant toute la chaîne R1→exécution→R3, et on déverrouille
	// dès que tout revient, qu'il soit succès ou erreur.
	const lockedRef = useRef(false)

	// GARDE DE RÉ-ENTRANCE DE `lancerLeDe` — `lockedRef` reste VRAI pendant toute
	// l'attente du clic (KR-265 étendu), donc il ne peut pas distinguer « carte en
	// attente » de « lancerLeDe déjà en vol » : un second déclenchement (double
	// frappe Entrée côté `CarteJet`, répétition clavier OS) appellerait `lancerLeDe`
	// deux fois AVANT que l'état React (`isLoading` de `CarteJet`) n'ait eu le temps
	// de se re-rendre — un `useState` ne se lit jamais de façon synchrone entre deux
	// invocations rapprochées. `useRef`, vérifié-et-posé en tête de `lancerLeDe`,
	// exactement l'idiome déjà retenu pour `lockedRef` lui-même (BUG-137/KR-278).
	const lancerEnCoursRef = useRef(false)

	// Stockage temporaire pour l'état lors de l'attente du clic « Lancer »
	const sessionEncourseRef = useRef<EtatSession | null>(null)
	const propositionEncourseRef = useRef<{
		carac: Characteristic
		tc: ChallengeTier
		enjeuReussite: string
		enjeuEchec: string
	} | null>(null)

	// IMPLÉMENTATION DE `executeAction` : le cœur de l'orchestration R1 et R3.
	async function executeAction(saisie: string): Promise<boolean> {
		// VERROU : déjà verrouillé ? On sort tout de suite (appel ignoré).
		if (lockedRef.current) return false

		// Posons le verrou et en notifions l'écran.
		lockedRef.current = true
		setIsLocked(true)

		// VERROU KR-265 ÉTENDU : si cette commande pose une `CarteJet` en attente du
		// clic « Lancer », le verrou NE DOIT PAS se relâcher ici — il couvre toute la
		// chaîne R1→exécution→R2→attente du clic→résolution→R3, un seul verrou. C'est
		// `lancerLeDe` qui le relâche dans SON PROPRE `finally`, une fois la chaîne
		// terminée. Sans ce drapeau, une seconde commande (console ou saisie libre)
		// pourrait s'intercaler pendant que la carte est affichée et écraser en
		// silence la session que `lancerLeDe` s'apprête à lire (`sessionEncourseRef`).
		let carteEnAttente = false

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
			// R2 (ARBITRE) — demander un jet si applicable (lot 2)
			// ──────────────────────────────────────────────────────────
			// Vérifier si cette commande doit déclencher R2
			const pasAccepte = 'type' in nouvelAvis && nouvelAvis.type === 'aucun'
			if (
				pasAccepte &&
				reponse.proposition.lecture === 'commande' &&
				doitArbitrer(reponse.proposition.commande, nouvelleSession)
			) {
				// Appeler R2
				const cibleArbitre: CibleArbitre = {
					role: 'arbitre',
					saisie,
					lieuId: nouvelleSession.monde.lieu_courant,
				}
				const reponseArbitre = await copilote.demander(dossier, cibleArbitre)

				// Vérifier le statut de R2
				if (reponseArbitre.statut === 'propose') {
					const { proposition: propositionArbitre } = reponseArbitre

					// Vérifier si c'est une épreuve ou sans_epreuve
					if ('epreuve' in propositionArbitre) {
						const { carac, tc, enjeu_reussite, enjeu_echec } = propositionArbitre.epreuve
						// Ranger la proposition et attendre le clic « Lancer »
						setCarteJet({
							carac,
							tc,
							enjeuReussite: enjeu_reussite,
							enjeuEchec: enjeu_echec,
						})
						// Sauvegarder l'état pour lancerLeDe
						sessionEncourseRef.current = nouvelleSession
						propositionEncourseRef.current = { carac, tc, enjeuReussite: enjeu_reussite, enjeuEchec: enjeu_echec }
						carteEnAttente = true
						return true // Pas d'appel à R3 maintenant — le verrou reste posé, voir `finally`
					}
					// else : sans_epreuve → continuer à R3 ci-dessous
				}
				// else : erreur R2 → continuer à R3 ci-dessous
			}

			// ──────────────────────────────────────────────────────────
			// R4 (ACTEUR) — réplique du PNJ (n° 12 moteur-acteurs, it1, lot 2)
			// ──────────────────────────────────────────────────────────
			// Appelé UNIQUEMENT si la commande acceptée est `parler`
			if (
				pasAccepte &&
				reponse.proposition.lecture === 'commande' &&
				reponse.proposition.commande.commande === 'parler'
			) {
				// ÉTAPE 6a : Appeler R4 avec la session déjà persistée (S1)
				const cibleActeur: CibleActeur = {
					role: 'acteur',
					personnageId: reponse.proposition.commande.cibles[0],
					saisie,
					session: nouvelleSession, // S1 DÉJÀ PERSISTÉE
				}
				const reponseActeur = await copilote.demander(dossier, cibleActeur)

				// ÉTAPE 6b : Traiter la réponse de R4
				if (!('statut' in reponseActeur)) {
					// Succès R4 — écrire la réplique dans le récit
					const sessionAvecReplique = consignerNarration(nouvelleSession, nouvelleSession.horloge.tour, {
						recit: reponseActeur.replique,
						faits_etablis: [],
					})
					onSessionChange(sessionAvecReplique)
					setIssueNarrateur({
						tour: nouvelleSession.horloge.tour,
						statut: 'raconte',
						suggestions: [],
					})
				} else {
					// Échec R4 (contexte trop long, indisponible, etc.) — AUCUN texte de repli
					// KR-283 : le pas reste acquis, aucune réplique n'est posée, la bannière
					// d'EchecCopilote existante s'affiche.
					setAvis(reponseActeur)
				}
				return pasAccepte
			}

			// ──────────────────────────────────────────────────────────
			// R3 (NARRATEUR) — récit du pas
			// ──────────────────────────────────────────────────────────
			// On n'arrive ici que si le pas a été accepté et pas d'épreuve en attente
			// (et pas un appel R4 — qui gère sa propre réponse ci-dessus)
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
			// DÉVERROUILLAGE : toujours levé, même en cas d'erreur — SAUF si une
			// `CarteJet` vient d'être posée : le verrou reste alors tenu jusqu'à
			// `lancerLeDe` (KR-265, chaîne étendue, voir le commentaire plus haut).
			if (!carteEnAttente) {
				lockedRef.current = false
				setIsLocked(false)
			}
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

	// RÉSOLUTION ET APPEL R3 — appelé quand le joueur clique « Lancer ». SECONDE
	// MOITIÉ de la chaîne verrouillée par `executeAction` (KR-265 étendu) : le
	// verrou a été POSÉ là-bas (et laissé tenu, `carteEnAttente`) et n'est RELÂCHÉ
	// qu'ICI, dans le `finally` ci-dessous — jamais entre les deux, qu'importe ce
	// que le joueur ou la console tentent pendant que la carte est affichée.
	async function lancerLeDe(): Promise<void> {
		if (carteJet === null || sessionEncourseRef.current === null || propositionEncourseRef.current === null) {
			return
		}

		// GARDE : déjà en vol ? Un second appel (double frappe Entrée, etc.) est
		// ignoré — sans elle, deux appels concurrents dupliqueraient `consignerJet`
		// (deux entrées `jet` pour le même pas) et l'appel à R3 (BUG-137/KR-278).
		if (lancerEnCoursRef.current) return
		lancerEnCoursRef.current = true

		try {
			const currentSession = sessionEncourseRef.current
			const proposition = propositionEncourseRef.current

			// Enregistrer le jet dans la session
			const sessionAvecJet = consignerJet(currentSession, currentSession.horloge.tour, {
				carac: proposition.carac,
				tc: proposition.tc,
			})

			// Résoudre le jet
			const issue = issueDuJet(sessionAvecJet, currentSession.horloge.tour)
			if (issue === undefined) {
				// Pas de jet à résoudre — ne devrait pas arriver ici
				setCarteJet(null)
				return
			}

			// Mettre à jour l'état de la carte avec le résultat
			const characteristicValue = sessionAvecJet.heros?.caracs[proposition.carac] ?? 0
			setCarteJet((prev) =>
				prev
					? {
							...prev,
							resultat: {
								roll: issue.roll,
								success: issue.success,
								characteristicValue,
							},
						}
					: null,
			)

			// Créditer l'XP avant l'appel à R3 — la session créditée hérite
			// aux deux branches (succès et dégradation R3), sinon consignerNarration
			// écraserait silencieusement le crédit (BUG-137/238, trouvaille narratif-ia).
			let sessionAvecXp = sessionAvecJet
			const xp = xpDuJet(sessionAvecJet, currentSession.horloge.tour)
			if (xp !== undefined && xp > 0) {
				sessionAvecXp = crediterXp(sessionAvecJet, xp)
				// Persister immédiatement, avant R3 — cette session contient le jet ET le crédit
				onSessionChange(sessionAvecXp)
			} else {
				// Si pas de crédit d'XP, persister quand même le jet enregistré
				onSessionChange(sessionAvecJet)
			}

			// Appeler R3 (narrateur) avec l'épreuve résolue
			const cibleNarrateur: CibleNarrateur = {
				role: 'narrateur',
				saisie: '', // La saisie n'est plus utile ici, c'est du narrateur seulement
				session: sessionAvecXp,
				epreuve: {
					enjeu_reussite: proposition.enjeuReussite,
					enjeu_echec: proposition.enjeuEchec,
				},
			}

			const reponseNarrateur = await copilote.demander(dossier, cibleNarrateur)

			// Traiter la réponse de R3
			if (reponseNarrateur.statut === 'propose') {
				// Succès R3 — écrire le récit
				const { suggestions } = reponseNarrateur.proposition
				const sessionAvecRecit = consignerNarration(
					sessionAvecXp,
					sessionAvecXp.horloge.tour,
					reponseNarrateur.proposition,
				)
				onSessionChange(sessionAvecRecit)
				setIssueNarrateur({
					tour: sessionAvecXp.horloge.tour,
					statut: 'raconte',
					suggestions,
				})
			} else {
				// Échec R3 — juste signaler la dégradation
				setIssueNarrateur({
					tour: sessionAvecXp.horloge.tour,
					statut: 'degrade',
				})
			}

			// Nettoyer l'état de la carte
			setCarteJet(null)
			sessionEncourseRef.current = null
			propositionEncourseRef.current = null
		} finally {
			// DÉVERROUILLAGE DE LA CHAÎNE ÉTENDUE — voir le commentaire de tête.
			lockedRef.current = false
			setIsLocked(false)
			lancerEnCoursRef.current = false
		}
	}

	return {
		executeAction,
		getGestelabel,
		avis,
		isLocked,
		issueNarrateur,
		pasEnCours,
		carteJet,
		lancerLeDe,
	}
}
