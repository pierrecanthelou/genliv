import type { Destination } from './destinations'
import type { EtatSession } from './session'

/**
 * QUI LIT QUOI — l'AUDIENCE de chaque champ de l'ÉTAT DE SESSION.
 *
 * POURQUOI UNE SECONDE TABLE. `destinations.ts` couvre le DOSSIER seul. La
 * session porte des champs qui iront un jour au modèle — `journal[].texte`,
 * `memoire.*`, `attente.payload` — et sans table, la n° 9 rouvrirait côté session
 * la cachette fermée côté dossier (KR-232/241).
 *
 * JAMAIS FUSIONNÉE DANS `destinations.ts` : la garde de celle-là balaie une
 * fixture de DOSSIER, et son assertion « aucune ligne morte » ferait rougir une
 * clé de session le jour même où on l'y écrirait. Deux tables, deux gardes, deux
 * fixtures — `sessionCouverture.test.ts` est la garde de celle-ci.
 *
 * STRICTEMENT PLUS FORTE QUE SA VOISINE, et sur un point que la docstring de
 * `destinations.ts` reconnaît elle-même : ses clés à elle sont des CHAÎNES, que
 * rien ne relie aux types. Les clés RACINES de celle-ci sont `keyof EtatSession`,
 * donc exhaustives PAR COMPILATION — une huitième racine ne compile pas tant que
 * personne n'a déclaré pour qui elle est écrite.
 *
 * ⚠ ZÉRO LIGNE `'ia'`, ET C'EST UNE DÉCISION, PAS UN ÉTAT DES LIEUX. Une ligne
 * `'ia'` est une AUTORISATION, pas une prévision : la n° 10 la trouverait signée
 * d'avance par l'itération qui n'a ni assembleur, ni granularité par rôle, ni
 * borne de résumé, ni comportement d'échec. Les lignes d'audience se corrigent en
 * COMMENTAIRE, jamais en VALEUR (KR-195/196) — c'est ce que font les deux lignes
 * ci-dessous qui annoncent leur bascule.
 *
 * CE QU'ELLE DONNE À LA N° 10 : deux des quatre champs `'ia'` *sous condition
 * d'état* de `destinations.ts` reçoivent enfin le NOM DU FAIT DE SESSION qui les
 * ouvre — `monde.indices_connus[]` ouvre `monde.indices[].verite`,
 * `monde.jalons_atteints[]` ouvre `charpente.jalons[].enonce_texte`. Les deux
 * autres (`savoirs[].revele_comment`, `plan_actions[].si_bloque`) n'ont PAS leur
 * porte ici : propriétaires n° 12 et n° 14.
 *
 * MODULE PUR : il part avec `src/player/` le jour de l'extraction
 * (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * Les chemins de FEUILLE de la session, au format du balayage pleine profondeur
 * (`feuillesDeLaFixture`) : `[]` pour un élément de liste, `<id>` pour une clé de
 * `Record`. Cette seconde normalisation se fait CÔTÉ TEST — le balayage efface
 * les indices de tableau, jamais les clés d'un `Record`.
 *
 * Les cinq feuilles scalaires de premier niveau (`schema`, `dossier_id`,
 * `dossier_maj`, `graine_alea`, `memoire`) ne sont PAS ici : leur clé racine EST
 * leur chemin de feuille, et une seconde ligne serait morte.
 */
type CheminDeFeuilleDeSession =
	| 'horloge.tour'
	| 'monde.lieu_courant'
	| 'monde.lieux_visites[]'
	| 'monde.objets_possedes[]'
	| 'monde.indices_connus[]'
	| 'monde.jalons_atteints[]'
	| 'monde.evenements_consommes[]'
	| 'monde.pnj.<id>.a_dit[]'
	| 'journal[].tour'
	| 'journal[].role'
	| 'journal[].texte'

export const DESTINATION_DES_CHAMPS_DE_SESSION: Readonly<
	Record<keyof EtatSession | CheminDeFeuilleDeSession, Destination>
> = {
	// ── Les cinq racines qui sont aussi des feuilles ──────────────────────────
	/** Enveloppe de persistance : le code seul la lit. */
	schema: 'moteur',
	/** Handle du document joué. */
	dossier_id: 'moteur',
	// L'estampille du dossier à l'ouverture. `moteur` au même titre que `updatedAt`
	// du dossier : un horodatage est une donnée de fraîcheur, jamais de la fiction.
	dossier_maj: 'moteur',
	/**
	 * L'entropie de la partie. Un modèle qui la lirait connaîtrait l'issue d'un jet
	 * AVANT le moteur — c'est le même arbitrage que les caractéristiques d'un
	 * personnage dans `destinations.ts`, pour la même raison.
	 */
	graine_alea: 'moteur',
	/**
	 * Typée `null` : un `null` ne s'injecte pas, et une audience pour une valeur qui
	 * ne peut pas exister serait une autorisation dormante. La n° 10, propriétaire,
	 * REMPLACE cette ligne racine par des lignes de FEUILLE le jour où `memoire`
	 * porte une forme.
	 */
	memoire: 'moteur',

	// ── Les trois racines PORTEUSES — lignes de clé, jamais de feuille ─────────
	// `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme feuille : ces
	// trois lignes n'ont donc AUCUNE instance dans la fixture saturée. Elles
	// existent pour l'exhaustivité par compilation sur `keyof EtatSession`, et le
	// test les nomme comme les TROIS DISPENSES DÉCLARÉES — jamais comme des lignes
	// mortes. Précédent exact : `…stats` et `…caractere` dans `destinations.ts`,
	// absents pour la raison inverse (là-bas, une telle ligne serait morte).
	horloge: 'moteur',
	monde: 'moteur',
	journal: 'moteur',

	// ── L'horloge ─────────────────────────────────────────────────────────────
	/** Le COMPTE, pas sa paraphrase — précédents `plan_actions[].duree`, `climat[].duree`. */
	'horloge.tour': 'moteur',

	// ── Le monde : sept champs, sept handles ou listes de handles ─────────────
	/** Handle du lieu où se tient le héros. */
	'monde.lieu_courant': 'moteur',
	'monde.lieux_visites[]': 'moteur',
	/**
	 * Le modèle ne lit JAMAIS l'inventaire : il reçoit la `description_joueur` des
	 * objets que le CODE a résolus, et celle-là porte déjà sa propre ligne `'ia'`
	 * dans `destinations.ts`.
	 */
	'monde.objets_possedes[]': 'moteur',
	/** Handles — ET C'EST LA PORTE de `monde.indices[].verite`, `'ia'` sous condition d'état. */
	'monde.indices_connus[]': 'moteur',
	/**
	 * Handles — ET C'EST LA PORTE de `charpente.jalons[].enonce_texte`, `'ia'` pour
	 * un jalon ATTEINT seulement.
	 */
	'monde.jalons_atteints[]': 'moteur',
	'monde.evenements_consommes[]': 'moteur',
	/** Handles. `<id>` est normalisé côté test : le balayage n'efface que les indices de liste. */
	'monde.pnj.<id>.a_dit[]': 'moteur',

	// ── Le journal ────────────────────────────────────────────────────────────
	'journal[].tour': 'moteur',
	'journal[].role': 'moteur',
	/**
	 * `'moteur'` EN it1, et la prévision reste ICI, en commentaire : la n° 10 la
	 * bascule à `'ia'` DANS le lot qui livre son assembleur ET sa borne de résumé.
	 * Avant cela, ce serait une autorisation dormante — signée par une itération
	 * qui n'a aucun moyen de la tenir.
	 */
	'journal[].texte': 'moteur',
}
