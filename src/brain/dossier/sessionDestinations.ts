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
 * ⚠ « ZÉRO LIGNE `'ia'` » ÉTAIT UNE DÉCISION, PAS UN ÉTAT DES LIEUX — ET ELLE EST
 * DÉSORMAIS FAUSSE, CORRIGÉE ICI EN COMMENTAIRE, JAMAIS EN VALEUR (KR-195/196) :
 * le lot `contrat` de la n° 10 (`moteur-interprete`) pose ses DEUX PREMIÈRES
 * lignes `'ia'` du fichier — `attente.question` et `attente.saisie`, EXACTEMENT
 * les deux, aucune autre. Sans elles injectées au tour suivant, le modèle
 * répondrait à l'aveugle à une saisie qui répond à une question qu'il ne peut
 * plus lire. Les deux autres champs `'ia'` *sous condition d'état* que
 * `destinations.ts` annonçait déjà (`savoirs[].revele_comment`,
 * `plan_actions[].si_bloque`) restent aux propriétaires n° 12 et n° 14.
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
	| 'attente.type'
	| 'attente.question'
	| 'attente.saisie'
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
	| 'journal[].origine'
	| 'journal[].deltas[].delta'
	| 'journal[].deltas[].cibles[]'
	| 'journal[].deltas[].effet'

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

	// ── Les quatre racines PORTEUSES — lignes de clé, jamais de feuille ────────
	// `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme feuille : ces
	// quatre lignes n'ont donc AUCUNE instance dans la fixture saturée SI ELLE NE
	// LES INSTANCIE PAS. Elles existent pour l'exhaustivité par compilation sur
	// `keyof EtatSession`, et le test les nomme comme des DISPENSES DÉCLARÉES —
	// jamais comme des lignes mortes. Précédent exact : `…stats` et `…caractere`
	// dans `destinations.ts`, absents pour la raison inverse (là-bas, une telle
	// ligne serait morte).
	//
	// `attente` EST LA QUATRIÈME, posée par le lot `contrat` de la n° 10 : une clé
	// racine RÉELLE de `EtatSession` (optionnelle, KR-251), donc exhaustive par
	// compilation ici comme les trois autres — jamais une feuille, puisqu'un
	// `AttenteClarification` est un objet non vide.
	horloge: 'moteur',
	monde: 'moteur',
	journal: 'moteur',
	attente: 'moteur',

	// ── L'attente de clarification (n° 10) ─────────────────────────────────────
	/** Le DISCRIMINANT — un handle de code, jamais de la fiction. */
	'attente.type': 'moteur',
	/**
	 * La QUESTION que R1 a posée, VERBATIM (l'un des deux seuls textes hors
	 * amorce/fin émis mot pour mot — non, PLUS PRÉCISÉMENT : injectée telle
	 * quelle au tour suivant, jamais récitée à l'écran comme une fiche). `'ia'` :
	 * sans cette ligne, le modèle ne verrait jamais sa propre question au tour
	 * où le joueur y répond.
	 */
	'attente.question': 'ia',
	/**
	 * La SAISIE qui a déclenché la question, normalisée. `'ia'` pour la même
	 * raison que sa voisine : c'est le COUPLE {question, saisie} qui donne au
	 * modèle de quoi comprendre une réponse elliptique (« le grand », « non »).
	 */
	'attente.saisie': 'ia',

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
	 * `'moteur'`, ET LA PRÉVISION D'it1 EST RÉVOQUÉE — EN COMMENTAIRE, JAMAIS EN
	 * VALEUR (KR-195/196). L'itération 1 annonçait que la n° 10 basculerait cette
	 * ligne à `'ia'` ; l'itération 2 la corrige, parce que le journal qu'elle livre
	 * est un RELEVÉ D'ÉTAT et rien d'autre : ses `texte` ne portent que des verbes
	 * du registre clos, des noms de champs d'`EtatMonde`, des identifiants du
	 * dossier et quatre séparateurs. Pas un mot que l'auteur a tapé, pas un
	 * caractère que le joueur a tapé.
	 *
	 * ET LA BASCULE EN BLOC EST IMPOSSIBLE, pas seulement indésirable : cette table
	 * est indexée par CHEMIN, donc elle ne peut pas discriminer par valeur de
	 * `role` — basculer la ligne ouvrirait AUSSI les entrées `joueur`. La n° 10
	 * donnera à sa prose SON PROPRE CHEMIN, avec sa propre ligne.
	 */
	'journal[].texte': 'moteur',
	/**
	 * LA CAUSE d'une entrée — une clé du registre CLOS des commandes, donc un
	 * HANDLE, au même titre que `dossier_id` ou `monde.lieu_courant`. Optionnelle
	 * À VIE (KR-251) : une entrée écrite par it1 ne la porte pas, et c'est un état
	 * LÉGAL, pas un trou. Instanciée dans `__fixtures__/session-saturee.ts` — sans
	 * instance, cette ligne serait morte le jour même où elle est écrite.
	 */
	'journal[].origine': 'moteur',

	// ── Les effets de règle portés par une entrée (itération 3) ────────────────
	// TROIS FEUILLES, TOUTES `'moteur'`, et aucune n'est un candidat à la bascule :
	// un identifiant d'effet est une clé de registre CLOS, ses cibles sont des
	// handles du dossier, et `effet` est un constat à deux valeurs. Rien de tout
	// cela n'est de la fiction — ce que le modèle lira d'un indice révélé est
	// `monde.indices[].verite`, qui porte déjà SA ligne `'ia'` dans `destinations.ts`.
	/** Clé du registre CLOS des effets — un HANDLE, au même titre que `journal[].origine`. */
	'journal[].deltas[].delta': 'moteur',
	/** Handles du dossier, DANS L'ORDRE de `refKinds` — jamais un nom libre. */
	'journal[].deltas[].cibles[]': 'moteur',
	/** Le CONSTAT d'application, deux valeurs closes (KR-247). */
	'journal[].deltas[].effet': 'moteur',
}
