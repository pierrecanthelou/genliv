import type { FaitsDeSession } from './faits'
import type { DossierIssue, DossierIssueCode } from './issues'
import {
	decrireValeur,
	defineRegistre,
	estCleDe,
	estIdentifiantBienForme,
	estObjet,
	feuilleDe,
	type EspaceDeNoms,
} from './identifiers'

/**
 * LE REGISTRE DES EFFETS DE RÈGLE — le vocabulaire FERMÉ de ce que le moteur
 * ÉCRIT dans l'état de session, jumeau de `PREDICATES` qui dit ce qu'il LIT.
 *
 * RÈGLE D'ADMISSION, appliquée comme un relevé et non comme une conception. Un
 * delta n'entre que si les QUATRE clauses tiennent :
 *  (a) il écrit un champ que le runtime mute DÉJÀ, ou qu'un prédicat de
 *      `PREDICATES` lit ;
 *  (b) tous ses opérandes sont des identifiants STABLES — aucun entier ;
 *  (c) son `refKinds` est INCLUS dans l'union des `refKinds` de `PREDICATES` ;
 *  (d) le moteur peut l'appliquer SANS LANCER UN DÉ.
 *
 * La clause (c) fait du veto « aucun effet ne peut nommer un monstre » un
 * COROLLAIRE DÉRIVÉ plutôt qu'une assertion isolée : `bestiaire` n'étant dans le
 * `refKinds` d'aucun prédicat, aucun delta ne peut l'atteindre. C'est mécanique,
 * pas conventionnel, et deux tests le tiennent.
 *
 * ÉCARTÉS, motif à lever avant réouverture : `gagner_xp`, `modifier_pv`,
 * `modifier_pe`, `modifier_bonus_attaque`, `modifier_bonus_defense`,
 * `modifier_carac`, `equiper_objet`, `deplacer_vers`, `consommer_evenement`,
 * `modifier_confiance`, `ouvrir_combat`. Les six premiers portent un opérande
 * ENTIER, et une magnitude sans borne NOMMÉE ne peut recevoir aucun test à la
 * limite (KR-165) ; par ailleurs `docs/REGLES-DU-JEU.md` CALCULE les points de
 * vie (§ 1) et tout gain d'XP (§ 5) plutôt que de les poser, et écrire une règle
 * de jeu depuis une itération de format est l'inversion exacte que KR-130
 * interdit. Réouverture d'un opérande entier : une section de
 * `docs/REGLES-DU-JEU.md` → `rules.golden.test.ts` → le code, dans cet ordre.
 *
 * Ce module n'importe NI `expr.ts` NI `predicates.ts` : deux registres frères ne
 * se dépendent pas. `SiteDelta` est donc recopié de `SiteExpr` — extraction au
 * troisième. Ils partagent `faits.ts`, qui n'importe RIEN et n'est donc pas une
 * arête entre eux. L'ordre des modules reste acyclique : `identifiers` →
 * `issues` → `faits` → `predicates` → `expr` → `deltas` → `types` → `tables` →
 * `validate`.
 *
 * APPLIQUER un delta est d'ici DEPUIS L'ITÉRATION 3 DE LA N° 9, et c'est bien un
 * CHAMP DU DESCRIPTEUR (`ecrit`), jamais un `switch` (KR-117) — ce que la
 * docstring d'it1 annonçait. La fonction qui l'appelle et JOURNALISE son effet,
 * elle, vit dans `evaluate.ts` : ce module reste le registre, pas le moteur.
 */
export interface DeltaDescripteur {
	/** Libellé français — la valeur du `Select` des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/**
	 * L'espace de noms attendu à CHAQUE position de `cibles`. L'ARITÉ est
	 * `refKinds.length`, DÉRIVÉE, jamais stockée (KR-165). Tout espace listé ici a
	 * une ligne dans `COLLECTIONS_IDENTIFIEES` ET est nommé par un `refKinds` de
	 * `PREDICATES` — c'est ce qui rend « aucun effet ne peut nommer un monstre »
	 * mécanique plutôt que conventionnel.
	 */
	refKinds: readonly EspaceDeNoms[]
	/**
	 * CE QUE L'EFFET ÉCRIT DANS LES FAITS — un CHAMP du descripteur, jamais un
	 * aiguillage au site d'appel (KR-117) : un cinquième effet ne compile pas tant
	 * que personne n'a dit ce qu'il écrit.
	 *
	 * ⚠ ELLE REND LA MÊME RÉFÉRENCE QUAND RIEN NE CHANGE, et ce n'est pas une
	 * optimisation : c'est ce qui rend `effet: 'sans_effet'` MÉCANIQUE plutôt que
	 * déclaratif — `appliquerDelta` le dérive par `===`, sans qu'aucun descripteur
	 * n'ait à l'annoncer. Un descripteur qui rendrait toujours un objet neuf ferait
	 * de « demandé sans effet » et « demandé » deux états indistinguables, ce que
	 * KR-247 refuse. Précédent au dépôt : `commandes.ts`, dont `lieux_visites` rend
	 * la liste d'entrée quand le lieu y est déjà.
	 */
	ecrit: (faits: FaitsDeSession, cibles: readonly string[]) => FaitsDeSession
}

/**
 * LES TROIS LISTES D'IDENTIFIANTS QU'UN EFFET SAIT ÉCRIRE. `lieu_courant` n'y est
 * pas (aucun effet ne déplace le héros, `deplacer_vers` est écarté) et
 * `evenements_consommes` non plus (`consommer_evenement` l'est aussi) : cette
 * union est un RELEVÉ des quatre entrées ci-dessous, pas une permission.
 */
type ChampDeListe = 'objets_possedes' | 'indices_connus' | 'jalons_atteints'

/**
 * L'AJOUT À SÉMANTIQUE D'ENSEMBLE — et LA MÊME RÉFÉRENCE si l'identifiant y est
 * déjà. C'est cette ligne, et elle seule, qui rend l'idempotence OBSERVABLE : deux
 * jalons qui révèlent le même indice produisent `'applique'` puis `'sans_effet'`,
 * sans qu'aucun appelant n'ait à comparer des listes.
 */
function avecAjout(faits: FaitsDeSession, champ: ChampDeListe, id: string): FaitsDeSession {
	const liste = faits[champ]
	return liste.includes(id) ? faits : { ...faits, [champ]: [...liste, id] }
}

/** Le RETRAIT, même règle de référence : une liste qui ne porte pas l'identifiant n'est pas remplacée. */
function avecRetrait(faits: FaitsDeSession, champ: ChampDeListe, id: string): FaitsDeSession {
	const liste = faits[champ]
	return liste.includes(id) ? { ...faits, [champ]: liste.filter((present) => present !== id) } : faits
}

export const DELTAS = defineRegistre<DeltaDescripteur>()({
	/** Écrit l'inventaire de session — déjà muté par `actionEngine.applyGift` (`inventoryAdd`). */
	donner_objet: {
		label: "donne l'objet",
		refKinds: ['objet'],
		ecrit: (faits, cibles) => avecAjout(faits, 'objets_possedes', cibles[0]),
	},
	/** Écrit l'inventaire de session — déjà muté par `actionEngine.computeInventoryLoss`. */
	retirer_objet: {
		label: "retire l'objet",
		refKinds: ['objet'],
		ecrit: (faits, cibles) => avecRetrait(faits, 'objets_possedes', cibles[0]),
	},
	/**
	 * Écrit la liste des indices connus — lue par `indice_connu` SEUL. Il n'écrit
	 * JAMAIS le carnet d'un personnage, et c'est mécanique : son arité est 1, il
	 * n'a aucun opérande `pnj` par lequel nommer QUI a parlé (H3,
	 * `atteignabilite.ts`).
	 */
	reveler_indice: {
		label: "révèle l'indice",
		refKinds: ['indice'],
		ecrit: (faits, cibles) => avecAjout(faits, 'indices_connus', cibles[0]),
	},
	/**
	 * Écrit la liste des jalons atteints — lue par `jalon_atteint`.
	 *
	 * ⚠ SEUL ÉCRIVAIN DE `jalons_atteints` DANS TOUT LE DÉPÔT. La passe à point fixe
	 * de `resoudreJalons` ne l'étend JAMAIS en direct : deux écrivains du même champ
	 * seraient la seconde source de vérité que KR-013 refuse, et l'idempotence d'un
	 * jalon déjà atteint cesserait d'être mécanique.
	 */
	atteindre_jalon: {
		label: 'marque le jalon atteint',
		refKinds: ['jalon'],
		ecrit: (faits, cibles) => avecAjout(faits, 'jalons_atteints', cibles[0]),
	},
})

/** L'union des identifiants d'effet, DÉRIVÉE du registre — jamais re-listée. */
export type DeltaId = keyof typeof DELTAS

/**
 * L'EFFET QUI MARQUE UN JALON ATTEINT, NOMMÉ ICI ET NULLE PART AILLEURS.
 *
 * `resoudreJalons` doit l'émettre, et il ne peut pas le NOMMER : `evaluate.ts` ne
 * porte aucun identifiant de registre en chaîne — sans quoi le moteur redeviendrait
 * un site de décision par littéral, à côté du registre (KR-117). La constante fait
 * voyager la clé depuis son domicile, typée, sans rouvrir cette porte.
 */
export const DELTA_DU_JALON_ATTEINT: DeltaId = 'atteindre_jalon'

/**
 * La forme persistée d'un effet de règle. `cibles` reste un TABLEAU même à
 * l'arité 1, comme `ExprNode` : un effet à deux cibles ne cassera pas le type le
 * jour où il entre.
 *
 * La clé discriminante est `delta`, JAMAIS `op` — `op` désigne dans ce module les
 * quatre opérateurs STRUCTURELS d'`ExprNode`, et le miroir de
 * `predicat: PredicatId` est `delta: DeltaId`.
 */
export interface Delta {
	delta: DeltaId
	cibles: string[]
}

/**
 * Le champ PORTEUR de l'effet — le `path` et le `location` de toute anomalie qu'il
 * produit. Jumeau de `SiteExpr`, RECOPIÉ : deux registres frères ne se dépendent
 * pas. Extraction au troisième.
 */
export interface SiteDelta {
	path: string
	location: string
}

/** Les clés reconnues sur un effet — toute autre est bloquante (voir `validateDelta`). */
const CLES_DE_DELTA: readonly string[] = ['delta', 'cibles']

/**
 * L'appartenance PROPRE au registre, en position de GARDE DE TYPE. Deux raisons,
 * et la seconde n'est pas cosmétique :
 *  · `estCleDe` plutôt qu'`in` ou qu'un test d'index — tout littéral d'objet
 *    hérite d'`Object.prototype`, donc `'toString' in DELTAS` vaut `true` et le
 *    descripteur qu'on en tire est une FONCTION (KR-175, BUG-053) ;
 *  · en GARDE DE TYPE, la restriction est portée par le compilateur au lieu d'être
 *    affirmée par un `as` — et un `as` posé sur une valeur non fiable est
 *    précisément l'endroit où `tsc` cesse de protéger (KR-175, corollaire 1).
 *
 * PORTÉE DE CET ABSOLU : **ce module**, et le test-grep ne cliquette que `DELTAS`.
 * `expr.ts` porte encore QUATRE `as` de la même forme (`op` l. 126, `predicat`
 * l. 185, 273 et 275 — le dernier en affectation de champ, pas en indexation), chacun
 * précédé immédiatement d'`estCleDe` — donc sans le défaut, mais sans cliquet non
 * plus. Qualifié à la revue de PR plutôt qu'énoncé comme un invariant de
 * `brain/dossier/` : un absolu non qualifié dans un module `contrat` est une
 * promesse que le prochain appelant croira (KR-169). Leur suppression par un
 * `estPredicatId` est additive et n'appartient pas à ce lot, que le plan borne
 * aux deux renommages sur `expr.ts`.
 */
function estDeltaId(valeur: unknown): valeur is DeltaId {
	return typeof valeur === 'string' && estCleDe(DELTAS, valeur)
}

function anomalieDelta(code: DossierIssueCode, message: string, site: SiteDelta, entityId?: string): DossierIssue {
	const base = { code, severity: 'error' as const, message, location: site.location, path: site.path }
	return entityId === undefined ? base : { ...base, entityId }
}

/** Le nombre d'éléments d'une valeur qui devrait être une liste ; 0 sinon. */
function cardinal(valeur: unknown): number {
	return Array.isArray(valeur) ? valeur.length : 0
}

/**
 * LA FORME, toute la forme, rien que la forme — frontière de confiance (KR-116).
 *
 * TOTALE sur `unknown` : elle ne lève JAMAIS, quoi qu'on lui passe, et rend des
 * anomalies RÉDIGÉES en français (KR-164). Elle indexe `DELTAS` par `estDeltaId`
 * (donc par `estCleDe`), jamais par `in` ni par un test d'index, et l'indexation
 * ne porte aucun `as`.
 *
 * Elle refuse TOUTE clé inconnue sur l'effet, et c'est la contrepartie
 * INDISSOCIABLE de l'arrêt du balayage de couverture : un effet est une feuille
 * OPAQUE pour `couverture.test.ts`, donc sans cette règle il deviendrait une
 * CACHETTE — un champ de prose y vivrait, échapperait au balayage des
 * destinations et serait injecté par la n° 10 sans qu'un test rougisse.
 *
 * Elle ne RÉSOUT rien : elle vérifie la BONNE FORME d'une cible, préfixe d'espace
 * de noms compris, mais l'EXISTENCE de l'entité appartient à `validate.ts`, seul
 * à connaître `collectIds`. Même frontière que `validateExpr`.
 */
export function validateDelta(valeur: unknown, site: SiteDelta): DossierIssue[] {
	const issues: DossierIssue[] = []
	const champ = feuilleDe(site.path)

	if (!estObjet(valeur)) {
		issues.push(
			anomalieDelta(
				'delta-malforme',
				`Le champ « ${champ} » attend un effet structuré reconnu (une clé « delta », puis ses cibles) ; il contient « ${decrireValeur(valeur)} ».`,
				site,
			),
		)
		return issues
	}

	for (const cle of Object.keys(valeur)) {
		if (CLES_DE_DELTA.includes(cle)) continue
		issues.push(
			anomalieDelta(
				'delta-malforme',
				`Le champ « ${champ} » contient une clé « ${cle} » que les effets ne reconnaissent pas.`,
				site,
			),
		)
	}

	// SANS clé `delta` : c'est un défaut de FORME, pas un effet inconnu — l'auteur
	// n'a pas écrit un mauvais mot, il n'en a écrit aucun.
	if (valeur.delta === undefined) {
		issues.push(
			anomalieDelta(
				'delta-malforme',
				`Le champ « ${champ} » attend un effet structuré reconnu (une clé « delta », puis ses cibles) ; il contient « ${decrireValeur(valeur)} ».`,
				site,
			),
		)
		return issues
	}

	const delta = valeur.delta
	if (!estDeltaId(delta)) {
		issues.push(
			anomalieDelta(
				'delta-inconnu',
				`Le champ « ${champ} » utilise l'effet « ${decrireValeur(delta)} », qui n'existe pas dans le registre des effets.`,
				site,
			),
		)
		return issues
	}

	const descripteur = DELTAS[delta]
	const cibles = valeur.cibles
	if (!Array.isArray(cibles) || cibles.length !== descripteur.refKinds.length) {
		// `arite-invalide` RÉUTILISÉ, jamais un code de plus : sa ligne QUOI FAIRE dit
		// déjà « Ajustez le nombre de cibles » — un code par CAUSE, pas par emplacement.
		issues.push(
			anomalieDelta(
				'arite-invalide',
				`Le champ « ${champ} » fournit ${cardinal(cibles)} cible(s) à l'effet « ${descripteur.label} », qui en attend ${descripteur.refKinds.length}.`,
				site,
			),
		)
		return issues
	}

	descripteur.refKinds.forEach((espace, rang) => {
		const cible = cibles[rang]
		if (typeof cible === 'string' && estIdentifiantBienForme(cible, espace)) return
		issues.push(
			anomalieDelta(
				'identifiant-invalide',
				`L'effet « ${descripteur.label} » de « ${champ} » fournit « ${decrireValeur(cible)} », qui n'est pas un identifiant valide.`,
				site,
				typeof cible === 'string' ? cible : undefined,
			),
		)
	})

	return issues
}

export interface RefDeltaCollectee {
	id: string
	/** L'espace ATTENDU à cette position, lu dans `refKinds[i]`. */
	espace: EspaceDeNoms
	/**
	 * L'effet porteur — requis par le message de `reference-pendante`, qui le nomme
	 * par son `label`. Sans ce champ, `validate.ts` devrait relire l'effet pour le
	 * retrouver : une seconde lecture, donc une seconde vérité.
	 */
	delta: DeltaId
}

/**
 * Relevé PLAT des références d'un effet BIEN FORMÉ. Totale **sur un effet déjà
 * accepté par `validateDelta`** : `[]` sur du bruit, jamais une exception.
 * L'absolu est qualifié à dessein — un absolu non qualifié dans un module
 * `contrat` est une promesse que le prochain appelant croira (KR-169).
 *
 * Elle n'est appelée QUE si `validateDelta` s'est tue — deux anomalies pour une
 * seule cause seraient du bruit dans le rapport. Conséquence utile : elle ne voit
 * que des identifiants bien formés, et la résolution se réduit chez son appelant
 * à une appartenance à un ensemble.
 */
export function collectDeltaRefs(valeur: unknown): RefDeltaCollectee[] {
	if (!estObjet(valeur)) return []
	const delta = valeur.delta
	if (!estDeltaId(delta)) return []
	const cibles = valeur.cibles
	if (!Array.isArray(cibles)) return []

	return DELTAS[delta].refKinds.flatMap((espace, rang) => {
		const cible = cibles[rang]
		return typeof cible === 'string' ? [{ id: cible, espace, delta }] : []
	})
}
