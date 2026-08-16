import {
	BUDGET_MOTS_CANON,
	BUDGET_MOTS_JALON,
	CAMPS,
	CAMPS_PERSONNAGE,
	CARACTERISTIQUE_MIN,
	CERTITUDES,
	CONFIANCE_MAX,
	CONFIANCE_MIN,
	DUREE_MIN,
	INTENSITE_MAX,
	INTENSITE_MIN,
	PORTEES,
	PORTEES_CONTRE_MESURE,
} from './types'
import { COLLECTIONS_IDENTIFIEES, type EspaceDeNoms } from './identifiers'
import { CURSEUR_MAX, CURSEUR_MIN, CURSEUR_VALUES } from './curseurs'
import { CHARACTERISTIC_MAX, CHARACTERISTIC_VALUES } from '../characteristics'
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
	// REQUIS DANS SON BLOC, comme les huit `stats` : `sitesDe` ne produit AUCUN site
	// sous un `but` absent (le `if (!estObjet(site.valeur)) continue` coupe), donc un
	// personnage sans but reste calme, tandis qu'un `but` posé sans `libelle` est
	// bloquant. Un but qui ne dit pas ce que le personnage veut n'est pas un but.
	{ path: 'monde.personnages[].but.libelle', location: 'Personnages' },
	// MÊME FORME que `plan_actions[].action` juste au-dessus, et pour la même raison :
	// une contre-mesure sans intention n'a rien à jouer. La liste, elle, reste
	// OPTIONNELLE — c'est l'ÉLÉMENT qui est contraint.
	{ path: 'monde.personnages[].contre_mesures[].action', location: 'Personnages' },
	// LES DEUX MOITIÉS D'UNE RELATION, requises DANS leur élément par le même
	// mécanisme que `contre_mesures[].action` : la LISTE reste optionnelle, c'est
	// l'ÉLÉMENT qui est contraint. Une relation sans cible ne désigne personne ; une
	// relation sans `lien` n'a rien à faire jouer — c'est la seule des quatre clés
	// que le rôle acteur reçoive, donc une ligne muette pour tout le Temps 2.
	{ path: 'monde.personnages[].relations[].cible_id', location: 'Personnages' },
	{ path: 'monde.personnages[].relations[].lien', location: 'Personnages' },
	// MÊME FORME : une présence sans lieu ne situe rien. `quand` reste optionnel — le
	// moment courant vient de la SESSION, pas de la fiche.
	{ path: 'monde.personnages[].presence[].lieu_id', location: 'Personnages' },
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
 * Les valeurs d'INTENSITÉ acceptables sur une relation, DÉRIVÉES des deux bornes
 * nommées exactement comme `CONFIANCES` juste au-dessus (KR-165).
 *
 * REGISTRE DISTINCT DE `CONFIANCES`, et la table est l'endroit où cela se voit : les
 * deux listes portent aujourd'hui les MÊMES SEPT VALEURS, et c'est précisément ce qui
 * rendait la réutilisation tentante. Elles ne mesurent pas la même chose — la
 * confiance est un état de SESSION que le héros gagne d'un PNJ, l'intensité une
 * donnée d'AUTEUR écrite une fois — et un registre partagé les ferait dériver
 * ensemble au premier changement de l'une. Précédents : `CAMPS_PERSONNAGE` face à
 * `CAMPS`, `PORTEES_CONTRE_MESURE` face à `PORTEES`.
 *
 * L'ÉNUMÉRATION EXPLICITE est ce qui rend `2.5` et `"3"` refusés sans qu'aucune règle
 * de forme n'ait à être écrite, même mécanique que `VALEURS_DE_CARACTERISTIQUE` : le
 * balayage générique des ensembles fermés teste une APPARTENANCE.
 */
export const INTENSITES: readonly number[] = Array.from(
	{ length: INTENSITE_MAX - INTENSITE_MIN + 1 },
	(_, rang) => INTENSITE_MIN + rang,
)

/**
 * Les valeurs qu'une caractéristique peut prendre — DÉRIVÉES des deux bornes
 * nommées, exactement comme `CONFIANCES` juste au-dessus, et pour la même raison :
 * une borne ne se réécrit jamais en dur au site de validation (KR-165).
 *
 * L'échelle « entier de 1 à 12 » fait foi dans `docs/REGLES-DU-JEU.md` § 1,
 * paragraphe « Échelle » (KR-130) ; ses deux bornes vivent aujourd'hui à deux
 * endroits — `CHARACTERISTIC_MAX` dans `characteristics.ts` (sous score de
 * mutation), `CARACTERISTIQUE_MIN` dans `types.ts` —, ce que la docstring de la
 * seconde nomme et date.
 *
 * L'ÉNUMÉRATION EXPLICITE est ce qui rend `2.5` et `"3"` refusés sans qu'aucune
 * règle de forme n'ait à être écrite : la boucle générique des ensembles fermés
 * teste une APPARTENANCE, donc un non-entier et une chaîne tombent par la même
 * porte qu'un `0` ou qu'un `13`.
 */
export const VALEURS_DE_CARACTERISTIQUE: readonly number[] = Array.from(
	{ length: CHARACTERISTIC_MAX - CARACTERISTIQUE_MIN + 1 },
	(_, rang) => CARACTERISTIQUE_MIN + rang,
)

/**
 * Les valeurs qu'un CURSEUR DE CARACTÈRE peut prendre — DÉRIVÉES des deux bornes
 * nommées de `curseurs.ts`, exactement comme les trois échelles ci-dessus, et pour
 * la même raison : une borne ne se réécrit jamais en dur au site de validation
 * (KR-165).
 *
 * QUATRIÈME REGISTRE D'ÉCHELLE, et le premier qui ne commence pas à `1` ni à `-3` :
 * `0` est ici une EXTRÉMITÉ (« aucune méfiance »), pas un point neutre entre deux
 * contraires — c'est ce qui le sépare d'`INTENSITES`, et ce qui fait que le
 * `Stepper` qui règle un curseur ne porte AUCUN `prefix` signé.
 *
 * SA SOURCE N'EST PAS `docs/REGLES-DU-JEU.md`, et c'est délibéré (KR-193) : un
 * curseur ne change aucun jet, il ne colore qu'une prose. Les deux bornes vivent
 * dans `curseurs.ts`, registre de PRÉSENTATION, hors table dorée et hors score de
 * mutation.
 */
export const VALEURS_DE_CURSEUR: readonly number[] = Array.from(
	{ length: CURSEUR_MAX - CURSEUR_MIN + 1 },
	(_, rang) => CURSEUR_MIN + rang,
)

/**
 * Les ensembles FERMÉS du schéma. Chaque ligne cite le registre qui porte ses
 * valeurs — jamais une liste recopiée (KR-117) : les deux `camp`, `portee` et
 * `certitude` viennent de `types.ts`, le jet de révélation des registres de
 * règles, et les bornes de confiance des deux constantes nommées.
 *
 * LES DEUX `camp` NE PARTAGENT PAS LEUR REGISTRE, et la table est l'endroit où
 * cela se voit : celui d'un OBJECTIF lit `CAMPS` (à qui la victoire appartient,
 * `'joueur'` compris) et il est REQUIS ; celui d'un PERSONNAGE lit
 * `CAMPS_PERSONNAGE` (de quel côté cet acteur joue) et il est OPTIONNEL — un camp
 * requis sur `monde.personnages[]` invaliderait rétroactivement tout dossier déjà
 * persisté, le schéma restant 1 sans chemin de migration (KR-191).
 *
 * LES HUIT CARACTÉRISTIQUES SONT `requis: true` SANS QUE `stats` DEVIENNE
 * OBLIGATOIRE, et cette combinaison est le contrat « optionnel en bloc, TOTAL
 * quand présent » — pas une contradiction. Elle tient à `sitesDe` : le segment
 * `stats` d'un personnage qui n'en porte pas ne produit AUCUN site, donc aucune
 * des huit règles ne parle ; dès que le bloc existe, chacune des huit clés
 * manquantes est une anomalie bloquante. Le précédent est
 * `savoirs[].revele_si.jet.carac`, déjà `requis: true` sous deux porteurs
 * optionnels — et surtout PAS `revele_si.confiance_min`, feuille scalaire
 * optionnelle, dont le `requis: false` ne dit rien d'un bloc.
 */
export const ENUMERES_FERMES: readonly EnumereFerme[] = [
	{ path: 'canon.objectifs[].camp', location: 'Objectifs', valeurs: CAMPS, requis: true },
	{ path: 'monde.personnages[].portee', location: 'Personnages', valeurs: PORTEES, requis: true },
	{ path: 'monde.personnages[].camp', location: 'Personnages', valeurs: CAMPS_PERSONNAGE, requis: false },
	// TROISIÈME registre à porter le mot « portée », et le seul dont la clé soit
	// homonyme d'un autre : `monde.personnages[].portee` juste au-dessus dit la
	// PROFONDEUR DE SIMULATION, celle-ci dit CE QU'UNE RIPOSTE ATTEINT. Deux
	// registres, deux types (`Portee` / `PorteeContreMesure`), aucune valeur commune
	// — c'est ce qui rend une confusion visible plutôt que silencieuse.
	{
		path: 'monde.personnages[].contre_mesures[].portee',
		location: 'Personnages',
		valeurs: PORTEES_CONTRE_MESURE,
		requis: false,
	},
	// L'INTENSITÉ D'UNE RELATION lit `INTENSITES`, JAMAIS `CONFIANCES` — les deux
	// listes portent les mêmes sept valeurs aujourd'hui, et c'est exactement ce qui
	// rend l'erreur invisible : rien ne rougirait, et les deux échelles dériveraient
	// ensemble au premier changement de l'une. `requis: true` DANS l'élément, comme
	// les huit caractéristiques dans leur bloc — une relation dont personne n'a réglé
	// l'intensité laisserait le seuil du moteur indéfini.
	{
		path: 'monde.personnages[].relations[].intensite',
		location: 'Personnages',
		valeurs: INTENSITES,
		requis: true,
	},
	// LE DRAPEAU DE SECRET — `requis: false` : une relation dont l'auteur n'a rien dit
	// n'est pas secrète (« absent se traite comme `false` », JSDoc de `Relation.secret`),
	// et l'exiger invaliderait rétroactivement le premier dossier qui en porterait une.
	// Même forme que `revele_si.contrepartie.consomme`, qui est le seul autre booléen
	// fermé du schéma — mais `requis: true` là-bas, la porte n'ayant pas de défaut.
	{
		path: 'monde.personnages[].relations[].secret',
		location: 'Personnages',
		valeurs: [true, false],
		requis: false,
	},
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
	// LES HUIT CARACTÉRISTIQUES — DÉRIVÉES du registre, jamais huit littéraux : une
	// liste recopiée divergerait de `CHARACTERISTICS` en silence (KR-117), et la
	// dérivation est ÉTALÉE ICI plutôt que confiée à un mécanisme générique de
	// « Record à clés fixes » — deux étalements de trois lignes valent mieux qu'une
	// abstraction dont le rayon d'explosion serait le garde d'audience du schéma.
	...CHARACTERISTIC_VALUES.map((carac) => ({
		path: `monde.personnages[].stats.${carac}`,
		location: 'Personnages',
		valeurs: VALEURS_DE_CARACTERISTIQUE,
		requis: true,
	})),
	// LES SIX CURSEURS DE CARACTÈRE — MÊME FORME que les huit caractéristiques
	// ci-dessus (jurisprudence d'it3 : dérivées du registre, `requis: true` sous un
	// bloc optionnel, dérivation ÉTALÉE ICI et jamais promue en mécanisme partagé),
	// pour un MOTIF DIFFÉRENT, et c'est ce qui interdit de fondre les deux : un
	// curseur manquant ne rend aucun jet irrésoluble — l'affinité est documentaire
	// et aucun code ne calcule rien depuis ce nombre (KR-193). Ce qu'un bloc partiel
	// casse est EN AVAL, à l'assemblage du contexte de la n° 10 : une clé manquante y
	// deviendrait une branche, c'est-à-dire l'endroit où l'on invente un trait de
	// caractère côté prompt.
	...CURSEUR_VALUES.map((curseur) => ({
		path: `monde.personnages[].caractere.curseurs.${curseur}`,
		location: 'Personnages',
		valeurs: VALEURS_DE_CURSEUR,
		requis: true,
	})),
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

export interface ChampEntier extends ChampRequis {
	/** La borne BASSE, INCLUSE — toujours une constante nommée, jamais un nombre en
	 *  dur ici (KR-165). */
	min: number
}

/**
 * Les champs ENTIERS BORNÉS PAR LE BAS — ceux qu'aucune énumération ne peut
 * décrire, faute de borne haute.
 *
 * POURQUOI UNE TABLE À PART DE `ENUMERES_FERMES` : les caractéristiques sont
 * bornées des DEUX côtés, donc `VALEURS_DE_CARACTERISTIQUE` peut les énumérer, et
 * l'appartenance à cette liste refuse d'un coup `2.5`, `"3"`, `0` et `13`. Ici il
 * n'y a pas de borne haute (aucune règle ne tranche la durée d'une aventure) :
 * l'ensemble admis est infini, et il faut donc dire en toutes lettres ce que
 * l'appartenance disait — un NOMBRE, ENTIER, au moins `min`.
 *
 * DEUX CHEMINS, ET DEUX SEULEMENT. `plan_actions[].etape` n'y est PAS, et c'est un
 * arbitrage, pas un oubli : c'est un champ DÉJÀ EXISTANT et déjà valide depuis la
 * n° 1, dont aucune règle d'ordonnancement (unicité, continuité, départ à 1) n'a
 * jamais été arbitrée — le contraindre ici serait décider en passant ce que
 * personne n'a décidé, et invalider rétroactivement des documents déjà persistés
 * (KR-160). KR-190 borne le pire cas d'un lot contrat, il ne prescrit pas sa liste.
 */
export const CHAMPS_ENTIERS: readonly ChampEntier[] = [
	{ path: 'monde.personnages[].plan_actions[].duree', location: 'Personnages', min: DUREE_MIN },
	{ path: 'monde.personnages[].contre_mesures[].delai', location: 'Personnages', min: DUREE_MIN },
]

/**
 * Les listes OPTIONNELLES dont chaque élément doit être un objet — la moitié que
 * la dérivation ci-dessous ne peut pas produire.
 *
 * FERMETURE DU TROU RÉSIDUEL DE BUG-050. `LISTES_A_ELEMENTS_STRUCTURES` était
 * dérivée de `LISTES_REQUISES` SEULE, qui ne porte par construction que des listes
 * NON optionnelles : aucune liste optionnelle n'était donc contrôlée élément par
 * élément, et un `contre_mesures: ["une chaîne"]` traversait `validateDossier` en
 * `ok: true` — le dossier gelé promettait une `ContreMesure` là où il y a une
 * chaîne, et l'acteur perdait sa riposte sans que rien ne le dise. Exactement le
 * défaut que BUG-050 avait fermé pour les listes requises, resté ouvert sur
 * l'autre moitié parce que le schéma 1 n'avait aucune liste optionnelle.
 *
 * Elle ne se dérive de rien : une liste optionnelle n'a, par définition, aucune
 * autre table qui la nomme. Toute liste optionnelle STRUCTURÉE ajoutée à
 * `types.ts` gagne sa ligne ici — le compilateur ne relie pas les deux. Les DEUX
 * annoncées par l'itération 4 sont arrivées à l'itération 5.
 *
 * ⚠ `monde.personnages[].caractere.parler` N'Y EST PAS, ET CE N'EST PAS UN OUBLI
 * (itération 8) : le mot qui compte dans le nom de cette table est STRUCTURÉES —
 * ses éléments sont des CHAÎNES, pas des objets, et la règle qu'elle pose
 * (« chaque élément est un objet ») refuserait le contenu même du champ. Le
 * précédent exact est `canon.interdits_ton[]`, liste de chaînes sans règle
 * d'élément depuis la n° 1. Sa cardinalité (`PARLER_REPLIQUES`) est une borne
 * d'INTERFACE, jamais un chemin de refus du SSOT : un document qui porte trois
 * répliques est ACCEPTÉ et rendu en entier.
 */
export const LISTES_OPTIONNELLES_STRUCTUREES: readonly ChampRequis[] = [
	{ path: 'monde.personnages[].contre_mesures', location: 'Personnages' },
	{ path: 'monde.personnages[].relations', location: 'Personnages' },
	{ path: 'monde.personnages[].presence', location: 'Personnages' },
]

/**
 * BUG-050 — les listes dont chaque ÉLÉMENT doit être un objet. DEUX MOITIÉS : la
 * requise, DÉRIVÉE et jamais recopiée ; l'optionnelle, déclarée, faute d'une table
 * dont elle pourrait se dériver.
 *
 * `LISTES_REQUISES` exige que la liste SOIT un tableau, jamais que ses éléments
 * soient des objets : un `savoirs: ["du texte"]` traversait le validateur en
 * silence, `ok:true`, et le dossier gelé promettait un `Savoir` là où il y a une
 * chaîne — le savoir disparaissait du personnage sans que rien ne le dise.
 *
 * Pourquoi la moitié requise est une DÉRIVATION plutôt qu'une table dédiée : les
 * collections identifiées sont DÉJÀ gardées — un élément non-objet y donne
 * `id: null` dans `collectIds`, donc `champ-requis-vide`, bloquant depuis
 * l'itération 1 — donc les inclure produirait deux anomalies pour une seule cause.
 * Et les deux tables lues là sont chacune un point de passage obligé pour d'autres
 * raisons, alors qu'une table recopiée serait le seul endroit du module où un
 * oubli passerait inaperçu.
 *
 * Pourquoi la moitié optionnelle ne l'est PAS : il n'existe aucune table dont une
 * liste optionnelle serait déjà membre. Le prix est nommé — c'est une déclaration,
 * donc un oubli possible — et il est payé par le garde : `couverture.test.ts`
 * exige une instance en fixture pour chaque chemin, et `validate.test.ts` un
 * poseur par ligne.
 *
 * Le nombre de chemins est à REMESURER, jamais à recopier d'ici (KR-159), et il
 * est épinglé par `couverture.test.ts`.
 */
export const LISTES_A_ELEMENTS_STRUCTURES: readonly ChampRequis[] = [
	...LISTES_REQUISES.filter((liste) => !COLLECTIONS_IDENTIFIEES.some((collection) => collection.path === liste.path)),
	...LISTES_OPTIONNELLES_STRUCTUREES,
]

/**
 * Une RÉFÉRENCE SIMPLE : un champ textuel qui pointe une entité du dossier par
 * son identifiant, hors de tout arbre et hors de tout effet.
 *
 * Elle existe pour qu'aucune référence ne soit plus résolue par une branche
 * câblée en dur dans le validateur (KR-117) : `charpente.depart.lieu_id` en était
 * une, et les trois champs de `savoirs[]` en auraient été trois de plus.
 */
export interface ReferenceSimple {
	path: string
	espace: EspaceDeNoms
	location: string
	/** Sujet de la phrase quand il ne se dérive pas du champ. Repli : « Le champ « {feuille} » ». */
	sujet?: string
}

/**
 * Les SEPT références simples du schéma 1 — quatre posées par la n° 1, la
 * cinquième (`personnages[].objectif_id`) par l'itération 1 de la n° 4, les deux
 * dernières par son itération 5. Toutes bloquantes quand elles ne résolvent pas :
 * une référence orpheline est EXPOSÉE, jamais silencieuse (KR-021). Le nombre est à
 * REMESURER, jamais à recopier d'ici (KR-159).
 *
 * Les trois de `savoirs[]` — et les trois portées par la fiche elle-même — nomment
 * le PERSONNAGE porteur : c'est `sitesDe` qui le résout en traversant
 * `monde.personnages`, sans qu'aucune ligne ait à le dire.
 *
 * CONSÉQUENCE DE LA CINQUIÈME, à ne pas découvrir en aval : un objectif du canon
 * cité par un personnage ne peut plus être retiré tant que le rattachement tient.
 * Ce n'est pas un effet de bord, c'est la définition d'une référence — l'écran qui
 * retire l'objectif doit RENDRE le refus, jamais l'avaler (KR-183).
 *
 * LA SIXIÈME EST LA PREMIÈRE RÉFÉRENCE AUTO-RÉFÉRENTIELLE DU SCHÉMA, et cette table
 * n'y change RIEN : `relations[].cible_id` pointe l'espace `pnj`, donc le porteur
 * lui-même y résout comme n'importe quel autre personnage. Aucune garde, aucun
 * filtre, ni ici ni au sélecteur (KR-194) — un personnage en conflit avec lui-même
 * est une didascalie jouable, pas une anomalie à rattraper. Sa conséquence en aval
 * est symétrique de celle de la cinquième : un personnage cité par une relation ne
 * pourra plus être retiré en silence, ce que l'itération 7 rendra visible à l'écran.
 */
export const REFERENCES_SIMPLES: readonly ReferenceSimple[] = [
	{ path: 'charpente.depart.lieu_id', espace: 'lieu', location: 'Point de départ', sujet: 'Le point de départ' },
	{ path: 'monde.personnages[].savoirs[].indice_id', espace: 'indice', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', espace: 'objet', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.apres_indice_id', espace: 'indice', location: 'Personnages' },
	{
		path: 'monde.personnages[].objectif_id',
		espace: 'objectif',
		location: 'Personnages',
		sujet: 'Le rattachement de ce personnage',
	},
	// LES DEUX DE L'ITÉRATION 5, SANS `sujet` — comme les trois de `savoirs[]`, et
	// délibérément : le repli dérivé écrit « Le champ « cible_id » », qui nomme le
	// champ que l'auteur vient d'éditer. Un `sujet` rédigé serait du texte d'interface
	// qu'aucun contrat de design n'a arbitré ; les deux qui en portent un
	// (`depart.lieu_id`, `objectif_id`) le tiennent d'une décision écrite.
	{ path: 'monde.personnages[].relations[].cible_id', espace: 'pnj', location: 'Personnages' },
	{ path: 'monde.personnages[].presence[].lieu_id', espace: 'lieu', location: 'Personnages' },
]

/**
 * Les QUATRE emplacements d'effets de règle. L'itération 2 y a fermé la FORME —
 * une liste d'objets, jamais de la prose, point irréversible du schéma —, et
 * l'itération 4 y ferme le VOCABULAIRE : chaque élément passe par `validateDelta`
 * et ses cibles se résolvent comme celles d'une condition.
 *
 * Cette table a DEUX lecteurs, et c'est ce qui interdit de re-lister ses chemins
 * ailleurs : le validateur, et l'ARRÊT du balayage de couverture, qui en est
 * DÉRIVÉ — chaque chemin SUFFIXÉ `[]`, de sorte que l'arrêt tombe sur l'ÉLÉMENT
 * et non sur le tableau.
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
	/** D1 : un `…_texte` sans `…_expr` AVERTIT — sur une FIN, un OBJECTIF et une
	 *  CONTRE-MESURE. Il reste CALME sur un jalon, un événement et une étape de
	 *  plan, où le déclenchement à la main du narrateur est légitime. */
	alerteSansExpr: boolean
}

/**
 * SIX FAMILLES, SEPT COUPLES : `canon.objectifs` en porte deux (`reussi_si` et
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
	// LA SIXIÈME FAMILLE, arrivée avec sa racine à l'itération 4 de la n° 4. Elle est
	// le CONTRASTE de la ligne juste au-dessus, et le contraste est le contenu de
	// l'arbitrage : deux champs de même NOM (`declencheur_texte`), portés par le même
	// personnage, à deux étages du même bloc d'écran, et qui se comportent à l'opposé.
	//
	// Une ÉTAPE de plan sans condition structurée reste CALME (arbitrage d'it1) : le
	// narrateur peut légitimement faire avancer un personnage à la main, et alerter
	// là ferait du bruit sur tous les plans écrits en prose.
	//
	// Une CONTRE-MESURE sans condition structurée AVERTIT : c'est une riposte ARMÉE,
	// dont toute la raison d'être est de partir quand le joueur déclenche quelque
	// chose. Sans son `…_expr`, rien ne l'arme jamais — l'auteur a écrit une menace
	// qui ne se produira pas, et il ne l'apprendrait qu'en jouant.
	{
		expr: 'monde.personnages[].contre_mesures[].declencheur_expr',
		texte: 'monde.personnages[].contre_mesures[].declencheur_texte',
		location: 'Personnages',
		alerteSansExpr: true,
	},
]
