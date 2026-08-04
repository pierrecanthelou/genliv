import fs from 'node:fs'
import path from 'node:path'
import { createDossierService } from './DossierService'
import { createEventBus } from './EventBus'
import { createLocalStoragePersistence } from './PersistenceService'
import { dossierKey, DOSSIER_KEY_PREFIX } from './persistenceKeys'

const CHEMIN_FIXTURE = path.join(__dirname, 'dossier', '__fixtures__', 'dossier-minimal.json')

/** Le jumeau de la liste de `dossier/validate.test.ts` — trois mots, recopiés plutôt
 *  qu'extraits : un module partagé à deux appelants de test serait de la dette. */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

/** Le TEXTE du fichier réel, lu du disque (KR-156) — jamais un littéral inline. */
function texteFixture(): string {
	return fs.readFileSync(CHEMIN_FIXTURE, 'utf8')
}

/**
 * Le VRAI magasin (comme `BookService.test.ts`) : il sérialise réellement, donc
 * il ne peut pas rendre par mégarde la même RÉFÉRENCE que celle qu'on a écrite —
 * ce qui prouverait le gel et le round-trip par identité au lieu du contenu.
 */
function setup() {
	const persistence = createLocalStoragePersistence()
	const events = createEventBus()
	const dossiers = createDossierService(persistence, events)
	return { persistence, events, dossiers }
}

describe('DossierService', () => {
	beforeEach(() => window.localStorage.clear())

	it('importDossier persiste un dossier conforme et le rend valide', () => {
		const { dossiers, persistence } = setup()

		const inspection = dossiers.importDossier(texteFixture())

		expect(inspection.statut).toBe('valid')
		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([dossierKey('dossier-minimal')])
		expect(dossiers.get('dossier-minimal')?.titre).toBe('Le sceau du Gouffre')
	})

	it('get re-valide et ne rend jamais le brut', () => {
		const { dossiers, persistence } = setup()

		// Écrit DERRIÈRE le service — exactement ce que fait l'adoption cloud.
		persistence.set(dossierKey('corrompu'), { schema: 2, id: 'corrompu', titre: 'Venu du cloud' })

		expect(dossiers.get('corrompu')).toBeNull()
		expect(dossiers.exportDossier('corrompu')).toBeNull()
		// Discriminant : le document EST bien dans le magasin ; c'est la lecture qui
		// le refuse, pas son absence.
		expect(persistence.get(dossierKey('corrompu'))).not.toBeNull()
	})

	it('get rend un dossier gele en profondeur, quel que soit le chemin', () => {
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const dossier = dossiers.get('dossier-minimal')

		expect(dossier).not.toBeNull()
		if (dossier === null) return
		expect(Object.isFrozen(dossier)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux[0])).toBe(true)
	})

	it('get rend null sur un identifiant inconnu', () => {
		const { dossiers } = setup()
		expect(dossiers.get('jamais-vu')).toBeNull()
		expect(dossiers.exportDossier('jamais-vu')).toBeNull()
	})

	it('deux imports du meme contenu : le second est refuse', () => {
		const { dossiers, persistence, events } = setup()
		const crees: string[] = []
		events.on('dossier:created', ({ dossierId }) => crees.push(dossierId))

		dossiers.importDossier(texteFixture())
		const premier = JSON.stringify(persistence.get(dossierKey('dossier-minimal')))

		// Le second fichier porte le MÊME identifiant mais un titre différent : si
		// l'import écrasait, le titre changerait.
		const modifie = JSON.parse(texteFixture()) as Record<string, unknown>
		modifie.titre = 'Une seconde version'
		const seconde = dossiers.importDossier(JSON.stringify(modifie))

		expect(seconde.statut).toBe('invalid')
		if (seconde.statut !== 'invalid') return
		expect(seconde.errors.map((e) => e.code)).toEqual(['dossier-deja-importe'])
		expect(seconde.errors[0].message).toContain('Le sceau du Gouffre')
		// Le huitième code que `validate.test.ts` délègue ici : il est le seul produit
		// par le magasin et non par le validateur, donc le seul que le balayage du
		// critère #4 ne peut pas atteindre. Même exigence, même liste (KR-164).
		for (const fuite of FUITES_TECHNIQUES) {
			expect(seconde.errors[0].message.toLowerCase()).not.toContain(fuite)
		}
		expect(seconde.errors[0].location).not.toBe('')
		expect(seconde.errors[0].path).not.toBe('')
		// Aucun écrasement, et aucun second événement.
		expect(JSON.stringify(persistence.get(dossierKey('dossier-minimal')))).toBe(premier)
		expect(crees).toEqual(['dossier-minimal'])
	})

	it('un fichier illisible ne persiste rien et n emet rien', () => {
		const { dossiers, events, persistence } = setup()
		const emis: string[] = []
		events.on('dossier:created', ({ dossierId }) => emis.push(dossierId))

		expect(dossiers.importDossier('').statut).toBe('file-error')
		expect(dossiers.importDossier('{ tronqué').statut).toBe('file-error')

		expect(persistence.keys(DOSSIER_KEY_PREFIX)).toEqual([])
		expect(emis).toEqual([])
	})

	it('dossier:created est emis APRES la resolution de la persistance', () => {
		const { dossiers, events, persistence } = setup()
		let vuDansLeMagasin: unknown = null

		events.on('dossier:created', ({ dossierId }) => {
			// L'abonné lit le magasin AU MOMENT de la notification : il doit déjà y
			// trouver le dossier (KR-004).
			vuDansLeMagasin = persistence.get(dossierKey(dossierId))
		})

		dossiers.importDossier(texteFixture())

		expect(vuDansLeMagasin).not.toBeNull()
		expect((vuDansLeMagasin as { titre: string }).titre).toBe('Le sceau du Gouffre')
	})

	it('open emet dossier:opened une seule fois, dans l ordre', () => {
		const { dossiers, events } = setup()
		const journal: string[] = []
		events.on('dossier:created', () => journal.push('created'))
		events.on('dossier:opened', () => journal.push('opened'))

		dossiers.importDossier(texteFixture())
		dossiers.open('dossier-minimal')

		expect(journal).toEqual(['created', 'opened'])
	})

	it('open sur un dossier absent ou corrompu n emet rien', () => {
		const { dossiers, events, persistence } = setup()
		const ouverts: string[] = []
		events.on('dossier:opened', ({ dossierId }) => ouverts.push(dossierId))

		dossiers.open('jamais-vu')
		persistence.set(dossierKey('corrompu'), { schema: 2, id: 'corrompu' })
		dossiers.open('corrompu')

		// Un `dossier:opened` sur une clé sans dossier lisible enverrait la
		// réconciliation cloud chercher ce qui n'existe pas.
		expect(ouverts).toEqual([])
	})

	it('exportDossier rend le document re-validable', () => {
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const exporte = dossiers.exportDossier('dossier-minimal')

		expect(exporte).not.toBeNull()
		expect(exporte?.schema).toBe(1)
		expect(Object.isFrozen(exporte)).toBe(true)
	})
})
