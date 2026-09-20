import { MARQUEUR_A_ECRIRE } from './amorce'
import type { Dossier } from './types'

/**
 * L'ÉTAT DE SESSION — ce que la partie SAIT, et rien de ce que le dossier DIT.
 *
 * Ce module est l'adresse que `tourzero.ts` cite sans la connaître : « H6 NE
 * SPÉCIFIE AUCUN ÉTAT DE SESSION » y renvoie désormais ICI. Le document décrit
 * une aventure possible ; cette structure décrit UNE partie en cours. Les deux ne
 * se recopient jamais l'une l'autre — aucune copie gelée du dossier n'entre dans
 * la session, le lien est `dossier_id` et rien d'autre (seconde source de vérité,
 * KR-013).
 *
 * RÈGLE D'ADMISSION (KR-249) : un champ n'entre que si un chemin de code de la
 * feature l'ÉCRIT et un autre le LIT. Sinon, seule la CLÉ RACINE est réservée, à
 * `null`, avec son propriétaire nommé — et une clé non racine ne se réserve pas
 * du tout : un commentaire de propriétaire suffit, puisque KR-251 rend son ajout
 * futur optionnel à vie.
 *
 * TOUT CHAMP AJOUTÉ APRÈS CE LOT EST OPTIONNEL À VIE (KR-251) : `schema: 1` n'a
 * aucun chemin de migration, et la session est PERSISTÉE dès l'itération 1 — une
 * session écrite aujourd'hui doit rester lisible demain sans convertisseur.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * La version de la FORME DE SESSION, distincte de `DOSSIER_SCHEMA` : deux
 * documents, deux durées de vie. Elle ne monte pas en schéma 1 — KR-251 fait que
 * rien n'a jamais besoin de la faire monter.
 */
export const SCHEMA_SESSION = 1

/**
 * QUI PARLE dans le journal. Registre CLOS : `'ia'` n'y entre pas, la n° 9
 * n'émettant aucune ligne de modèle. La source est la DONNÉE — un troisième champ
 * (`est_verbatim`, `style`) qui redirait ce que `role` dit déjà serait KR-013.
 */
export type RoleJournal = 'joueur' | 'moteur'

/** Une ligne du journal de partie — un CONSTAT, jamais une entrée du rejeu (KR-248). */
export interface EntreeJournal {
	readonly tour: number
	readonly role: RoleJournal
	readonly texte: string
	// `deltas?` est AJOUTÉ EN it3, OPTIONNEL À VIE (KR-251). Ne pas le déclarer ici :
	// aucun chemin de code de cette itération ne l'écrit ni ne le lit.
}

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
 * LA TOTALITÉ EST LA PRÉCONDITION DE LA BIVALENCE d'it3 : six champs optionnels y
 * feraient six branches `undefined` sous un aiguillage qui doit LEVER, et « un
 * état bien formé décide les sept prédicats » cesserait d'être représentable.
 * L'unité d'admission de KR-249 est ici `monde`, PAS ses champs — exception
 * nommée, écrite pour être retrouvée.
 */
export interface EtatMonde {
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
	/** Y répond : `jalon_atteint`. */
	readonly jalons_atteints: readonly string[]
	/** Y répond : `evenement_consomme`. */
	readonly evenements_consommes: readonly string[]
	/**
	 * Y répond : `pnj_a_revele`. `{}` À L'OUVERTURE, jamais une entrée par
	 * `monde.personnages[]` : pré-semer serait une copie dérivée d'une collection du
	 * dossier (KR-013). La lecture se fait `pnj[p]?.a_dit.includes(i) ?? false` —
	 * CLÉ ABSENTE = ÉTAT LÉGAL, jamais un trou.
	 */
	readonly pnj: Readonly<Record<string, EtatPnj>>
}

/**
 * LA SESSION ENTIÈRE — huit clés racines, exhaustives par compilation pour la
 * table d'audience de `sessionDestinations.ts`.
 *
 * CE CONTRAT GÈLE L'ÉCRITURE, ET LA LECTURE N'APPARTIENT PAS À L'ITÉRATION 1.
 * Trois points, écrits ici plutôt que découverts par la n° 9 it2, qui les tranche :
 *  1. `useSessionPersistee` écrit AU MONTAGE, donc ouvrir un aperçu ÉCRASE la
 *     session persistée du dossier avant toute question. La reprise (it2) doit
 *     décider AVANT d'écrire, pas après ;
 *  2. `dossier_maj` existe pour que cette décision soit possible — voir son champ ;
 *  3. AUCUN `validerSession` n'existe encore. Le magasin est une frontière de
 *     confiance (KR-116, précédent `DossierService.get` qui revalide à chaque
 *     lecture), et l'évaluateur bivalent de la n° 9 it3 LÈVE sur une entrée non
 *     reconnue (KR-238) : la première itération qui RELIT une session doit la
 *     faire passer par un validateur, jamais par un `as EtatSession`.
 *
 * Trois clés que l'on ne trouvera pas ici, et leur propriétaire :
 *  · `attente` — n° 10 / n° 11, VARIANTE PAR VARIANTE avec son producteur. Une
 *    racine `attente: null` rendrait indistinguables « aucune attente » et
 *    « variante non supportée » ;
 *  · `heros`, `combat` — n° 11, composés dans `src/player/types.ts` ;
 *  · une copie du dossier — jamais : le gel est PAR RÉFÉRENCE (`dossier_id`).
 */
export interface EtatSession {
	readonly schema: typeof SCHEMA_SESSION
	/** La RÉFÉRENCE au dossier joué — jamais une copie de son contenu (KR-013). */
	readonly dossier_id: string
	/**
	 * L'ESTAMPILLE DU DOSSIER AU MOMENT OÙ LA PARTIE S'EST OUVERTE — `dossier.updatedAt`,
	 * recopié tel quel. SECONDE exemption nommée à la règle d'admission (KR-249),
	 * et exactement le même argument que `graine_alea` ci-dessous : elle ne se
	 * RÉTRO-AJOUTE pas. Le dossier est gelé PAR RÉFÉRENCE à l'ouverture, et l'auteur
	 * l'édite entre deux aperçus ; une session écrite sans estampille ne saurait
	 * JAMAIS que le dossier a bougé sous elle, et KR-251 rendrait le champ ajouté
	 * plus tard `optionnel à vie` — donc « session sans estampille » resterait un
	 * état légal pour toujours. Aucun code ne la lit avant la reprise (it2), qui
	 * refusera de reprendre une session dont l'estampille ne correspond plus.
	 * Ce n'est PAS un champ dérivable (KR-013) : `dossier.updatedAt` est la valeur
	 * D'AUJOURD'HUI, celle-ci est celle de L'OUVERTURE — deux instants, deux faits.
	 *
	 * TROIS CLAUSES POUR it2, écrites ici parce qu'elles coûtent trois lignes
	 * aujourd'hui et sont irréversibles plus tard :
	 *  1. On compare à `DossierService.get(dossier_id)?.updatedAt`, et « dossier
	 *     introuvable » est une issue DISTINCTE de « estampille périmée » — deux
	 *     causes, deux chemins, comme le refus `dossier_introuvable` déjà à l'écran.
	 *  2. ON NE RÉ-ESTAMPILLE JAMAIS EN PLACE. Le mode de panne le plus probable
	 *     d'it2 est de « réparer » la reprise en rafraîchissant ce champ sur une
	 *     session existante : ce serait blanchir une session périmée. **Seul
	 *     `ouvrirSession` écrit ce champ.**
	 *  3. La réconciliation cloud est un écrivain LÉGITIME d'`updatedAt` (adoption
	 *     d'une copie distante plus récente) : une session ouverte avant l'adoption
	 *     DOIT être vue périmée. Ce n'est pas un faux positif, c'est le cas d'usage.
	 *
	 * La source est comparable, et c'est mesuré : `DossierService.update` frappe
	 * `updatedAt` lui-même, aucun appelant ne peut l'antidater.
	 */
	readonly dossier_maj: string
	/**
	 * L'entropie de la partie, REQUISE et INJECTÉE. Écrite dès l'itération 1 bien
	 * qu'aucun code ne la lise avant la n° 11, et c'est l'unique exemption nommée à
	 * la règle d'admission (KR-249) : une graine ne se RÉTRO-AJOUTE pas — une
	 * session née ici et reprise sous la n° 11 devrait en inventer une en cours de
	 * partie, et la promesse de rejeu ne tiendrait jamais pour elle.
	 */
	readonly graine_alea: number
	/**
	 * `climat_actif` : propriétaire n° 14 (KR-207), NON DÉCLARÉ — clé non racine,
	 * hors de la réserve de KR-249, optionnelle à vie le jour venu (KR-251).
	 */
	readonly horloge: { readonly tour: number }
	readonly monde: EtatMonde
	readonly journal: readonly EntreeJournal[]
	/**
	 * CLÉ RACINE RÉSERVÉE, propriétaire n° 10 — typée `null` : la politique de
	 * mémoire à trois niveaux lui appartient, et aucun champ `memoire.*` n'est
	 * représentable avant elle.
	 */
	readonly memoire: null
}

/**
 * Registre CLOS des refus d'ouverture. Tout second membre nomme LA DONNÉE qu'il
 * lit ; un refus qui n'en nomme aucune est un refus qu'on ne saura pas lever.
 */
export type RefusOuverture = 'ouverture_a_ecrire'

/** Union DISCRIMINÉE — un appelant qui la rétrécit totalement n'a aucun bras muet. */
export type ResultatOuverture =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusOuverture }

/**
 * OUVRIR UNE PARTIE — PURE, totale, synchrone. Aucune persistance, aucune
 * horloge système, aucun tirage : `graine_alea` est REQUISE et INJECTÉE, jamais
 * un `Math.random()` ici (rejouabilité, KR-242).
 *
 * LE REFUS SUR LE MARQUEUR EST PLUS GROSSIER QUE `controles.ts`, JAMAIS PLUS FIN :
 * il teste UN champ — `charpente.depart.texte_ouverture_joueur` — et ne
 * réimplémente ni les quatre proses d'amorce, ni la classification
 * bloquant/alerte. Une règle, DEUX gardiens, et le second n'est pas un doublon :
 * `src/player/` est extrait SANS l'éditeur, donc sans `controlerDossier` ni CTA ;
 * sans ce refus, la surface extraite émettrait le marqueur VERBATIM à un vrai
 * joueur, sur l'un des deux seuls champs émis mot pour mot. La porte de l'éditeur
 * est ergonomique, ce refus-ci est une correction.
 *
 * `charpente.fins[].texte` encore marqué NE bloque PAS l'ouverture : il ne bloque
 * que l'atteinte de SA fin (KR-244).
 *
 * VALEURS À L'OUVERTURE, et l'une d'elles est une décision : `lieux_visites` vaut
 * `[charpente.depart.lieu_id]` et non `[]`. Un héros dans un lieu qu'il n'a jamais
 * visité est un état INCOHÉRENT, que l'évaluateur bivalent d'it3 rapporterait
 * fidèlement ; et l'ouverture DÉCRIT ce lieu verbatim, que `[]` ferait re-décrire
 * comme une découverte au passage suivant.
 */
export function ouvrirSession(dossier: Dossier, options: { graine_alea: number }): ResultatOuverture {
	if (dossier.charpente.depart.texte_ouverture_joueur.includes(MARQUEUR_A_ECRIRE)) {
		return { ok: false, refus: 'ouverture_a_ecrire' }
	}

	const depart = dossier.charpente.depart.lieu_id

	return {
		ok: true,
		session: {
			schema: SCHEMA_SESSION,
			dossier_id: dossier.id,
			dossier_maj: dossier.updatedAt,
			graine_alea: options.graine_alea,
			horloge: { tour: 0 },
			monde: {
				lieu_courant: depart,
				lieux_visites: [depart],
				objets_possedes: [],
				indices_connus: [],
				jalons_atteints: [],
				evenements_consommes: [],
				pnj: {},
			},
			journal: [],
			memoire: null,
		},
	}
}
