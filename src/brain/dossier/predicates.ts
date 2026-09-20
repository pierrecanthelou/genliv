import { defineRegistre, type EspaceDeNoms } from './identifiers'

/**
 * LE REGISTRE DES PRÉDICATS — le vocabulaire FERMÉ des conditions du dossier.
 *
 * Règle d'admission, appliquée comme un RELEVÉ et non comme une conception : un
 * prédicat n'entre que si un champ NOMMÉ de l'état de session y répond, et si
 * TOUS ses arguments sont des identifiants stables. Chaque entrée porte donc en
 * commentaire le champ qui y répond — en prose, jamais en table : une table de
 * chemins de session n'aurait aucun lecteur avant la n° 9, et une table sans
 * lecteur est la dette qu'on reprocherait à quelqu'un d'autre.
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
}

/**
 * La factory d'identité est PARTAGÉE depuis `identifiers.ts` (`defineRegistre`) :
 * la copie locale a été extraite au TROISIÈME appelant, comme cette docstring
 * l'avait elle-même annoncé. Elle épingle chaque valeur à `PredicatDescripteur`
 * tout en INFÉRANT l'union des clés, de sorte que `PredicatId` n'est pas une
 * seconde liste à tenir en phase (KR-117).
 */
export const PREDICATES = defineRegistre<PredicatDescripteur>()({
	/** Y répond : `monde.objets_possedes[]` (`session.ts`) — SEUL inventaire de session ; celui de l'arbre est condamné. */
	possede_objet: { label: "possède l'objet", refKinds: ['objet'] },
	/** Y répond : `monde.indices_connus[]`, alimenté par la sortie R4 du protocole de révélation. */
	indice_connu: { label: "connaît l'indice", refKinds: ['indice'] },
	/** Y répond : `monde.jalons_atteints[]` — la même liste que la projection de charpente. */
	jalon_atteint: { label: 'le jalon est atteint', refKinds: ['jalon'] },
	/** Y répond : `monde.lieux_visites[]`. */
	lieu_visite: { label: 'le lieu a été visité', refKinds: ['lieu'] },
	/** Y répond : `monde.lieu_courant` — une valeur, pas une liste. */
	lieu_courant_est: { label: 'se trouve dans le lieu', refKinds: ['lieu'] },
	/** Y répond : `monde.evenements_consommes[]`. */
	evenement_consomme: { label: "l'événement a déjà eu lieu", refKinds: ['evenement'] },
	/**
	 * Y répond : `monde.pnj.<id>.a_dit[]`. SEUL prédicat d'arité 2 du schéma 1, et
	 * il est délibéré : sans lui, la dérivation `refKinds.length` et le
	 * `TargetPicker` par position resteraient des théories jamais exercées.
	 */
	pnj_a_revele: { label: "le personnage a déjà révélé l'indice", refKinds: ['pnj', 'indice'] },
})

/** L'union des identifiants de prédicat, DÉRIVÉE du registre — jamais re-listée. */
export type PredicatId = keyof typeof PREDICATES
