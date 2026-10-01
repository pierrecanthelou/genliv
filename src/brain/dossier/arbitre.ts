/**
 * `brain/dossier/arbitre.ts` — LE ROUTAGE ET LA RÉSOLUTION DU NEUVIÈME RÔLE
 * (n° 11 `moteur-arbitre`, lot `contrat`, it2 puis it3).
 *
 * QUATRE RESPONSABILITÉS, PURES, SYNCHRONES :
 *  · `doitArbitrer` — la PORTE : décide si R2 (arbitre) doit être consulté après
 *    une commande acceptée. Un GATE MÉCANIQUE se fonde sur une STRUCTURE (le
 *    verbe, la présence d'un héros), **jamais** sur le CONTENU/SENS d'une prose
 *    auteur (`dangers` reste de la prose narrative, jamais parsée — KR-262/244
 *    étendus, arbitrage cadrage tour 3) ;
 *  · `issueDuJet` — **LA SEULE appelante de `resolveChallenge` dans `brain/` et
 *    `features/**`** (§ 8 #5 du plan it2 ; reformulé lot `contrat`, it3, § 8 #9
 *    du plan — l'affirmation « dans tout le dépôt » était fausse :
 *    `src/player/engine/{actionEngine,combatEngine,capacityEffects}.ts`
 *    l'appellent aussi, orphelins GELÉS de l'ancien runtime sans producteur
 *    depuis `moteur-dossier` it4 (KR-240), hors périmètre de cette feature) :
 *    lue par `CarteJet`, par l'assembleur du narrateur
 *    (`copilote/contexte/narrateur.ts`) et, depuis it3, par `xpDuJet`. Un
 *    témoin de balayage (`arbitre.test.ts`) garde cette unicité CÔTÉ FEATURES.
 *  · `classifierIssue` — la classification QUALITATIVE, à TROIS états depuis
 *    it3 (réussit/réussit nettement/échoue), que le CODE pose, jamais l'IA (R3
 *    ne reçoit jamais les chiffres) ;
 *  · `xpDuJet` (it3) — l'XP gagnée par le jet, DÉLÈGUE À `issueDuJet` pour le
 *    tirage, jamais un second appel à `resolveChallenge`.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import { CHALLENGE_TIERS, challengeTierValue, resolveChallenge, type ChallengeResult } from '../challenge'
import { challengeXp, MARGE_FRANCHE, tierOf } from '../xp'
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

/**
 * La classification QUALITATIVE d'un jet résolu — ce que R3 reçoit, jamais les
 * chiffres. TROIS membres depuis it3 : `'reussit'`/`'echoue'` INCHANGÉS depuis
 * it2 (ajout pur, § 8 #2 du plan it3 — un renommage aurait cassé deux tests
 * existants sans gain fonctionnel) ; `'reussit_nettement'` nouveau, pour une
 * marge ≥ `MARGE_FRANCHE` (`brain/xp.ts`).
 */
export type IssueEpreuve = 'echoue' | 'reussit' | 'reussit_nettement'

/**
 * Le CODE classe, jamais l'IA : `ChallengeResult.success`/`.margin` sont la
 * seule source. La frontière `'reussit'`/`'reussit_nettement'` est
 * `MARGE_FRANCHE` (`brain/xp.ts`), LA MÊME ADRESSE que le bonus de +1 XP de
 * `challengeXp` (KR-261) — jamais un second seuil dupliqué ici.
 */
export function classifierIssue(resultat: ChallengeResult): IssueEpreuve {
	if (!resultat.success) return 'echoue'
	return resultat.margin >= MARGE_FRANCHE ? 'reussit_nettement' : 'reussit'
}

/**
 * LA RÉSOLUTION — **SEULE appelante de `resolveChallenge` dans `brain/` et
 * `features/**`** (voir la docstring de tête, § `issueDuJet`). Lit l'entrée
 * `moteur` du journal qui porte `origine` **pour `tour`** et un `jet` déjà
 * consigné (`consignerJet`) ; sans elle, ou sans héros, rend `undefined` — il
 * n'y a rien à résoudre.
 *
 * DÉTERMINISTE : `creerRng(session.graine_alea, 'jet', tour)` dérive un
 * générateur NEUF à chaque appel, toujours de la MÊME clé `(graine, 'jet',
 * tour)` — deux appels avec la même session et le même `tour` rendent donc
 * TOUJOURS la même issue, que l'appelant soit la carte, l'assembleur du
 * narrateur ou (it3) `xpDuJet` (critère 3 du plan it2).
 */
export function issueDuJet(session: EtatSession, tour: number): ChallengeResult | undefined {
	const entree = session.journal.find(
		(candidate) => candidate.tour === tour && candidate.role === 'moteur' && candidate.jet !== undefined,
	)
	if (entree?.jet === undefined || session.heros === undefined) return undefined

	const valeur = session.heros.caracs[entree.jet.carac]
	return resolveChallenge(entree.jet.tc, valeur, creerRng(session.graine_alea, 'jet', tour))
}

/**
 * L'XP GAGNÉE PAR CE JET — PURE (n° 11 `moteur-arbitre`, lot `contrat`, it3).
 * DÉLÈGUE À `issueDuJet` POUR LE TIRAGE — jamais un second appel à
 * `resolveChallenge` dans ce module : LA MÊME sélection d'entrée de journal et
 * LA MÊME garde `undefined` qu'`issueDuJet`, augmentée du cas (structurellement
 * inatteignable, mais vérifié par le type) où `issueDuJet` elle-même ne résout
 * rien.
 *
 * `heroTier` se lit sur la CARACTÉRISTIQUE TESTÉE par le jet
 * (`entree.jet.carac`), **jamais** la MC — réservée aux jets de fuite/combat
 * (n° 13), amendé dans `docs/REGLES-DU-JEU.md` § 5 par ce lot (KR-130, sens
 * d'écriture : doc avant code).
 *
 * `0` EST UNE VALEUR LÉGALE (bande sans bonus, § 5) : `undefined` ne sort que
 * dans les DEUX cas où `issueDuJet` rend déjà `undefined` elle-même (aucun jet
 * consigné pour `tour`, ou aucun héros).
 */
export function xpDuJet(session: EtatSession, tour: number): number | undefined {
	const resultat = issueDuJet(session, tour)
	const entree = session.journal.find(
		(candidate) => candidate.tour === tour && candidate.role === 'moteur' && candidate.jet !== undefined,
	)
	if (resultat === undefined || entree?.jet === undefined || session.heros === undefined) return undefined

	const heroTier = tierOf(session.heros.caracs[entree.jet.carac])
	const baseXp = CHALLENGE_TIERS[entree.jet.tc].baseXp
	const challengeTier = challengeTierValue(entree.jet.tc)

	return challengeXp({ challengeTier, heroTier, success: resultat.success, baseXp, margin: resultat.margin })
}
