import fs from 'node:fs'
import path from 'node:path'

/**
 * Le garde de PLACEMENT de la prop sœur — lit le SOURCE d'`App.tsx`, donc il
 * ne peut vivre que dans le lot qui modifie ce fichier (§ 5.2 du plan, lot
 * `panneau`). Il asserte l'ORDRE SEUL (`panneauCopilote=` présent et avant
 * `panneaux={{`), jamais la forme du paramètre — un lot `contrat` qui posait
 * ce garde aurait échoué à sa propre porte, puisque `<PanneauCopilote/>`
 * n'existe qu'ici (§ 8, désaccords n° 22/23).
 */
describe('cablage — placement de la prop soeur panneauCopilote dans App.tsx', () => {
	it('panneauCopilote= est present et vient AVANT panneaux={{', () => {
		const chemin = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(chemin, 'utf8')

		const indexPanneauCopilote = source.indexOf('panneauCopilote=')
		const indexPanneaux = source.indexOf('panneaux={{')

		expect(indexPanneauCopilote).toBeGreaterThan(-1)
		expect(indexPanneaux).toBeGreaterThan(-1)
		expect(indexPanneauCopilote).toBeLessThan(indexPanneaux)
	})

	it('App.tsx importe PanneauCopilote depuis la feature dossier-copilote', () => {
		const chemin = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(chemin, 'utf8')

		expect(source).toContain("import { PanneauCopilote } from './features/dossier-copilote'")
	})
})
