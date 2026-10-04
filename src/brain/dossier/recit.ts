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
import { epreuvesReussies } from './arbitre'
import { appliquerDelta, type DeltaJournalise } from './evaluate'
import type { FaitsDeSession } from './faits'
import { estCleDe } from './identifiers'
import { pasACondenser } from './memoire'
import { evaluerSavoir } from './revelation'
import {
	crediterConfiance,
	type EtatSession,
	type FaitEtabli,
	type MemoireSession,
	type ResumeMemoire,
} from './session'
import type { Dossier, Savoir } from './types'

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

/** Le `Savoir` d'un `personnageId` qui vise `indiceId` — `undefined` si le
 *  personnage ne résout pas, ou ne porte aucun savoir sur cet indice. */
function trouverSavoir(dossier: Dossier, personnageId: string, indiceId: string): Savoir | undefined {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === personnageId)
	return personnage?.savoirs.find((savoir) => savoir.indice_id === indiceId)
}

/**
 * AJOUTE `indiceId` À `faits.pnj[personnageId].a_dit`, idempotent — précédent
 * `avecAjout` (`deltas.ts`), RECOPIÉ ici plutôt que partagé : `a_dit` N'A PAS
 * D'ENTRÉE DANS LE REGISTRE `DELTAS` (aucun prédicat ne le DEMANDE comme un effet
 * de règle, `pnj_a_revele` le LIT seulement), donc `appliquerDelta` ne peut pas
 * l'écrire — `consignerReponseActeur` en est le SEUL écrivain de tout le dépôt,
 * au même titre que `fixerHeros` pour `EtatSession.heros`.
 *
 * `estCleDe`, jamais une indexation nue ni `in` : `faits.pnj` est indexé par un
 * identifiant de dossier, valeur non fiable au sens de KR-175.
 */
function avecIndiceConfie(faits: FaitsDeSession, personnageId: string, indiceId: string): FaitsDeSession {
	const etatExistant = estCleDe(faits.pnj, personnageId) ? faits.pnj[personnageId] : { a_dit: [] }
	if (etatExistant.a_dit.includes(indiceId)) return faits
	return {
		...faits,
		pnj: { ...faits.pnj, [personnageId]: { ...etatExistant, a_dit: [...etatExistant.a_dit, indiceId] } },
	}
}

/**
 * CONSIGNER LA RÉPONSE D'UN ACTEUR (R4) — PURE, synchrone, et le SEUL écrivain
 * COMBINÉ de `recit` + `reveler_indice` + `a_dit` SUR LA MÊME ENTRÉE de journal
 * (n° 12 `moteur-acteurs`, it2, lot `contrat`). Précédent exact `consignerJet` /
 * `fixerHeros` pour la forme, et `consignerNarration` pour la garde structurelle
 * du récit — RECOPIÉE ici (recopie jusqu'au TROISIÈME appelant, précédent
 * `SiteDelta`/`SiteExpr`) plutôt que partagée : `consignerNarration` n'écrit
 * jamais de delta ni de mémoire de personnage, et les deux fonctions restent
 * chacune TOTALE sur sa propre responsabilité.
 *
 * MÊMES TROIS CAS « MÊME RÉFÉRENCE » que `consignerNarration` — `pas` périmé,
 * aucune entrée à `origine` pour ce pas, ou cette entrée porte déjà un récit :
 * `session` est rendue INCHANGÉE, SANS lever, même si `indicesReveles` contient
 * un identifiant devenu invalide entretemps — il n'y a alors rien à écrire.
 *
 * L'APPLICATION, DANS CET ORDRE (§ 4 bis du plan d'itération) :
 *  1. RE-VÉRIFICATION — chaque id de `indicesReveles` doit être `'revelable'`
 *     MAINTENANT, par le MÊME `evaluerSavoir` que celui qui a fermé le catalogue
 *     offert à R4 (KR-287), AVEC les réussites acquises de ce personnage
 *     (`epreuvesReussies`, it4) : un savoir gardé par un `jet` n'est `'revelable'`
 *     que si le journal de CETTE session porte la réussite — celle du pas courant
 *     comprise, qui est précisément ce qui rend le savoir dû. Un id qui ne l'est
 *     plus LÈVE : ce n'est PAS une sortie de modèle à rejouer (la validation de
 *     FORME est déjà passée, § 4 bis du plan), c'est un APPELANT FAUTIF (KR-238,
 *     précédent `evaluerExpr`) — le seul appelant légitime a dû re-résoudre un rang
 *     devenu obsolète entre l'assemblage du contexte et l'application ;
 *  2. `appliquerDelta(reveler_indice)` pour chaque id, dans l'ordre reçu ;
 *  3. `a_dit` du personnage, dans le MÊME ordre — le monde SAIT avant que le
 *     personnage SE SOUVIENNE de l'avoir dit ;
 *  4. LE RÉCIT, sur la MÊME entrée que les deltas — jamais un gabarit mécanique :
 *     `apport.recit` est la réplique RÉELLE que R4 a rendue, déjà validée ;
 *  5. UNE session rendue, persistée une fois par l'appelant (`useTourDeJeu`).
 *
 * `indicesReveles` VIDE est un CAS NOMINAL (succès de franchise, § 4 bis du
 * plan) : aucune boucle, aucun delta, `deltas` reste ABSENT de l'entrée —
 * seul le récit est posé.
 */
export function consignerReponseActeur(
	session: EtatSession,
	pas: number,
	dossier: Dossier,
	apport: {
		readonly recit: string
		readonly personnageId: string
		readonly indicesReveles: readonly string[]
		readonly deltaConfiance: -1 | 0 | 1
	},
): EtatSession {
	if (pas !== session.horloge.tour) return session
	const rang = session.journal.findIndex((entree) => entree.tour === pas && entree.origine !== undefined)
	if (rang === -1) return session
	if (session.journal[rang].recit !== undefined) return session

	// RE-VÉRIFICATION SUR L'ÉTAT D'AVANT Δ (n° 12 it3) — un Δ négatif de cette
	// même réplique ne doit jamais refermer rétroactivement le savoir qu'elle
	// vient de confier : la porte se juge AVANT que la confiance ne varie.
	const epreuves = epreuvesReussies(session, apport.personnageId)
	for (const indiceId of apport.indicesReveles) {
		const savoir = trouverSavoir(dossier, apport.personnageId, indiceId)
		if (
			savoir === undefined ||
			evaluerSavoir(dossier, session.monde, apport.personnageId, savoir, epreuves) !== 'revelable'
		) {
			throw new Error(`consignerReponseActeur : « ${indiceId} » n'est plus révélable par « ${apport.personnageId} »`)
		}
	}

	let faits = session.monde
	const deltas: DeltaJournalise[] = []
	for (const indiceId of apport.indicesReveles) {
		const applique = appliquerDelta(faits, { delta: 'reveler_indice', cibles: [indiceId] })
		faits = applique.faits
		deltas.push(applique.journalise)
		faits = avecIndiceConfie(faits, apport.personnageId, indiceId)
	}

	// Δ APPLIQUÉ APRÈS les révélations (n° 12 it3) — `crediterConfiance` sature
	// aux bornes, seule porte d'écriture de `EtatPnj.confiance`.
	const sessionCreditee = crediterConfiance({ ...session, monde: faits }, apport.personnageId, apport.deltaConfiance)

	const journal = sessionCreditee.journal.map((entree, indice) =>
		indice === rang ? { ...entree, recit: apport.recit, ...(deltas.length > 0 ? { deltas } : {}) } : entree,
	)

	return { ...sessionCreditee, journal }
}
