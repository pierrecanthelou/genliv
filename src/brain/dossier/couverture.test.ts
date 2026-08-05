import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import { DESTINATION_DES_CHAMPS } from './destinations'

/**
 * LE SCHÉMA EST ÉCRIT TROIS FOIS — une fois comme types (`types.ts`), une fois
 * comme tables déclaratives (`validate.ts`), une fois comme audiences
 * (`destinations.ts`) — et rien ne relie les trois. Les fondre produirait un DSL
 * de schéma à spécifier, versionner et tester : pire que la dérive qu'il corrige.
 * Ce qui doit être unique n'est pas la table, c'est le GARDE — ce fichier.
 *
 * Il ferme la boucle par la FIXTURE, seul document dont on sait qu'il est
 * complet, et il échoue par NOM de champ, jamais par un compte.
 *
 * DEUX corrections de l'instrument de l'itération 1, toutes deux mesurées :
 *  · il descend en PLEINE PROFONDEUR et ENTRE DANS LES TABLEAUX. L'ancien
 *    s'arrêtait à deux niveaux et excluait `Array.isArray` — or tous les champs
 *    de l'itération 2 vivent dans des tableaux : il serait resté VERT sur du code
 *    faux ;
 *  · le critère passe de la SUPPRESSION à la CORRUPTION. « Supprimer une clé doit
 *    faire échouer la validation » était total tant que toute clé de la fixture
 *    était obligatoire ; dès qu'un optionnel y entre (`revele_si`, `monstre_ref`),
 *    la suppression est légitime. La corruption — remplacer la feuille par une
 *    valeur du MAUVAIS TYPE — subsume la suppression et vaut pour les optionnels
 *    contraints.
 *
 * UN SEUL walker, exporté, réutilisé par les trois assertions : deux balayeurs de
 * profondeurs différentes sur la même fixture divergeraient en silence — c'est
 * précisément le mode de défaillance que ce test existe pour interdire.
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')
const MODULE_DOSSIER = __dirname

type Doc = Record<string, unknown>

/** La fixture, LUE DU DISQUE à chaque appel (KR-156) — jamais un littéral inline. */
function fixture(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Doc
}

export interface FeuilleDeFixture {
	/** Chemin à indices EFFACÉS : `monde.evenements[].monstre_ref`. */
	normalise: string
	/** Chemin réel, indices compris : `monde.evenements[0].monstre_ref`. */
	concret: string
	valeur: unknown
}

/**
 * Toutes les feuilles terminales d'un document, en pleine profondeur, tableaux
 * inclus. Une feuille est ce qui ne se descend plus : une valeur scalaire, mais
 * aussi un objet ou un tableau VIDE — sinon `effet: [{}]` disparaîtrait du
 * balayage, et c'est exactement le champ que l'itération 2 fige.
 *
 * Les indices sont NORMALISÉS : sans cela, ajouter un second personnage
 * doublerait les chemins et le test échouerait par cardinalité au lieu d'échouer
 * par nom de champ. Chaque INSTANCE est conservée à part, parce que la couverture
 * n'est acquise que si CHACUNE rougit — une règle qui ne contrôlerait que `[0]`
 * passerait sinon pour exhaustive.
 */
export function feuillesDeLaFixture(valeur: unknown, normalise = '', concret = ''): FeuilleDeFixture[] {
	if (Array.isArray(valeur) && valeur.length > 0) {
		return valeur.flatMap((element, index) => feuillesDeLaFixture(element, `${normalise}[]`, `${concret}[${index}]`))
	}
	if (estObjetSimple(valeur) && Object.keys(valeur).length > 0) {
		return Object.entries(valeur).flatMap(([cle, enfant]) =>
			feuillesDeLaFixture(
				enfant,
				normalise === '' ? cle : `${normalise}.${cle}`,
				concret === '' ? cle : `${concret}.${cle}`,
			),
		)
	}
	return [{ normalise, concret, valeur }]
}

function estObjetSimple(valeur: unknown): valeur is Doc {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/** Les clés successives d'un chemin concret : `a.b[2].c` → `a`, `b`, 2, `c`. */
function decouper(chemin: string): (string | number)[] {
	const cles: (string | number)[] = []
	for (const segment of chemin.split('.')) {
		cles.push(segment.replace(/\[\d+\]/g, ''))
		for (const marqueur of segment.match(/\[\d+\]/g) ?? []) cles.push(Number(marqueur.slice(1, -1)))
	}
	return cles
}

/** Remplace la feuille par une valeur du MAUVAIS TYPE, sur une copie. */
function corrompre(doc: Doc, chemin: string): Doc {
	const copie = JSON.parse(JSON.stringify(doc)) as Doc
	const cles = decouper(chemin)
	let courant: unknown = copie
	for (const cle of cles.slice(0, -1)) courant = (courant as Record<string | number, unknown>)[cle]
	const derniere = cles[cles.length - 1]
	const porteur = courant as Record<string | number, unknown>
	porteur[derniere] = typeof porteur[derniere] === 'string' ? 42 : 'du texte a la place'
	return copie
}

/** Le motif partagé des `nom` — écrit une fois, chaque chemin restant nommé. */
const NOM_LIBRE =
	"« nom » est OPTIONNEL et libre : une valeur non textuelle retombe sur le repli « {Type} n°{index} (sans nom) », jamais sur une anomalie. C'est la doctrine absent ≠ vide de l'itération 1."

/**
 * Les feuilles dont la corruption ne fait PAS échouer la validation, chacune
 * avec son motif. Toute entrée devenue inutile fait rougir le test de disjonction
 * plus bas : une liste d'exceptions doit être AUTO-NETTOYANTE (BUG-044).
 */
const LIBRES: Record<string, string> = {
	'canon.interdits_ton[]':
		"consigne de ton libre : la RACINE est vérifiée comme liste (itération 1), le contenu de ses éléments n'est arbitré par aucune règle du schéma 1.",
	'canon.objectifs[].nom': NOM_LIBRE,
	'monde.personnages[].nom': NOM_LIBRE,
	'monde.personnages[].plan_actions[].etape':
		"l'ordre d'une étape : aucune règle d'ordonnancement (unicité, continuité, départ à 1) n'est arbitrée au schéma 1 — les déclencheurs arrivent en itération 3.",
	'monde.personnages[].savoirs[].revele_comment':
		'didascalie OPTIONNELLE et libre : son absence est calme, et aucune règle ne contraint sa forme.',
	'monde.personnages[].savoirs[].revele_si.apres_indice_id':
		"porte optionnelle : sa RÉSOLUTION vers monde.indices est l'intégrité référentielle de l'itération 3 ; l'itération 2 ne ferme que la LISTE des portes reconnues.",
	'monde.lieux[].nom': NOM_LIBRE,
	'monde.objets[].nom': NOM_LIBRE,
	'monde.indices[].nom': NOM_LIBRE,
	'monde.quetes[].nom': NOM_LIBRE,
	'monde.evenements[].nom': NOM_LIBRE,
	'monde.conditions.climat[].nom': NOM_LIBRE,
	'charpente.jalons[].nom': NOM_LIBRE,
	'charpente.fins[].nom': NOM_LIBRE,
}

/**
 * Les feuilles auxquelles on refuse une audience, chacune avec son motif. VIDE
 * aujourd'hui : au schéma 1, tout champ terminal est classable en `ia` / `moteur`
 * / `auteur`. Elle est gardée sous la même assertion de disjonction — une
 * dispense qui nomme un champ DÉJÀ classé absorberait la disparition de sa ligne.
 */
const SANS_DESTINATION: Record<string, string> = {}

/** Les chemins normalisés dont CHAQUE instance corrompue fait échouer la validation. */
function couvertsParCorruption(): string[] {
	const rougit = new Map<string, boolean>()
	for (const feuille of feuillesDeLaFixture(fixture())) {
		const casse = validateDossier(corrompre(fixture(), feuille.concret)).ok === false
		rougit.set(feuille.normalise, (rougit.get(feuille.normalise) ?? true) && casse)
	}
	return [...rougit].filter(([, couvert]) => couvert).map(([chemin]) => chemin)
}

/** Les chemins normalisés de la fixture, dédupliqués. */
function cheminsDeLaFixture(): string[] {
	return [...new Set(feuillesDeLaFixture(fixture()).map((feuille) => feuille.normalise))]
}

describe('couverture', () => {
	it('la fixture est valide et sans avertissement, sinon le balayage ne mesure rien', () => {
		const resultat = validateDossier(fixture())

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('toute feuille corrompue est refusee, ou nommee dans LIBRES', () => {
		const couverts = couvertsParCorruption()

		const nonCouverts = cheminsDeLaFixture()
			.filter((chemin) => !couverts.includes(chemin))
			.filter((chemin) => LIBRES[chemin] === undefined)

		expect(nonCouverts).toEqual([])
	})

	it('toute feuille a une destination, ou est nommee dans SANS_DESTINATION', () => {
		const sansAudience = cheminsDeLaFixture()
			.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] === undefined)
			.filter((chemin) => SANS_DESTINATION[chemin] === undefined)

		expect(sansAudience).toEqual([])
	})

	it('aucune ligne morte dans DESTINATION_DES_CHAMPS', () => {
		// Une ligne qui ne correspond à aucune feuille de la fixture ne déclare
		// l'audience de rien : elle survit à la raison qui l'a créée.
		const chemins = cheminsDeLaFixture()

		expect(Object.keys(DESTINATION_DES_CHAMPS).filter((chemin) => !chemins.includes(chemin))).toEqual([])
	})

	it('une dispense nommant une feuille deja couverte est morte', () => {
		// Une dispense ne dispense alors de rien — mais elle ABSORBERAIT la perte de
		// la règle qu'elle nomme. Elle doit tomber, et se nommer en tombant.
		const couverts = couvertsParCorruption()

		expect(Object.keys(LIBRES).filter((chemin) => couverts.includes(chemin))).toEqual([])
		expect(Object.keys(SANS_DESTINATION).filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== undefined)).toEqual([])
	})

	it('le walker de couverture n est ecrit qu une fois dans le module dossier', () => {
		// Construit par morceaux pour que la présence de CE littéral ne suffise pas à
		// faire passer le test si la fonction disparaissait (même patron que le
		// test-grep du gel).
		const SIGNATURE = ['function feuilles', 'DeLaFixture'].join('')

		const porteurs = fs
			.readdirSync(MODULE_DOSSIER)
			.filter((nom) => nom.endsWith('.ts'))
			.filter((nom) => fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8').includes(SIGNATURE))

		expect(porteurs).toEqual(['couverture.test.ts'])
	})

	it('le balayage entre reellement dans les tableaux et normalise les indices', () => {
		// Discriminant de l'instrument lui-même : l'ancien walker s'arrêtait à deux
		// niveaux et ignorait les tableaux — ces trois chemins lui étaient invisibles.
		const chemins = cheminsDeLaFixture()

		expect(chemins).toContain('monde.personnages[].savoirs[].revele_si.jet.carac')
		expect(chemins).toContain('monde.evenements[].resolutions[].consequence[]')
		expect(chemins).toContain('charpente.jalons[].enonce_texte')
		// Normalisation : les deux indices de la fixture donnent UN chemin, pas deux.
		expect(chemins.filter((chemin) => chemin === 'monde.indices[].id')).toHaveLength(1)
	})
})
