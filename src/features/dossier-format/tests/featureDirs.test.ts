import fs from 'node:fs'
import path from 'node:path'

/**
 * Ferme la boucle de KR-151/159 : `.eslintrc.cjs` restreint les imports
 * inter-features et le stockage brut sur EXACTEMENT `FEATURE_DIRS`, une liste
 * tolérante devenue une liste EXACTE. Un dossier de `src/features` absent de
 * cette liste est SILENCIEUSEMENT exempté des deux règles d'isolation.
 *
 * On ne `require()` pas `.eslintrc.cjs` : ESLint 8 rejette tout objet de
 * configuration portant une propriété de premier niveau qu'il ne connaît pas
 * (« Unexpected top-level property "FEATURE_DIRS" »), donc l'exporter romprait
 * `npm run lint`. Le test lit le fichier comme du TEXTE et en extrait le
 * littéral — la même source que celle qu'ESLint exécute réellement.
 */
const CHEMIN_ESLINTRC = path.join(__dirname, '..', '..', '..', '..', '.eslintrc.cjs')
const CHEMIN_FEATURES = path.join(__dirname, '..', '..')

function featureDirsDeclares(): string[] {
	const texte = fs.readFileSync(CHEMIN_ESLINTRC, 'utf8')
	const correspondance = texte.match(/const FEATURE_DIRS = \[([^\]]*)\]/)
	if (correspondance === null) {
		throw new Error('FEATURE_DIRS introuvable dans .eslintrc.cjs')
	}
	return correspondance[1]
		.split(',')
		.map((entree) => entree.trim().replace(/^['"]|['"]$/g, ''))
		.filter((entree) => entree.length > 0)
}

function dossiersDeFeatures(): string[] {
	return fs
		.readdirSync(CHEMIN_FEATURES, { withFileTypes: true })
		.filter((entree) => entree.isDirectory())
		.map((entree) => entree.name)
}

describe('featureDirs', () => {
	it('tout dossier de src/features est declare dans FEATURE_DIRS', () => {
		const declares = featureDirsDeclares()
		const reels = dossiersDeFeatures()

		expect(reels.length).toBeGreaterThan(0)
		for (const dossier of reels) {
			expect(declares).toContain(dossier)
		}
	})

	it('dossier-format est bien dans la liste', () => {
		expect(featureDirsDeclares()).toContain('dossier-format')
	})
})
