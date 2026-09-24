/**
 * LES FAITS D'UNE PARTIE — ce que la session SAIT, sous la forme que les deux
 * registres frères peuvent nommer sans se dépendre.
 *
 * AUCUN IMPORT, ET C'EST TOUTE SA RAISON D'ÊTRE. `predicates.ts` (qui LIT ces
 * faits) et `deltas.ts` (qui les ÉCRIT) sont deux registres frères dont
 * `deltas.test.ts` interdit qu'ils s'importent l'un l'autre ; et `session.ts`, où
 * ce corps vivait, importe déjà `commandes.ts` en type — le loger là ferait
 * remonter tout le moteur dans deux registres qui doivent rester des feuilles de
 * l'arbre de dépendances. Un module sans import est le seul domicile possible.
 *
 * CORPS DÉPLACÉ depuis `EtatMonde` (`session.ts`, itération 1), JAMAIS RECOPIÉ :
 * `session.ts` le RÉ-EXPORTE sous son nom historique, de sorte que `EtatMonde` et
 * `FaitsDeSession` sont le MÊME type et non deux qui se ressemblent. Deux
 * déclarations se seraient tues le jour où l'une aurait bougé.
 *
 * MODULE PUR : il part avec `src/player/` le jour de l'extraction
 * (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * Ce que la partie sait d'UN personnage. `a_dit` est le SEUL champ, et c'est
 * mesuré : `pnj_a_revele` répond à `monde.pnj.<id>.a_dit[]` et à rien d'autre.
 *
 * `sait` est REFUSÉ, ni comme champ ni comme clé réservée (KR-253) : aucun
 * prédicat ne le lit, aucun delta ne peut l'écrire, et le savoir d'un personnage
 * est entièrement déterminé par `monde.personnages[].savoirs[]` du dossier, en
 * lecture seule pendant la partie. Le réserver légitimerait un dérivé stocké.
 *
 * `confiance` : propriétaire n° 12, NON DÉCLARÉE — ce n'est pas une clé RACINE,
 * donc KR-249 ne la réserve pas, et KR-251 la rendra optionnelle à vie le jour
 * venu. La réserver ici l'écrirait sur CHAQUE entrée, à jamais.
 */
export interface EtatPnj {
	readonly a_dit: readonly string[]
}

/**
 * SEPT CHAMPS, TOUS REQUIS — un par prédicat de `PREDICATES`, dans l'ordre du
 * registre, et chacun nommé par la docstring de son prédicat.
 *
 * LA TOTALITÉ EST LA PRÉCONDITION DE LA BIVALENCE (KR-254) : six champs
 * optionnels y feraient six branches `undefined` sous un aiguillage qui doit
 * LEVER (KR-238), et « un état bien formé décide les sept prédicats » cesserait
 * d'être représentable. L'unité d'admission de KR-249 est ici `monde`, PAS ses
 * champs — exception nommée, écrite pour être retrouvée.
 */
export interface FaitsDeSession {
	/**
	 * Y répond : `lieu_courant_est`. `string`, JAMAIS `string | null` — un nullable
	 * serait une seconde représentation de « partie non ouverte », que la porte
	 * `jouable` interdit déjà : état illégal représentable.
	 */
	readonly lieu_courant: string
	/** Y répond : `lieu_visite`. */
	readonly lieux_visites: readonly string[]
	/**
	 * Y répond : `possede_objet`. LE SEUL INVENTAIRE DE SESSION.
	 * `SessionEquipmentState.inventory` (`src/player/types.ts`) est l'inventaire de
	 * la session d'ARBRE, orphelin à l'itération 4 : l'itération qui compose un
	 * héros (n° 11) se repointe ICI et n'en redéclare pas un second.
	 */
	readonly objets_possedes: readonly string[]
	/** Y répond : `indice_connu`. */
	readonly indices_connus: readonly string[]
	/** Y répond : `jalon_atteint`. UN SEUL ÉCRIVAIN : `DELTAS.atteindre_jalon.ecrit`. */
	readonly jalons_atteints: readonly string[]
	/** Y répond : `evenement_consomme`. */
	readonly evenements_consommes: readonly string[]
	/**
	 * Y répond : `pnj_a_revele`. `{}` À L'OUVERTURE, jamais une entrée par
	 * `monde.personnages[]` : pré-semer serait une copie dérivée d'une collection du
	 * dossier (KR-013). CLÉ ABSENTE = ÉTAT LÉGAL, jamais un trou — et la lecture
	 * passe par une appartenance PROPRE, jamais par une indexation nue : tout
	 * littéral d'objet hérite d'`Object.prototype` (KR-175, BUG-053).
	 */
	readonly pnj: Readonly<Record<string, EtatPnj>>
}
