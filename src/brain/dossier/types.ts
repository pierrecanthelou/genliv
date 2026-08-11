/**
 * Le DOSSIER D'AVENTURE — le format que l'éditeur produit au Temps 1 et que le
 * moteur joue au Temps 2. C'est le contrat entre les deux temps : les quinze
 * features suivantes le consomment.
 *
 * TREIZE RACINES groupées en TROIS : `canon` (ce qui est vrai de l'histoire),
 * `monde` (les acteurs et le décor), `charpente` (ce que le moteur lit).
 *
 * `canon.mj` est séparé de `canon.partage` : le synopsis MJ porte la vérité, y
 * compris ce que le joueur ignore. Les deux fondus, le PNJ serait omniscient par
 * construction. C'est la seule scission NON MIGRABLE du schéma — on ne coupe pas
 * de la prose déjà rédigée par script.
 *
 * CASSE DES CLÉS : `snake_case` pour toute clé du document persistant.
 * `createdAt` / `updatedAt` sont l'UNIQUE exception, motivée — des horodatages
 * ISO jamais tapés à la main. L'auteur écrit ce JSON à la main jusqu'à la n° 3,
 * d'où les exemples portés par les JSDoc des champs de prose.
 *
 * PÉRIMÈTRE — décision A du 2026-08-04 : la forme COMPLÈTE des treize racines
 * n'appartient plus à cette feature. Chaque racine reçoit la sienne dans la
 * feature qui l'ÉDITE (`canon` en n° 3, `personnages` en n° 4, `lieux`/`objets`/
 * `indices` en n° 5, `quetes`/`evenements`/`conditions` en n° 6). L'itération 2
 * ne pose ici que les corrections IRRÉVERSIBLES — celles qu'aucune migration ne
 * rattrape : la collision de clé `plan`, les portes de révélation fermées, les
 * quatre emplacements de deltas TYPÉS, `monstre_ref`, et `jalons[].enonce_texte`.
 * L'itération 3 y ajoute les DIX champs des cinq familles de conditions (D1) —
 * six `…_expr` moteur, quatre `…_texte` auteur, tous optionnels. L'itération 4
 * ferme le VOCABULAIRE des quatre emplacements d'effets : `DeltaBrut`
 * (`Record<string, unknown>`, la seule FORME que l'it2 pouvait figer) laisse la
 * place à `Delta`, dont la clé `delta` est un identifiant du registre `DELTAS`.
 *
 * QUI LIT QUOI : ce fichier dit la FORME, il ne dit pas l'AUDIENCE. L'audience
 * de chaque champ terminal vit dans `destinations.ts`, sous le balayage de
 * `couverture.test.ts` — trois questions disjointes, trois sources, un seul
 * garde.
 *
 * AUCUNE fonction ne convertit un `Book` en `Dossier` ni l'inverse, dans aucun
 * sens (KR-167) : un chemin de compatibilité serait une seconde source de vérité
 * que personne n'oserait couper en n° 9.
 */
import type { Characteristic } from '../characteristics'
import type { ChallengeTier } from '../challenge'
import type { ExprNode } from './expr'
import type { Delta } from './deltas'

/**
 * La version du schéma. Comparée au NOMBRE 1, strictement : ni `'1'`, ni `0`, ni
 * `2`, ni absent, et jamais coercée (KR-160). Il n'existe pas de `migrateDossier`
 * et il ne doit pas en exister tant qu'aucun schéma 2 n'existe — sans v2, une
 * fonction de migration n'a ni test ni appelant.
 */
export const DOSSIER_SCHEMA = 1

/**
 * Le budget de mots CONSEILLÉ pour un bloc de canon (`canon.mj`, `canon.partage`).
 * Constante NOMMÉE, jamais un nombre en dur au site de validation (KR-165) : c'est
 * le budget de contexte du modèle qui en dépend. Le dépassement produit un
 * AVERTISSEMENT non bloquant, jamais une erreur.
 */
export const BUDGET_MOTS_CANON = 600

/**
 * Le budget de mots d'un `jalons[].enonce_texte`. Beaucoup plus serré que celui
 * du canon, et pour une raison mécanique : les énoncés des jalons atteints sont
 * injectés TOUS ENSEMBLE, et leur liste croît monotonement avec la durée de la
 * partie. Dépassement = avertissement, jamais un refus (KR-165).
 */
export const BUDGET_MOTS_JALON = 20

/**
 * Les bornes FERMÉES de l'échelle de confiance d'une porte de révélation. Le
 * schéma de session du plan de cible écrit déjà `confiance: -3..3` ; les poser
 * ici évite qu'un dossier importé demande une confiance que la session ne peut
 * pas atteindre. La mécanique de l'échelle elle-même reste à définir (n° 12).
 */
export const CONFIANCE_MIN = -3
export const CONFIANCE_MAX = 3

/**
 * Toute entité nommée et référencée du dossier. `id` porte son espace de noms
 * (`pnj.aldur-le-sage`) et il est la SEULE façon de la référencer — jamais le nom.
 *
 * `nom` est OPTIONNEL : une entité en cours de rédaction peut ne pas encore en
 * porter, et c'est exactement ce que le repli « {Type} n°{index} (sans nom) » du
 * rapport d'anomalie rend lisible. Absent n'est pas vide : un `nom` omis est un
 * état informationnel calme, jamais une alerte.
 */
export interface Entite {
	id: string
	nom?: string
}

/**
 * La PORTÉE d'un personnage : premier plan (simulé en détail) ou second plan.
 * Le tableau est la source unique — l'union en est dérivée, et le validateur lit
 * le tableau plutôt que de re-lister les littéraux (KR-117).
 *
 * Ce champ tranche la collision de clé relevée en § 5 de la roadmap : `plan`
 * désignait à la fois cet énuméré et la liste d'étapes, qui est `plan_actions`.
 */
export const PORTEES = ['premier', 'second'] as const
export type Portee = (typeof PORTEES)[number]

/**
 * Le degré de CERTITUDE d'un savoir. OBLIGATOIRE, sans défaut implicite : un
 * `croit` est une information fausse ou incertaine, et sans ce champ une rumeur
 * entrerait au carnet d'indices comme un fait établi — le garde-fou « faits
 * établis » se mettrait alors à défendre une contradiction.
 */
export const CERTITUDES = ['sait', 'croit', 'soupconne'] as const
export type Certitude = (typeof CERTITUDES)[number]

/**
 * Le CAMP d'un objectif : À QUI cette victoire appartient. Le tableau est la
 * source unique — l'union en est dérivée, et le validateur lit le tableau plutôt
 * que de re-lister les littéraux (KR-117).
 *
 * OBLIGATOIRE, sans défaut implicite, pour la même raison que `certitude` : un
 * objectif sans camp n'appartient à personne, et le moteur qui conclut une partie
 * ne saurait pas de QUEL côté elle s'est jouée. « Un objectif par camp » reste
 * DESCRIPTIF : aucune règle n'exige de couvrir les trois, ni n'en interdit deux du
 * même camp.
 */
export const CAMPS = ['protagonistes', 'antagonistes', 'joueur'] as const
export type Camp = (typeof CAMPS)[number]

/** Une étape du plan d'actions d'un personnage. */
export interface PlanAction {
	/** L'ordre de l'étape dans le plan. */
	etape: number
	/** L'intention du personnage à cette étape — ce que le rôle acteur joue. */
	action: string
	/** AUTEUR — ce qui fait passer le personnage à cette étape, en français. À ne
	 *  pas confondre avec `action`, qui est la seule clé IA de la famille.
	 *  Exemple : declencheur_texte: 'Le joueur mentionne le sceau brisé devant lui.' */
	declencheur_texte?: string
	/** MOTEUR — l'avancement d'étape est du code (n° 14), jamais une intention.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'indice_connu', cibles: ['indice.sceau-brise'] } */
	declencheur_expr?: ExprNode
}

/**
 * La condition de révélation d'un savoir — QUATRE portes fermées, jamais un
 * prédicat booléen. Un jet n'ÉVALUE pas, il ÉMET une demande qui change le tour :
 * aplati en prédicat, il forcerait l'évaluateur à lancer le dé et le moteur
 * perdrait le routage vers le protocole à deux appels de la n° 11.
 *
 * Une porte absente n'est pas une porte fermée : c'est une porte non posée. Un
 * savoir sans AUCUNE des quatre portes ne se révèle jamais de lui-même — le
 * validateur en avertit sans bloquer.
 */
export interface Revelation {
	/** Confiance minimale exigée, dans `[CONFIANCE_MIN, CONFIANCE_MAX]`. */
	confiance_min?: number
	/**
	 * Un challenge ORDINAIRE (`resolveChallenge`), pas un sous-système social : le
	 * `carac` est celui du HÉROS. Le modèle ne voit jamais `carac`/`tc` bruts — il
	 * reçoit un libellé dérivé des registres.
	 */
	jet?: { carac: Characteristic; tc: ChallengeTier }
	/**
	 * Un prix STRUCTURÉ, jamais de la prose : le moteur ne peut pas constater qu'un
	 * serment a été tenu. Une contrepartie en prose libre n'est pas une porte mais
	 * une intention — elle va dans `revele_comment`.
	 */
	contrepartie?: { objet_id: string; consomme: boolean }
	/** L'indice qui doit avoir été obtenu avant que ce savoir puisse se révéler. */
	apres_indice_id?: string
}

/** Ce qu'un personnage sait d'un indice, et à quelle condition il le dit. */
export interface Savoir {
	/** Référence vers `monde.indices[].id`. */
	indice_id: string
	certitude: Certitude
	/** La MANIÈRE dont le savoir se révèle — didascalie pour l'IA, injectée
	 *  UNIQUEMENT quand la porte est ouverte. Jamais un dialogue verbatim.
	 *  Exemple : « Elle hésite, puis chuchote, jetant un regard vers la porte. » */
	revele_comment?: string
	revele_si?: Revelation
}

/** Un acteur du monde : sa portée, son plan, et ce qu'il sait. */
export interface Personnage extends Entite {
	portee: Portee
	plan_actions: PlanAction[]
	savoirs: Savoir[]
}

/** Une issue possible d'un événement, et ce qu'elle change. */
export interface Resolution {
	/** L'issue, en français — ce que le narrateur joue quand elle survient. */
	resultat: string
	consequence: Delta[]
}

/** Un événement du monde, éventuellement adossé à une créature du bestiaire. */
export interface Evenement extends Entite {
	/**
	 * `bestiaire.<templateId>` — SECOND espace de noms, résolu contre `BESTIARY`
	 * et non contre une collection du dossier. Une référence pendante est
	 * BLOQUANTE à l'import : sinon un combat s'ouvre sans monstre.
	 */
	monstre_ref?: string
	/** DEUX optionnels, PAIRÉS — un événement peut rester déclenché par la seule main
	 *  du narrateur, sans condition formalisée : c'est calme, jamais une alerte.
	 *  Exemple : declencheur_texte: 'Le joueur revient à Val-Cendre après la tempête.' */
	declencheur_texte?: string
	/** MOTEUR — jamais injecté : un narrateur qui connaît le déclencheur PROVOQUE
	 *  l'embuscade au lieu de la laisser survenir.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
	declencheur_expr?: ExprNode
	resolutions: Resolution[]
}

/** Une quête, et ce qu'elle rapporte. */
export interface Quete extends Entite {
	recompense: Delta[]
}

/** Un climat : une condition ambiante qui modifie les règles. */
export interface Climat extends Entite {
	effets_regles: Delta[]
}

/**
 * § 09 climat & conditions. `climat` est la première — et pour l'instant la
 * seule — famille de conditions.
 *
 * Le validateur n'en EXIGE pas la présence : imposer à tout dossier de déclarer
 * une liste de climats serait une décision de produit que personne n'a prise, et
 * la forme complète de `conditions` appartient à la n° 6 (décision A), qui
 * tranchera. Ses entrées, elles, sont contrôlées dès qu'il y en a une.
 */
export interface Conditions {
	climat: Climat[]
}

/**
 * Un objectif de l'aventure. `reussi_si_expr` / `echoue_si_expr` sont MOTEUR —
 * jamais injectés. `reussi_si_texte` / `echoue_si_texte` sont AUTEUR : la même
 * règle en français, pour que l'auteur qui relit le JSON sache ce qu'il déclenche.
 *
 * Les quatre sont OPTIONNELS et il n'existe AUCUNE règle de symétrie
 * `…_expr` ⇒ `…_texte` : un `…_texte` sans son `…_expr` avertit (D1), l'inverse
 * est un trou de documentation d'auteur, affaire du linter n° 7.
 *
 * `camp`, lui, est REQUIS — la seule clé non optionnelle de la fiche après `id`.
 *
 * Exemple : reussi_si_expr: { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] }
 * Exemple : reussi_si_texte: 'Le héros a atteint le fond du Gouffre scellé.'
 */
export interface Objectif extends Entite {
	/** À qui appartient cette victoire. MOTEUR : jamais injecté au modèle — un
	 *  narrateur qui sait quel camp doit l'emporter y conduit. */
	camp: Camp
	reussi_si_texte?: string
	reussi_si_expr?: ExprNode
	echoue_si_texte?: string
	echoue_si_expr?: ExprNode
}

/** Ce qui est vrai de l'histoire, et les consignes de registre injectées au modèle. */
export interface Canon {
	mj: CanonMj
	partage: CanonPartage
	/** Le registre de langue de l'aventure — module le ton, jamais la personne ni le temps. */
	ton: string
	/**
	 * Les interdits de TON (contenu, anachronismes, registre) — une consigne
	 * INJECTÉE au modèle. À ne pas confondre avec le garde-fou « aucune création
	 * d'entité », qui est une VALIDATION par résolution d'identifiant (n° 10).
	 */
	interdits_ton: string[]
	objectifs: Objectif[]
}

/** Le bloc du canon réservé au MJ — la vérité, y compris ce que le joueur ignore. */
export interface CanonMj {
	synopsis_mj: string
}

/** Le bloc du canon partagé — ce que le joueur peut lire ou entendre. */
export interface CanonPartage {
	accroche_joueur: string
}

/** Les acteurs et le décor — la couche que le modèle lit pour raconter. */
export interface Monde {
	personnages: Personnage[]
	lieux: Entite[]
	objets: Entite[]
	indices: Entite[]
	quetes: Quete[]
	evenements: Evenement[]
	conditions: Conditions
}

/** Le point d'entrée de l'aventure : où l'on commence, et le texte qui ouvre la partie. */
export interface Depart {
	/** Référence vers `monde.lieux[].id`. Une référence pendante est BLOQUANTE. */
	lieu_id: string
	texte_ouverture_joueur: string
}

/** Un jalon : un fait de l'histoire que le moteur coche quand il est accompli. */
export interface Jalon extends Entite {
	/** IA — énoncé à l'ACCOMPLI du fait établi, ≤ BUDGET_MOTS_JALON, injecté
	 *  seulement si le jalon est atteint. Jamais la même phrase que
	 *  declencheur_texte : celui-ci décrit la CONDITION, celui-là le FAIT.
	 *  Exemple : « Le sceau est brisé ; l'Archiviste le sait. » */
	enonce_texte: string
	/** AUTEUR — ce qui déclenche ce jalon. Jamais injectée au modèle (dupliquerait
	 *  declencheur_expr en prose). La n° 7 la lit pour son linter.
	 *  Exemple : « Le joueur porte le sceau brisé devant l'Archiviste. » */
	declencheur_texte: string
	/** MOTEUR — jumeau structuré de `declencheur_texte`, OPTIONNEL là où celui-ci
	 *  est requis : un jalon peut rester coché à la main par le moteur d'un
	 *  événement. Absent, la condition n'est jamais vérifiée automatiquement, et
	 *  c'est calme — un jalon n'est pas une fin.
	 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
	declencheur_expr?: ExprNode
	effet: Delta[]
}

/** Une fin possible de l'aventure. */
export interface Fin extends Entite {
	/** AUTEUR — condition de fin en langage naturel. Jamais injectée (un narrateur
	 *  qui la connaît y conduit).
	 *  Exemple : « Le héros a vaincu le Gardien ET porte la Clé d'Aldûr. » */
	condition_texte: string
	/** MOTEUR — jumeau structuré de `condition_texte`. Jamais injecté : un narrateur
	 *  qui connaît la condition de fin y conduit.
	 *  Exemple : condition_expr: { op: 'et', enfants: [
	 *    { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] },
	 *    { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] } ] } */
	condition_expr?: ExprNode
}

/**
 * Ce que le MOTEUR lit. `charpente` n'est pas « jamais vue » mais « jamais vue
 * ENTIÈRE » : la seule charge utile qui en sorte vers le modèle est l'ÉNONCÉ des
 * jalons DÉJÀ ATTEINTS (`jalons[].enonce_texte`). Les déclencheurs et les
 * conditions de fin restent au dossier, destination auteur, jamais injectés —
 * `declencheur_texte` est `declencheur_expr` en français, et l'injecter met la
 * même règle dans le code et dans le prompt.
 *
 * La PROJECTION qui bâtit cette charge utile dépend de `session.jalons_atteints` :
 * ce n'est donc pas une projection du dossier, et elle vit en n° 9, à côté de son
 * assembleur, pas ici.
 */
export interface Charpente {
	depart: Depart
	jalons: Jalon[]
	fins: Fin[]
}

export interface Dossier {
	/** Toujours le nombre `DOSSIER_SCHEMA`. Toute autre valeur est refusée (KR-160). */
	schema: typeof DOSSIER_SCHEMA
	/** Identifiant stable du dossier — la clé de persistance, jamais le titre (KR-003). */
	id: string
	titre: string
	createdAt: string
	/** Horodatage ISO — le champ de comparaison de la réconciliation cloud (dernier écrit gagne). */
	updatedAt: string
	canon: Canon
	monde: Monde
	charpente: Charpente
}
