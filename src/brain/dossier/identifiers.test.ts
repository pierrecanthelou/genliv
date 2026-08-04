import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import {
	collectIds,
	ESPACES_DE_NOMS,
	estIdentifiantBienForme,
	FORME_IDENTIFIANT,
	identifiantsDupliques,
} from './identifiers'

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

type Doc = Record<string, unknown>

/** La fixture, LUE DU DISQUE à chaque appel (KR-156). */
function fixture(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Doc
}

const obj = (value: unknown): Doc => value as Doc
const arr = (value: unknown): Doc[] => value as Doc[]

describe('identifiers', () => {
	it('les espaces de noms forment un ensemble ferme de neuf', () => {
		expect(Object.keys(ESPACES_DE_NOMS).sort()).toEqual([
			'bestiaire',
			'fin',
			'indice',
			'jalon',
			'lieu',
			'objectif',
			'objet',
			'pnj',
			'quete',
		])
		expect(ESPACES_DE_NOMS.pnj.label).toBe('Personnage')
	})

	it('la forme accepte un prefixe connu suivi de minuscules chiffres et tirets', () => {
		expect(FORME_IDENTIFIANT.test('lieu.val-cendre')).toBe(true)
		expect(FORME_IDENTIFIANT.test('pnj.aldur-2')).toBe(true)
		// Discriminants : préfixe inconnu, majuscule, accent, espace, point manquant.
		expect(FORME_IDENTIFIANT.test('endroit.val-cendre')).toBe(false)
		expect(FORME_IDENTIFIANT.test('lieu.Val-Cendre')).toBe(false)
		expect(FORME_IDENTIFIANT.test('lieu.val cendre')).toBe(false)
		expect(FORME_IDENTIFIANT.test('lieu.vallée')).toBe(false)
		expect(FORME_IDENTIFIANT.test('valcendre')).toBe(false)
		expect(FORME_IDENTIFIANT.test('lieu.')).toBe(false)
	})

	it('un identifiant range dans le mauvais espace de noms est mal forme', () => {
		expect(estIdentifiantBienForme('lieu.val-cendre', 'lieu')).toBe(true)
		expect(estIdentifiantBienForme('lieu.val-cendre', 'pnj')).toBe(false)
	})

	it('collectIds releve chaque entite avec son chemin et son nom', () => {
		const collectes = collectIds(fixture())

		expect(collectes).toHaveLength(8) // 1 objectif + 5 collections du monde + 1 jalon + 1 fin
		const personnage = collectes.find((c) => c.espace === 'pnj')
		expect(personnage?.id).toBe('pnj.aldur-le-sage')
		expect(personnage?.path).toBe('monde.personnages[0].id')
		expect(personnage?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('collectIds reste total sur une entree non fiable', () => {
		expect(collectIds(null)).toEqual([])
		expect(collectIds(42)).toEqual([])
		expect(collectIds({ monde: { lieux: 'pas une liste' } })).toEqual([])
		expect(collectIds({ monde: { lieux: [null] } })[0].id).toBeNull()
	})

	it('identifiantsDupliques ne retient que ce qui est reellement en double', () => {
		const collectes = [
			{ id: 'lieu.a', espace: 'lieu' as const, path: 'p1', location: 'l1' },
			{ id: 'lieu.b', espace: 'lieu' as const, path: 'p2', location: 'l2' },
			{ id: 'lieu.a', espace: 'lieu' as const, path: 'p3', location: 'l3' },
			{ id: null, espace: 'lieu' as const, path: 'p4', location: 'l4' },
			{ id: null, espace: 'lieu' as const, path: 'p5', location: 'l5' },
		]

		// Deux identifiants ABSENTS ne sont pas un doublon — ils sont deux manques.
		expect([...identifiantsDupliques(collectes)]).toEqual(['lieu.a'])
	})

	it('un identifiant hors espace de noms est bloquant', () => {
		const doc = fixture()
		arr(obj(doc.monde).personnages)[0].id = 'heros.aldur-le-sage'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'identifiant-invalide')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.entityId).toBe('heros.aldur-le-sage')
		expect(anomalie?.path).toBe('monde.personnages[0].id')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
		expect(anomalie?.message).toContain('heros.aldur-le-sage')
	})

	it('un identifiant range dans la mauvaise collection est bloquant', () => {
		const doc = fixture()
		// Bien formé au sens général, mais rangé dans `personnages`.
		arr(obj(doc.monde).personnages)[0].id = 'lieu.aldur-le-sage'

		const anomalie = validateDossier(doc).errors.find((e) => e.code === 'identifiant-invalide')

		expect(anomalie?.entityId).toBe('lieu.aldur-le-sage')
	})

	it('deux entites partageant un identifiant sont refusees', () => {
		const doc = fixture()
		arr(obj(doc.monde).objets).push({ id: 'objet.clef-de-basalte', nom: 'Une clef de contrebande' })

		const resultat = validateDossier(doc)
		const doublons = resultat.errors.filter((e) => e.code === 'identifiant-duplique')

		expect(resultat.ok).toBe(false)
		// LES DEUX occurrences sont signalées et NOMMÉES : ne signaler que la seconde
		// laisserait l'auteur chercher la première.
		expect(doublons).toHaveLength(2)
		expect(doublons.map((e) => e.location)).toEqual(['Objet « Clef de basalte »', 'Objet « Une clef de contrebande »'])
		expect(doublons.map((e) => e.path)).toEqual(['monde.objets[0].id', 'monde.objets[1].id'])
		expect(doublons.every((e) => e.entityId === 'objet.clef-de-basalte')).toBe(true)
	})

	it('une collision ENTRE deux collections nomme les deux porteurs, chacun par son defaut', () => {
		const doc = fixture()
		// L'espace de noms rend une collision inter-collections IMPOSSIBLE entre deux
		// identifiants bien formés : `jalon.x` ne peut être bien formé que sous
		// `charpente.jalons`. Une collision ne survient donc qu'avec un identifiant
		// rangé au mauvais endroit — et les deux porteurs doivent être signalés,
		// chacun par le défaut qui est le sien.
		arr(obj(doc.charpente).fins)[0].id = 'jalon.premiere-nuit'

		const errors = validateDossier(doc).errors
		const surLaFin = errors.find((e) => e.path === 'charpente.fins[0].id')
		const surLeJalon = errors.find((e) => e.path === 'charpente.jalons[0].id')

		expect(surLaFin?.code).toBe('identifiant-invalide') // rangé au mauvais endroit
		expect(surLaFin?.location).toBe('Fin « Le sceau refermé »')
		expect(surLeJalon?.code).toBe('identifiant-duplique') // son identifiant lui est volé
		expect(surLeJalon?.location).toBe('Jalon « La première nuit à Val-Cendre »')
	})
})
