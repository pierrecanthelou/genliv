import type { FaitsDeSession } from './faits'
import { defineRegistre, estCleDe, type EspaceDeNoms } from './identifiers'

/**
 * LE REGISTRE DES PRÉDICATS — le vocabulaire FERMÉ des conditions du dossier.
 *
 * Règle d'admission, appliquée comme un RELEVÉ et non comme une conception : un
 * prédicat n'entre que si un champ NOMMÉ de l'état de session y répond, et si
 * TOUS ses arguments sont des identifiants stables. Chaque entrée porte donc en
 * commentaire le champ qui y répond — et, DEPUIS L'ITÉRATION 3 DE LA N° 9, la
 * LECTURE elle-même : `lit` est un champ du descripteur, et ce qui n'était qu'une
 * prose de correspondance est devenu le code qui l'exécute. La table de chemins
 * de session écartée à l'itération de format n'a pas été écrite pour autant : ce
 * sont des FONCTIONS, pas des chemins, et elles ont leur appelant (`evaluate.ts`).
 *
 * Écartés, motif à lever avant réouverture : `jet_reussi` / `carac_au_moins`
 * (un jet n'ÉVALUE pas, il ÉMET une demande qui change le tour ; un évaluateur
 * qui en contient lance le dé) · `quete_achevee` (aucun état de quête en
 * session) · `objectif_atteint` (circulaire : un objectif EST défini par son
 * `reussi_si_expr`) · `confiance_au_moins`, `tour_au_moins`, `etape_plan_au_moins`
 * (opérande ENTIER, reportés n° 9-12 ; leur retour est additif —
 * `refKinds: readonly (EspaceDeNoms | 'entier')[]` plus un champ au descripteur,
 * jamais un `switch`, KR-117) · `etat_heros(…)` (vocabulaire non fermé :
 * l'argument redeviendrait un nom libre) · `atteignable(lieu)` (calcul du linter
 * n° 7, pas une donnée du dossier).
 */
export interface PredicatDescripteur {
	/** Libellé français — la valeur du `Select` des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/**
	 * L'espace de noms attendu à CHAQUE position. L'ARITÉ est `refKinds.length`,
	 * DÉRIVÉE et jamais stockée (deux champs pour un seul nombre est la dérive que
	 * `CONFIANCES` a déjà refusée, KR-165).
	 *
	 * SCHÉMA 1 : slots de RÉFÉRENCE uniquement — tout espace listé ici a une ligne
	 * dans `COLLECTIONS_IDENTIFIEES`, propriété tenue par un test, et `bestiaire`
	 * n'en a pas : AUCUN prédicat ne peut désigner un monstre, donc aucun ne peut
	 * ouvrir un combat. Mécaniquement, pas par convention. Un opérande littéral
	 * gagnera un champ au DESCRIPTEUR, jamais un `switch` (KR-117).
	 */
	refKinds: readonly EspaceDeNoms[]
	/**
	 * CE QUE LE PRÉDICAT LIT DANS LES FAITS — un CHAMP du descripteur, jamais un
	 * aiguillage au site d'appel (KR-117) : l'évaluateur bivalent résout par
	 * `PREDICATES[p].lit`, de sorte qu'un huitième prédicat ne compile pas tant que
	 * personne n'a dit ce qu'il lit.
	 *
	 * ELLE NE LÈVE JAMAIS, quelles que soient les cibles reçues — c'est
	 * `evaluerExpr` qui lève, et sur l'OPÉRATEUR seul (KR-238). Une cible qui ne
	 * désigne aucune entité rend `false` : résoudre une référence est l'affaire du
	 * validateur (KR-225), jamais d'une lecture d'état.
	 */
	lit: (faits: FaitsDeSession, cibles: readonly string[]) => boolean
}

/**
 * La factory d'identité est PARTAGÉE depuis `identifiers.ts` (`defineRegistre`) :
 * la copie locale a été extraite au TROISIÈME appelant, comme cette docstring
 * l'avait elle-même annoncé. Elle épingle chaque valeur à `PredicatDescripteur`
 * tout en INFÉRANT l'union des clés, de sorte que `PredicatId` n'est pas une
 * seconde liste à tenir en phase (KR-117).
 */
export const PREDICATES = defineRegistre<PredicatDescripteur>()({
	/** Y répond : `monde.objets_possedes[]` (`faits.ts`) — SEUL inventaire de session ; celui de l'arbre est condamné. */
	possede_objet: {
		label: "possède l'objet",
		refKinds: ['objet'],
		lit: (faits, cibles) => faits.objets_possedes.includes(cibles[0]),
	},
	/** Y répond : `monde.indices_connus[]`, alimenté par la sortie R4 du protocole de révélation. */
	indice_connu: {
		label: "connaît l'indice",
		refKinds: ['indice'],
		lit: (faits, cibles) => faits.indices_connus.includes(cibles[0]),
	},
	/** Y répond : `monde.jalons_atteints[]` — la même liste que la projection de charpente. */
	jalon_atteint: {
		label: 'le jalon est atteint',
		refKinds: ['jalon'],
		lit: (faits, cibles) => faits.jalons_atteints.includes(cibles[0]),
	},
	/** Y répond : `monde.lieux_visites[]`. */
	lieu_visite: {
		label: 'le lieu a été visité',
		refKinds: ['lieu'],
		lit: (faits, cibles) => faits.lieux_visites.includes(cibles[0]),
	},
	/** Y répond : `monde.lieu_courant` — une valeur, pas une liste. */
	lieu_courant_est: {
		label: 'se trouve dans le lieu',
		refKinds: ['lieu'],
		lit: (faits, cibles) => faits.lieu_courant === cibles[0],
	},
	/** Y répond : `monde.evenements_consommes[]`. */
	evenement_consomme: {
		label: "l'événement a déjà eu lieu",
		refKinds: ['evenement'],
		lit: (faits, cibles) => faits.evenements_consommes.includes(cibles[0]),
	},
	/**
	 * Y répond : `monde.pnj.<id>.a_dit[]`. SEUL prédicat d'arité 2 du schéma 1, et
	 * il est délibéré : sans lui, la dérivation `refKinds.length` et le
	 * `TargetPicker` par position resteraient des théories jamais exercées.
	 *
	 * SEULE LECTURE INDEXÉE DU REGISTRE DES FAITS, donc la seule qui passe par une
	 * APPARTENANCE PROPRE : `faits.pnj['toString']` rend une FONCTION, dont `.a_dit`
	 * vaut `undefined` et dont `.includes` lèverait — un prédicat qui doit ne jamais
	 * lever ne s'indexe pas nu (KR-175, BUG-053).
	 */
	pnj_a_revele: {
		label: "le personnage a déjà révélé l'indice",
		refKinds: ['pnj', 'indice'],
		lit: (faits, cibles) => estCleDe(faits.pnj, cibles[0]) && faits.pnj[cibles[0]].a_dit.includes(cibles[1]),
	},
})

/** L'union des identifiants de prédicat, DÉRIVÉE du registre — jamais re-listée. */
export type PredicatId = keyof typeof PREDICATES
