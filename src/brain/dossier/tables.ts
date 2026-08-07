import { BUDGET_MOTS_CANON, BUDGET_MOTS_JALON, CERTITUDES, CONFIANCE_MAX, CONFIANCE_MIN, PORTEES } from './types'
import { CHARACTERISTIC_VALUES } from '../characteristics'
import { CHALLENGE_TIER_VALUES } from '../challenge'

/**
 * LES TABLES DU VALIDATEUR — les règles du schéma comme DONNÉES, jamais comme
 * cascades de `if` (KR-117). Étendre le schéma, c'est ajouter des LIGNES.
 *
 * Elles sortent de `validate.ts` à l'itération 3 AVEC leur bénéficiaire, et pas
 * pour l'esthétique du découpage : la QUATRIÈME assertion du balayage de
 * couverture — tout chemin de table a au moins une instance dans la fixture — a
 * besoin de les IMPORTER. C'était le dernier chemin de contournement du garde de
 * `DESTINATION_DES_CHAMPS` : un champ ajouté aux types et aux tables mais PAS à
 * la fixture restait invisible aux deux assertions existantes.
 *
 * Ce fichier ne porte que des DONNÉES et leurs formes. Le LECTEUR — `sitesDe`,
 * l'expanseur de chemins — reste dans `validate.ts` : la grammaire de chemin
 * (segments pointés et `[]`, rien d'autre) est FIGÉE, et c'est le validateur qui
 * la parle, pas la table.
 */

/** Ce qu'une racine obligatoire doit être : un objet, ou une liste. */
export type GenreDeRacine = 'objet' | 'liste'

export interface RacineObligatoire {
	/** Chemin JSON depuis la racine du dossier — c'est lui que le message nomme. */
	path: string
	genre: GenreDeRacine
	/** OÙ : le nom lisible de la section, jamais le chemin seul. */
	location: string
}

/**
 * Les treize racines du schéma 1, plus les trois conteneurs de groupe qui les
 * portent. Absente ou du mauvais genre → `racine-manquante`, bloquant.
 *
 * `monde.conditions.climat` n'y figure pas — non parce qu'elle serait
 * facultative, mais parce que sa règle est ailleurs : `LISTES_REQUISES` exige un
 * TABLEAU (vide accepté) là où `RACINES` exigerait une section peuplée.
 */
export const RACINES: readonly RacineObligatoire[] = [
	{ path: 'canon', genre: 'objet', location: 'Canon' },
	{ path: 'canon.mj', genre: 'objet', location: 'Canon (MJ)' },
	{ path: 'canon.partage', genre: 'objet', location: 'Canon (partagé)' },
	{ path: 'canon.interdits_ton', genre: 'liste', location: 'Interdits de ton' },
	{ path: 'canon.objectifs', genre: 'liste', location: 'Objectifs' },
	{ path: 'monde', genre: 'objet', location: 'Monde' },
	{ path: 'monde.personnages', genre: 'liste', location: 'Personnages' },
	{ path: 'monde.lieux', genre: 'liste', location: 'Lieux' },
	{ path: 'monde.objets', genre: 'liste', location: 'Objets' },
	{ path: 'monde.indices', genre: 'liste', location: 'Indices' },
	{ path: 'monde.quetes', genre: 'liste', location: 'Quêtes' },
	{ path: 'monde.evenements', genre: 'liste', location: 'Événements' },
	{ path: 'monde.conditions', genre: 'objet', location: 'Conditions' },
	{ path: 'charpente', genre: 'objet', location: 'Charpente' },
	{ path: 'charpente.depart', genre: 'objet', location: 'Point de départ' },
	{ path: 'charpente.jalons', genre: 'liste', location: 'Jalons' },
	{ path: 'charpente.fins', genre: 'liste', location: 'Fins' },
]

export interface ChampRequis {
	/**
	 * Chemin depuis la racine. Un segment suffixé `[]` est une LISTE : la règle
	 * s'applique alors à chacun de ses éléments, et le OÙ de l'anomalie est
	 * l'entité identifiée la plus proche.
	 */
	path: string
	/** OÙ de repli, quand aucune entité identifiée ne porte le champ. */
	location: string
}

/**
 * Les champs de texte OBLIGATOIRES. Absent, non textuel ou vide → bloquant.
 * Tout ce qui n'est pas dans cette table est OPTIONNEL : un optionnel absent est
 * un état informationnel calme, il n'apparaît ni dans `errors` ni dans
 * `warnings`. C'est le cas du `nom` d'une entité, que le repli
 * « {Type} n°{index} (sans nom) » rend lisible sans jamais alerter.
 */
export const CHAMPS_REQUIS: readonly ChampRequis[] = [
	{ path: 'id', location: 'Dossier' },
	{ path: 'titre', location: 'Dossier' },
	{ path: 'createdAt', location: 'Dossier' },
	{ path: 'updatedAt', location: 'Dossier' },
	{ path: 'canon.mj.synopsis_mj', location: 'Canon (MJ)' },
	{ path: 'canon.partage.accroche_joueur', location: 'Canon (partagé)' },
	{ path: 'canon.ton', location: 'Canon' },
	{ path: 'monde.personnages[].plan_actions[].action', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].indice_id', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', location: 'Personnages' },
	{ path: 'monde.evenements[].resolutions[].resultat', location: 'Événements' },
	{ path: 'charpente.depart.lieu_id', location: 'Point de départ' },
	{ path: 'charpente.depart.texte_ouverture_joueur', location: 'Point de départ' },
	{ path: 'charpente.jalons[].enonce_texte', location: 'Jalons' },
	{ path: 'charpente.jalons[].declencheur_texte', location: 'Jalons' },
	{ path: 'charpente.fins[].condition_texte', location: 'Fins' },
]

export interface EnumereFerme extends ChampRequis {
	/** L'ensemble FERMÉ des valeurs acceptées — la source du libellé « attendu : … ». */
	valeurs: readonly unknown[]
	/** Faux quand le champ est optionnel : absent alors, il ne dit rien. */
	requis: boolean
}

/**
 * Les valeurs de confiance acceptables, DÉRIVÉES des deux bornes nommées : la
 * borne ne se réécrit jamais en dur au site de validation (KR-165).
 */
export const CONFIANCES: readonly number[] = Array.from(
	{ length: CONFIANCE_MAX - CONFIANCE_MIN + 1 },
	(_, rang) => CONFIANCE_MIN + rang,
)

/**
 * Les ensembles FERMÉS du schéma. Chaque ligne cite le registre qui porte ses
 * valeurs — jamais une liste recopiée (KR-117) : `portee` et `certitude` viennent
 * de `types.ts`, le jet de révélation des registres de règles, et les bornes de
 * confiance des deux constantes nommées.
 */
export const ENUMERES_FERMES: readonly EnumereFerme[] = [
	{ path: 'monde.personnages[].portee', location: 'Personnages', valeurs: PORTEES, requis: true },
	{ path: 'monde.personnages[].savoirs[].certitude', location: 'Personnages', valeurs: CERTITUDES, requis: true },
	{
		path: 'monde.personnages[].savoirs[].revele_si.confiance_min',
		location: 'Personnages',
		valeurs: CONFIANCES,
		requis: false,
	},
	{
		path: 'monde.personnages[].savoirs[].revele_si.jet.carac',
		location: 'Personnages',
		valeurs: CHARACTERISTIC_VALUES,
		requis: true,
	},
	{
		path: 'monde.personnages[].savoirs[].revele_si.jet.tc',
		location: 'Personnages',
		valeurs: CHALLENGE_TIER_VALUES,
		requis: true,
	},
	{
		path: 'monde.personnages[].savoirs[].revele_si.contrepartie.consomme',
		location: 'Personnages',
		valeurs: [true, false],
		requis: true,
	},
]

/**
 * Les LISTES OBLIGATOIRES — celles que `types.ts` déclare NON optionnelles et
 * que `sitesDe` laisserait passer absentes.
 *
 * Pourquoi une table à part plutôt qu'une ligne de `CHAMPS_REQUIS` : ce dernier
 * exige une CHAÎNE non vide, alors qu'ici on exige un TABLEAU — vide accepté,
 * un personnage sans savoir est légitime. Ce qui ne l'est pas, c'est la clé
 * absente : le dossier gelé promettrait alors un tableau valant `undefined`, et
 * la n° 4 comme la n° 12 l'itéreraient en confiance du typage.
 *
 * Relevé à la revue de PR d'it2 : on croyait `conditions.climat` seul dans ce
 * cas, il y en avait QUATRE. Toute liste ajoutée non optionnelle à `types.ts`
 * doit gagner sa ligne ici — le compilateur ne relie pas les deux.
 */
export const LISTES_REQUISES: readonly ChampRequis[] = [
	{ path: 'monde.personnages[].plan_actions', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs', location: 'Personnages' },
	{ path: 'monde.evenements[].resolutions', location: 'Événements' },
	{ path: 'monde.conditions.climat', location: 'Conditions' },
]

/**
 * Les QUATRE emplacements d'effets de règle. Leur contenu attend le registre
 * `DELTAS` (itération 4) ; ce qui se ferme ICI est la FORME — une liste d'objets,
 * jamais de la prose. C'est le point irréversible : de la prose ne se parse pas
 * en delta, alors qu'un objet dont les clés se précisent est une extension.
 */
export const CHEMINS_DE_DELTAS: readonly ChampRequis[] = [
	{ path: 'monde.quetes[].recompense', location: 'Quêtes' },
	{ path: 'monde.evenements[].resolutions[].consequence', location: 'Événements' },
	{ path: 'monde.conditions.climat[].effets_regles', location: 'Climat' },
	{ path: 'charpente.jalons[].effet', location: 'Jalons' },
]

export interface BudgetDeMots extends ChampRequis {
	budget: number
	/** Le SUJET de la phrase d'avertissement, article compris. */
	sujet: string
}

/**
 * Les textes soumis à un budget de mots (avertissement, jamais blocage). La borne
 * est toujours une constante NOMMÉE, et son NOM ne fuit jamais dans le message.
 */
export const BUDGETS_DE_MOTS: readonly BudgetDeMots[] = [
	{ path: 'canon.mj', location: 'Canon (MJ)', budget: BUDGET_MOTS_CANON, sujet: 'Le canon' },
	{ path: 'canon.partage', location: 'Canon (partagé)', budget: BUDGET_MOTS_CANON, sujet: 'Le canon' },
	{
		path: 'charpente.jalons[].enonce_texte',
		location: 'Jalons',
		budget: BUDGET_MOTS_JALON,
		sujet: "L'énoncé de ce jalon",
	},
]

/**
 * Une FAMILLE DE CONDITIONS — le couple `…_expr` (moteur) / `…_texte` (auteur)
 * que la décision D1 pose sur chaque endroit du schéma où quelque chose se
 * déclenche.
 */
export interface FamilleDeCondition {
	/** Chemin du `…_expr` — segments pointés et `[]`, la grammaire FIGÉE de `sitesDe`. */
	expr: string
	/** Chemin du jumeau prose. */
	texte: string
	/** OÙ de repli, quand aucune entité identifiée ne porte le champ. */
	location: string
	/** D1 : un `…_texte` sans `…_expr` AVERTIT — sur une FIN et un OBJECTIF seulement. */
	alerteSansExpr: boolean
}

/**
 * CINQ FAMILLES, SIX COUPLES : `canon.objectifs` en porte deux (`reussi_si` et
 * `echoue_si`). Cette table a TROIS lecteurs, et c'est ce qui interdit de
 * re-lister ses chemins ailleurs :
 *  · le validateur, qui contrôle la forme puis résout les références ;
 *  · l'alerte D1 « prose sans condition structurée », pilotée par `alerteSansExpr` ;
 *  · le balayage de couverture, dont l'ARRÊT sur les `…_expr` en est DÉRIVÉ —
 *    un arbre d'expression peuplé produit des chemins qui varient avec sa forme,
 *    donc une table de destinations qui ne pourrait jamais être exhaustive.
 *
 * Deux listes de chemins d'expression divergeraient en silence : il n'y en a
 * qu'une, et c'est celle-ci.
 */
export const FAMILLES_DE_CONDITIONS: readonly FamilleDeCondition[] = [
	{
		expr: 'canon.objectifs[].reussi_si_expr',
		texte: 'canon.objectifs[].reussi_si_texte',
		location: 'Objectifs',
		alerteSansExpr: true,
	},
	{
		expr: 'canon.objectifs[].echoue_si_expr',
		texte: 'canon.objectifs[].echoue_si_texte',
		location: 'Objectifs',
		alerteSansExpr: true,
	},
	{
		expr: 'charpente.fins[].condition_expr',
		texte: 'charpente.fins[].condition_texte',
		location: 'Fins',
		alerteSansExpr: true,
	},
	{
		expr: 'charpente.jalons[].declencheur_expr',
		texte: 'charpente.jalons[].declencheur_texte',
		location: 'Jalons',
		alerteSansExpr: false,
	},
	{
		expr: 'monde.evenements[].declencheur_expr',
		texte: 'monde.evenements[].declencheur_texte',
		location: 'Événements',
		alerteSansExpr: false,
	},
	{
		expr: 'monde.personnages[].plan_actions[].declencheur_expr',
		texte: 'monde.personnages[].plan_actions[].declencheur_texte',
		location: 'Personnages',
		alerteSansExpr: false,
	},
]
// SIXIÈME famille `contre_mesures[]` : absente du schéma 1. Elle vit SOUS
// `personnages[]` et arrive avec sa racine en n° 4 `dossier-fiches` — quatre
// lignes. Ne PAS l'anticiper ici : une ligne sans instance dans la fixture fait
// rougir le balayage de couverture, par construction.
