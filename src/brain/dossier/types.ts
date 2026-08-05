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
 * `…_expr` arrive à l'itération 3, le registre `DELTAS` à l'itération 4.
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
 * Un EFFET DE RÈGLE encore non typé : un objet, JAMAIS une chaîne. C'est tout ce
 * que l'itération 2 fige, et c'est le point irréversible — de la prose ne se
 * parse pas en delta, alors qu'un objet dont les clés se précisent est une
 * extension. Le vocabulaire des clés est le registre `DELTAS` de l'itération 4,
 * qui s'inventorie dans `actionEngine.ts` / `sessionEngine.ts` / `xp.ts` ; le nom
 * `Delta` lui reste libre.
 */
export type DeltaBrut = Record<string, unknown>

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

/** Une étape du plan d'actions d'un personnage. */
export interface PlanAction {
	/** L'ordre de l'étape dans le plan. */
	etape: number
	/** L'intention du personnage à cette étape — ce que le rôle acteur joue. */
	action: string
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
	consequence: DeltaBrut[]
}

/** Un événement du monde, éventuellement adossé à une créature du bestiaire. */
export interface Evenement extends Entite {
	/**
	 * `bestiaire.<templateId>` — SECOND espace de noms, résolu contre `BESTIARY`
	 * et non contre une collection du dossier. Une référence pendante est
	 * BLOQUANTE à l'import : sinon un combat s'ouvre sans monstre.
	 */
	monstre_ref?: string
	resolutions: Resolution[]
}

/** Une quête, et ce qu'elle rapporte. */
export interface Quete extends Entite {
	recompense: DeltaBrut[]
}

/** Un climat : une condition ambiante qui modifie les règles. */
export interface Climat extends Entite {
	effets_regles: DeltaBrut[]
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
	objectifs: Entite[]
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
	effet: DeltaBrut[]
}

/** Une fin possible de l'aventure. */
export interface Fin extends Entite {
	/** AUTEUR — condition de fin en langage naturel. Jamais injectée (un narrateur
	 *  qui la connaît y conduit).
	 *  Exemple : « Le héros a vaincu le Gardien ET porte la Clé d'Aldûr. » */
	condition_texte: string
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
