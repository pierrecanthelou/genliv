/**
 * `brain/dossier/arbitre.ts` — LE ROUTAGE ET LA RÉSOLUTION DU NEUVIÈME RÔLE
 * (n° 11 `moteur-arbitre`, lot `contrat`, it2).
 *
 * TROIS RESPONSABILITÉS, PURES, SYNCHRONES :
 *  · `doitArbitrer` — la PORTE : décide si R2 (arbitre) doit être consulté après
 *    une commande acceptée. Un GATE MÉCANIQUE se fonde sur une STRUCTURE (le
 *    verbe, la présence d'un héros), **jamais** sur le CONTENU/SENS d'une prose
 *    auteur (`dangers` reste de la prose narrative, jamais parsée — KR-262/244
 *    étendus, arbitrage cadrage tour 3) ;
 *  · `issueDuJet` — **LA SEULE appelante de `resolveChallenge` dans tout le
 *    dépôt** (§ 8 #5 du plan it2) : lue par `CarteJet`, par l'assembleur du
 *    narrateur (`copilote/contexte/narrateur.ts`) et, en it3, par le calcul
 *    d'XP. Un témoin de balayage (`arbitre.test.ts`) garde cette unicité.
 *  · `classifierIssue` — la classification QUALITATIVE binaire (réussit/échoue)
 *    que le CODE pose, jamais l'IA (R3 ne reçoit jamais les chiffres).
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import { resolveChallenge, type ChallengeResult } from '../challenge'
import { creerRng } from './alea'
import type { Commande } from './commandes'
import type { EtatSession } from './session'

/**
 * LA PORTE DE DÉCLENCHEMENT DE R2 — vraie **ssi** `commande.commande === 'agir'`
 * **et** `session.heros !== undefined` ; **jamais** sur `'aller'`, **jamais**
 * gatée par le contenu de `monde.lieux[].dangers` (arbitrage cadrage tour 3,
 * retenu au raffinage it2 : le routage par présence/contenu de `dangers`,
 * proposé puis retiré par son propre auteur, n'est jamais revenu).
 */
export function doitArbitrer(commande: Commande, session: EtatSession): boolean {
	return commande.commande === 'agir' && session.heros !== undefined
}

/** La classification QUALITATIVE binaire d'un jet résolu — ce que R3 reçoit,
 *  jamais les chiffres. */
export type IssueEpreuve = 'reussit' | 'echoue'

/** Le CODE classe, jamais l'IA : `ChallengeResult.success` est la seule source. */
export function classifierIssue(resultat: ChallengeResult): IssueEpreuve {
	return resultat.success ? 'reussit' : 'echoue'
}

/**
 * LA RÉSOLUTION — **SEULE appelante de `resolveChallenge` dans tout le dépôt**.
 * Lit l'entrée `moteur` du journal qui porte `origine` **pour `tour`** et un
 * `jet` déjà consigné (`consignerJet`) ; sans elle, ou sans héros, rend
 * `undefined` — il n'y a rien à résoudre.
 *
 * DÉTERMINISTE : `creerRng(session.graine_alea, 'jet', tour)` dérive un
 * générateur NEUF à chaque appel, toujours de la MÊME clé `(graine, 'jet',
 * tour)` — deux appels avec la même session et le même `tour` rendent donc
 * TOUJOURS la même issue, que l'appelant soit la carte, l'assembleur du
 * narrateur ou (it3) le calcul d'XP (critère 3 du plan it2).
 */
export function issueDuJet(session: EtatSession, tour: number): ChallengeResult | undefined {
	const entree = session.journal.find(
		(candidate) => candidate.tour === tour && candidate.role === 'moteur' && candidate.jet !== undefined,
	)
	if (entree?.jet === undefined || session.heros === undefined) return undefined

	const valeur = session.heros.caracs[entree.jet.carac]
	return resolveChallenge(entree.jet.tc, valeur, creerRng(session.graine_alea, 'jet', tour))
}
