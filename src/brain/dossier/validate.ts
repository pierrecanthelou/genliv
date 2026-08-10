import { DOSSIER_SCHEMA, type Dossier } from './types'
import type { DossierIssue, DossierIssueCode, DossierIssueSeverity } from './issues'
import {
	COLLECTIONS_IDENTIFIEES,
	ESPACES_DE_NOMS,
	collectIds,
	decrireValeur,
	estCleDe,
	estIdentifiantBienForme,
	estObjet,
	feuilleDe,
	identifiantsDupliques,
	localiserEntite,
	resoudreChemin,
	type EspaceDeNoms,
} from './identifiers'
import {
	BUDGETS_DE_MOTS,
	CHAMPS_REQUIS,
	CHEMINS_DE_DELTAS,
	ENUMERES_FERMES,
	FAMILLES_DE_CONDITIONS,
	LISTES_A_ELEMENTS_STRUCTURES,
	LISTES_REQUISES,
	RACINES,
	REFERENCES_SIMPLES,
} from './tables'
import { collectRefs, validateExpr } from './expr'
import { DELTAS, collectDeltaRefs, validateDelta } from './deltas'
import { PREDICATES } from './predicates'
import { deepFreeze } from './freeze'
import { BESTIARY_BY_TEMPLATE } from '../bestiary'

/**
 * Le VALIDATEUR du dossier — la frontière de confiance entre un fichier écrit à
 * la main et le contrat que quinze features consomment.
 *
 * Quatre propriétés le définissent :
 *  · il est PUR : l'argument ressort INTACT, jamais gelé en place. Ce qui est
 *    gelé est une copie (voir la sortie de la fonction) ;
 *  · il est TOTAL SUR TOUT DOCUMENT ISSU D'UN `JSON.parse` — `input` est
 *    `unknown`, aucune FORME n'est supposée, une entrée non-objet est refusée et
 *    non fatale. La précondition n'est pas la forme mais la PROVENANCE : sur une
 *    valeur construite en mémoire, une structure cyclique ou un `BigInt` font
 *    lever le clone de sortie. C'est assumé — les deux appelants (`DossierService`
 *    et `inspectDossierFile`) ne passent que du `JSON.parse` — et c'est nommé ici
 *    plutôt que promis à tort : quand la n° 2 validera un brouillon construit en
 *    mémoire, elle devra clore ce point, pas le découvrir ;
 *  · il est IGNORANT DU MAGASIN : il ne sait ni ce qui est déjà importé, ni où
 *    le dossier sera rangé. `dossier-deja-importe` n'est donc PAS produit ici,
 *    mais par `DossierService`, qui est le seul à voir la bibliothèque ;
 *  · il GÈLE en profondeur ce qu'il rend quand il réussit (KR-166) — c'est le
 *    seul site d'appel de `deepFreeze` du module dossier.
 *
 * Les règles ne sont pas des cascades de `if` : les racines, les champs
 * obligatoires, les énumérations fermées, les emplacements de deltas, les budgets
 * de mots et les familles de conditions vivent dans des TABLES déclaratives
 * (`tables.ts`), toutes lues par le même expanseur de chemins. Étendre le schéma,
 * c'est ajouter des LIGNES.
 *
 * Ce fichier garde les DONNÉES qui ne sont pas des chemins de table — les portes
 * de révélation, la forme de l'identifiant de dossier — et surtout le LECTEUR,
 * `sitesDe`, dont la grammaire est FIGÉE : segments pointés et `[]`, rien d'autre.
 */
export interface DossierValidation {
	/** Vrai si et seulement si `errors` est vide. Un avertissement ne bloque jamais. */
	ok: boolean
	/** Le dossier typé et GELÉ en profondeur — non nul si et seulement si `ok`. */
	dossier: Dossier | null
	errors: DossierIssue[]
	warnings: DossierIssue[]
}

/** Le chemin des savoirs — le seul porteur de portes de révélation du schéma 1. */
const CHEMIN_SAVOIRS = 'monde.personnages[].savoirs[]'

/**
 * Les QUATRE portes de révélation reconnues. Toute autre clé sous `revele_si` est
 * bloquante : un `revele_si: { toujours: true }` qui passerait en silence serait
 * un savoir que rien ne révèle jamais, et l'auteur ne le saurait qu'en jouant.
 *
 * Les deux libellés français de ces portes sont ARBITRÉS au § 3.2 du plan et
 * DIFFÈRENT l'un de l'autre (« confiance minimale » dans `porte-inconnue`,
 * « confiance » dans `revelation-sans-porte`) : ils ne se dérivent donc pas d'une
 * source unique, ils sont recopiés verbatim ci-dessous et épinglés par les tests.
 */
const PORTES_DE_REVELATION = ['confiance_min', 'jet', 'contrepartie', 'apres_indice_id'] as const

/** L'unique référence du schéma 1 qui résout HORS du dossier, contre le bestiaire. */
const CHEMIN_MONSTRE_REF = 'monde.evenements[].monstre_ref'
const ESPACE_BESTIAIRE: EspaceDeNoms = 'bestiaire'
const PREFIXE_BESTIAIRE = `${ESPACE_BESTIAIRE}.`

/**
 * La forme de l'IDENTIFIANT DE DOSSIER — la racine `id`, distincte des
 * identifiants d'entité (`FORME_IDENTIFIANT` dans `identifiers.ts`), qui eux
 * portent un préfixe d'espace de noms.
 *
 * Volontairement plus stricte que « chaîne non vide » : cette valeur, écrite à
 * la main dans un fichier importé, devient telle quelle une CLÉ DE STOCKAGE via
 * `dossierKey()`. Pas de `:` (séparateur réservé du découpage de clés), pas
 * d'espace, pas de majuscule — deux clés qui ne diffèrent que par la casse ou
 * par un espace de bord sont deux entrées de stockage mais un seul dossier pour
 * l'auteur, et `dossier-deja-importe` ne les rapprocherait pas.
 */
const FORME_ID_DOSSIER = /^[a-z0-9][a-z0-9-]*$/

/** L'espace de noms attendu par collection — dérivé, jamais re-listé. */
const ESPACE_PAR_COLLECTION: Record<string, EspaceDeNoms> = Object.fromEntries(
	COLLECTIONS_IDENTIFIEES.map((collection) => [collection.path, collection.espace]),
)

function anomalie(
	code: DossierIssueCode,
	severity: DossierIssueSeverity,
	message: string,
	location: string,
	path: string,
	entityId?: string,
): DossierIssue {
	return entityId === undefined
		? { code, severity, message, location, path }
		: { code, severity, message, location, path, entityId }
}

/** Le segment parent d'un chemin pointé ; chaîne vide au premier niveau. */
function parentDe(path: string): string {
	const dernier = path.lastIndexOf('.')
	return dernier === -1 ? '' : path.slice(0, dernier)
}

/** Un emplacement CONCRET désigné par un chemin de table, avec son OÙ résolu. */
interface Site {
	/** Chemin réel, indices compris — le `path` de l'anomalie. */
	path: string
	valeur: unknown
	/** OÙ — l'entité identifiée la plus proche, ou le repli de la table. */
	location: string
}

/**
 * L'EXPANSEUR de chemins : il traduit un chemin de table
 * (`monde.personnages[].savoirs[].indice_id`) en tous ses emplacements réels
 * (`monde.personnages[0].savoirs[2].indice_id`, …).
 *
 * Il est le seul endroit du validateur qui descende dans les tableaux, et il
 * résout au passage le OÙ : chaque fois qu'il entre dans une collection
 * identifiée, le libellé devient celui de l'entité traversée. C'est ce qui fait
 * qu'un `savoirs[].indice_id` vide est signalé sur « Personnage « Aldûr le Sage » »
 * sans qu'aucune table n'ait à le dire.
 *
 * Total sur une entrée non fiable : ce qui n'est pas là ne produit aucun site.
 */
function sitesDe(racine: unknown, chemin: string, repli: string): Site[] {
	let sites: (Site & { normalise: string })[] = [{ path: '', normalise: '', valeur: racine, location: repli }]
	for (const segment of chemin.split('.')) {
		const estListe = segment.endsWith('[]')
		const cle = estListe ? segment.slice(0, -2) : segment
		const suivants: (Site & { normalise: string })[] = []
		for (const site of sites) {
			if (!estObjet(site.valeur)) continue
			const valeur = site.valeur[cle]
			const path = site.path === '' ? cle : `${site.path}.${cle}`
			const normalise = site.normalise === '' ? cle : `${site.normalise}.${cle}`
			if (!estListe) {
				suivants.push({ path, normalise, valeur, location: site.location })
				continue
			}
			if (!Array.isArray(valeur)) continue
			const espace = ESPACE_PAR_COLLECTION[normalise]
			valeur.forEach((element, index) => {
				suivants.push({
					path: `${path}[${index}]`,
					normalise: `${normalise}[]`,
					valeur: element,
					location: espace === undefined ? site.location : localiserEntite(espace, element, index),
				})
			})
		}
		sites = suivants
	}
	return sites
}

/** « a, b ou c » — la liste des valeurs attendues, sans jamais un nom de type. */
function enumererEnFrancais(valeurs: readonly unknown[]): string {
	const textes = valeurs.map((valeur) => decrireValeur(valeur))
	if (textes.length < 2) return textes.join('')
	return `${textes.slice(0, -1).join(', ')} ou ${textes[textes.length - 1]}`
}

/**
 * Comment nommer un savoir dans une phrase : par l'indice qu'il porte, puisqu'un
 * savoir n'a pas de nom à lui. Le repli indexé garde le message lisible quand
 * l'indice manque, plutôt que d'y laisser passer un « undefined ».
 */
function designerSavoir(savoir: Record<string, unknown>, path: string): string {
	const indiceId = savoir.indice_id
	if (typeof indiceId === 'string' && indiceId.trim() !== '') return indiceId.trim()
	const rang = /\[(\d+)\]$/.exec(path)
	return rang === null ? path : `n°${Number(rang[1]) + 1}`
}

/**
 * Le COMPTEUR DE MOTS du dossier — un seul, pour que l'avertissement du validateur
 * et le compteur affiché sous un champ de saisie comptent la MÊME chose.
 *
 * Exporté depuis la n° 3 (`dossier-canon`), qui en est le second appelant réel :
 * le compteur « n/BUDGET mots » du formulaire de canon. Réimplémenté à l'écran, il
 * dériverait en silence de la borne qui décide réellement de l'avertissement, et
 * l'auteur verrait un compteur calme sur un texte que l'import signale.
 */
export function compterMots(texte: string): number {
	const nettoye = texte.trim()
	return nettoye === '' ? 0 : nettoye.split(/\s+/).length
}

/** Somme les mots de toutes les feuilles textuelles d'un bloc, quel qu'il devienne. */
function compterMotsDe(valeur: unknown): number {
	if (typeof valeur === 'string') return compterMots(valeur)
	if (Array.isArray(valeur)) return valeur.reduce<number>((total, v) => total + compterMotsDe(v), 0)
	if (estObjet(valeur)) return Object.values(valeur).reduce<number>((total, v) => total + compterMotsDe(v), 0)
	return 0
}

export function validateDossier(input: unknown): DossierValidation {
	const errors: DossierIssue[] = []
	const warnings: DossierIssue[] = []

	// 1 — LA GARDE DE VERSION, avant tout le reste et distincte de toute erreur de
	// contenu : un schéma inconnu n'est pas un dossier incomplet, c'est un dossier
	// d'une autre époque, et rien de ce qui suit n'aurait de sens sur lui.
	// Comparaison STRICTE au nombre : ni '1', ni 0, ni 2, ni absent, jamais coercée
	// (KR-160). Une entrée qui n'est même pas un objet tombe ici aussi — refusée,
	// jamais fatale.
	if (!estObjet(input) || input.schema !== DOSSIER_SCHEMA) {
		errors.push(
			anomalie(
				'schema-inconnu',
				'error',
				`Le champ « schema » doit valoir ${DOSSIER_SCHEMA} ; ce fichier ne peut pas être importé.`,
				'Dossier',
				'schema',
			),
		)
		return { ok: false, dossier: null, errors, warnings }
	}

	// 2 — Les racines obligatoires.
	const racinesManquantes = new Set<string>()
	for (const racine of RACINES) {
		const valeur = resoudreChemin(input, racine.path)
		const conforme = racine.genre === 'liste' ? Array.isArray(valeur) : estObjet(valeur)
		if (conforme) continue
		racinesManquantes.add(racine.path)
		errors.push(
			anomalie(
				'racine-manquante',
				'error',
				`La racine « ${racine.path} » est absente du dossier.`,
				racine.location,
				racine.path,
			),
		)
	}

	// 3 — Les champs obligatoires. Un champ dont la racine porteuse manque n'est PAS
	// signalé une seconde fois : la racine l'a déjà été, et empiler deux anomalies
	// pour une seule cause transforme le rapport en bruit.
	for (const champ of CHAMPS_REQUIS) {
		const parent = parentDe(champ.path)
		if (parent !== '' && racinesManquantes.has(parent)) continue
		for (const site of sitesDe(input, champ.path, champ.location)) {
			if (typeof site.valeur === 'string' && site.valeur.trim() !== '') continue
			errors.push(
				anomalie(
					'champ-requis-vide',
					'error',
					`Le champ « ${feuilleDe(champ.path)} » est vide alors qu'il est obligatoire.`,
					site.location,
					site.path,
				),
			)
		}
	}

	// 3 bis — L'IDENTIFIANT DE DOSSIER, contraint à part des identifiants d'entité.
	//
	// Il ne porte pas de préfixe d'espace de noms (il ne désigne rien DANS le
	// document), mais il est le seul champ du fichier qui devient une CLÉ DE
	// STOCKAGE : `dossierKey(id)` le concatène derrière `genliv:dossier:`, et
	// `:` est le séparateur réservé du découpage de clés (`dossierContentKey` /
	// `dossierImageKey` arrivent en n° 3 / n° 4). Un `id` valant « x:content »
	// entrerait donc en collision par construction avec la future clé de contenu
	// de « x ». Laisser « chaîne non vide » comme seule contrainte, c'est laisser
	// un fichier écrit à la main choisir la forme de nos clés.
	//
	// Les espaces de bord comptent aussi : « x » et «  x  » sont deux clés
	// distinctes mais le même dossier pour l'auteur, donc `dossier-deja-importe`
	// ne les rapprocherait pas.
	const idDossier = resoudreChemin(input, 'id')
	if (typeof idDossier === 'string' && idDossier.trim() !== '' && !FORME_ID_DOSSIER.test(idDossier)) {
		errors.push(
			anomalie(
				'identifiant-invalide',
				'error',
				`L'identifiant du dossier « ${idDossier} » ne respecte pas le format attendu (minuscules, chiffres et tirets, commençant par une lettre ou un chiffre).`,
				'Dossier',
				'id',
				idDossier,
			),
		)
	}

	// 4 — Les identifiants : forme, puis unicité. Chaque occurrence d'un doublon est
	// signalée, pas seulement la seconde — sinon l'auteur cherche la première.
	const collectes = collectIds(input)
	const dupliques = identifiantsDupliques(collectes)
	for (const collecte of collectes) {
		if (collecte.id === null) {
			errors.push(
				anomalie(
					'champ-requis-vide',
					'error',
					"Le champ « id » est vide alors qu'il est obligatoire.",
					collecte.location,
					collecte.path,
				),
			)
			continue
		}
		if (!estIdentifiantBienForme(collecte.id, collecte.espace)) {
			errors.push(
				anomalie(
					'identifiant-invalide',
					'error',
					`L'identifiant « ${collecte.id} » ne respecte pas le format attendu (préfixe connu, puis lettres, chiffres et tirets).`,
					collecte.location,
					collecte.path,
					collecte.id,
				),
			)
		} else if (dupliques.has(collecte.id)) {
			errors.push(
				anomalie(
					'identifiant-duplique',
					'error',
					`L'identifiant « ${collecte.id} » est déjà utilisé par un autre élément du dossier.`,
					collecte.location,
					collecte.path,
					collecte.id,
				),
			)
		}
	}

	// L'ensemble des identifiants réellement PORTÉS par le dossier — la seule
	// question que pose une résolution de référence, quel qu'en soit le porteur :
	// champ simple, cible de condition ou cible d'effet.
	const idsPortes = new Set(collectes.flatMap((collecte) => (collecte.id === null ? [] : [collecte.id])))

	// 5 — Les RÉFÉRENCES SIMPLES : un champ textuel qui pointe une entité, hors de
	// tout arbre et hors de tout effet. Une référence orpheline est EXPOSÉE, jamais
	// silencieuse (KR-021).
	//
	// La table a remplacé une branche câblée en dur sur `charpente.depart.lieu_id`
	// (KR-117). CHANGEMENT DE COMPORTEMENT ASSUMÉ : cette branche se taisait quand
	// `monde.lieux` manquait, la boucle générique ne le fait pas — cohérent avec les
	// conditions, qui signalent déjà leurs cibles pendantes sans regarder si la
	// collection porteuse existe.
	for (const reference of REFERENCES_SIMPLES) {
		for (const site of sitesDe(input, reference.path, reference.location)) {
			if (typeof site.valeur !== 'string' || site.valeur.trim() === '') continue
			const sujet = reference.sujet ?? `Le champ « ${feuilleDe(reference.path)} »`
			// FORME d'abord, RÉSOLUTION ensuite — même frontière que pour une cible de
			// condition ou d'effet, et deux causes distinctes ne partagent pas un code.
			// Sans le contrôle d'ESPACE, un `pnj.aldur-le-sage` rangé dans
			// `depart.lieu_id` RÉSOUDRAIT : l'identifiant existe, mais pas là.
			if (!estIdentifiantBienForme(site.valeur, reference.espace)) {
				errors.push(
					anomalie(
						'identifiant-invalide',
						'error',
						`${sujet} fournit « ${site.valeur} », qui n'est pas une référence valide de type « ${ESPACES_DE_NOMS[reference.espace].label} ».`,
						site.location,
						site.path,
						site.valeur,
					),
				)
				continue
			}
			if (idsPortes.has(site.valeur)) continue
			errors.push(
				anomalie(
					'reference-pendante',
					'error',
					`${sujet} pointe « ${site.valeur} », qui n'existe pas dans ce dossier.`,
					site.location,
					site.path,
					site.valeur,
				),
			)
		}
	}

	// 5b — `evenements[].monstre_ref` résout HORS du dossier, contre le bestiaire du
	// jeu. Le OÙ reste l'ÉVÉNEMENT : le monstre, lui, n'existe pas dans le document.
	for (const site of sitesDe(input, CHEMIN_MONSTRE_REF, 'Événements')) {
		if (site.valeur === undefined) continue
		const reference = typeof site.valeur === 'string' ? site.valeur : ''
		const templateId = reference.startsWith(PREFIXE_BESTIAIRE) ? reference.slice(PREFIXE_BESTIAIRE.length) : ''
		// `estCleDe`, jamais un test d'index : `BESTIARY_BY_TEMPLATE` est construit par
		// `Object.fromEntries`, donc `BESTIARY_BY_TEMPLATE['toString']` rend une
		// FONCTION héritée d'`Object.prototype` — et « bestiaire.toString » passait pour
		// un monstre existant (BUG-053, même cause racine que le site des prédicats).
		if (templateId !== '' && estCleDe(BESTIARY_BY_TEMPLATE, templateId)) continue
		errors.push(
			anomalie(
				'reference-pendante',
				'error',
				`Le monstre « ${decrireValeur(site.valeur)} » n'existe pas dans le bestiaire du jeu.`,
				site.location,
				site.path,
				typeof site.valeur === 'string' ? site.valeur : undefined,
			),
		)
	}

	// 6 — Les ENSEMBLES FERMÉS. Sans cette règle, une `portee` valant « troisieme »
	// passerait en silence et le moteur découvrirait la valeur à l'exécution.
	for (const enumere of ENUMERES_FERMES) {
		for (const site of sitesDe(input, enumere.path, enumere.location)) {
			if (site.valeur === undefined && !enumere.requis) continue
			if (enumere.valeurs.includes(site.valeur)) continue
			errors.push(
				anomalie(
					'valeur-hors-enumeration',
					'error',
					`Le champ « ${feuilleDe(enumere.path)} » vaut « ${decrireValeur(site.valeur)} », qui n'est pas une valeur reconnue (attendu : ${enumererEnFrancais(enumere.valeurs)}).`,
					site.location,
					site.path,
				),
			)
		}
	}

	// 6 bis — Les LISTES OBLIGATOIRES.
	//
	// `sitesDe` abandonne un segment `[]` dont la valeur n'est pas un tableau :
	// c'est ce qui lui permet de traverser un document non fiable sans lever, mais
	// ça rend AUSSI muettes les règles portées par les descendants d'une liste
	// absente. Sans cette table, `plan_actions`, `savoirs` et `resolutions` —
	// pourtant NON optionnels dans `types.ts` — passeraient absents, `ok: true`,
	// et le dossier gelé promettrait trois tableaux valant `undefined`. Le contrat
	// entre les deux temps mentirait à quinze features.
	for (const liste of LISTES_REQUISES) {
		for (const site of sitesDe(input, liste.path, liste.location)) {
			if (Array.isArray(site.valeur)) continue
			errors.push(
				anomalie(
					'champ-requis-vide',
					'error',
					`Le champ « ${feuilleDe(liste.path)} » est vide alors qu'il est obligatoire.`,
					site.location,
					site.path,
				),
			)
		}
	}

	// 6 ter — Les ÉLÉMENTS de liste (BUG-050). La table est DÉRIVÉE, jamais une
	// cinquième table : les collections identifiées sont déjà gardées ailleurs, un
	// élément non-objet y donnant `id: null` puis `champ-requis-vide`.
	for (const liste of LISTES_A_ELEMENTS_STRUCTURES) {
		for (const site of sitesDe(input, liste.path, liste.location)) {
			if (!Array.isArray(site.valeur)) continue
			site.valeur.forEach((element, index) => {
				if (estObjet(element)) return
				errors.push(
					anomalie(
						'element-non-objet',
						'error',
						`Le champ « ${feuilleDe(liste.path)} » attend une liste d'objets ; l'un de ses éléments n'en est pas un (« ${decrireValeur(element)} »).`,
						site.location,
						`${site.path}[${index}]`,
					),
				)
			})
		}
	}

	// 7 — Les EFFETS DE RÈGLE, en deux temps disjoints, exactement comme les
	// conditions : `validateDelta` tient la FORME (clé `delta`, clés inconnues,
	// arité, bonne forme d'une cible), `collectDeltaRefs` n'est appelée que si elle
	// s'est tue, et il ne reste ici que la RÉSOLUTION.
	//
	// L'élément non-objet d'un de ces quatre chemins est `delta-malforme`, PAS
	// `element-non-objet` : ces chemins sont exclus de la dérivation ci-dessus, et
	// ce que l'auteur doit corriger n'est pas « mettre un objet » mais « écrire un
	// effet reconnu ». Deux frontières, deux codes, deux consignes.
	for (const chemin of CHEMINS_DE_DELTAS) {
		for (const site of sitesDe(input, chemin.path, chemin.location)) {
			if (site.valeur === undefined) {
				errors.push(
					anomalie(
						'champ-requis-vide',
						'error',
						`Le champ « ${feuilleDe(chemin.path)} » est vide alors qu'il est obligatoire.`,
						site.location,
						site.path,
					),
				)
				continue
			}
			if (!Array.isArray(site.valeur)) {
				errors.push(
					anomalie(
						'delta-en-prose',
						'error',
						`Le champ « ${feuilleDe(chemin.path)} » attend une liste d'effets structurés ; il contient du texte libre.`,
						site.location,
						site.path,
					),
				)
				continue
			}
			site.valeur.forEach((effet, index) => {
				const siteEffet = { path: `${site.path}[${index}]`, location: site.location }
				const malForme = validateDelta(effet, siteEffet)
				if (malForme.length > 0) {
					errors.push(...malForme)
					return
				}
				for (const ref of collectDeltaRefs(effet)) {
					if (idsPortes.has(ref.id)) continue
					errors.push(
						anomalie(
							'reference-pendante',
							'error',
							`L'effet « ${DELTAS[ref.delta].label} » de « ${feuilleDe(chemin.path)} » pointe « ${ref.id} », qui n'existe pas dans ce dossier.`,
							site.location,
							siteEffet.path,
							ref.id,
						),
					)
				}
			})
		}
	}

	// 8 — Les PORTES DE RÉVÉLATION. Une clé inconnue est bloquante ; l'absence des
	// quatre portes n'est qu'un avertissement — c'est peut-être un savoir que
	// l'auteur ne veut jamais voir se révéler de lui-même.
	for (const site of sitesDe(input, CHEMIN_SAVOIRS, 'Personnages')) {
		const savoir = site.valeur
		if (!estObjet(savoir)) continue
		const designation = designerSavoir(savoir, site.path)
		const revele = savoir.revele_si
		if (estObjet(revele)) {
			for (const cle of Object.keys(revele)) {
				if ((PORTES_DE_REVELATION as readonly string[]).includes(cle)) continue
				errors.push(
					anomalie(
						'porte-inconnue',
						'error',
						`Le savoir « ${designation} » porte une condition de révélation « ${cle} » qui n'existe pas dans le format (attendu : confiance minimale, jet, contrepartie, ou indice préalable).`,
						site.location,
						`${site.path}.revele_si.${cle}`,
					),
				)
			}
		}
		const posee = estObjet(revele) && PORTES_DE_REVELATION.some((porte) => revele[porte] !== undefined)
		if (!posee) {
			warnings.push(
				anomalie(
					'revelation-sans-porte',
					'warning',
					`Le savoir « ${designation} » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement.`,
					site.location,
					`${site.path}.revele_si`,
				),
			)
		}
	}

	// 8 bis — LES CINQ FAMILLES DE CONDITIONS (D1), en deux temps disjoints.
	//
	// La FORME appartient à `validateExpr` — opérateur, clés, arité, profondeur, et
	// jusqu'à la bonne forme d'une cible, préfixe d'espace de noms compris. Ce qui
	// reste ICI est la seule RÉSOLUTION : `collectRefs` n'étant appelée que si
	// `validateExpr` est muette, elle ne rend que des identifiants BIEN FORMÉS, et
	// résoudre se réduit à une appartenance à l'ensemble des identifiants portés
	// par le dossier (`idsPortes`, relevé au § 5). Deux anomalies pour une seule
	// cause seraient du bruit.
	for (const famille of FAMILLES_DE_CONDITIONS) {
		// Le jumeau prose, retrouvé par le PORTEUR commun (`charpente.fins[0]`) : les
		// deux chemins ne diffèrent que par leur feuille.
		const textes = new Map<string, unknown>()
		for (const site of sitesDe(input, famille.texte, famille.location)) textes.set(parentDe(site.path), site.valeur)

		for (const site of sitesDe(input, famille.expr, famille.location)) {
			if (site.valeur === undefined) {
				const texte = textes.get(parentDe(site.path))
				// D1 : une condition en prose sans son jumeau structuré AVERTIT — sur une
				// FIN et un OBJECTIF seulement. Ailleurs (jalon, événement, étape de plan),
				// un déclenchement laissé à la main du narrateur est légitime et calme.
				if (!famille.alerteSansExpr || typeof texte !== 'string' || texte.trim() === '') continue
				warnings.push(
					anomalie(
						'condition-sans-expr',
						'warning',
						`Le champ « ${feuilleDe(famille.texte)} » décrit une condition en prose, mais aucune condition structurée correspondante n'est posée : elle ne sera jamais vérifiée automatiquement.`,
						site.location,
						`${parentDe(site.path)}.${feuilleDe(famille.texte)}`,
					),
				)
				continue
			}

			const malFormee = validateExpr(site.valeur, { path: site.path, location: site.location })
			if (malFormee.length > 0) {
				errors.push(...malFormee)
				continue
			}

			for (const ref of collectRefs(site.valeur)) {
				if (idsPortes.has(ref.id)) continue
				errors.push(
					anomalie(
						'reference-pendante',
						'error',
						`Le prédicat « ${PREDICATES[ref.predicat].label} » de « ${feuilleDe(site.path)} » pointe « ${ref.id} », qui n'existe pas dans ce dossier.`,
						site.location,
						site.path,
						ref.id,
					),
				)
			}
		}
	}

	// 9 — Les BUDGETS DE MOTS : des AVERTISSEMENTS. Ils ne dégradent rien, ne
	// bloquent rien, et `ok` reste vrai. La borne est une constante nommée, jamais
	// un nombre en dur ici (KR-165), et son NOM ne fuit jamais dans le texte.
	for (const budget of BUDGETS_DE_MOTS) {
		if (racinesManquantes.has(budget.path)) continue
		for (const site of sitesDe(input, budget.path, budget.location)) {
			const mots = compterMotsDe(site.valeur)
			if (mots <= budget.budget) continue
			warnings.push(
				anomalie(
					'texte-trop-long',
					'warning',
					`${budget.sujet} compte ${mots} mots ; le budget conseillé est de ${budget.budget}.`,
					site.location,
					site.path,
				),
			)
		}
	}

	const ok = errors.length === 0
	// Le gel en profondeur, ici et nulle part ailleurs dans le module dossier
	// (KR-166) : un dossier validé est en lecture seule dès l'import, et toute
	// écriture ultérieure clone.
	//
	// On gèle une COPIE, jamais l'argument. Geler `input` en place rendrait
	// `validateDossier` impure au pire endroit : un appelant qui valide un
	// brouillon pour l'afficher verrait son brouillon devenir immuable, et la
	// mutation suivante JETTERAIT (module ESM = mode strict).
	//
	// Le clone passe par JSON, et c'est la bonne sémantique, pas un pis-aller :
	// un dossier est PAR CONTRAT un document JSON — il vient de `JSON.parse` et
	// il repart en `JSON.stringify` vers `PersistenceService`. Cloner par JSON,
	// c'est donc rendre exactement ce qui sera persisté, sans qu'aucune valeur
	// non sérialisable puisse survivre à la validation en attendant de
	// disparaître silencieusement à l'écriture. (`structuredClone` conserverait
	// davantage — et n'existe pas dans l'environnement jsdom des tests.)
	return {
		ok,
		dossier: ok ? deepFreeze(JSON.parse(JSON.stringify(input)) as Dossier) : null,
		errors,
		warnings,
	}
}
