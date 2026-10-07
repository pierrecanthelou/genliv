import type { HeroState } from '../../player/types'
import { CHALLENGE_TIERS } from '../challenge'
import { CHARACTERISTICS } from '../characteristics'
import { POSTURES } from '../combat'
import { COMMANDES } from './commandes'
import { DELTAS } from './deltas'
import type { DeltaJournalise } from './evaluate'
import type { EtatPnj, FaitsDeSession } from './faits'
import { estCleDe, estObjet } from './identifiers'
import {
	SCHEMA_SESSION,
	type AttenteClarification,
	type EntreeJournal,
	type EtatCombat,
	type EtatSession,
	type FaitEtabli,
	type MemoireSession,
	type ResumeMemoire,
	type RoleJournal,
} from './session'
import type { Dossier } from './types'

/**
 * LA REPRISE D'UNE PARTIE — ce que `MagasinDeSession.lire` rend, et la fonction pure qui
 * le décide (n° 15 `moteur-fins`, it2, lot `contrat`).
 *
 * `PersistenceService.get` est un `as` déguisé (KR-116) : ce qui sort du stockage est
 * typé par personne tant qu'il n'a pas passé ICI. `validerSession` est le point de
 * lecture unique, et c'est lui qui interdit à un appelant d'écrire `as EtatSession`.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6) — ses imports sont une liste blanche
 * que `reprise.test.ts` mesure. Il n'est PAS ré-exporté par `brain/index.ts` — seul le TYPE
 * `LectureSession` l'est : aucun fichier de production de `src/features/` n'appelle
 * `validerSession` (`reprise.test.ts` le mesure), la feature consomme
 * `useBrain().sessions.lire` (KR-109).
 *
 * `session.ts` importe `LectureSession` d'ici en TYPE SEUL (effacé à l'émission) pendant
 * que ce module importe `SCHEMA_SESSION` de `session.ts` en VALEUR : le cycle n'existe
 * qu'au niveau des types, et il doit y rester.
 */

/**
 * CE QUE LE MAGASIN RENDRA À LA LECTURE D'UNE SESSION — union DISCRIMINÉE, quatre
 * membres, aucun cinquième : un appelant qui la rétrécit totalement n'a aucun bras muet.
 *
 *  · `absente`    — rien n'est rangé sous la clé de ce dossier ;
 *  · `reprenable` — une session bien formée, du MÊME dossier, à la MÊME estampille ;
 *  · `perimee`    — bien formée, mais le dossier a changé depuis son ouverture ;
 *  · `illisible`  — rangée, mais pas une session que ce code sache relire.
 *
 * `illisible` ne porte AUCUN motif (KR-249) : aucun lecteur n'en a, et le champ s'ajoute
 * plus tard sans coût. `terminée` n'est PAS un cinquième statut : une fin atteinte se lit
 * depuis la session par `finAtteinte` (evaluate.ts), l'appeler ici ferait entrer
 * l'évaluateur bivalent — qui LÈVE sur une entrée non reconnue (KR-238) — dans la
 * frontière de confiance.
 */
export type LectureSession =
	| { readonly statut: 'absente' }
	| { readonly statut: 'reprenable'; readonly session: EtatSession }
	| { readonly statut: 'perimee' }
	| { readonly statut: 'illisible' }

type Validateur = (valeur: unknown) => boolean

/**
 * Une table de validateurs pour UN type objet : une ligne par clé, TOUTES requises dans la
 * table même quand la clé est optionnelle dans le type (`-?`) — c'est la ligne qui dit si
 * l'absence est légale. Ajouter une clé au type sans sa ligne ne COMPILE pas, et une
 * ligne pour une clé disparue non plus (excès de propriété) : la table ne peut pas
 * dériver du type en silence.
 */
type Table<T> = { readonly [K in keyof T]-?: Validateur }

/**
 * Un objet dont CHAQUE clé de la table passe son validateur. Les clés qu'elle ne nomme pas
 * sont TOLÉRÉES : refuser une session pour une clé qu'on ne connaît pas jetterait une
 * partie légitime écrite par un code plus récent, et la session rendue est celle du
 * stockage telle quelle — rien n'est reconstruit, donc rien n'est perdu (KR-251).
 */
function objet<T>(table: Table<T>): (valeur: unknown) => valeur is T {
	const cles = Object.keys(table) as Array<keyof T & string>
	return (valeur): valeur is T => estObjet(valeur) && cles.every((cle) => table[cle](valeur[cle]))
}

const estTexte: Validateur = (valeur) => typeof valeur === 'string'

/** FINI : `JSON.parse` ne produit ni `NaN` ni `Infinity`, un tel nombre ne vient pas du stockage. */
const estNombre: Validateur = (valeur) => typeof valeur === 'number' && Number.isFinite(valeur)

/** Une liste dont CHAQUE élément passe le validateur — jamais `Array.isArray` seul. */
const liste =
	(element: Validateur): Validateur =>
	(valeur) =>
		Array.isArray(valeur) && valeur.every((courant) => element(courant))

const listeDeTextes = liste(estTexte)

/**
 * Un champ OPTIONNEL À VIE (KR-251) : absent est légal, `null` ne l'est PAS — la
 * docstring de chaque champ le dit (« jamais `| null` »), et deux encodages de « rien »
 * obligeraient chaque lecteur à les ramener à un seul.
 */
const facultatif =
	(valide: Validateur): Validateur =>
	(valeur) =>
		valeur === undefined || valide(valeur)

/**
 * L'appartenance PROPRE à un registre fermé — jamais `in` (KR-175). C'est ce qui garde le
 * lecteur de laisser passer un `origine` ou une `posture` que le moteur ne saurait plus
 * servir : l'assembleur du narrateur lit `COMMANDES[origine].label`, et un verbe sorti du
 * registre y ferait lever la lecture d'une partie pourtant « reprenable ».
 */
const membreDe =
	(registre: object): Validateur =>
	(valeur) =>
		typeof valeur === 'string' && estCleDe(registre, valeur)

/** Un enregistrement dont CHAQUE valeur passe le validateur (les clés sont des identifiants libres). */
const enregistrement =
	(valeur: Validateur): Validateur =>
	(candidat) =>
		estObjet(candidat) && Object.values(candidat).every((courant) => valeur(courant))

/**
 * Les deux unions littérales du journal qui n'ont PAS de registre : `Record` exhaustif
 * (KR-117), pour qu'un troisième membre de l'union exige sa ligne ici.
 */
const ROLES: Readonly<Record<RoleJournal, true>> = { joueur: true, moteur: true }
const EFFETS: Readonly<Record<DeltaJournalise['effet'], true>> = { applique: true, sans_effet: true }

// ── monde ────────────────────────────────────────────────────────────────────

const estEtapePlan = objet<NonNullable<EtatPnj['etape_plan']>>({ rang: estNombre, depuis: facultatif(estNombre) })

const estEtatPnj = objet<EtatPnj>({
	a_dit: listeDeTextes,
	confiance: facultatif(estNombre),
	etape_plan: facultatif(estEtapePlan),
})

/** Les SEPT champs de `FaitsDeSession` sont requis et totaux (KR-254) : la table l'est aussi. */
const estMonde = objet<FaitsDeSession>({
	lieu_courant: estTexte,
	lieux_visites: listeDeTextes,
	objets_possedes: listeDeTextes,
	indices_connus: listeDeTextes,
	jalons_atteints: listeDeTextes,
	evenements_consommes: listeDeTextes,
	pnj: enregistrement(estEtatPnj),
})

const estClimatActif = objet<NonNullable<EtatSession['horloge']['climat_actif']>>({
	id: estTexte,
	depuis: estNombre,
})

/**
 * `horloge` est ÉCRIT COMME UNE LECTURE, pas comme une table : `climat.test.ts` mesure les
 * écrivains de `climat_actif` en cherchant la clé en POSITION D'OBJET (`climat_actif:`,
 * KR-258), et une ligne de table à cet endroit serait comptée comme une seconde écriture
 * alors que ce module n'écrit rien. L'exhaustivité par compilation que les autres tables
 * portent est ici tenue AU TEST : `SESSION_SATUREE` instancie `horloge.climat_actif`, et
 * le balayage de `reprise.test.ts` y met une valeur fausse — un champ d'horloge qu'aucun
 * validateur ne lit y rougirait.
 */
const estHorloge: Validateur = (valeur) =>
	estObjet(valeur) && estNombre(valeur.tour) && facultatif(estClimatActif)(valeur.climat_actif)

// ── journal ──────────────────────────────────────────────────────────────────

const estDelta = objet<DeltaJournalise>({
	delta: membreDe(DELTAS),
	cibles: listeDeTextes,
	effet: membreDe(EFFETS),
})

const estJet = objet<NonNullable<EntreeJournal['jet']>>({
	carac: membreDe(CHARACTERISTICS),
	tc: membreDe(CHALLENGE_TIERS),
})

const estEntreeDeJournal = objet<EntreeJournal>({
	tour: estNombre,
	role: membreDe(ROLES),
	texte: estTexte,
	origine: facultatif(membreDe(COMMANDES)),
	interlocuteur: facultatif(estTexte),
	deltas: facultatif(liste(estDelta)),
	recit: facultatif(estTexte),
	jet: facultatif(estJet),
})

// ── mémoire du narrateur ─────────────────────────────────────────────────────

const estFaitEtabli = objet<FaitEtabli>({ fait: estTexte, sur: listeDeTextes })

const estResume = objet<ResumeMemoire>({ texte: estTexte, jusqu_au_pas: estNombre })

/**
 * LA FORME de la mémoire, jusqu'aux primitives — et RIEN DE PLUS : les invariants I1 à I5
 * de `EtatSession.memoire` sont des propriétés du CHEMIN D'ÉCRITURE (`consignerNarration`),
 * pas du lecteur. Un `{ faits_etablis: [] }` sans résumé (I1), un `jusqu_au_pas` hors
 * cadence (I2) ou une ancre qui n'est ni un `lieu.*` ni un `objet.*` (I5) restent donc
 * LISIBLES ici : les exécuter exigerait la cadence (`memoire.ts`) et ferait du lecteur un
 * second gardien d'une règle que le code qui ÉCRIT tient déjà. Ce que la forme garantit,
 * c'est qu'un blob corrompu ne devient pas, au tour suivant, un contexte de modèle bâti
 * sur un `faits_etablis` qui n'est pas un tableau.
 */
const estMemoire = objet<MemoireSession>({ faits_etablis: liste(estFaitEtabli), resume: facultatif(estResume) })

// ── les trois clés racines facultatives ──────────────────────────────────────

const estAttente = objet<AttenteClarification>({
	type: (valeur) => valeur === 'clarification',
	question: estTexte,
	saisie: estTexte,
})

const estCaracs: Validateur = (valeur) =>
	estObjet(valeur) && Object.keys(CHARACTERISTICS).every((carac) => estNombre(valeur[carac]))

const estHeros = objet<HeroState>({
	name: estTexte,
	caracs: estCaracs,
	pvMax: estNombre,
	pv: estNombre,
	peMax: estNombre,
	pe: estNombre,
	mcBonus: estNombre,
	xp: estNombre,
})

/** `fuite` : le LITTÉRAL `true` ou absent, JAMAIS `false` (`EtatCombat`). */
const estCombat = objet<EtatCombat>({
	monstre_ref: estTexte,
	postures: liste(membreDe(POSTURES)),
	fuite: (valeur) => valeur === undefined || valeur === true,
})

// ── la session entière ───────────────────────────────────────────────────────

/**
 * ONZE lignes, une par clé racine de `EtatSession` : une douzième clé ne compile pas sans
 * la sienne. Les huit premières sont REQUISES (absente ⇒ illisible), les trois dernières
 * sont optionnelles à vie (absentes ⇒ légal, `null` ⇒ illisible) ; `memoire` est l'unique
 * clé requise qui accepte `null`, son état « rien retenu » (KR-249).
 */
const estSessionBienFormee = objet<EtatSession>({
	schema: (valeur) => valeur === SCHEMA_SESSION,
	dossier_id: estTexte,
	dossier_maj: estTexte,
	graine_alea: estNombre,
	horloge: estHorloge,
	monde: estMonde,
	journal: liste(estEntreeDeJournal),
	memoire: (valeur) => valeur === null || estMemoire(valeur),
	attente: facultatif(estAttente),
	heros: facultatif(estHeros),
	combat: facultatif(estCombat),
})

/**
 * DÉCIDE CE QU'ON PEUT FAIRE d'une valeur relue du stockage, pour CE dossier. PURE, TOTALE
 * (aucune valeur ne la fait lever, `unknown` compris), et SANS EFFET.
 *
 * L'ORDRE DES VERDICTS EST UN CONTRAT, pas une commodité :
 *  1. `null` ou `undefined` ⇒ `absente`. Rien d'autre : `0`, `''` et `false` sont des valeurs
 *     RANGÉES qui ne sont pas des sessions, donc `illisible` ;
 *  2. schéma, `dossier_id` ou forme en défaut ⇒ `illisible` ;
 *  3. `dossier_maj` différent de `dossier.updatedAt` ⇒ `perimee` ;
 *  4. sinon `reprenable`.
 * La forme passe AVANT l'estampille : une session abîmée dont l'estampille diffère se lirait
 * sinon « périmée » — et l'écran dirait « le dossier a changé » d'une sauvegarde qui est en
 * réalité endommagée. Un `dossier_id` d'un autre dossier est `illisible` et non `perimee` :
 * ce n'est pas la même partie qui a vieilli, c'est une clé qui ne contient pas la bonne.
 *
 * LA SESSION RENDUE EST `brut` LUI-MÊME, la même référence — jamais une copie ni une
 * reconstruction. Un validateur qui reconstruirait perdrait toute clé optionnelle qu'on
 * lui oublie (KR-251), et ré-estampiller en passant blanchirait une session périmée :
 * `dossier_maj` n'est écrit que par `ouvrirSession`. `perimee` et `illisible` ne portent
 * AUCUNE session — l'appelant n'a rien qu'il puisse, par erreur, jouer ou réparer.
 *
 * NE LIT DU DOSSIER QUE `id` ET `updatedAt`. N'exécute PAS I1-I5 de la mémoire (voir
 * `estMemoire`), et ne résout aucune référence : `lieu_courant` qui ne résout plus est le
 * cas `perimee` — le dossier a changé —, jamais un défaut de forme.
 */
export function validerSession(brut: unknown, dossier: Dossier): LectureSession {
	if (brut === null || brut === undefined) return { statut: 'absente' }
	if (!estSessionBienFormee(brut) || brut.dossier_id !== dossier.id) return { statut: 'illisible' }
	if (brut.dossier_maj !== dossier.updatedAt) return { statut: 'perimee' }
	return { statut: 'reprenable', session: brut }
}
