import fs from 'node:fs'
import path from 'node:path'
import type { Certitude, Dossier } from './types'
import { CERTITUDES } from './types'
import { CHEMINS_DE_DELTAS } from './tables'
import { validateDossier } from './validate'
import { createDossierService } from '../DossierService'
import { createEventBus } from '../EventBus'
import { createLocalStoragePersistence } from '../PersistenceService'

/**
 * LA SUFFISANCE DU DOSSIER DE RÉFÉRENCE — itération 5.
 *
 * `dossier-reference.json` est un SECOND fichier, distinct de `dossier-minimal.json`
 * (INTOUCHÉE — lue par sept autres suites de tests existantes). Il prouve, par une
 * construction narrative réelle, que le schéma livré (it1-it4) porte assez pour un
 * dossier COMPLET : six personnages, cinq lieux, et sept branches nommées qui
 * échouent par NOM plutôt que par un contrôle à l'œil (KR-157).
 */

const DOSSIER_MODULE = __dirname
const CHEMIN_REFERENCE = path.join(DOSSIER_MODULE, '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(DOSSIER_MODULE, '__fixtures__', 'dossier-minimal.json')

/** Les DEUX fichiers réels, lus du disque (KR-156) — jamais un littéral inline. */
function texteReference(): string {
	return fs.readFileSync(CHEMIN_REFERENCE, 'utf8')
}
function texteMinimal(): string {
	return fs.readFileSync(CHEMIN_MINIMAL, 'utf8')
}

/** Le dossier de référence, VALIDÉ — utilisé par toutes les branches ci-dessous. */
const validation = validateDossier(JSON.parse(texteReference()))
if (!validation.ok || validation.dossier === null) {
	throw new Error(`la fixture dossier-reference.json ne valide pas : ${JSON.stringify(validation.errors)}`)
}
const reference: Dossier = validation.dossier

/**
 * Le chemin ADMISSIBLE, exclu de la 7e branche : `monde.conditions.climat[].effets_regles`
 * est structurellement le SEUL emplacement de `CHEMINS_DE_DELTAS` sans delta admissible —
 * un climat « modifie les règles », opérande entier que le registre `DELTAS` n'accepte pas
 * (décision d'it4, appliquée au § 6 du plan d'it5).
 */
const CIBLE_CLIMAT_EXCLUE = 'monde.conditions.climat[].effets_regles'

/**
 * Résout un chemin de table (segments pointés, `[]` = liste) en la liste des VALEURS
 * portées à ce chemin — même grammaire que `sitesDe` (`validate.ts`), réduite à ce dont ce
 * fichier a besoin : pas de résolution du OÙ, juste les valeurs terminales.
 */
function resoudreCheminDeTable(racine: unknown, chemin: string): unknown[] {
	let valeurs: unknown[] = [racine]
	for (const segment of chemin.split('.')) {
		const estListe = segment.endsWith('[]')
		const cle = estListe ? segment.slice(0, -2) : segment
		valeurs = valeurs.flatMap((valeur) => {
			if (valeur === null || typeof valeur !== 'object') return []
			const enfant = (valeur as Record<string, unknown>)[cle]
			if (!estListe) return [enfant]
			return Array.isArray(enfant) ? enfant : []
		})
	}
	return valeurs
}

/** Un chemin de `CHEMINS_DE_DELTAS` porte au moins un `Delta` instancié quelque part. */
function contientUnDelta(dossier: Dossier, chemin: string): boolean {
	return resoudreCheminDeTable(dossier, chemin).some((valeur) => Array.isArray(valeur) && valeur.length > 0)
}

/**
 * Les effets `atteindre_jalon` portés AILLEURS que par le propre `effet[]` du jalon visé —
 * `quetes[].recompense`, `evenements[].resolutions[].consequence`, et l'`effet[]` des
 * AUTRES jalons.
 */
function jalonAtteignableParDeltaAilleurs(dossier: Dossier, jalonId: string): boolean {
	const ailleurs = [
		...dossier.monde.quetes.flatMap((quete) => quete.recompense),
		...dossier.monde.evenements.flatMap((evenement) =>
			evenement.resolutions.flatMap((resolution) => resolution.consequence),
		),
		...dossier.charpente.jalons.filter((jalon) => jalon.id !== jalonId).flatMap((jalon) => jalon.effet),
	]
	return ailleurs.some((delta) => delta.delta === 'atteindre_jalon' && delta.cibles.includes(jalonId))
}

/** Les certitudes qui ne sont PAS `sait` — dérivées du registre, jamais re-listées.
 *  Annotée en `Certitude[]` : sans elle, `filter` narrove le type à `'croit'|'soupconne'`
 *  et `.includes(savoir.certitude: Certitude)` refuse l'argument à la compilation — un cast
 *  serait alors la seule échappatoire, exactement le patron que KR-175 met en garde. */
const CERTITUDES_NON_SAIT: Certitude[] = CERTITUDES.filter((certitude) => certitude !== 'sait')

/**
 * LA CHECKLIST DE SUFFISANCE — sept branches nommées (§ 6 critère 2 du plan). Chaque
 * échec se NOMME par sa branche, jamais par un contrôle à l'œil (KR-157).
 */
const BRANCHES: ReadonlyArray<{ nom: string; predicat: (d: Dossier) => boolean }> = [
	{
		nom: 'portee=second',
		predicat: (d) => d.monde.personnages.some((personnage) => personnage.portee === 'second'),
	},
	{
		nom: 'fin avec …_expr',
		predicat: (d) => d.charpente.fins.some((fin) => fin.condition_expr !== undefined),
	},
	{
		nom: 'savoir avec porte apres_indice',
		predicat: (d) =>
			d.monde.personnages.some((personnage) =>
				personnage.savoirs.some((savoir) => savoir.revele_si?.apres_indice_id !== undefined),
			),
	},
	{
		nom: 'jalon sans declencheur_expr mais atteignable par un delta atteindre_jalon',
		predicat: (d) =>
			d.charpente.jalons.some(
				(jalon) => jalon.declencheur_expr === undefined && jalonAtteignableParDeltaAilleurs(d, jalon.id),
			),
	},
	{
		nom: 'événement sans declencheur_texte ni declencheur_expr',
		predicat: (d) =>
			d.monde.evenements.some(
				(evenement) => evenement.declencheur_texte === undefined && evenement.declencheur_expr === undefined,
			),
	},
	{
		nom: 'certitude non-sait (croit ou soupçonne) sur au moins un savoir',
		predicat: (d) =>
			d.monde.personnages.some((personnage) =>
				personnage.savoirs.some((savoir) => CERTITUDES_NON_SAIT.includes(savoir.certitude)),
			),
	},
	{
		nom: 'delta sur chaque cible ADMISSIBLE',
		predicat: (d) =>
			CHEMINS_DE_DELTAS.filter((chemin) => chemin.path !== CIBLE_CLIMAT_EXCLUE).every((chemin) =>
				contientUnDelta(d, chemin.path),
			),
	},
]

function branche(nom: string): (d: Dossier) => boolean {
	const trouvee = BRANCHES.find((candidate) => candidate.nom === nom)
	if (trouvee === undefined) throw new Error(`branche inconnue de la checklist de suffisance : ${nom}`)
	return trouvee.predicat
}

/** Les clés JSON, à TOUTE PROFONDEUR — collectées une fois par document, jamais un compte. */
function clesProfondes(valeur: unknown, acc: Set<string> = new Set()): Set<string> {
	if (Array.isArray(valeur)) {
		for (const element of valeur) clesProfondes(element, acc)
		return acc
	}
	if (valeur !== null && typeof valeur === 'object') {
		for (const [cle, enfant] of Object.entries(valeur as Record<string, unknown>)) {
			acc.add(cle)
			clesProfondes(enfant, acc)
		}
		return acc
	}
	return acc
}

function setupService() {
	const persistence = createLocalStoragePersistence()
	const events = createEventBus()
	return createDossierService(persistence, events)
}

describe('suffisance du dossier de reference', () => {
	beforeEach(() => window.localStorage.clear())

	it('le dossier de reference valide sans erreur ni avertissement', () => {
		const resultat = validateDossier(JSON.parse(texteReference()))

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('chaque branche de la checklist de suffisance est non vide', () => {
		const manquantes = BRANCHES.filter((b) => !b.predicat(reference)).map((b) => b.nom)

		expect(manquantes).toEqual([])
	})

	it('les branches sont DISCRIMINANTES : la fixture minimale en manque exactement quatre', () => {
		// Preuve que les prédicats savent aussi rendre `false`, pas seulement `true` sur la
		// référence — sans ce test, une branche toujours vraie (comme « scène figée » avant
		// son retrait, plan § 8) passerait inaperçue. Les trois autres branches (fin avec
		// …_expr, savoir avec porte apres_indice, delta sur chaque cible admissible) sont
		// DÉJÀ vraies sur dossier-minimal.json — ce test épingle le partage exact, pas un
		// « tout est faux » de complaisance.
		const minimal = validateDossier(JSON.parse(texteMinimal()))
		if (!minimal.ok || minimal.dossier === null) throw new Error('dossier-minimal.json ne valide pas')

		const manquantes = BRANCHES.filter((b) => !b.predicat(minimal.dossier as Dossier)).map((b) => b.nom)

		expect(manquantes).toEqual([
			'portee=second',
			'jalon sans declencheur_expr mais atteignable par un delta atteindre_jalon',
			'événement sans declencheur_texte ni declencheur_expr',
			'certitude non-sait (croit ou soupçonne) sur au moins un savoir',
		])
	})

	it('portee=second est instanciee', () => {
		expect(branche('portee=second')(reference)).toBe(true)
	})

	it('une fin porte condition_expr', () => {
		expect(branche('fin avec …_expr')(reference)).toBe(true)
	})

	it('un savoir porte une porte apres_indice', () => {
		expect(branche('savoir avec porte apres_indice')(reference)).toBe(true)
	})

	it('un jalon sans declencheur_expr est atteignable par un delta', () => {
		expect(branche('jalon sans declencheur_expr mais atteignable par un delta atteindre_jalon')(reference)).toBe(true)
	})

	it('un evenement sans declencheur_texte ni declencheur_expr', () => {
		expect(branche('événement sans declencheur_texte ni declencheur_expr')(reference)).toBe(true)
	})

	it('une certitude non-sait est instanciee', () => {
		expect(branche('certitude non-sait (croit ou soupçonne) sur au moins un savoir')(reference)).toBe(true)
	})

	it('delta sur chaque cible admissible', () => {
		expect(branche('delta sur chaque cible ADMISSIBLE')(reference)).toBe(true)
	})

	it('aucune cle en trop face a dossier-minimal', () => {
		const clesReference = clesProfondes(JSON.parse(texteReference()))
		const clesMinimal = clesProfondes(JSON.parse(texteMinimal()))

		const enTrop = [...clesReference].filter((cle) => !clesMinimal.has(cle))

		expect(enTrop).toEqual([])
	})

	it('le compte de sites de deltas parcourus egale CHEMINS_DE_DELTAS.length', () => {
		// Le parcours est DÉRIVÉ de la table entière, jamais d'une sous-liste choisie à la
		// main : un cinquième emplacement ajouté demain grossit `sites` automatiquement et,
		// s'il reste sans delta, se nomme dans `manquants` plutôt que de passer inaperçu.
		const sites = CHEMINS_DE_DELTAS.map((chemin) => ({
			path: chemin.path,
			admissible: chemin.path !== CIBLE_CLIMAT_EXCLUE,
			possede: contientUnDelta(reference, chemin.path),
		}))

		expect(sites).toHaveLength(CHEMINS_DE_DELTAS.length)

		const manquants = sites.filter((site) => site.admissible && !site.possede).map((site) => site.path)
		expect(manquants).toEqual([])

		// Discriminant : le seul chemin NON admissible est bien celui du climat, et il
		// n'est PAS exigé — sans cette ligne, un `every` toujours vrai passerait aussi si
		// le filtre d'admissibilité ne filtrait rien.
		const exclus = sites.filter((site) => !site.admissible).map((site) => site.path)
		expect(exclus).toEqual([CIBLE_CLIMAT_EXCLUE])
	})

	it('le dossier de reference traverse import puis export intact', () => {
		const dossiers = setupService()
		const texte = texteReference()
		const attendu = JSON.parse(texte) as unknown

		const inspection = dossiers.importDossier(texte)
		expect(inspection.statut).toBe('valid')

		const exporte = dossiers.exportDossier(reference.id)

		expect(exporte).toEqual(attendu)
		expect(validateDossier(JSON.parse(JSON.stringify(exporte))).ok).toBe(true)
	})
})
