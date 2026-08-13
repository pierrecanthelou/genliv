import fs from 'node:fs'
import path from 'node:path'
import { ESLint } from 'eslint'

/**
 * REMPLACE `featureDirs.test.ts` (supprimé le 2026-08-13).
 *
 * L'ancien test vérifiait qu'un LITTÉRAL (`FEATURE_DIRS` dans `.eslintrc.cjs`)
 * était à jour du disque. C'était la seule chose qui empêchait une feature neuve
 * d'être SILENCIEUSEMENT exemptée des règles d'isolation — un garde de liste,
 * pas un garde de comportement.
 *
 * `.eslintrc.cjs` dérive désormais la liste du disque (`readdirSync`), donc la
 * classe de panne a disparu par construction : il n'y a plus de liste à tenir à
 * jour. Ce qui reste à prouver n'est plus « la liste est juste » mais « les
 * règles MORDENT » — c'est ce que ce fichier fait, en lançant le VRAI ESLint
 * avec la VRAIE configuration du dépôt sur des extraits synthétiques.
 *
 * Chaque cas porte son DISCRIMINANT : à côté de tout extrait qui doit être
 * refusé, un extrait voisin qui doit passer. Un test qui n'assert que des refus
 * reste vert le jour où la règle refuse tout.
 *
 * CE QUE CE FICHIER NE COUVRE PAS : il lint du TEXTE, pas le dépôt. Que le
 * dépôt réel soit propre est la charge de `npm run lint`, pas de celle-ci.
 */

const RACINE = path.join(__dirname, '..', '..', '..', '..')
const RACINE_FEATURES = path.join(RACINE, 'src', 'features')

/** Les features réelles, lues du disque — la même source que `.eslintrc.cjs`. */
function featuresDuDisque(): string[] {
	return fs
		.readdirSync(RACINE_FEATURES, { withFileTypes: true })
		.filter((entree) => entree.isDirectory())
		.map((entree) => entree.name)
		.sort()
}

let eslint: ESLint

beforeAll(() => {
	eslint = new ESLint({ cwd: RACINE })
})

/** Les messages produits par le VRAI ESLint du dépôt sur un extrait synthétique. */
async function messages(code: string, cheminRelatif: string): Promise<string[]> {
	const resultats = await eslint.lintText(code, { filePath: path.join(RACINE, cheminRelatif) })
	return resultats.flatMap((r) => r.messages.map((m) => m.message))
}

const contient = (liste: string[], fragment: string): boolean => liste.some((m) => m.includes(fragment))

/**
 * `rgba(` NE PEUT PAS s ecrire en clair dans ce fichier : la regle de couleur en
 * dur s applique a tout `src/**`, donc AUSSI aux fixtures de son propre test —
 * et depuis que le selecteur cherche la sous-chaine (correctif BUG-027, seconde
 * moitie), une fixture ecrite en clair fait rougir `npm run lint`.
 *
 * Construit par morceaux, exactement comme la signature de
 * `couverture.test.ts` (« un test ne doit pas se satisfaire lui-meme ») — ici la
 * raison est symetrique : il ne doit pas se REFUSER lui-meme. Ce n est pas un
 * contournement de la regle, c est la preuve qu elle mord jusque dans le fichier
 * qui la teste ; un `eslint-disable` aurait cache exactement ce signal.
 */
const RGBA = ['rgb', 'a('].join('')

describe('isolation des features (regles derivees du disque)', () => {
	it('il y a au moins deux features sur le disque, sinon ce fichier ne mesure rien', () => {
		expect(featuresDuDisque().length).toBeGreaterThanOrEqual(2)
	})

	it('tout dossier de src/features est bien une feature (il porte une specification.json)', () => {
		// La derivation `readdirSync` traite TOUT dossier comme une feature. Cette
		// assertion ancre la definition : le jour ou quelqu un depose un
		// `src/features/_shared/`, il devient a la fois un pseudo-bloc `overrides` et
		// un nom banni pour les autres, sans qu aucune erreur ne le dise. C est la
		// seule propriete que l ancien littoral rendait visible et humaine.
		for (const feature of featuresDuDisque()) {
			expect(fs.existsSync(path.join(RACINE_FEATURES, feature, 'specification.json'))).toBe(true)
		}
	})

	it('un import statique vers une AUTRE feature est refuse — pour CHAQUE feature, pas la premiere paire', async () => {
		// Boucle sur toutes les features : une panne dependante d UN NOM particulier
		// (cf. l ancrage par segment du selecteur dynamique) est invisible si on ne
		// sonde que `featuresDuDisque()[0]` et `[1]`.
		const features = featuresDuDisque()
		for (const a of features) {
			const b = features.find((f) => f !== a) as string
			const trouves = await messages(
				`import { x } from '../../${b}/utils/x'\nexport const y = x\n`,
				`src/features/${a}/components/C.ts`,
			)
			expect(contient(trouves, 'Import inter-features interdit')).toBe(true)
		}
	})

	it('un TEST de feature n a pas plus le droit qu une source d importer une soeur', async () => {
		// La regle 2 n a volontairement PAS d `excludedFiles`, contrairement a la
		// regle 1. Affirme en commentaire dans `.eslintrc.cjs` ; sans cette sonde,
		// l invariant se perdrait au premier `excludedFiles` recopie du bloc voisin.
		const [a, b] = featuresDuDisque()
		const trouves = await messages(
			`import { x } from '../../${b}/utils/x'\nexport const y = x\n`,
			`src/features/${a}/tests/c.test.ts`,
		)
		expect(contient(trouves, 'Import inter-features interdit')).toBe(true)
	})

	it('le runtime joueur ne peut pas importer une feature (portabilite)', async () => {
		const [a] = featuresDuDisque()
		const trouves = await messages(
			`import { x } from '../features/${a}/index'\nexport const y = x\n`,
			`src/player/R.ts`,
		)
		expect(contient(trouves, 'Le runtime joueur ne doit jamais importer une feature')).toBe(true)
	})

	it('un import DYNAMIQUE vers une autre feature est refuse aussi', async () => {
		const [a, b] = featuresDuDisque()
		const trouves = await messages(
			`export const y = () => import('../../${b}/index')\n`,
			`src/features/${a}/components/C.ts`,
		)
		expect(contient(trouves, 'Import inter-features interdit')).toBe(true)
	})

	it('DISCRIMINANT : une feature qui s importe ELLE-MEME par un chemin grimpant passe', async () => {
		// C'etait le faux positif documente en commentaire dans l ancienne config
		// (« KNOWN LIMIT, documented, not fixed »). Le decoupage par feature le
		// supprime : la feature A n interdit que les AUTRES.
		const [a] = featuresDuDisque()
		const trouves = await messages(
			`import { x } from '../../${a}/utils/x'\nexport const y = x\n`,
			`src/features/${a}/components/C.ts`,
		)
		expect(contient(trouves, 'Import inter-features interdit')).toBe(false)
	})

	it('DISCRIMINANT : un import depuis brain/ passe', async () => {
		const [a] = featuresDuDisque()
		const trouves = await messages(
			`import { x } from '../../../brain'\nexport const y = x\n`,
			`src/features/${a}/components/C.ts`,
		)
		expect(contient(trouves, 'Import inter-features interdit')).toBe(false)
	})

	it('brain/ ne peut pas importer une feature (le sens qui n etait garde par rien)', async () => {
		const [a] = featuresDuDisque()
		const trouves = await messages(`import { x } from '../features/${a}/index'\nexport const y = x\n`, `src/brain/S.ts`)
		expect(contient(trouves, 'brain/ ne doit jamais importer une feature')).toBe(true)
	})

	it('DISCRIMINANT : brain/ qui importe brain/ passe', async () => {
		const trouves = await messages(`import { x } from './dossier/types'\nexport const y = x\n`, `src/brain/S.ts`)
		expect(contient(trouves, 'brain/ ne doit jamais importer une feature')).toBe(false)
	})
})

describe('stockage brut dans une feature (KR-011/111)', () => {
	// La regle 1 est la SEULE des trois que la restructuration des `overrides` a
	// laissee en place sans la sonder — et c est celle dont le bloc voisin a bouge.
	// Elle porte un `excludedFiles` sur les tests, que rien ne tenait.
	it('localStorage brut dans une SOURCE de feature est refuse', async () => {
		const [a] = featuresDuDisque()
		const trouves = await messages("export const v = localStorage.getItem('x')\n", `src/features/${a}/components/C.ts`)
		expect(contient(trouves, 'Stockage brut interdit dans une feature')).toBe(true)
	})

	it('DISCRIMINANT : window.localStorage dans un TEST de feature passe (excludedFiles)', async () => {
		// Un test remet legitimement le vrai stockage a zero. C est la sonde qui garde
		// l `excludedFiles` — sans elle, le supprimer ne ferait rougir personne.
		const [a] = featuresDuDisque()
		const trouves = await messages(
			'window.localStorage.clear()\nexport const v = 1\n',
			`src/features/${a}/tests/c.test.ts`,
		)
		expect(contient(trouves, 'Stockage brut interdit dans une feature')).toBe(false)
	})
})

describe('couleur en dur (BUG-027)', () => {
	it('BUG-027 : une couleur AU MILIEU d un gabarit est refusee', async () => {
		// Le motif d origine etait ancre en tete de quasi (`^\s*(...)`) : cet
		// extrait precis passait le lint. C est le defaut que BUG-027 decrit.
		const trouves = await messages('export const s = `background: #abc123`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(true)
	})

	it('BUG-027 : une fonction de couleur au milieu d un gabarit est refusee', async () => {
		const trouves = await messages('export const s = `border: 1px solid ' + RGBA + '0,0,0,.2)`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(true)
	})

	it('DISCRIMINANT : un gabarit qui ne porte que des tokens passe', async () => {
		const trouves = await messages('export const s = `1.5px dashed var(--accent)`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(false)
	})

	it('DISCRIMINANT : une couleur ecrite en REPLI de token passe (masquage var())', async () => {
		// Equivalent du masquage `var(...)` de projetx : un repli n est pas une
		// couleur en dur. Zero occurrence dans le depot aujourd hui — le cas est
		// ecrit pour que la regle ne se mette pas a mordre le jour ou il arrive.
		const trouves = await messages(
			'export const s = `box-shadow: var(--ombre, 0 6px ' + RGBA + '0,0,0,.18))`\n',
			'src/brain/S.ts',
		)
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(false)
	})

	it('DISCRIMINANT : une ancre de fragment n est pas une couleur', async () => {
		const trouves = await messages("export const s = '#main'\n", 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(false)
	})

	it('DISCRIMINANT : un numero de section court n est pas une couleur', async () => {
		// Sonde exigee nommement par la fiche BUG-027 (champ regression_test).
		const trouves = await messages('export const s = `Section #1`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(false)
	})

	it('BUG-027, SECONDE MOITIE : une fonction de couleur dans une CHAINE SIMPLE est refusee', async () => {
		// Trouve par la revue de PR : la fiche du bug affirmait que « les deux
		// selecteurs Literal sont ancres debut-et-fin et ne sont pas concernes ».
		// Vrai du hex, FAUX de celui-ci — il etait ancre au DEBUT seulement. Or la
		// chaine simple est l idiome DOMINANT du depot pour une valeur composite
		// (`borderRight: '1px solid var(--border-subtle)'`), pas le gabarit.
		const trouves = await messages("export const s = '1px solid " + RGBA + "0,0,0,.2)'\n", 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(true)
	})

	it('DISCRIMINANT : la meme chaine simple avec un token passe', async () => {
		const trouves = await messages("export const s = '1px solid var(--border-subtle)'\n", 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(false)
	})

	it('JUMELLE DE LA LIMITE : `Section #abc` reste REFUSE — c est ce qui discrimine', async () => {
		// Sans cette jumelle, le test « faux positif » ci-dessous rougirait aussi bien
		// pour une VRAIE correction que pour une suppression pure de la branche
		// 3-hex — laquelle ferait cesser de detecter `#abc`, une vraie couleur. Le
		// couple discrimine, le singleton non.
		const trouves = await messages('export const s = `Section #abc`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(true)
	})

	it('LIMITE CONNUE, epinglee plutot que decouverte : `Section #123` est un FAUX POSITIF', async () => {
		// `#123` est indiscernable d un hexadecimal a 3 chiffres par une expression
		// reguliere seule. projetx s en protege en ne verifiant QUE l interieur des
		// props `sx`/`style` ; ici la regle porte sur tout le depot, ce qui est plus
		// large et donc plus expose. Ce test ne valide pas le faux positif : il le
		// RENDRA ROUGE le jour ou quelqu un le corrige, en signalant que ce fichier
		// et le commentaire de `.eslintrc.cjs` doivent etre mis a jour ensemble.
		// Contournement au site d appel : ecrire `Section n°123`.
		const trouves = await messages('export const s = `Section #123`\n', 'src/brain/S.ts')
		expect(contient(trouves, 'Couleur en dur interdite')).toBe(true)
	})
})
