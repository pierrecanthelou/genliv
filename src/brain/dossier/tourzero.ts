import type { ExprNode } from './expr'
import { PREDICATES, type PredicatId } from './predicates'
import type { Dossier } from './types'

/**
 * HYPOTHÈSE DATÉE DE L'ÉTAT D'OUVERTURE — 2026-09-17, itération 10 de la n° 7.
 *
 * DOMICILE : ICI, dans le seul fichier qui l'utilise — même règle que H1–H5
 * d'`atteignabilite.ts`, écrites « dans le fichier qui les utilise, et nulle part
 * ailleurs ». H6 n'est PAS une hypothèse d'atteignabilité : ce module répond à
 * l'AUTRE question, et les deux blocs se citent sans jamais se recopier.
 *
 * LES DEUX QUESTIONS, ET CE MODULE NE POSE QUE LA SECONDE.
 * `atteignabilite.ts` décide « ce fait peut-il un JOUR être établi ? ».
 * Ce module décide « ce fait est-il DÉJÀ établi AVANT la première action du
 * joueur ? ». La seconde a besoin d'un ÉTAT ; un document n'en porte pas. H6 dit
 * lequel — et surtout ce qu'elle REFUSE d'en dire.
 *
 * CE QUE LE DOCUMENT DÉTERMINE — UN SEUL FAIT. `monde.lieu_courant` vaut
 * `charpente.depart.lieu_id` : le seul champ de session qu'un champ du document
 * écrive, et `predicates.ts` le nomme — « une VALEUR, pas une liste ».
 * Conséquence, exactement l'inverse de ce qu'un évaluateur naïf dirait :
 * `lieu_courant_est(<départ>)` est VRAI au tour zéro, donc `non(...)` est FAUX.
 * ET SI LE DÉPART N'EST PAS POSÉ — `charpente.depart.lieu_id` vide ou ne résolvant
 * aucun `monde.lieux[].id` — la cellule rend `indecidable` : un départ non posé ne
 * détermine pas davantage OÙ le héros n'est PAS.
 *
 * CE QUE H6 SUPPOSE, ET QUE LE DOCUMENT N'ÉCRIT PAS — AUCUN DELTA N'EST APPLIQUÉ
 * AVANT LA PREMIÈRE ACTION DU JOUEUR. C'est cela, et cela seul, qui rend
 * `possede_objet`, `indice_connu` et `pnj_a_revele` certains-FAUX à l'ouverture.
 * DEUX canaux la mettraient en défaut, nommés pour être retrouvés le jour venu :
 * un `effet[]` de JALON — il part au déclenchement, sans scène jouée — et une
 * résolution d'ÉVÉNEMENT appliquée avant le premier tour. Pour l'inventaire, c'est
 * H5 d'`atteignabilite.ts` : NON RECOPIÉE ICI, CITÉE — trois lignes en dépendent
 * désormais, dans DEUX fichiers (KR-227).
 *
 * CE QUE H6 REFUSE DE DIRE. `lieu_visite`, `jalon_atteint` et `evenement_consomme`
 * restent `indecidable`, parce que deux décisions que la n° 9 n'a PAS prises les
 * gouvernent : (i) le moteur résout-il les `declencheur_expr` AVANT la première
 * action ? (ii) le lieu de départ compte-t-il comme VISITÉ ?
 * `evenement_consomme` est `indecidable` POUR UN CONTRE-EXEMPLE ÉCRIT, pas par
 * prudence : `dossier-minimal.json` déclenche `evenement.embuscade-du-fanal` sur
 * `lieu_courant_est('lieu.val-cendre')`, qui EST son lieu de départ — et le
 * sous-arbre `non(evenement_consomme(...))` est déjà écrit dans le champ VOISIN du
 * même objectif (`reussi_si_expr`). UNE CELLULE DONT LE CONTRE-EXEMPLE EST AU
 * DÉPÔT N'EST PAS UNE HYPOTHÈSE : C'EST UNE ERREUR.
 *
 * SENS D'ERREUR SI ELLE EST FAUSSE — la règle ne tire que sur le CERTAIN-VRAI et
 * `indecidable` ne tire pas : elle ne peut que SOUS-tirer — faux négatif —, SAUF
 * par le canal « aucun delta avant la première action », dont l'erreur va dans le
 * sens INTERDIT. Ce canal-là se corrige en UN endroit, la table
 * `VALEUR_AU_TOUR_ZERO` ci-dessous, et c'est contre LUI que le niveau du constat
 * se choisit.
 *
 * NE PAS CONFONDRE AVEC `ETABLISSEMENT` (`atteignabilite.ts`) : `lieu_courant_est`
 * y vaut `true` par IGNORANCE, ici `'vrai'` par DÉTERMINATION. Deux tables, deux
 * questions ; elles ne fusionnent pas.
 *
 * CE QU'ELLE N'EST PAS : H6 NE SPÉCIFIE AUCUN ÉTAT DE SESSION. La mémoire de
 * session appartient à la n° 9 ; ce module dit seulement ce que le DOCUMENT en
 * détermine. La discipline tient en une phrase : TOUTE CELLULE `vrai`/`faux` NOMME
 * soit le champ du document qui la détermine, soit la clause de H6 qui la suppose ;
 * sans l'un des deux, la cellule vaut `indecidable`.
 */

/**
 * LA FEUILLE qui rend une condition vraie au tour zéro — ce que son appelant
 * RACONTE, et rien de plus. Aucun identifiant de prédicat n'en sort : le libellé
 * français est résolu ICI, par le module voisin du registre des conditions, de
 * sorte que `controles.ts` reste tenu à distance d'`ExprNode` et de `PREDICATES`
 * (couture d'it6).
 */
export interface FeuilleVraieAuTourZero {
	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
	readonly predicat: string
	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
	readonly cibles: readonly string[]
	/** La feuille est sous un nombre IMPAIR de `non` : le fait établi est son ABSENCE. */
	readonly nie: boolean
}

/**
 * TROIS VALEURS, ET LA TROISIÈME EST LE LIVRABLE. Sous une logique à deux
 * valeurs, une cellule « supposée fausse » devient « assertée vraie » dès qu'un
 * `non` la traverse — c'est-à-dire un FAUX POSITIF, la seule direction d'erreur
 * que cette règle s'interdise. PRIVÉ au module : zéro lecteur dehors, et un type
 * exporté à un seul appelant est une dette, pas un contrat.
 */
type Trivalent = 'vrai' | 'faux' | 'indecidable'

/**
 * CE QUE VAUT CHAQUE PRÉDICAT AVANT LA PREMIÈRE ACTION DU JOUEUR — une ligne par
 * identifiant de `PREDICATES`, `Record` TOTAL donc exhaustif PAR COMPILATION
 * (KR-117) : un huitième prédicat ne compile pas tant que personne n'a décidé ce
 * qu'il vaut à l'ouverture.
 *
 * LA DISCIPLINE QUI GOUVERNE CETTE TABLE, et qu'un relecteur futur doit pouvoir
 * appliquer seul : TOUTE CELLULE `vrai`/`faux` NOMME soit le champ du document qui
 * la détermine, soit la clause de H6 qui la suppose ; sans l'un des deux, la
 * cellule vaut `indecidable`. Les trois `indecidable` ci-dessous ne sont donc pas
 * de la prudence : ce sont les trois endroits où le document ne dit RIEN, et où
 * écrire une valeur reviendrait à décider à la place de la n° 9.
 *
 * UN SEUL CHAMP DU DOSSIER EST LU DANS TOUTE CETTE TABLE :
 * `charpente.depart.lieu_id`, plus la collection de lieux qui le résout.
 */
const VALEUR_AU_TOUR_ZERO: Record<PredicatId, (dossier: Dossier, cibles: readonly string[]) => Trivalent> = {
	/**
	 * LE SEUL CHAMP DU DOCUMENT QUI ÉCRIVE UN FAIT DE SESSION, et la ligne qui
	 * interdit le faux positif : sans elle, `non(lieu_courant_est(<départ>))`
	 * deviendrait certain-vrai sur tout dossier, alors qu'il est certain-FAUX.
	 *
	 * TROIS BRAS ET NON DEUX. Un départ NON POSÉ — champ vide, ou référence qui ne
	 * résout aucun `monde.lieux[].id` — ne détermine pas davantage OÙ le héros
	 * n'est PAS : la cellule rend `indecidable`, jamais `'faux'`.
	 */
	lieu_courant_est: (dossier, cibles) => {
		const depart = dossier.charpente.depart.lieu_id
		if (depart === '' || !dossier.monde.lieux.some((lieu) => lieu.id === depart)) return 'indecidable'
		return cibles[0] === depart ? 'vrai' : 'faux'
	},
	/**
	 * H6, clause « aucun delta avant la première action », PLUS H5
	 * d'`atteignabilite.ts` — CITÉE, jamais recopiée : `donner_objet` est le seul
	 * écrivain d'inventaire, `Depart` n'en porte aucun, et le narrateur n'y touche
	 * jamais. TROISIÈME LIGNE DE KR-227, et la seule des trois qui ne LISE rien :
	 * elle constate un inventaire vide. C'est LE SEUL CANAL DE FAUX POSITIF de la
	 * règle, et c'est contre lui que son niveau se choisit.
	 */
	possede_objet: () => 'faux',
	/** H6, même clause : `monde.indices_connus[]` part vide. Aucun contre-exemple au dépôt. */
	indice_connu: () => 'faux',
	/**
	 * H3 d'`atteignabilite.ts`, CITÉE : l'unique producteur de `monde.pnj.<id>.a_dit[]`
	 * est un savoir livré en dialogue — c'est-à-dire une scène JOUÉE, qui n'a pas eu
	 * lieu au tour zéro.
	 */
	pnj_a_revele: () => 'faux',
	/**
	 * AUCUN CHAMP, ET UN CONTRE-EXEMPLE ÉCRIT AU DÉPÔT — voir H6. Une cellule dont
	 * le contre-exemple vit dans `__fixtures__` n'est pas une hypothèse : c'est une
	 * erreur. Coût de la prudence : nul, `ou('indecidable', 'faux')` se tait
	 * exactement comme `ou('faux', 'faux')`.
	 */
	evenement_consomme: () => 'indecidable',
	/**
	 * AUCUN CHAMP — deux écrivains, dont un `declencheur_expr` que la n° 9 pourrait
	 * résoudre avant le premier tour.
	 */
	jalon_atteint: () => 'indecidable',
	/** AUCUN CHAMP — le statut du lieu de DÉPART n'est tranché nulle part. */
	lieu_visite: () => 'indecidable',
}

/**
 * LE VERDICT D'UN NŒUD, et la feuille sur laquelle il REPOSE — UNE seule règle
 * d'ordre, écrite une fois et valable aux quatre opérateurs : la feuille est celle
 * du PREMIER enfant qui décide, et celle du premier enfant à défaut. Un rapport de
 * linter se rejoue comme une session ; le témoin désigné ne dépend jamais de
 * l'ordre dans lequel on a parcouru l'arbre.
 *
 * LE TÉMOIN NE DOUBLE PAS LA VALEUR, et cette indépendance est la propriété qui
 * compte : `valeur` est le SEUL décideur — `premiereFeuilleVraieAuTourZero` tire
 * sur elle, et sur elle seule. Effacer le témoin en même temps que l'indécidable
 * ferait des deux champs deux écritures du MÊME fait, et cette redondance-là
 * MASQUERAIT une faute de la table de Kleene au lieu de la révéler : un `non`
 * cassé rendrait `'vrai'` sans témoin, donc se tairait quand même. Mesuré sur ce
 * fichier avant d'être corrigé — l'implémentation fautive nommée au plan y
 * SURVIVAIT, verte.
 *
 * `temoin` ne vaut `null` que sur un connecteur SANS enfant, forme qu'un arbre
 * accepté par `validateExpr` ne porte jamais (`ENFANTS_MIN`), et qui se tait.
 */
interface Verdict {
	readonly valeur: Trivalent
	readonly temoin: FeuilleVraieAuTourZero | null
}

/**
 * LE `non` DE KLEENE, ÉCRIT UNE FOIS — V↔F, et l'indécis reste indécis. `Record`
 * TOTAL sur les trois valeurs (KR-117) : une quatrième ne compile pas, et jamais
 * une cascade de comparaisons au site d'appel.
 */
const NON_DE_KLEENE: Record<Trivalent, Trivalent> = { vrai: 'faux', faux: 'vrai', indecidable: 'indecidable' }

/**
 * L'EXHAUSTIVITÉ DU PARCOURS, PORTÉE PAR LE COMPILATEUR — et c'est la CONDITION
 * à laquelle ce module est admis comme TROISIÈME lecteur d'`ExprNode`
 * (`expr.test.ts`, garde de couture). UN SEUL aiguillage dans ce fichier, donc
 * UNE SEULE fermeture : un cinquième opérateur ajouté à l'union casse `tsc` à CET
 * APPEL, et nulle part ailleurs.
 *
 * ELLE REND `Verdict`, ET SURTOUT PAS `never` EN POSITION DE RETOUR : la garde
 * compte les fermetures par un motif qui apparie le deux-points suivi du mot,
 * si bien qu'un RETOUR ainsi typé produirait DEUX appariements pour UNE seule
 * fermeture et fausserait le compte qu'elle tient — un marqueur parasite masque
 * un aiguillage non fermé. Elle rend l'INDÉCIDABLE SANS TÉMOIN, jamais le nœud :
 * si un document forçait un jour cette branche malgré le type, l'indécidable ne
 * tire pas — le sens d'erreur permis.
 */
function jamaisEvalue(_operateur: never): Verdict {
	return { valeur: 'indecidable', temoin: null }
}

/**
 * LA TRAVERSÉE DE KLEENE — UN CAS PAR OPÉRATEUR, et pas un de plus.
 *
 * `non` V↔F, `?` → `?` · `et` FAUX si un enfant est faux, VRAI si tous le sont,
 * `?` sinon · `ou` VRAI si un enfant est vrai, FAUX si tous le sont, `?` sinon.
 *
 * `nie` DESCEND et BASCULE à chaque `non` traversé ; il est POSÉ À LA FEUILLE, et
 * nulle part ailleurs — c'est lui, et lui seul, qui permet au message d'affirmer
 * la valeur de vérité À CÔTÉ d'un libellé resté positif.
 */
function verdictAuTourZero(dossier: Dossier, noeud: ExprNode, nie: boolean): Verdict {
	switch (noeud.op) {
		// `predicat` → la table du tour zéro, et rien d'autre. Le témoin est la feuille
		// elle-même, munie de la polarité accumulée jusqu'ici — QUELLE QUE SOIT sa
		// valeur : c'est ce qui garde le témoin indépendant du verdict.
		case 'predicat':
			return {
				valeur: VALEUR_AU_TOUR_ZERO[noeud.predicat](dossier, noeud.cibles),
				temoin: { predicat: PREDICATES[noeud.predicat].label, cibles: noeud.cibles, nie },
			}

		// `non` → IL DESCEND, et c'est ce qui sépare ce module d'`atteignabilite.ts`,
		// dont le `non` rend `null` sans descendre. La SATISFIABILITÉ d'une feuille ne
		// se renverse pas ; sa VALEUR au tour zéro, si. Le témoin est celui de
		// l'enfant : sous `non(P)` avec `P` certain-faux, le fait établi est l'ABSENCE
		// de `P`, et c'est `nie` qui le dit.
		case 'non': {
			const enfant = verdictAuTourZero(dossier, noeud.enfant, !nie)
			return { valeur: NON_DE_KLEENE[enfant.valeur], temoin: enfant.temoin }
		}

		// `et` → FAUX dès qu'un enfant l'est, VRAI quand tous le sont, `?` sinon. Le
		// témoin est celui du premier enfant FAUX, celui du premier enfant à défaut.
		case 'et': {
			let temoin: FeuilleVraieAuTourZero | null = null
			let valeur: Trivalent = 'vrai'
			for (const [rang, enfant] of noeud.enfants.entries()) {
				const verdict = verdictAuTourZero(dossier, enfant, nie)
				if (rang === 0) temoin = verdict.temoin
				if (verdict.valeur === 'faux') return { valeur: 'faux', temoin: verdict.temoin }
				if (verdict.valeur === 'indecidable') valeur = 'indecidable'
			}
			return { valeur, temoin }
		}

		// `ou` → VRAI dès qu'un enfant l'est, FAUX quand tous le sont, `?` sinon. Un `ou`
		// est écrit exactement pour offrir un second chemin, et `ou('indecidable',
		// 'faux')` se tait donc comme `ou('faux', 'faux')` — c'est le coût NUL de la
		// cellule `evenement_consomme` laissée indécidable.
		case 'ou': {
			let temoin: FeuilleVraieAuTourZero | null = null
			let valeur: Trivalent = 'faux'
			for (const [rang, enfant] of noeud.enfants.entries()) {
				const verdict = verdictAuTourZero(dossier, enfant, nie)
				if (rang === 0) temoin = verdict.temoin
				if (verdict.valeur === 'vrai') return { valeur: 'vrai', temoin: verdict.temoin }
				if (verdict.valeur === 'indecidable') valeur = 'indecidable'
			}
			return { valeur, temoin }
		}

		// L'UNION EST CLOSE, et c'est le compilateur qui le dit.
		default:
			return jamaisEvalue(noeud)
	}
}

/**
 * LA FEUILLE QUI REND LA CONDITION VRAIE AU TOUR ZÉRO — `null` quand la condition
 * est FAUSSE ou INDÉCIDABLE. La règle ne tire que sur le certain-vrai : les deux
 * autres verdicts se taisent, et se taisent de la même façon.
 *
 * VALUATION, PAS SATISFIABILITÉ — `atteignabilite.ts` décide « ce fait peut-il un
 * JOUR être établi ? », celle-ci « l'est-il DÉJÀ, avant la première action ? ».
 * Zéro import entre les deux modules, dans les deux sens : rien n'est partagé que
 * `ExprNode` et `PREDICATES`, deux contrats publics.
 *
 * PURE ET TOTALE sur un arbre accepté par `validateExpr` ; AUCUNE borne de
 * récursion propre — c'est `PROFONDEUR_MAX_EXPR` chez le validateur qui la lui
 * garantit (KR-169 : l'absolu est qualifié à dessein).
 *
 * ELLE NE RÉSOUT AUCUNE RÉFÉRENCE : une cible qui ne désigne aucune entité du
 * dossier n'est pas son affaire — c'est une anomalie du validateur (KR-225), et
 * son appelant s'en tait.
 *
 * AUCUNE MÉMOÏSATION, AUCUN CACHE (KR-013/113) : elle se recalcule à chaque
 * appel, comme le rapport qui la consomme.
 */
export function premiereFeuilleVraieAuTourZero(dossier: Dossier, condition: ExprNode): FeuilleVraieAuTourZero | null {
	const verdict = verdictAuTourZero(dossier, condition, false)
	return verdict.valeur === 'vrai' ? verdict.temoin : null
}
