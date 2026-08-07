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

	it('toutes les formes neuves survivent import puis export', () => {
		// Le round-trip global ci-dessus prouve l'égalité PROFONDE ; celui-ci nomme
		// les formes de l'itération 2 une par une, pour qu'une clé perdue en route
		// échoue en se nommant plutôt qu'en produisant un diff d'objet illisible.
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const exporte = dossiers.exportDossier('dossier-minimal')

		expect(exporte).not.toBeNull()
		if (exporte === null) return

		const personnage = exporte.monde.personnages[0]
		expect(personnage.portee).toBe('premier')
		expect(personnage.plan_actions[0].etape).toBe(1)
		expect(personnage.plan_actions[0].action.length).toBeGreaterThan(0)

		const savoir = personnage.savoirs[0]
		expect(savoir.indice_id).toBe('indice.sceau-brise')
		expect(savoir.certitude).toBe('sait')
		expect(savoir.revele_comment?.length).toBeGreaterThan(0)
		expect(savoir.revele_si?.confiance_min).toBe(1)
		expect(savoir.revele_si?.jet).toEqual({ carac: 'CA', tc: 'TC2' })
		expect(savoir.revele_si?.contrepartie).toEqual({ objet_id: 'objet.clef-de-basalte', consomme: false })
		expect(savoir.revele_si?.apres_indice_id).toBe('indice.cendres-tiedes')

		const evenement = exporte.monde.evenements[0]
		expect(evenement.monstre_ref).toBe('bestiaire.gobelin')
		expect(evenement.resolutions[0].resultat.length).toBeGreaterThan(0)

		const jalon = exporte.charpente.jalons[0]
		expect(jalon.enonce_texte.length).toBeGreaterThan(0)
		expect(jalon.declencheur_texte.length).toBeGreaterThan(0)
		expect(exporte.charpente.fins[0].condition_texte.length).toBeGreaterThan(0)

		// Le document exporté reste RE-VALIDABLE et GELÉ jusqu'aux formes profondes.
		expect(validateDossier(JSON.parse(JSON.stringify(exporte))).ok).toBe(true)
		expect(Object.isFrozen(savoir.revele_si)).toBe(true)
		expect(Object.isFrozen(savoir.revele_si?.contrepartie)).toBe(true)
		expect(Object.isFrozen(evenement.resolutions[0].consequence[0])).toBe(true)
	})

	it('un dossier portant de vrais effets traverse import puis export intact', () => {
		// La preuve de bout en bout de l'itération 4, en l'absence d'écran (KR-156) : des
		// effets STRUCTURÉS partent d'un FICHIER RÉEL, traversent la validation, le gel,
		// la persistance et l'export sans qu'une clé soit perdue ni une cible aplatie.
		// Chaque emplacement est nommé un par un — un diff d'objet global dirait « ça a
		// changé » sans dire où.
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const exporte = dossiers.exportDossier('dossier-minimal')

		expect(exporte).not.toBeNull()
		if (exporte === null) return

		expect(exporte.monde.quetes[0].recompense).toEqual([{ delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }])
		// DEUX effets dans une même liste : l'ordre est du contenu, pas un détail — un
		// export qui les réordonnerait changerait ce que le moteur appliquera.
		expect(exporte.monde.evenements[0].resolutions[0].consequence).toEqual([
			{ delta: 'atteindre_jalon', cibles: ['jalon.premiere-nuit'] },
			{ delta: 'reveler_indice', cibles: ['indice.cendres-tiedes'] },
		])
		expect(exporte.monde.evenements[0].resolutions[1].consequence).toEqual([
			{ delta: 'retirer_objet', cibles: ['objet.clef-de-basalte'] },
		])
		// La liste VIDE du climat survit comme une liste vide, jamais comme un absent :
		// c'est exactement la distinction que `LISTES_REQUISES` protège.
		expect(exporte.monde.conditions.climat[0].effets_regles).toEqual([])
		expect(exporte.charpente.jalons[0].effet).toEqual([{ delta: 'reveler_indice', cibles: ['indice.sceau-brise'] }])

		// Le document exporté reste RE-VALIDABLE, et l'effet est GELÉ jusqu'à sa cible.
		expect(validateDossier(JSON.parse(JSON.stringify(exporte))).ok).toBe(true)
		expect(Object.isFrozen(exporte.charpente.jalons[0].effet)).toBe(true)
		expect(Object.isFrozen(exporte.charpente.jalons[0].effet[0])).toBe(true)
		expect(Object.isFrozen(exporte.charpente.jalons[0].effet[0].cibles)).toBe(true)
	})

	it('un arbre a 3 niveaux traverse import puis export intact', () => {
		// La preuve de bout en bout de l'itération 3, en l'absence d'écran (KR-156) :
		// un arbre de condition part d'un FICHIER RÉEL, traverse la validation, le gel,
		// la persistance et l'export sans qu'un niveau soit aplati ni une clé perdue.
		const { dossiers } = setup()
		dossiers.importDossier(texteFixture())

		const exporte = dossiers.exportDossier('dossier-minimal')

		expect(exporte).not.toBeNull()
		if (exporte === null) return

		const reussi = exporte.canon.objectifs[0].reussi_si_expr
		expect(reussi).toEqual({
			op: 'et',
			enfants: [
				{ op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] },
				{
					op: 'non',
					enfant: { op: 'predicat', predicat: 'evenement_consomme', cibles: ['evenement.embuscade-du-fanal'] },
				},
			],
		})

		// Les SIX `…_expr` et les QUATRE `…_texte` neufs, nommés un par un : une clé
		// perdue en route échoue en se nommant, jamais par un diff d'objet illisible.
		expect(exporte.canon.objectifs[0].reussi_si_texte?.length).toBeGreaterThan(0)
		expect(exporte.canon.objectifs[0].echoue_si_expr?.op).toBe('ou')
		expect(exporte.canon.objectifs[0].echoue_si_texte?.length).toBeGreaterThan(0)
		expect(exporte.charpente.fins[0].condition_expr?.op).toBe('et')
		expect(exporte.charpente.jalons[0].declencheur_expr?.op).toBe('predicat')
		expect(exporte.monde.evenements[0].declencheur_expr?.op).toBe('predicat')
		expect(exporte.monde.evenements[0].declencheur_texte?.length).toBeGreaterThan(0)
		expect(exporte.monde.personnages[0].plan_actions[0].declencheur_expr?.op).toBe('predicat')
		expect(exporte.monde.personnages[0].plan_actions[0].declencheur_texte?.length).toBeGreaterThan(0)

		// Le document exporté reste RE-VALIDABLE, et l'arbre est GELÉ jusqu'à sa feuille.
		expect(validateDossier(JSON.parse(JSON.stringify(exporte))).ok).toBe(true)
		expect(Object.isFrozen(reussi)).toBe(true)
		if (reussi === undefined || reussi.op !== 'et') return
		expect(Object.isFrozen(reussi.enfants)).toBe(true)
		const nie = reussi.enfants[1]
		expect(Object.isFrozen(nie)).toBe(true)
		if (nie.op !== 'non') return
		expect(Object.isFrozen(nie.enfant)).toBe(true)
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
