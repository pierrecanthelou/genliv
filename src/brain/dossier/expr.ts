import type { DossierIssue, DossierIssueCode } from './issues'
import {
	ESPACES_DE_NOMS,
	decrireValeur,
	estCleDe,
	estIdentifiantBienForme,
	estObjet,
	feuilleDe,
	type EspaceDeNoms,
} from './identifiers'
import { PREDICATES, type PredicatId } from './predicates'

/**
 * LES CONDITIONS DU DOSSIER — la forme persistée de tout `…_expr`, et les deux
 * seules fonctions qui la lisent.
 *
 * `…_expr` est un ARBRE JSON, et il n'existe AUCUN PARSEUR (KR-168) : pas de
 * `parseExpr`, sous quelque nom que ce soit. Un parseur réintroduirait une
 * seconde source de vérité de la condition, une grammaire à spécifier, versionner
 * et tester, toute la classe des erreurs de syntaxe, et la question de la syntaxe
 * montrée à l'auteur — que `PREDICATES` résout en pilotant le rendu par widgets
 * (`label` → `Select`, `refKinds` → `TargetPicker`). L'auteur ne saisit jamais
 * d'expression.
 *
 * Ce module ne connaît PAS `types.ts` : c'est `types.ts` qui importe `ExprNode`,
 * jamais l'inverse. L'ordre des modules est acyclique et voulu — `identifiers` →
 * `issues` → `predicates` → `expr` → `types` → `tables` → `validate`.
 */

/**
 * Borne de récursion — un fichier écrit à la main ne fait pas sauter la pile d'un
 * validateur qui se promet TOTAL. Constante NOMMÉE, jamais un nombre en dur au
 * site de validation ; testée à la borne et à borne+1 (KR-165).
 *
 * La profondeur se compte en NIVEAUX DE NŒUDS : un prédicat nu est de profondeur
 * 1, un `non` qui l'enveloppe de profondeur 2.
 */
export const PROFONDEUR_MAX_EXPR = 8

/**
 * ExprNode — quatre opérateurs français, union exhaustivement vérifiée par le
 * compilateur (KR-117), jamais un registre : KR-117 porte sur les identifiants de
 * prédicat, pas sur une union close de quatre littéraux. `cibles` reste un
 * TABLEAU même à l'arité 1 partout en schéma 1 : un prédicat à deux cibles ne
 * cassera pas le type le jour où il entre.
 *
 * Exemple : { op: 'et', enfants: [
 *   { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] },
 *   { op: 'non', enfant: { op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.val-cendre'] } } ] }
 */
export type ExprNode =
	| { op: 'et' | 'ou'; enfants: ExprNode[] }
	| { op: 'non'; enfant: ExprNode }
	| { op: 'predicat'; predicat: PredicatId; cibles: string[] }

/**
 * Le champ PORTEUR de l'expression — le `path` et le `location` de toute anomalie
 * produite par l'arbre. Le chemin NE DESCEND PAS dans l'arbre : le seul
 * consommateur déclaré (le badge de section, n° 7) ne sait pas badger un
 * sous-nœud, et `feuilleDe(path)` doit rendre la clé que l'auteur cherchera dans
 * son fichier.
 */
export interface SiteExpr {
	path: string
	location: string
}

/** Les clés reconnues par opérateur — toute autre est bloquante (voir `validateExpr`). */
const CLES_PAR_OPERATEUR = {
	et: ['op', 'enfants'],
	ou: ['op', 'enfants'],
	non: ['op', 'enfant'],
	predicat: ['op', 'predicat', 'cibles'],
} as const

type Operateur = keyof typeof CLES_PAR_OPERATEUR

const OPERATEURS = Object.keys(CLES_PAR_OPERATEUR) as Operateur[]

/** Le nombre minimal d'enfants d'un `et` ou d'un `ou`. */
const ENFANTS_MIN = 2

/** « et, ou, non ou predicat » — la liste des opérateurs, DÉRIVÉE du registre de clés. */
function enumererOperateurs(): string {
	return `${OPERATEURS.slice(0, -1).join(', ')} ou ${OPERATEURS[OPERATEURS.length - 1]}`
}

function anomalieExpr(code: DossierIssueCode, message: string, site: SiteExpr, entityId?: string): DossierIssue {
	const base = { code, severity: 'error' as const, message, location: site.location, path: site.path }
	return entityId === undefined ? base : { ...base, entityId }
}

/** Le nombre d'éléments d'une valeur qui devrait être une liste ; 0 sinon. */
function cardinal(valeur: unknown): number {
	return Array.isArray(valeur) ? valeur.length : 0
}

function visiter(noeud: unknown, site: SiteExpr, profondeur: number, issues: DossierIssue[]): void {
	if (profondeur > PROFONDEUR_MAX_EXPR) {
		issues.push(
			anomalieExpr(
				'expr-malformee',
				`Le champ « ${feuilleDe(site.path)} » imbrique les conditions trop profondément (maximum ${PROFONDEUR_MAX_EXPR} niveaux).`,
				site,
			),
		)
		return
	}

	const op = estObjet(noeud) ? noeud.op : undefined
	if (!estObjet(noeud) || typeof op !== 'string' || !estCleDe(CLES_PAR_OPERATEUR, op)) {
		issues.push(
			anomalieExpr(
				'expr-malformee',
				`Le champ « ${feuilleDe(site.path)} » utilise l'opérateur « ${decrireValeur(op)} », qui n'existe pas (attendu : ${enumererOperateurs()}).`,
				site,
			),
		)
		return
	}

	// TOUTE clé inconnue est bloquante, et ce n'est pas du zèle : sans cette règle,
	// l'opacité de l'arbre pour le balayage des destinations deviendrait une
	// CACHETTE — un champ de prose vivrait dans un `…_expr`, échapperait au
	// balayage et serait injecté par la n° 10 sans qu'un test rougisse.
	const connues = CLES_PAR_OPERATEUR[op as Operateur] as readonly string[]
	for (const cle of Object.keys(noeud)) {
		if (connues.includes(cle)) continue
		issues.push(
			anomalieExpr(
				'expr-malformee',
				`Le champ « ${feuilleDe(site.path)} » contient une clé « ${cle} » que les conditions ne reconnaissent pas.`,
				site,
			),
		)
	}

	if (op === 'et' || op === 'ou') {
		const enfants = noeud.enfants
		if (!Array.isArray(enfants) || enfants.length < ENFANTS_MIN) {
			issues.push(
				anomalieExpr(
					'arite-invalide',
					`Le champ « ${feuilleDe(site.path)} » utilise « ${op} » avec ${cardinal(enfants)} condition(s) : il en faut au moins deux.`,
					site,
				),
			)
			return
		}
		for (const enfant of enfants) visiter(enfant, site, profondeur + 1, issues)
		return
	}

	if (op === 'non') {
		// `non` n'a pas d'arité au sens des autres : le TYPE porte `enfant` au
		// SINGULIER, donc « un `non` à deux enfants » n'est pas exprimable. C'est une
		// clé `enfants` inconnue (ci-dessus) PLUS un `enfant` manquant (ici) — deux
		// causes distinctes, deux codes distincts.
		if (noeud.enfant === undefined) {
			issues.push(
				anomalieExpr(
					'arite-invalide',
					`Le champ « ${feuilleDe(site.path)} » utilise « non » sans condition à nier : il en faut exactement une.`,
					site,
				),
			)
			return
		}
		visiter(noeud.enfant, site, profondeur + 1, issues)
		return
	}

	const predicat = noeud.predicat
	if (typeof predicat !== 'string' || !estCleDe(PREDICATES, predicat)) {
		issues.push(
			anomalieExpr(
				'predicat-inconnu',
				`Le champ « ${feuilleDe(site.path)} » utilise le prédicat « ${decrireValeur(predicat)} », qui n'existe pas dans le registre des conditions.`,
				site,
			),
		)
		return
	}

	const descripteur = PREDICATES[predicat as PredicatId]
	const cibles = noeud.cibles
	if (!Array.isArray(cibles) || cibles.length !== descripteur.refKinds.length) {
		issues.push(
			anomalieExpr(
				'arite-invalide',
				`Le champ « ${feuilleDe(site.path)} » fournit ${cardinal(cibles)} cible(s) au prédicat « ${descripteur.label} », qui en attend ${descripteur.refKinds.length}.`,
				site,
			),
		)
		return
	}

	// LA FORME d'une cible, préfixe d'espace de noms COMPRIS : `estIdentifiantBienForme`
	// est une fonction de forme, pas de résolution. Ce qui reste à `validate.ts` est
	// la seule RÉSOLUTION — l'appartenance à l'ensemble des identifiants du dossier.
	descripteur.refKinds.forEach((espace, rang) => {
		const cible = cibles[rang]
		if (typeof cible === 'string' && estIdentifiantBienForme(cible, espace)) return
		issues.push(
			anomalieExpr(
				'identifiant-invalide',
				`Le champ « ${feuilleDe(site.path)} » fournit « ${decrireValeur(cible)} » au prédicat « ${descripteur.label} », qui attend une référence de type « ${ESPACES_DE_NOMS[espace].label} ».`,
				site,
				typeof cible === 'string' ? cible : undefined,
			),
		)
	})
}

/**
 * LA FORME, toute la forme, rien que la forme — frontière de confiance (KR-116).
 *
 * TOTALE sur `unknown` : elle ne lève jamais, quoi qu'on lui passe, et rend des
 * anomalies RÉDIGÉES en français (KR-164). Elle vérifie l'opérateur, l'absence de
 * clé inconnue, l'arité, la profondeur et la BONNE FORME d'une cible (préfixe
 * d'espace compris) — mais elle ne RÉSOUT rien : seule `validate.ts` connaît
 * `collectIds` et l'ensemble des identifiants réellement portés par le dossier.
 *
 * Le `path` de toute anomalie est celui du champ PORTEUR : il ne descend jamais
 * dans l'arbre.
 */
export function validateExpr(valeur: unknown, site: SiteExpr): DossierIssue[] {
	const issues: DossierIssue[] = []
	visiter(valeur, site, 1, issues)
	return issues
}

export interface RefCollectee {
	id: string
	/** L'espace ATTENDU à cette position, lu dans `refKinds[i]`. */
	espace: EspaceDeNoms
	/**
	 * Le prédicat porteur — requis par le message de `reference-pendante`, qui le
	 * nomme par son `label`. Sans ce champ, `validate.ts` devrait re-parcourir
	 * l'arbre pour le retrouver : une seconde traversée, donc une seconde vérité.
	 */
	predicat: PredicatId
}

/**
 * Relevé PLAT des références d'un arbre BIEN FORMÉ. Totale **sur un arbre déjà
 * accepté par `validateExpr`** : `[]` sur du bruit, jamais une exception. L'absolu
 * est qualifié à dessein — elle ne porte AUCUNE borne de récursion, et c'est
 * `validateExpr` qui la lui garantit en refusant au-delà de `PROFONDEUR_MAX_EXPR`.
 * Un absolu non qualifié dans un module `contrat` est une promesse que le prochain
 * appelant croira (KR-169).
 *
 * Elle n'est appelée QUE si `validateExpr` n'a rien produit — deux anomalies pour
 * une seule cause, c'est du bruit dans le rapport. Conséquence utile : elle ne
 * voit que des identifiants bien formés, et la résolution se réduit chez son
 * appelant à une appartenance à un ensemble.
 */
export function collectRefs(valeur: unknown): RefCollectee[] {
	if (!estObjet(valeur)) return []
	const op = valeur.op
	if (op === 'et' || op === 'ou') {
		const enfants = valeur.enfants
		return Array.isArray(enfants) ? enfants.flatMap((enfant) => collectRefs(enfant)) : []
	}
	if (op === 'non') return collectRefs(valeur.enfant)
	if (op !== 'predicat') return []

	const predicat = valeur.predicat
	if (typeof predicat !== 'string' || !estCleDe(PREDICATES, predicat)) return []
	const cibles = valeur.cibles
	if (!Array.isArray(cibles)) return []

	return PREDICATES[predicat as PredicatId].refKinds.flatMap((espace, rang) => {
		const cible = cibles[rang]
		return typeof cible === 'string' ? [{ id: cible, espace, predicat: predicat as PredicatId }] : []
	})
}
