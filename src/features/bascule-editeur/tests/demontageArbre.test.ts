import fs from 'node:fs'
import path from 'node:path'

/**
 * VERROU ANTI-RÉGRESSION (KR-181, critère #7 du plan d'itération 3 de
 * `bascule-editeur`) — ce test ne prouve PAS un changement de cette
 * itération : la route `{name:'editor'}` du livre-arbre n'est déjà plus
 * appelée aujourd'hui que depuis la composition racine (comparaison, pas
 * appel — voir `src/App.tsx`) et les suites de tests de `tree-canvas` /
 * `cloud-sync` (hors périmètre). Il fige cet état pour de bon : si un jour un
 * appelant de production réapparaît, ce test devient le premier signal.
 *
 * `src/App.tsx`, `src/EditorScreen.tsx` et `src/brain/Router.ts` restent gelés
 * jusqu'à la démolition n° 9 (désaccord 1 du plan) — ce marcheur les LIT, il
 * ne les modifie jamais.
 */

const RACINE_SRC = path.join(__dirname, '..', '..', '..')
const REGEX_NAVIGATE_EDITOR = /\.navigate\(\s*\{\s*name:\s*['"]editor['"]/s

/** Marcheur récursif de `src/`, hors tout dossier nommé `tests`, `.ts`/`.tsx` seulement. */
function fichiersSource(dossier: string): string[] {
	const resultat: string[] = []
	for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
		const chemin = path.join(dossier, entree.name)
		if (entree.isDirectory()) {
			if (entree.name === 'tests') continue
			resultat.push(...fichiersSource(chemin))
			continue
		}
		if (/\.(ts|tsx)$/.test(entree.name)) {
			resultat.push(chemin)
		}
	}
	return resultat
}

describe('demontage de l arbre, verrou anti-regression KR-181', () => {
	it('aucun appel de production vers navigate({ name: "editor" })', () => {
		const contrevenants = fichiersSource(RACINE_SRC)
			.filter((chemin) => REGEX_NAVIGATE_EDITOR.test(fs.readFileSync(chemin, 'utf8')))
			.map((chemin) => path.relative(RACINE_SRC, chemin))

		expect(contrevenants).toEqual([])
	})
})
