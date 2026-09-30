/**
 * LA NARRATION D'UN PAS — la transition PURE qui l'écrit sur la session (n° 10
 * `moteur-interprete` : it2 pour le récit, it3 pour la mémoire, lot `contrat`).
 *
 * UNE SEULE RESPONSABILITÉ : poser ce que le narrateur a rendu, DÉJÀ VALIDÉ — le récit du
 * pas, les faits qu'il établit, et le résumé qu'il a condensé s'il en a été prié —, en UNE
 * SEULE transition, ou ne rien faire. Elle ne valide rien — le validateur de sortie est
 * l'unique décideur de ce qui est recevable, et un second décideur ici divergerait de lui
 * (KR-013). Elle n'appelle rien, ne persiste rien, n'émet rien : l'orchestrateur la compose
 * APRÈS la réponse du modèle, puis persiste ce qu'elle rend.
 *
 * UNE TRANSITION ET NON TROIS (`consignerRecit` + `retenir` + `absorber`) : avec plusieurs
 * écritures, leur ORDRE d'appel deviendrait un contrat implicite, et un récit pourrait
 * rester posé sans ses faits après une coupure (R8 du raffinage it3).
 *
 * ⚠ CE FICHIER N'ÉCRIT JAMAIS LE NOM DU SERVICE QUI PARLE AU MODÈLE, NI AUCUNE ROUTE
 * RÉSEAU — même en commentaire : `brain/dossier/` est sous interdiction TOTALE par
 * `moteurSansIA.test.ts` (KR-260), un balayage de TEXTE aveugle à la sémantique. Et il ne
 * connaît que des TYPES de `dossier/` : ce qu'il reçoit est une structure, d'où elle vient
 * ne le regarde pas.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6), même doctrine que `session.ts`
 * et `commandes.ts`.
 */
import { pasACondenser } from './memoire'
import type { EtatSession, FaitEtabli, MemoireSession, ResumeMemoire } from './session'

/** Deux faits sont LE MÊME quand leur phrase (aux blancs de bord près) et l'ENSEMBLE de
 *  leurs ancres coïncident. Ce n'est pas une réparation (KR-230) : la réponse du modèle
 *  est acceptée entière ; le stockage refuse seulement de retenir deux fois ce qu'il
 *  retient déjà — la même garde, au fond, que « le premier récit gagne ». */
function memeFait(a: FaitEtabli, b: FaitEtabli): boolean {
	if (a.fait.trim() !== b.fait.trim() || a.sur.length !== b.sur.length) return false
	return a.sur.every((ancre) => b.sur.includes(ancre))
}

/**
 * CONSIGNER LA NARRATION DU PAS `pas` — PURE, synchrone, totale.
 *
 * ── LE RÉCIT ──────────────────────────────────────────────────────────────────
 * ÉCRIT SUR L'ENTRÉE QUI PORTE `origine` POUR CE PAS, ET SUR ELLE SEULE — jamais sur « la
 * dernière entrée » : un `aller` qui franchit un jalon place les entrées de jalon APRÈS
 * l'entrée d'`origine`, au MÊME `tour` (scénario séparateur de `recit.test.ts`).
 * Invariant tenu par construction : `journal.every(e => e.recit === undefined || e.origine !== undefined)`.
 *
 * ── LES FAITS ─────────────────────────────────────────────────────────────────
 * AJOUTÉS À LA FIN, dans l'ordre rendu, jamais résumés, réécrits ni évincés. Un fait
 * IDENTIQUE à un fait déjà retenu (ou à un fait précédent du même apport) n'est pas ajouté
 * une seconde fois (`memeFait`).
 *
 * ── LE RÉSUMÉ, ET SA GARDE ────────────────────────────────────────────────────
 * `apport.resume` n'est écrit QUE SI `apport.resume.jusqu_au_pas === pasACondenser(session)?.a`
 * — sinon la partie résumé reste INCHANGÉE, sans erreur. C'est le CHEMIN D'ÉCRITURE qui
 * tient l'invariant I2 (`session.ts`), pas la confiance dans l'appelant : un résumé
 * calculé sur une autre session, ou arrivé alors que rien n'était dû, ne peut pas faire
 * reculer ni sauter le pointeur. Et un résumé ABSENT laisse l'ancien en place : la tranche
 * reste due, elle sera redemandée au pas narré suivant (KR-271).
 *
 * ── I1 ────────────────────────────────────────────────────────────────────────
 * Sans aucun fait ni résumé à retenir, `memoire` reste `null` — jamais un objet vide.
 * Et quand rien de la mémoire ne change, `memoire` garde SA RÉFÉRENCE (`toBe`).
 *
 * ── LA MÊME RÉFÉRENCE, dans TROIS cas, et aucun n'est une erreur ─────────────
 *  1. `pas !== session.horloge.tour` — la narration d'un pas PÉRIMÉ. Inatteignable
 *     aujourd'hui par le verrou de tour de l'orchestrateur (KR-265), et gardé QUAND MÊME :
 *     c'est une fonction exportée de `brain/` ;
 *  2. aucune entrée à `origine` n'existe pour ce pas — le tour zéro, ou un journal qui n'a
 *     rien joué : il n'y a pas de commande à raconter ;
 *  3. l'entrée à `origine` de ce pas porte DÉJÀ un récit — au plus UNE narration par pas,
 *     et la PREMIÈRE GAGNE, pour le récit ET pour la mémoire : un second appel n'écrase
 *     jamais ce que le joueur a lu, ni n'ajoute des faits à un pas déjà raconté.
 *
 * CE QU'ELLE NE TOUCHE PAS, ET C'EST MESURÉ PAR RÉFÉRENCE : `monde`, `horloge`, `attente`,
 * et CHAQUE AUTRE entrée du journal gardent leur identité.
 */
export function consignerNarration(
	session: EtatSession,
	pas: number,
	apport: {
		readonly recit: string
		readonly faits_etablis: readonly FaitEtabli[]
		readonly resume?: ResumeMemoire
	},
): EtatSession {
	if (pas !== session.horloge.tour) return session

	const rang = session.journal.findIndex((entree) => entree.tour === pas && entree.origine !== undefined)
	if (rang === -1) return session
	if (session.journal[rang].recit !== undefined) return session

	const journal = session.journal.map((entree, indice) =>
		indice === rang ? { ...entree, recit: apport.recit } : entree,
	)

	const retenus = session.memoire?.faits_etablis ?? []
	const neufs = apport.faits_etablis.reduce<FaitEtabli[]>(
		(ajoutes, fait) => ([...retenus, ...ajoutes].some((deja) => memeFait(deja, fait)) ? ajoutes : [...ajoutes, fait]),
		[],
	)

	const attendu = pasACondenser(session)
	const resumeAccepte =
		apport.resume !== undefined && attendu !== null && apport.resume.jusqu_au_pas === attendu.a
			? apport.resume
			: undefined

	if (neufs.length === 0 && resumeAccepte === undefined) return { ...session, journal }

	const resume = resumeAccepte ?? session.memoire?.resume
	const memoire: MemoireSession =
		resume === undefined ? { faits_etablis: [...retenus, ...neufs] } : { faits_etablis: [...retenus, ...neufs], resume }

	return { ...session, journal, memoire }
}
