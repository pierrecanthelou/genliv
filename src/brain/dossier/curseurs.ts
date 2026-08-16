/**
 * LES SIX CURSEURS DE CARACTÈRE — le registre du bloc `caractere` d'une fiche de
 * personnage (itération 8 de la n° 4 `dossier-fiches`).
 *
 * ⚠ CE N'EST PAS UNE RÈGLE DU JEU, ET LE TEST QUI LE DÉCIDE EST ÉCRIT ICI
 * (KR-193) : si ce fichier disparaissait, un jet changerait-il de résultat ?
 * NON — seule une prose changerait. Conséquences, toutes trois volontaires :
 *  · AUCUNE section de `docs/REGLES-DU-JEU.md` ne porte ces valeurs, et il n'y en
 *    a donc aucune à citer. Ce registre est HORS de la doctrine « table dorée » —
 *    `src/brain/rules.golden.test.ts` ne l'épingle pas et ne doit pas l'épingler ;
 *  · il est HORS du périmètre du score de mutation (les quatre fichiers de
 *    `stryker.config.mjs`), qu'il ne fait donc pas jouer (KR-161) ;
 *  · son garde est un test KR-117 CLASSIQUE — exhaustivité des six clés, bornes
 *    nommées, appartenance des trois affinités (`curseurs.test.ts`).
 *
 * ⚠ ZÉRO IMPORT VERS `characteristics.ts` / `challenge.ts` / `combat.ts` /
 * `xp.ts`, ET C'EST UNE CLAUSE, PAS UNE COÏNCIDENCE (KR-193, vérifiée par un
 * test-grep sur la source de ce fichier). `affinite` est une UNION LOCALE de trois
 * littéraux, JAMAIS le type `Characteristic` : importer ce dernier lierait un
 * registre de présentation à la couche des règles, ferait entrer ce fichier dans
 * le rayon de tout travail sur les caractéristiques, et invaliderait la phrase
 * ci-dessus le jour où quelqu'un en déduirait qu'un curseur modifie un jet.
 *
 * LE JOUR OÙ CE FICHIER DEVIENDRA UNE RÈGLE — c'est-à-dire le jour où un code
 * calculera un modificateur NUMÉRIQUE depuis `affinite` — il migre vers
 * `characteristics.ts`, entre sous score de mutation et sous table dorée, et sa
 * valeur passe alors par `docs/REGLES-DU-JEU.md` d'abord (KR-130). Tant que ce
 * jour n'est pas venu, l'affinité est une COULEUR DE VOIX : elle dit de quel
 * registre le curseur relève, elle ne modifie aucun jet.
 */

/**
 * Les six curseurs, dans l'ordre d'affichage de la fiche. L'union est écrite en
 * toutes lettres et `CURSEURS` est un `Record` sur elle : une clé manquante comme
 * une clé de trop font échouer la compilation, jamais un `Partial<Record<…>>`
 * (KR-117).
 */
export type CurseurId = 'mefiance' | 'franchise' | 'courage' | 'cupidite' | 'loyaute' | 'verve'

/**
 * L'AFFINITÉ d'un curseur — de quelle caractéristique il emprunte le registre.
 *
 * UNION LOCALE DE TROIS LITTÉRAUX, jamais `Characteristic` : voir la clause « zéro
 * import » de l'en-tête. Les trois valeurs sont les codes que `CHARACTERISTICS`
 * porte de son côté, et `curseurs.test.ts` vérifie qu'elles y sont bien des clés —
 * c'est le TEST qui relie les deux registres, pas un import.
 */
export type AffiniteCurseur = 'CA' | 'IN' | 'IG'

export interface CurseurDescripteur {
	/** Le nom français du curseur, tel qu'il s'affiche. */
	label: string
	/** La GLOSE D'AUTEUR : ce que le curseur mesure, en une ligne. Aucun site de
	 *  rendu en itération 8 — le contrat de design ne rend que `label` et
	 *  `affinite` (§ 3 du plan) —, exactement comme `CharacteristicDescriptor.describe`
	 *  avant que la boutique d'XP ne l'affiche. Elle ne franchit JAMAIS le document :
	 *  c'est une chaîne de code, sans clé de schéma ni ligne d'audience. */
	describe: string
	/** DOCUMENTAIRE — la couleur de voix du curseur, jamais un modificateur. Aucun
	 *  code ne lit ce champ pour calculer quoi que ce soit ; il est rendu entre
	 *  parenthèses dans le libellé du `Stepper` et rien d'autre. */
	affinite: AffiniteCurseur
}

/**
 * LE REGISTRE — un seul `Record`, source unique du libellé, de la glose et de
 * l'affinité de chaque curseur (KR-117). Aucun consommateur ne re-liste les six
 * clés ni ne branche sur l'une d'elles.
 *
 * LE MAPPING CA / IN / IG EST TRANCHÉ AU CADRAGE DE LA FEATURE, pas ici et pas au
 * raffinage d'it8 (`specification.json`, `curseurs_registre` + KR-193) :
 * CA ← {courage, loyaute}, IN ← {mefiance, franchise}, IG ← {verve, cupidite}.
 *
 * L'ORDRE DES CLÉS EST L'ORDRE D'AFFICHAGE, et il n'est PAS regroupé par affinité
 * (proposition retirée par son autrice au raffinage) : la grille se balaie dans
 * l'ordre de `CURSEUR_VALUES`, de sorte que l'ordre du DOM et l'ordre visuel
 * coïncident et que la tabulation ne saute pas.
 */
export const CURSEURS: Record<CurseurId, CurseurDescripteur> = {
	mefiance: {
		label: 'Méfiance',
		describe: "Ce qu'il faut avant qu'il accorde sa confiance à un inconnu.",
		affinite: 'IN',
	},
	franchise: {
		label: 'Franchise',
		describe: "La distance entre ce qu'il pense et ce qu'il dit.",
		affinite: 'IN',
	},
	courage: {
		label: 'Courage',
		describe: "Ce qu'il affronte au lieu de reculer.",
		affinite: 'CA',
	},
	cupidite: {
		label: 'Cupidité',
		describe: "Ce qu'une offre d'argent obtient de lui.",
		affinite: 'IG',
	},
	loyaute: {
		label: 'Loyauté',
		describe: "Ce qu'il tient quand tenir parole lui coûte.",
		affinite: 'CA',
	},
	verve: {
		label: 'Verve',
		describe: "La place qu'il prend dans une conversation.",
		affinite: 'IG',
	},
}

/**
 * Les six identifiants, DÉRIVÉS du registre (KR-117) : une liste recopiée
 * divergerait en silence le jour où un septième curseur existerait. C'est cette
 * liste que balaient la grille de l'écran, les six lignes d'`ENUMERES_FERMES` et
 * les six lignes de `DESTINATION_DES_CHAMPS`.
 */
export const CURSEUR_VALUES = Object.keys(CURSEURS) as CurseurId[]

/**
 * Les bornes FERMÉES de l'échelle d'un curseur — constantes NOMMÉES, jamais un
 * nombre en dur au site de validation ni au `min`/`max` du `Stepper` (KR-165).
 *
 * Hors borne = BLOQUANT à l'import, même motif que les caractéristiques et que
 * l'intensité d'une relation : une échelle ouverte rendrait indéfini le libellé
 * dérivé que la n° 10 posera un jour (« très méfiant » pour un `8` — `open_question`
 * « libellés dérivés », propriétaire n° 10) autant que le seuil qu'un moteur y
 * lirait.
 *
 * ÉCHELLE NON SIGNÉE, contrairement à `INTENSITE_MIN`/`INTENSITE_MAX` : `0` est ici
 * une EXTRÉMITÉ (« aucune méfiance »), pas un point neutre entre deux contraires —
 * d'où l'absence de `prefix` signé sur le `Stepper` qui la règle.
 */
export const CURSEUR_MIN = 0
export const CURSEUR_MAX = 10

/**
 * LE NOMBRE MAXIMAL DE RÉPLIQUES TYPES de `caractere.parler` — une BORNE
 * D'INTERFACE, et cette qualification est le contrat, pas un détail.
 *
 * Elle vit ICI, avec le reste du bloc `caractere`, et NULLE PART dans
 * `validate.ts` : il n'existe aucune règle de cardinalité au schéma 1, et en
 * inventer une ferait d'un document déjà écrit un document refusé. L'écran cesse
 * d'offrir le bouton d'ajout à `PARLER_REPLIQUES` répliques ; un document importé
 * qui en porte davantage est ACCEPTÉ et rendu en entier — c'est l'assembleur n° 10
 * qui tronquera à l'injection, il n'échouera pas.
 *
 * Constante NOMMÉE quand même, et pour la raison exacte de KR-165 : une borne non
 * outillée n'existe pas, et c'est le budget de contexte du modèle qui en dépend.
 */
export const PARLER_REPLIQUES = 2

/**
 * Le bloc de curseurs SEMÉ À L'ÉCRITURE quand l'auteur règle le caractère d'un
 * personnage pour la première fois : les six clés au plancher, DÉRIVÉES du registre
 * (KR-117) — jamais six littéraux, qui divergeraient le jour où un septième curseur
 * existerait.
 *
 * ⚠ VALEUR D'ÉCRITURE, JAMAIS UN REPLI DE LECTURE — même doctrine que
 * `STATS_INITIALES` et `CONFIANCE_INITIALE_PORTE` : `curseurs ?? CURSEURS_INITIAUX`
 * est INTERDIT partout. Un bloc absent se LIT comme absent (« absent ≠ vide ») :
 * c'est un état calme, et l'écran rend son affordance de réglage plutôt qu'une
 * grille inventée. Un repli de lecture ferait passer un personnage que l'auteur n'a
 * jamais réglé pour un personnage sans courage, sans loyauté et sans verve — et le
 * narrateur du Temps 2 le jouerait ainsi.
 */
export const CURSEURS_INITIAUX: Record<CurseurId, number> = Object.fromEntries(
	CURSEUR_VALUES.map((curseur) => [curseur, CURSEUR_MIN]),
) as Record<CurseurId, number>
