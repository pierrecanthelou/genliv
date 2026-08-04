/**
 * Le DOSSIER D'AVENTURE — le format que l'éditeur produit au Temps 1 et que le
 * moteur joue au Temps 2. C'est le contrat entre les deux temps : les quinze
 * features suivantes le consomment.
 *
 * TREIZE RACINES groupées en TROIS : `canon` (ce qui est vrai de l'histoire),
 * `monde` (les acteurs et le décor), `charpente` (ce que le moteur lit et que
 * l'IA ne voit jamais). Le groupement n'est pas cosmétique : c'est lui qui rend
 * `Pick<Dossier, 'canon' | 'monde'>` sûr par construction en n° 10 — une fuite de
 * charpente vers le contexte du modèle devient une erreur de compilation.
 *
 * `canon.mj` est séparé de `canon.partage` : le synopsis MJ porte la vérité, y
 * compris ce que le joueur ignore. Les deux fondus, le PNJ serait omniscient par
 * construction. C'est la seule scission NON MIGRABLE du schéma — on ne coupe pas
 * de la prose déjà rédigée par script.
 *
 * PÉRIMÈTRE DE L'ITÉRATION 1 : les treize clés sont déclarées, avec un
 * SOUS-ENSEMBLE MINIMAL de champs par racine. La forme complète (les huit blocs
 * de personnage, les savoirs à portes, les accès de lieu…) arrive à l'itération 2 ;
 * `…_expr` à l'itération 3 ; `DELTAS` à l'itération 4. Aucun de ces trois
 * n'apparaît ici.
 *
 * AUCUNE fonction ne convertit un `Book` en `Dossier` ni l'inverse, dans aucun
 * sens (KR-167) : un chemin de compatibilité serait une seconde source de vérité
 * que personne n'oserait couper en n° 9.
 */

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

/** Le bloc du canon réservé au MJ — la vérité, y compris ce que le joueur ignore. */
export interface CanonMj {
	synopsis_mj: string
}

/** Le bloc du canon partagé — ce que le joueur peut lire ou entendre. */
export interface CanonPartage {
	accroche_joueur: string
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

/** Les acteurs et le décor — la couche que le modèle lit pour raconter. */
export interface Monde {
	personnages: Entite[]
	lieux: Entite[]
	objets: Entite[]
	indices: Entite[]
	quetes: Entite[]
	/**
	 * Déclarée à l'itération 1, MISE EN FORME à l'itération 2 (§ 08 du plan de
	 * cible : les deux listes séparées par « lié à l'histoire », `monstre_ref`
	 * vers le bestiaire). Typée `unknown[]` plutôt qu'inventée : le contenu
	 * traverse l'import et l'export intact, sans qu'une forme non arbitrée soit
	 * figée dans un contrat que quinze features consommeront.
	 */
	evenements: unknown[]
	/**
	 * § 09 climat & conditions. Déclarée à l'itération 1, MISE EN FORME à
	 * l'itération 2 ; `conditions.climat[].effetsRegles` sera une liste de deltas
	 * typés (itération 4), jamais de la prose.
	 */
	conditions: Record<string, unknown>
}

/** Le point d'entrée de l'aventure : où l'on commence, et le texte qui ouvre la partie. */
export interface Depart {
	/** Référence vers `monde.lieux[].id`. Une référence pendante est BLOQUANTE. */
	lieu_id: string
	texte_ouverture_joueur: string
}

/**
 * Ce que le MOTEUR lit et que l'IA ne voit JAMAIS. C'est le groupement qui rend
 * le confinement de la charge utile prouvable par le compilateur en n° 10.
 */
export interface Charpente {
	depart: Depart
	jalons: Entite[]
	fins: Entite[]
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
