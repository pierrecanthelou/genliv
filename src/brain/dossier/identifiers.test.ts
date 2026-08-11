import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import {
	collectIds,
	COLLECTIONS_IDENTIFIEES,
	decrireValeur,
	defineRegistre,
	ESPACES_DE_NOMS,
	estIdentifiantBienForme,
	feuilleDe,
	FORME_IDENTIFIANT,
	frapperIdentifiant,
	identifiantsDupliques,
	type EspaceDeNoms,
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
	it('evenement et climat sont des espaces de noms', () => {
		// Sans eux, une anomalie portée par un événement ou un climat n'aurait aucun
		// OÙ à résoudre, et l'intégrité référentielle d'it4 n'aurait pas de cible.
		expect(Object.keys(ESPACES_DE_NOMS).sort()).toEqual([
			'bestiaire',
			'climat',
			'evenement',
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
		expect(ESPACES_DE_NOMS.evenement.label).toBe('Événement')
		expect(ESPACES_DE_NOMS.climat.label).toBe('Climat')
	})

	it('chaque collection identifiee porte un espace de noms declare', () => {
		expect(COLLECTIONS_IDENTIFIEES).toHaveLength(10)
		for (const collection of COLLECTIONS_IDENTIFIEES) {
			expect(ESPACES_DE_NOMS[collection.espace]).toBeDefined()
		}
		expect(COLLECTIONS_IDENTIFIEES.map((c) => c.path)).toContain('monde.evenements')
		expect(COLLECTIONS_IDENTIFIEES.map((c) => c.path)).toContain('monde.conditions.climat')
		// `bestiaire` est un espace de RÉFÉRENCE : aucune collection du dossier ne le
		// porte, il résout contre le bestiaire du jeu.
		expect(COLLECTIONS_IDENTIFIEES.map((c) => c.espace)).not.toContain('bestiaire')
	})

	it('decrireValeur ne laisse jamais fuir undefined dans une phrase', () => {
		// La propriété que sa docstring affirme, et la raison pour laquelle elle existe
		// plutôt qu'un `String(valeur)` nu (KR-164/KR-169) : un champ absent doit se
		// dire « vide », jamais « undefined ». Elle a TROIS appelants depuis
		// l'itération 4 (`validate.ts`, `expr.ts`, `deltas.ts`), d'où son domicile ici.
		expect(decrireValeur(undefined)).toBe('vide')
		expect(decrireValeur(null)).toBe('vide')
		expect(decrireValeur('   ')).toBe('vide')
		expect(decrireValeur('du texte')).toBe('du texte')
		expect(decrireValeur(42)).toBe('42')
		expect(decrireValeur(false)).toBe('false')
		expect(decrireValeur([1, 2])).toBe('une liste')
		expect(decrireValeur({ a: 1 })).toBe('un objet')
	})

	it('defineRegistre rend la table INTACTE et infere ses cles', () => {
		// Factory d'IDENTITÉ : elle n'existe que pour son effet de TYPE — épingler la
		// valeur, inférer l'union des clés — et ne doit rien transformer au passage.
		// Ses trois appelants (`ESPACES_DE_NOMS`, `PREDICATES`, `DELTAS`) dérivent leur
		// union par `keyof typeof`, donc une copie ou un gel silencieux se verrait ici.
		const table = { a: { label: 'A' }, b: { label: 'B' } }

		const registre = defineRegistre<{ label: string }>()(table)

		expect(registre).toBe(table)
		expect(Object.keys(registre)).toEqual(['a', 'b'])
		// L'union des clés est bien INFÉRÉE (`'a' | 'b'`) et non élargie à `string` :
		// une clé absente ne compile pas.
		// @ts-expect-error — `c` n'est pas une clé de la table passée.
		expect(registre.c).toBeUndefined()
	})

	it('feuilleDe retire l indice de tableau', () => {
		expect(feuilleDe('monde.evenements[3].monstre_ref')).toBe('monstre_ref')
		expect(feuilleDe('charpente.depart.lieu_id')).toBe('lieu_id')
		expect(feuilleDe('charpente.jalons[0]')).toBe('jalons')
		expect(feuilleDe('id')).toBe('id')
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

	it('une frappe est bien formee dans CHAQUE espace de noms du registre', () => {
		// PROPRIÉTÉ, pas un exemple : la liste des espaces est DÉRIVÉE du registre, de
		// sorte qu'un espace ajouté demain est éprouvé sans qu'on y pense. L'échec se
		// NOMME par l'espace fautif (KR-157), jamais par un compte.
		const espaces = Object.keys(ESPACES_DE_NOMS) as EspaceDeNoms[]

		const malFormes = espaces.filter((espace) => !estIdentifiantBienForme(frapperIdentifiant(espace), espace))

		expect(malFormes).toEqual([])
		expect(espaces.length).toBeGreaterThan(0) // discriminant : la boucle a bien tourné
		// La frappe est LIÉE à son espace : celle d'un objectif n'est pas un lieu. Sans
		// cette ligne, un préfixe constant passerait la boucle ci-dessus pour un espace.
		expect(estIdentifiantBienForme(frapperIdentifiant('objectif'), 'lieu')).toBe(false)
		// Et jamais le `_` de `createId` — refusé par `FORME_IDENTIFIANT`, donc refusé
		// par le validateur à la relecture du dossier.
		expect(frapperIdentifiant('objectif')).not.toContain('_')
	})

	it('deux frappes successives ne collisionnent pas', () => {
		const premiere = frapperIdentifiant('objectif')
		const seconde = frapperIdentifiant('objectif')

		expect(premiere).not.toBe(seconde)
		// Une source constante se verrait immédiatement sur une poignée de tirages ; la
		// forme, elle, est déjà tenue par le test ci-dessus.
		const frappes = Array.from({ length: 50 }, () => frapperIdentifiant('objectif'))
		expect(new Set(frappes).size).toBe(frappes.length)
	})

	it('collectIds releve chaque entite avec son chemin et son nom', () => {
		const collectes = collectIds(fixture())

		// 1 objectif + 1 pnj + 1 lieu + 1 objet + 2 indices + 1 quête + 1 événement
		// + 1 climat + 1 jalon + 1 fin.
		expect(collectes).toHaveLength(11)
		const personnage = collectes.find((c) => c.espace === 'pnj')
		expect(personnage?.id).toBe('pnj.aldur-le-sage')
		expect(personnage?.path).toBe('monde.personnages[0].id')
		expect(personnage?.location).toBe('Personnage « Aldûr le Sage »')
		// Les deux collections neuves sont relevées comme les autres.
		const climat = collectes.find((c) => c.espace === 'climat')
		expect(climat?.id).toBe('climat.pluie-de-cendres')
		expect(climat?.path).toBe('monde.conditions.climat[0].id')
		expect(collectes.find((c) => c.espace === 'evenement')?.location).toBe("Événement « L'embuscade du Fanal »")
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
