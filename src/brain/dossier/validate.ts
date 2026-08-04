import { BUDGET_MOTS_CANON, DOSSIER_SCHEMA, type Dossier } from './types'
import type { DossierIssue, DossierIssueCode, DossierIssueSeverity } from './issues'
import { collectIds, estIdentifiantBienForme, estObjet, identifiantsDupliques, resoudreChemin } from './identifiers'
import { deepFreeze } from './freeze'

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
 * obligatoires et les blocs de canon vivent dans trois TABLES déclaratives.
 * Étendre le schéma à l'itération 2, c'est ajouter des lignes, pas des branches.
 */
export interface DossierValidation {
	/** Vrai si et seulement si `errors` est vide. Un avertissement ne bloque jamais. */
	ok: boolean
	/** Le dossier typé et GELÉ en profondeur — non nul si et seulement si `ok`. */
	dossier: Dossier | null
	errors: DossierIssue[]
	warnings: DossierIssue[]
}

/** Ce qu'une racine obligatoire doit être : un objet, ou une liste. */
type GenreDeRacine = 'objet' | 'liste'

interface RacineObligatoire {
	/** Chemin JSON depuis la racine du dossier — c'est lui que le message nomme. */
	path: string
	genre: GenreDeRacine
	/** OÙ : le nom lisible de la section, jamais le chemin seul. */
	location: string
}

/**
 * Les treize racines du schéma 1, plus les trois conteneurs de groupe qui les
 * portent. Absente ou du mauvais genre → `racine-manquante`, bloquant.
 */
const RACINES: readonly RacineObligatoire[] = [
	{ path: 'canon', genre: 'objet', location: 'Canon' },
	{ path: 'canon.mj', genre: 'objet', location: 'Canon (MJ)' },
	{ path: 'canon.partage', genre: 'objet', location: 'Canon (partagé)' },
	{ path: 'canon.interdits_ton', genre: 'liste', location: 'Interdits de ton' },
	{ path: 'canon.objectifs', genre: 'liste', location: 'Objectifs' },
	{ path: 'monde', genre: 'objet', location: 'Monde' },
	{ path: 'monde.personnages', genre: 'liste', location: 'Personnages' },
	{ path: 'monde.lieux', genre: 'liste', location: 'Lieux' },
	{ path: 'monde.objets', genre: 'liste', location: 'Objets' },
	{ path: 'monde.indices', genre: 'liste', location: 'Indices' },
	{ path: 'monde.quetes', genre: 'liste', location: 'Quêtes' },
	{ path: 'monde.evenements', genre: 'liste', location: 'Événements' },
	{ path: 'monde.conditions', genre: 'objet', location: 'Conditions' },
	{ path: 'charpente', genre: 'objet', location: 'Charpente' },
	{ path: 'charpente.depart', genre: 'objet', location: 'Point de départ' },
	{ path: 'charpente.jalons', genre: 'liste', location: 'Jalons' },
	{ path: 'charpente.fins', genre: 'liste', location: 'Fins' },
]

interface ChampRequis {
	path: string
	location: string
}

/**
 * Les champs de texte OBLIGATOIRES. Absent, non textuel ou vide → bloquant.
 * Tout ce qui n'est pas dans cette table est OPTIONNEL : un optionnel absent est
 * un état informationnel calme, il n'apparaît ni dans `errors` ni dans
 * `warnings`. C'est le cas du `nom` d'une entité, que le repli
 * « {Type} n°{index} (sans nom) » rend lisible sans jamais alerter.
 */
const CHAMPS_REQUIS: readonly ChampRequis[] = [
	{ path: 'id', location: 'Dossier' },
	{ path: 'titre', location: 'Dossier' },
	{ path: 'createdAt', location: 'Dossier' },
	{ path: 'updatedAt', location: 'Dossier' },
	{ path: 'canon.mj.synopsis_mj', location: 'Canon (MJ)' },
	{ path: 'canon.partage.accroche_joueur', location: 'Canon (partagé)' },
	{ path: 'canon.ton', location: 'Canon' },
	{ path: 'charpente.depart.lieu_id', location: 'Point de départ' },
	{ path: 'charpente.depart.texte_ouverture_joueur', location: 'Point de départ' },
]

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

/** Les blocs de canon soumis au budget de mots (avertissement, jamais blocage). */
const BLOCS_DE_CANON: readonly ChampRequis[] = [
	{ path: 'canon.mj', location: 'Canon (MJ)' },
	{ path: 'canon.partage', location: 'Canon (partagé)' },
]

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

/** La feuille d'un chemin pointé — ce que le message appelle « le champ ». */
function feuilleDe(path: string): string {
	const dernier = path.lastIndexOf('.')
	return dernier === -1 ? path : path.slice(dernier + 1)
}

function compterMots(texte: string): number {
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
		const valeur = resoudreChemin(input, champ.path)
		if (typeof valeur === 'string' && valeur.trim() !== '') continue
		errors.push(
			anomalie(
				'champ-requis-vide',
				'error',
				`Le champ « ${feuilleDe(champ.path)} » est vide alors qu'il est obligatoire.`,
				champ.location,
				champ.path,
			),
		)
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

	// 5 — L'UNIQUE référence de l'itération 1 : `charpente.depart.lieu_id` doit
	// résoudre vers un `monde.lieux[].id`. Une référence orpheline est exposée, pas
	// silencieuse (KR-021). Le reste de l'intégrité référentielle arrive en it3/it4.
	const lieuIdManquant = racinesManquantes.has('charpente.depart') || racinesManquantes.has('monde.lieux')
	const lieuId = resoudreChemin(input, 'charpente.depart.lieu_id')
	if (!lieuIdManquant && typeof lieuId === 'string' && lieuId.trim() !== '') {
		const lieux = resoudreChemin(input, 'monde.lieux')
		const resout = Array.isArray(lieux) && lieux.some((lieu) => estObjet(lieu) && lieu.id === lieuId)
		if (!resout) {
			errors.push(
				anomalie(
					'reference-pendante',
					'error',
					"Le point de départ pointe un lieu qui n'existe pas dans ce dossier.",
					'Point de départ',
					'charpente.depart.lieu_id',
					lieuId,
				),
			)
		}
	}

	// 6 — Le budget de mots du canon : un AVERTISSEMENT. Il ne dégrade rien, ne
	// bloque rien, et `ok` reste vrai. La borne est la constante nommée, jamais un
	// nombre en dur ici (KR-165), et son NOM ne fuit jamais dans le texte.
	for (const bloc of BLOCS_DE_CANON) {
		if (racinesManquantes.has(bloc.path)) continue
		const mots = compterMotsDe(resoudreChemin(input, bloc.path))
		if (mots <= BUDGET_MOTS_CANON) continue
		warnings.push(
			anomalie(
				'canon-trop-long',
				'warning',
				`Le canon compte ${mots} mots ; le budget conseillé est de ${BUDGET_MOTS_CANON}.`,
				bloc.location,
				bloc.path,
			),
		)
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
