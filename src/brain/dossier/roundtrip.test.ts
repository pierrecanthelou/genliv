import fs from 'node:fs'
import path from 'node:path'
import { createDossierService } from '../DossierService'
import { createEventBus } from '../EventBus'
import { createLocalStoragePersistence } from '../PersistenceService'
import { dossierKey } from '../persistenceKeys'
import { validateDossier } from './validate'

const DOSSIER_MODULE = __dirname
const CHEMIN_FIXTURE = path.join(DOSSIER_MODULE, '__fixtures__', 'dossier-minimal.json')

/** Le TEXTE du fichier réel, lu du disque (KR-156) — jamais un littéral inline. */
function texteFixture(): string {
	return fs.readFileSync(CHEMIN_FIXTURE, 'utf8')
}

/**
 * Le VRAI magasin : il sérialise réellement, et c'est ce qui rend le round-trip
 * honnête — un magasin en mémoire qui rendrait la même RÉFÉRENCE prouverait
 * l'égalité par identité, pas par contenu.
 */
function setup() {
	const persistence = createLocalStoragePersistence()
	const events = createEventBus()
	return { persistence, events, dossiers: createDossierService(persistence, events) }
}

describe('roundtrip', () => {
	beforeEach(() => window.localStorage.clear())

	it('la fixture lue du disque survit a import puis export', () => {
		const { dossiers } = setup()
		const texte = texteFixture()
		const attendu = JSON.parse(texte) as unknown

		const inspection = dossiers.importDossier(texte)
		expect(inspection.statut).toBe('valid')

		const exporte = dossiers.exportDossier('dossier-minimal')

		// Deep-equal : rien n'a été ajouté, rien n'a été normalisé, rien n'a été perdu.
		expect(exporte).toEqual(attendu)
		// Et le document exporté se relit : le round-trip est fermé.
		expect(validateDossier(JSON.parse(JSON.stringify(exporte))).ok).toBe(true)
	})

	it('le document est gele quel que soit le chemin d obtention', () => {
		const { dossiers } = setup()

		const inspection = dossiers.importDossier(texteFixture())
		expect(inspection.statut).toBe('valid')
		if (inspection.statut !== 'valid') return

		// Chemin 1 — la sortie de l'import.
		expect(Object.isFrozen(inspection.dossier)).toBe(true)
		expect(Object.isFrozen(inspection.dossier.charpente.jalons[0])).toBe(true)

		// Chemin 2 — la relecture par le service.
		const relu = dossiers.get('dossier-minimal')
		expect(Object.isFrozen(relu)).toBe(true)
		expect(Object.isFrozen(relu?.canon.interdits_ton)).toBe(true)

		// Chemin 3 — l'export.
		expect(Object.isFrozen(dossiers.exportDossier('dossier-minimal'))).toBe(true)
	})

	it('un dossier adopte derriere le service ressort gele et re-valide', () => {
		// Ce que fait l'adoption cloud : écrire sous le magasin local, sans passer par
		// le service. La lecture doit quand même geler et re-valider (désaccord 6).
		const { dossiers, persistence } = setup()
		persistence.set(dossierKey('dossier-minimal'), JSON.parse(texteFixture()))

		const adopte = dossiers.get('dossier-minimal')

		expect(adopte).not.toBeNull()
		expect(Object.isFrozen(adopte)).toBe(true)
		expect(Object.isFrozen(adopte?.monde.personnages[0])).toBe(true)
	})
})

describe('freeze', () => {
	// Construit par morceaux pour que CE fichier ne soit pas lui-même une occurrence.
	const APPEL_DE_GEL = ['Object', 'freeze'].join('.')

	function fichiersTypeScript(racine: string): string[] {
		return fs
			.readdirSync(racine, { withFileTypes: true })
			.flatMap((entree) =>
				entree.isDirectory()
					? fichiersTypeScript(path.join(racine, entree.name))
					: entree.name.endsWith('.ts')
						? [path.join(racine, entree.name)]
						: [],
			)
	}

	it('le gel n a quun seul site dans le module dossier', () => {
		const porteurs = fichiersTypeScript(DOSSIER_MODULE)
			.filter((fichier) => fs.readFileSync(fichier, 'utf8').includes(APPEL_DE_GEL))
			.map((fichier) => path.basename(fichier))

		// Un second site de gel rendrait indécidable « ce document a-t-il été validé ? »
		// et une écriture du Temps 2 passerait inaperçue (KR-166).
		expect(porteurs).toEqual(['freeze.ts'])
	})

	it('deepFreeze n est appele qu une fois, en sortie de validateDossier', () => {
		const appels = fichiersTypeScript(DOSSIER_MODULE)
			.filter((fichier) => !fichier.endsWith('.test.ts') && !fichier.endsWith('freeze.ts'))
			.flatMap((fichier) => {
				const source = fs.readFileSync(fichier, 'utf8')
				const occurrences = source.match(/deepFreeze\(/g) ?? []
				return occurrences.map(() => path.basename(fichier))
			})

		expect(appels).toEqual(['validate.ts'])
	})
})

/**
 * LE SENS DE LA SCISSION `types.ts` / `tree.ts` — la propriété centrale de
 * l'itération, et la seule chose qui rende KR-167 vérifiable.
 *
 * `tree.ts` porte le modèle d'arbre (condamné : n° 2 puis n° 9) et importe les
 * types de RÈGLES depuis `types.ts` (conservés, consommés par `src/player/`).
 * Jamais l'inverse. Tant que l'asymétrie tient, démolir l'arbre en n° 9 est une
 * suppression de fichier ; le jour où `types.ts` importe `tree.ts`, les deux
 * modèles sont noués et le convertisseur `Book` ↔ `Dossier` que KR-167 interdit
 * devient la solution évidente.
 *
 * Jusqu'ici cette propriété n'était portée que par un COMMENTAIRE. Rien
 * n'empêchait l'itération 2 de l'annuler sans qu'un test rougisse.
 */
describe('scission types.ts / tree.ts', () => {
	const BRAIN = path.join(__dirname, '..')

	function source(fichier: string): string {
		return fs.readFileSync(path.join(BRAIN, fichier), 'utf8')
	}

	it('types.ts n importe JAMAIS tree.ts', () => {
		expect(source('types.ts')).not.toMatch(/from\s+['"]\.\/tree['"]/)
	})

	it('tree.ts importe bien types.ts — l asymetrie est orientee, pas absente', () => {
		// Sans cette seconde assertion, le test ci-dessus passerait aussi si les deux
		// fichiers étaient devenus indépendants ou si `tree.ts` avait disparu.
		expect(source('tree.ts')).toMatch(/from\s+['"]\.\/types['"]/)
	})

	it('aucun fichier du module dossier ne connait le modele d arbre', () => {
		// Le dossier ignore l'arbre : c'est ce qui rend impossible d'écrire une
		// conversion sans que quelqu'un ait à ajouter l'import d'abord (KR-167).
		const coupables = fs
			.readdirSync(DOSSIER_MODULE)
			.filter((nom) => nom.endsWith('.ts'))
			.filter((nom) => /from\s+['"]\.\.\/tree['"]/.test(fs.readFileSync(path.join(DOSSIER_MODULE, nom), 'utf8')))

		expect(coupables).toEqual([])
	})
})
