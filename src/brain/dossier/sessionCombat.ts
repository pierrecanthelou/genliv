// `Posture` — n° 13 `moteur-combat`, lot `contrat` : TYPE SEUL, et `combat.ts`
// n'importe rien de `dossier/`, donc aucun cycle. `EtatCombat.postures` la porte TELLE QUELLE.
import type { Posture } from '../combat'
// `HeroState` est importée TELLE QUELLE de `src/player/types.ts` — jamais une seconde
// forme (même motif que `session.ts`) : import de TYPE SEUL, effacé à l'émission.
import type { HeroState } from '../../player/types'
// UNE SEULE ARÊTE DE VALEUR vers `session.ts` — `crediterXp`, seule porte de `heros.xp`, que
// `cloturerParLaVictoire` appelle — et AUCUNE dans l'autre sens : `session.ts` n'importe
// de ce module que des TYPES (`import type`, effacé à l'émission). Le sens inverse, une
// ré-exportation de VALEUR depuis `session.ts`, nouerait un cycle de modules. Ne jamais
// le poser.
import { crediterXp, type EtatSession } from './session'

/**
 * LES PORTES DU COMBAT EN SESSION — extraites de `session.ts` (n° 14 `moteur-horloge`,
 * it4, lot `contrat` : DÉPLACEMENT PUR, aucun champ neuf, aucune ligne de logique
 * modifiée). `session.ts` dépassait 800 lignes (KR-112) ; la dette portait ce fichier
 * depuis la n° 13 (`docs/ROADMAP-BASCULE-IA.md`, « dettes à déclencheur »), et l'itération
 * qui rouvre `session.ts` la paie.
 *
 * CE QUI VIT ICI : les trois types du combat (`EtatCombat`, `IssueCombat`, `BilanCombat`)
 * et TROIS des quatre portes d'écriture de `EtatSession.combat` — `jouerPosture` ÉTEND
 * `postures`, `fuirRencontre` POSE `fuite`, `cloreCombat` RETIRE la clé. LA QUATRIÈME,
 * `resoudreRencontre` (qui POSE `combat`), RESTE dans `session.ts` : elle n'a aucune
 * dépendance de clôture, et `src/player/engine/rencontre.ts` l'importe de là.
 *
 * `session.ts` RÉ-EXPORTE les trois types, en TYPE SEUL, pour ses importeurs historiques
 * (`copilote/types.ts`, `copilote/contexte/commentateur.ts`, `player/engine/rencontre.ts`) :
 * le même type sous deux adresses, jamais deux formes.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * LE RENVOI DE REJEU D'UN COMBAT EN COURS — TROIS FEUILLES, ET TROIS SEULEMENT :
 *  · `monstre_ref` — `bestiaire.<templateId>`, TELLE QUE `evenements[].monstre_ref`
 *    la porte (résolue par `monstreDeLaReference`, `monstre.ts`) ;
 *  · `postures` — celles que le JOUEUR a choisies, dans l'ordre, une par round joué.
 *    Celle du monstre n'y est JAMAIS : elle se redérive du rejeu ;
 *  · `fuite` — le CHOIX du joueur de fuir (n° 13, it2, `docs/REGLES-PLAY.md` D5), posé
 *    par `fuirRencontre` seule. C'est une ENTRÉE du joueur au même titre que `postures`,
 *    jamais un état dérivé : le rejeu la consomme APRÈS les postures. `hero-fled`, lui,
 *    est une issue DÉRIVÉE du rejeu, jamais stockée (KR-013).
 *
 * AUCUN INSTANTANÉ (KR-292) : ni PV, ni PE, ni round, ni journal — un snapshot
 * vieillirait dès que le moteur de combat changerait entre la sauvegarde et la
 * reprise. Les PV vivants sont DÉRIVÉS (KR-013) ; `heros.pv`/`heros.pe` ne bougent
 * qu'à la clôture.
 *
 * `fuite` est OPTIONNEL À VIE (KR-251) et d'un type LITTÉRAL : `true` ou ABSENT,
 * JAMAIS `false` — une clé présente à `false` serait un second état « pas de fuite »,
 * distinct de l'absence, que rien ne départagerait (KR-013). Une session écrite avant
 * cette itération ne la porte pas : état LÉGAL, pas un trou à combler.
 */
export interface EtatCombat {
	readonly monstre_ref: string
	readonly postures: readonly Posture[]
	readonly fuite?: true
}

/**
 * COMMENT UN COMBAT S'ACHÈVE — registre CLOS, cinq issues. `'hero-fled'` est livré par
 * l'itération 2 (KR-297) : le héros sort du combat vivant, par un choix qu'il a fait
 * (`EtatCombat.fuite`), au prix d'un assaut gratuit. Son bilan porte donc des PV > 0 —
 * un assaut gratuit qui les ramènerait à ≤ 0 s'achève en `'hero-mort'`, jamais en
 * `'hero-fled'` (`docs/REGLES-PLAY.md` D5).
 * `'hero-mort'` est la seule issue qui NE CLÔT PAS : `combat` reste, et aucune
 * commande ne reprend (écran de fin : n° 15).
 */
export type IssueCombat = 'hero-victory' | 'monster-fled' | 'hero-survived-unconscious' | 'hero-mort' | 'hero-fled'

/**
 * CE QUE LA CLÔTURE ÉCRIT DANS LA SESSION — le bilan que le rejeu a calculé et que
 * `cloreCombat` applique. Jamais persisté : il se recalcule du rejeu (KR-292).
 *  · `pv`, `pe` — les valeurs VIVANTES du héros en fin de combat ;
 *  · `xp` — le gain, à créditer par `crediterXp` (seule porte de `heros.xp`) ;
 *  · `pv_max_delta`, `pe_max_delta` — la variation des plafonds (maladie, drain,
 *    rayon), SIGNÉE : négative quand le monstre a rogné le maximum.
 */
export interface BilanCombat {
	readonly issue: IssueCombat
	readonly pv: number
	readonly pe: number
	readonly xp: number
	readonly pv_max_delta: number
	readonly pe_max_delta: number
}

/**
 * JOUER UNE POSTURE — PURE, et SEULE PORTE qui ÉTEND `EtatCombat.postures` : AJOUTÉE
 * à la fin, une par round — c'est cet ordre que le rejeu consomme (KR-292). Elle ne
 * résout RIEN : aucun round, aucun PV (la résolution est un REJEU). NO-OP, MÊME
 * RÉFÉRENCE, SANS `combat` : en INVENTER un ouvrirait un combat sans monstre ; et
 * NO-OP, MÊME RÉFÉRENCE, une fois `fuite` posée : la fuite est TERMINALE
 * (`docs/REGLES-PLAY.md` D5), aucune posture ne se joue après — une posture ajoutée
 * après `fuite` serait une entrée que le rejeu n'a aucune raison de consommer.
 */
export function jouerPosture(session: EtatSession, posture: Posture): EtatSession {
	if (session.combat === undefined || session.combat.fuite === true) return session
	return { ...session, combat: { ...session.combat, postures: [...session.combat.postures, posture] } }
}

/**
 * FUIR UN COMBAT — PURE, et SEULE PORTE qui POSE `EtatCombat.fuite` (n° 13
 * `moteur-combat`, it2, KR-297 : la fuite n'est PAS une posture, d'où une fonction
 * séparée de `jouerPosture`). UNE SEULE ÉCRITURE : `combat.fuite = true`. Elle ne
 * résout RIEN — ni l'assaut gratuit, ni les PV, ni l'issue : c'est le REJEU qui
 * consomme `fuite` après les postures et DÉRIVE `'hero-fled'` ou `'hero-mort'`
 * (`docs/REGLES-PLAY.md` D5). Ni `postures`, ni `monstre_ref`, ni `monde`, `horloge`,
 * `journal`, `heros` ne bougent : le héros RESTE au lieu courant, aucun déplacement.
 *
 * NO-OP, MÊME RÉFÉRENCE, SANS `combat` (rien à fuir) ou si `fuite` est DÉJÀ posée
 * (idempotente : une seconde fuite ne dit rien de plus). Le contrat ne lit PAS
 * l'issue du rejeu : la session ne la porte pas (KR-292). Fuir un combat dont le
 * rejeu est déjà terminal est donc ACCEPTÉ ici, et c'est le rejeu qui l'ignore.
 */
export function fuirRencontre(session: EtatSession): EtatSession {
	if (session.combat === undefined || session.combat.fuite === true) return session
	return { ...session, combat: { ...session.combat, fuite: true } }
}

/** LE PLANCHER DE `pvMax`/`peMax` APRÈS UNE CLÔTURE (maladie, drain, rayon) — NOMMÉ (KR-165). */
const PLANCHER_DES_MAXIMA = 1

/**
 * CE QUE CHAQUE ISSUE FAIT DE LA SESSION — un `Record<IssueCombat, …>` EXHAUSTIF
 * PAR COMPILATION (KR-117), jamais une échelle de `if`. PRIVÉ : la porte est
 * `cloreCombat`, qui garde `heros` une fois pour les cinq entrées.
 */
const CLOTURES: Readonly<
	Record<IssueCombat, (session: EtatSession, heros: HeroState, bilan: BilanCombat) => EtatSession>
> = {
	'hero-victory': cloturerParLaVictoire,
	// MÊME RÉSOLUTION que la victoire : le monstre a rompu le combat (`REGLES-DU-JEU.md`
	// § 4, fuite du monstre) et le héros en sort debout, avec l'XP du combat. Le
	// butin est hors périmètre de cette itération.
	'monster-fled': cloturerParLaVictoire,
	// LE HÉROS SE RÉVEILLE À 1 PV À LA FIN DU COMBAT (`docs/REGLES-PLAY.md` E1).
	// PAS d'XP, PAS de variation de plafonds : ce ne sont pas des gains de victoire.
	// `pe` est celle du bilan — les rounds ont coûté de l'endurance, la rendre
	// intacte offrirait un repos gratuit.
	'hero-survived-unconscious': (session, heros, bilan) =>
		sansCombat({ ...session, heros: { ...heros, pv: 1, pe: Math.min(bilan.pe, heros.peMax) } }),
	// LE HÉROS SORT DU COMBAT PAR LA FUITE (`docs/REGLES-PLAY.md` D5) : même doctrine que
	// l'inconscient — PAS d'XP, PAS de variation de plafonds (ni gain de victoire, ni
	// maladie, drain ou rayon : la fuite n'en emporte aucun). DIFFÉRENCE : il n'est PAS
	// remis à 1 PV, il garde ses PV RESTANTS après l'assaut gratuit, écrêtés au plafond
	// INTACT — comme `pe`, celle du bilan : les rounds joués ont coûté de l'endurance, la
	// rendre intacte offrirait un repos gratuit. AUCUN déplacement : `monde` (donc
	// `lieu_courant`), `horloge` et `journal` ne bougent pas.
	'hero-fled': (session, heros, bilan) =>
		sansCombat({
			...session,
			heros: { ...heros, pv: Math.min(bilan.pv, heros.pvMax), pe: Math.min(bilan.pe, heros.peMax) },
		}),
	// LA MORT NE CLÔT RIEN : session rendue À L'IDENTIQUE, `combat` reste, et
	// `executerCommande` continue de tout refuser. L'écran de fin est la n° 15.
	'hero-mort': (session) => session,
}

/**
 * LA SESSION SANS `combat` — la CLÉ est retirée, jamais posée à `undefined`
 * (KR-251). `delete` sur une COPIE : l'argument reste intact. Compile PARCE QUE
 * `combat` est optionnelle (précédent exact `retirerAttente`, `interprete.ts`).
 */
function sansCombat(session: EtatSession): EtatSession {
	const reste = { ...session }
	delete reste.combat
	return reste
}

/**
 * VICTOIRE OU FUITE DU MONSTRE : plafonds d'abord (`+ delta`, plancher
 * `PLANCHER_DES_MAXIMA`), jauges ensuite — ÉCRÊTÉES au plafond neuf, jamais
 * relevées par lui —, `combat` retiré, XP créditée en DERNIER par `crediterXp`
 * (seule porte de `heros.xp` : cette fonction n'écrit jamais `xp` elle-même).
 */
function cloturerParLaVictoire(session: EtatSession, heros: HeroState, bilan: BilanCombat): EtatSession {
	const pvMax = Math.max(PLANCHER_DES_MAXIMA, heros.pvMax + bilan.pv_max_delta)
	const peMax = Math.max(PLANCHER_DES_MAXIMA, heros.peMax + bilan.pe_max_delta)
	const pv = Math.min(bilan.pv, pvMax)
	const pe = Math.min(bilan.pe, peMax)
	return crediterXp(sansCombat({ ...session, heros: { ...heros, pvMax, peMax, pv, pe } }), bilan.xp)
}

/**
 * CLORE UN COMBAT — PURE, et SEULE PORTE qui RETIRE `EtatSession.combat` (n° 13
 * `moteur-combat`, it1). Applique le bilan du rejeu selon l'issue (`CLOTURES`) :
 * victoire ou fuite du monstre — `pv`, `pe`, plafonds variés (plancher
 * `PLANCHER_DES_MAXIMA`), jauges écrêtées, XP via `crediterXp`, `combat` retiré ;
 * inconscient — `pv = 1`, `pe` du bilan, AUCUNE XP, `combat` retiré ; fuite du héros
 * — `pv` et `pe` du bilan écrêtés aux plafonds INTACTS, AUCUNE XP, `combat` retiré ;
 * mort — session rendue À L'IDENTIQUE, `combat` reste.
 *
 * NO-OP, SESSION RENDUE INCHANGÉE (même référence), SANS `combat` (rien à clore) ou
 * SANS `heros` (inatteignable par construction, gardé par défense). `horloge`,
 * `journal`, `monde` ne bougent JAMAIS : un combat est UN pas d'horloge, déjà
 * consommé par la commande qui l'a déclenché.
 */
export function cloreCombat(session: EtatSession, bilan: BilanCombat): EtatSession {
	if (session.combat === undefined || session.heros === undefined) return session
	return CLOTURES[bilan.issue](session, session.heros, bilan)
}
