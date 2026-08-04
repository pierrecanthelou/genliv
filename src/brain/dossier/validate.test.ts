import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import { BUDGET_MOTS_CANON, DOSSIER_SCHEMA } from './types'
import { DOSSIER_ISSUE_LABELS, dossierIssueRemediation, type DossierIssue, type DossierIssueCode } from './issues'

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

type Doc = Record<string, unknown>

/**
 * La fixture, LUE DU DISQUE à chaque appel (KR-156) — jamais un littéral inline.
 * Un nouvel objet à chaque fois : le validateur GÈLE ce qu'il rend, donc une
 * fixture partagée entre deux tests deviendrait immuable au premier.
 */
function fixture(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Doc
}

const obj = (value: unknown): Doc => value as Doc
const arr = (value: unknown): Doc[] => value as Doc[]

/** Les sous-chaînes qui trahissent une erreur runtime sérialisée (KR-164). */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

function codes(issues: readonly DossierIssue[]): DossierIssueCode[] {
	return issues.map((i) => i.code)
}

describe('validateDossier', () => {
	it('la fixture minimale passe sans erreur', () => {
		const resultat = validateDossier(fixture())

		expect(resultat.ok).toBe(true)
		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.dossier).not.toBeNull()
		expect(resultat.dossier?.titre).toBe('Le sceau du Gouffre')
		expect(resultat.dossier?.charpente.depart.lieu_id).toBe('lieu.val-cendre')
	})

	it('schema absent / chaine / 0 / 2 est refuse', () => {
		const cas: unknown[] = [undefined, '1', 0, 2, 1.5, true, null]

		for (const valeurDeSchema of cas) {
			const doc = fixture()
			if (valeurDeSchema === undefined) delete doc.schema
			else doc.schema = valeurDeSchema

			const resultat = validateDossier(doc)

			expect(codes(resultat.errors)).toEqual(['schema-inconnu'])
			expect(resultat.ok).toBe(false)
			// Jamais coercé : aucun dossier ne ressort, et le contenu n'est même pas lu.
			expect(resultat.dossier).toBeNull()
			expect(resultat.errors[0].path).toBe('schema')
		}

		// Discriminant : c'est bien le NOMBRE 1 qui passe, et lui seul.
		const conforme = fixture()
		conforme.schema = DOSSIER_SCHEMA
		expect(validateDossier(conforme).ok).toBe(true)
	})

	it('une racine manquante est bloquante', () => {
		const doc = fixture()
		delete obj(doc.monde).lieux

		const resultat = validateDossier(doc)
		const manquante = resultat.errors.find((e) => e.code === 'racine-manquante')

		expect(resultat.ok).toBe(false)
		expect(manquante).toBeDefined()
		expect(manquante?.path).toBe('monde.lieux') // le path NOMME la racine
		expect(manquante?.message).toContain('monde.lieux')
		expect(manquante?.location).toBe('Lieux')
	})

	it('une racine du mauvais genre est traitee comme manquante', () => {
		const doc = fixture()
		obj(doc.monde).lieux = { 'lieu.val-cendre': {} } // un objet là où une liste est attendue

		const resultat = validateDossier(doc)

		expect(codes(resultat.errors)).toContain('racine-manquante')
	})

	it('un champ obligatoire vide est bloquant', () => {
		const doc = fixture()
		obj(doc.canon).ton = '   '
		arr(obj(doc.monde).personnages)[0].id = ''

		const resultat = validateDossier(doc)
		const surLeTon = resultat.errors.find((e) => e.path === 'canon.ton')
		const surLIdentite = resultat.errors.find((e) => e.path === 'monde.personnages[0].id')

		expect(resultat.ok).toBe(false)
		expect(surLeTon?.code).toBe('champ-requis-vide')
		expect(surLeTon?.message).toContain('« ton »')
		// `location` résout l'entité PAR SON NOM, jamais par son chemin (KR-164).
		expect(surLIdentite?.code).toBe('champ-requis-vide')
		expect(surLIdentite?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('une entite sans nom retombe sur le repli indexe, jamais sur le chemin JSON', () => {
		const doc = fixture()
		const personnages = arr(obj(doc.monde).personnages)
		delete personnages[0].nom
		personnages[0].id = ''

		const anomalie = validateDossier(doc).errors.find((e) => e.path === 'monde.personnages[0].id')

		expect(anomalie?.location).toBe('Personnage n°1 (sans nom)')
	})

	it('un optionnel absent est calme', () => {
		const doc = fixture()
		// `nom` est optionnel : une entité en cours de rédaction n'en porte pas encore.
		delete arr(obj(doc.monde).personnages)[0].nom
		delete arr(obj(doc.charpente).jalons)[0].nom

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('chaque anomalie a un code ferme et un message redige', () => {
		const documents: Doc[] = []

		// Un document par famille d'anomalie, pour que les sept codes que le
		// validateur sait produire soient TOUS observés (le huitième,
		// `dossier-deja-importe`, appartient au magasin — voir DossierService).
		const mauvaisSchema = fixture()
		mauvaisSchema.schema = 2
		documents.push(mauvaisSchema)

		const sansRacine = fixture()
		delete obj(sansRacine.charpente).fins
		documents.push(sansRacine)

		const champVide = fixture()
		obj(obj(champVide.canon).mj).synopsis_mj = ''
		documents.push(champVide)

		const idInvalide = fixture()
		arr(obj(idInvalide.monde).indices)[0].id = 'INDICE.Cendres Tièdes'
		documents.push(idInvalide)

		const idDuplique = fixture()
		arr(obj(idDuplique.monde).objets).push({ id: 'objet.clef-de-basalte', nom: 'Une autre clef' })
		documents.push(idDuplique)

		const referencePendante = fixture()
		obj(obj(referencePendante.charpente).depart).lieu_id = 'lieu.nulle-part'
		documents.push(referencePendante)

		const canonTropLong = fixture()
		obj(obj(canonTropLong.canon).mj).synopsis_mj = 'mot '.repeat(BUDGET_MOTS_CANON + 1)
		documents.push(canonTropLong)

		const observes = new Set<DossierIssueCode>()
		for (const document of documents) {
			const resultat = validateDossier(document)
			for (const anomalie of [...resultat.errors, ...resultat.warnings]) {
				observes.add(anomalie.code)
				// Le code appartient à l'union fermée : le registre a une entrée pour lui.
				expect(DOSSIER_ISSUE_LABELS[anomalie.code]).toBeDefined()
				expect(anomalie.path.length).toBeGreaterThan(0)
				expect(anomalie.location.length).toBeGreaterThan(0)
				expect(anomalie.message.length).toBeGreaterThan(0)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(anomalie.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}

		expect([...observes].sort()).toEqual([
			'canon-trop-long',
			'champ-requis-vide',
			'identifiant-duplique',
			'identifiant-invalide',
			'racine-manquante',
			'reference-pendante',
			'schema-inconnu',
		])
	})

	it('une entree non-objet est refusee sans exception', () => {
		const nonObjets: unknown[] = [null, undefined, 42, 'un texte', [], true]
		for (const entree of nonObjets) {
			expect(() => validateDossier(entree)).not.toThrow()
			expect(validateDossier(entree).ok).toBe(false)
		}

		// Une COLLECTION peuplée de non-objets ne fait pas lever non plus.
		const doc = fixture()
		obj(doc.monde).lieux = [42, 'lieu.val-cendre', null]
		expect(() => validateDossier(doc)).not.toThrow()
		const resultat = validateDossier(doc)
		expect(resultat.ok).toBe(false)
		expect(codes(resultat.errors)).toContain('champ-requis-vide')
	})

	it('depart.lieu_id pendant est bloquant', () => {
		const doc = fixture()
		obj(obj(doc.charpente).depart).lieu_id = 'lieu.nulle-part'

		const resultat = validateDossier(doc)
		const pendante = resultat.errors.find((e) => e.code === 'reference-pendante')

		expect(resultat.ok).toBe(false)
		expect(pendante?.path).toBe('charpente.depart.lieu_id')
		expect(pendante?.entityId).toBe('lieu.nulle-part')
		expect(pendante?.location).toBe('Point de départ')
	})

	it('canon a 600 mots ne declenche rien', () => {
		const doc = fixture()
		obj(obj(doc.canon).mj).synopsis_mj = Array(BUDGET_MOTS_CANON).fill('mot').join(' ')

		const resultat = validateDossier(doc)

		expect(resultat.warnings).toEqual([]) // à la borne EXACTE, rien
		expect(resultat.ok).toBe(true)
	})

	it('canon a 601 mots produit un avertissement non bloquant', () => {
		const doc = fixture()
		obj(obj(doc.canon).mj).synopsis_mj = Array(BUDGET_MOTS_CANON + 1)
			.fill('mot')
			.join(' ')

		const resultat = validateDossier(doc)

		expect(codes(resultat.warnings)).toEqual(['canon-trop-long'])
		expect(resultat.warnings[0].path).toBe('canon.mj')
		expect(resultat.warnings[0].severity).toBe('warning')
		expect(resultat.warnings[0].message).toContain(String(BUDGET_MOTS_CANON + 1))
		// Un avertissement ne bloque rien : `errors` reste vide et `ok` reste vrai.
		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true)
		expect(resultat.dossier).not.toBeNull()
	})

	it('le bloc partage porte le meme budget que le bloc mj', () => {
		const doc = fixture()
		obj(obj(doc.canon).partage).accroche_joueur = Array(BUDGET_MOTS_CANON + 1)
			.fill('mot')
			.join(' ')

		const resultat = validateDossier(doc)

		expect(resultat.warnings.map((w) => w.path)).toEqual(['canon.partage'])
	})
})

describe('freeze', () => {
	it('le dossier rendu est gele a tous les niveaux', () => {
		const resultat = validateDossier(fixture())
		const dossier = resultat.dossier

		expect(dossier).not.toBeNull()
		if (dossier === null) return

		expect(Object.isFrozen(dossier)).toBe(true)
		expect(Object.isFrozen(dossier.canon)).toBe(true)
		expect(Object.isFrozen(dossier.canon.mj)).toBe(true)
		expect(Object.isFrozen(dossier.monde)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux)).toBe(true) // le TABLEAU
		expect(Object.isFrozen(dossier.monde.lieux[0])).toBe(true) // et son entrée
		expect(Object.isFrozen(dossier.canon.interdits_ton)).toBe(true)
		expect(Object.isFrozen(dossier.charpente.depart)).toBe(true)
	})

	it('un document refuse ne rend aucun dossier a geler', () => {
		const doc = fixture()
		doc.schema = 2
		expect(validateDossier(doc).dossier).toBeNull()
	})

	/**
	 * La contrepartie du gel : ce qui est gelé est une COPIE. Sans ce test, rien ne
	 * distingue « geler la sortie » de « geler l'argument de l'appelant », et la
	 * seconde lecture rend `validateDossier` impure au pire endroit — un appelant
	 * qui valide un brouillon pour l'afficher le rendrait immuable, et sa mutation
	 * suivante JETTERAIT (module ESM = mode strict).
	 */
	it('gele une copie et rend l argument INTACT', () => {
		const doc = fixture()
		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(true)
		expect(Object.isFrozen(doc)).toBe(false)
		expect(Object.isFrozen(obj(doc.canon))).toBe(false)
		expect(Object.isFrozen(arr(obj(doc.monde).lieux))).toBe(false)
		// Et l'argument reste réellement mutable, pas seulement non marqué.
		doc.titre = 'Encore modifiable'
		expect(doc.titre).toBe('Encore modifiable')
		// La copie gelée, elle, n'a pas suivi : ce sont deux documents distincts.
		expect(resultat.dossier?.titre).not.toBe('Encore modifiable')
	})
})

/**
 * L'identifiant de dossier est le SEUL champ du fichier qui devient une clé de
 * stockage (`dossierKey`). Sa forme n'est donc pas une coquetterie : `:` est le
 * séparateur réservé du découpage de clés à venir (n° 3 / n° 4).
 */
describe('validateDossier, identifiant de dossier', () => {
	const MAL_FORMES: ReadonlyArray<readonly [string, string]> = [
		['deux-points', 'mon-dossier:content'],
		['espace interne', 'mon dossier'],
		['espace de bord', ' mon-dossier'],
		['majuscule', 'Mon-Dossier'],
		['tiret en tete', '-mon-dossier'],
		['barre oblique', 'mon/dossier'],
		['point', 'mon.dossier'],
	]

	for (const [cas, id] of MAL_FORMES) {
		it(`refuse un id de dossier avec ${cas}`, () => {
			const doc = fixture()
			doc.id = id
			const { ok, errors } = validateDossier(doc)

			expect(ok).toBe(false)
			const anomalie = errors.find((e) => e.path === 'id')
			expect(anomalie?.code).toBe('identifiant-invalide')
			expect(anomalie?.entityId).toBe(id)
			expect(anomalie?.location).toBe('Dossier')
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		})
	}

	it('accepte les formes legitimes', () => {
		for (const id of ['dossier-minimal', 'a', 'a1', '1er-dossier', 'un-tres-long-nom-avec-tirets']) {
			const doc = fixture()
			doc.id = id
			expect(validateDossier(doc).errors.filter((e) => e.path === 'id')).toEqual([])
		}
	})

	it('un id vide reste champ-requis-vide, pas identifiant-invalide', () => {
		const doc = fixture()
		doc.id = '   '
		const codesId = codes(validateDossier(doc).errors.filter((e) => e.path === 'id'))
		// Une seule cause, une seule anomalie : la forme ne se plaint pas en plus du vide.
		expect(codesId).toEqual(['champ-requis-vide'])
	})
})

/**
 * La ligne QUOI FAIRE, isolée de son rendu. Elle est exportée du baril `brain/`
 * et `dossier-controles` (n° 7) la consommera telle quelle : sans assertion, la
 * substitution du marqueur pourrait ne pas se faire — ou porter `location` au
 * lieu de `path` — et tout resterait vert.
 */
describe('dossierIssueRemediation', () => {
	function anomalieDe(code: DossierIssueCode, path: string): DossierIssue {
		return { code, severity: 'error', message: 'peu importe', location: 'Monde', path }
	}

	it('resout le marqueur {racine} par le chemin, pas par le libelle', () => {
		const rendu = dossierIssueRemediation(anomalieDe('racine-manquante', 'monde.lieux'))

		expect(rendu).toContain('monde.lieux')
		expect(rendu).not.toContain('{racine}')
		expect(rendu).not.toContain('Monde') // `location` n'a rien à faire ici
	})

	it('laisse intact un libelle sans marqueur', () => {
		expect(dossierIssueRemediation(anomalieDe('champ-requis-vide', 'canon.ton'))).toBe(
			DOSSIER_ISSUE_LABELS['champ-requis-vide'],
		)
	})

	it('rend une consigne non vide et sans marqueur residuel pour CHACUN des huit codes', () => {
		for (const code of Object.keys(DOSSIER_ISSUE_LABELS) as DossierIssueCode[]) {
			const rendu = dossierIssueRemediation(anomalieDe(code, 'monde.personnages'))

			expect(rendu.trim()).not.toBe('')
			expect(rendu).toMatch(/^↪ /) // l'anatomie du § 3.3 : la consigne se préfixe
			expect(rendu).not.toMatch(/\{[a-z_]+\}/) // aucun marqueur oublié
			for (const fuite of FUITES_TECHNIQUES) {
				expect(rendu.toLowerCase()).not.toContain(fuite)
			}
		}
	})
})

/**
 * LE SCHÉMA EST ÉCRIT DEUX FOIS — une fois comme types (`types.ts`), une fois
 * comme tables déclaratives (`RACINES`, `CHAMPS_REQUIS`) — et rien ne relie les
 * deux. C'est exactement le trou que KR-117 interdit ailleurs dans ce module :
 * l'itération 2 ajoute des racines, une clé typée mais oubliée dans la table
 * devient SILENCIEUSEMENT optionnelle, et aucun test ne rougit.
 *
 * Ce test ferme la boucle par la fixture, qui est le seul document dont on sait
 * qu'il est complet : toute clé qu'elle porte doit être couverte par une règle.
 * Il échoue par NOM de clé non couverte, pas par un compte.
 */
describe('exhaustivite des tables du validateur', () => {
	/** Tout chemin pointé porté par le document, jusqu'au deuxième niveau. */
	function cheminsDuDocument(doc: Doc): string[] {
		const chemins: string[] = []
		for (const [cle, valeur] of Object.entries(doc)) {
			chemins.push(cle)
			if (estObjetSimple(valeur)) {
				for (const sousCle of Object.keys(valeur)) chemins.push(`${cle}.${sousCle}`)
			}
		}
		return chemins
	}

	function estObjetSimple(v: unknown): v is Doc {
		return typeof v === 'object' && v !== null && !Array.isArray(v)
	}

	it('toute cle de la fixture est couverte par une regle, ou explicitement dispensee', () => {
		/**
		 * Les dispenses sont NOMMÉES, et la liste est VIDE aujourd'hui : au schéma 1,
		 * toute clé de la fixture est réellement couverte par une règle.
		 *
		 * Elle est laissée en place parce que l'itération 2 en aura besoin — mais
		 * sous l'assertion de disjonction ci-dessous, sans laquelle une dispense
		 * absorberait SILENCIEUSEMENT la disparition de la règle qu'elle nomme.
		 * C'était le cas de la première version de ce test : douze dispenses toutes
		 * déjà couvertes, donc douze règles qu'on pouvait perdre sans rougir — le
		 * mode de défaillance que ce test est censé interdire.
		 */
		const DISPENSES = new Set<string>([])

		const couverts = new Set<string>()
		const resultat = validateDossier(fixture())
		expect(resultat.ok).toBe(true)

		// On reconstruit la couverture en cassant chaque clé une par une : une clé
		// couverte par une règle produit une anomalie quand on la retire. C'est plus
		// fort que de relire les tables — ça teste le VALIDATEUR, pas sa déclaration.
		for (const chemin of cheminsDuDocument(fixture())) {
			const doc = fixture()
			const segments = chemin.split('.')
			if (segments.length === 1) delete doc[segments[0]]
			else delete (doc[segments[0]] as Doc)[segments[1]]

			if (!validateDossier(doc).ok) couverts.add(chemin)
		}

		// Une dispense qui nomme une clé DÉJÀ couverte est morte : elle ne dispense
		// de rien, mais elle absorberait la perte de la règle. Elle doit tomber.
		expect([...DISPENSES].filter((dispense) => couverts.has(dispense))).toEqual([])

		const nonCouverts = cheminsDuDocument(fixture())
			.filter((chemin) => !couverts.has(chemin))
			.filter((chemin) => !DISPENSES.has(chemin))

		expect(nonCouverts).toEqual([])
	})
})
