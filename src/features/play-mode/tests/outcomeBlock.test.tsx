import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { OutcomeBlock } from '../components/OutcomeBlock'

/**
 * `OutcomeBlock` SEUL — le composant neuf de l'itération 1 de `moteur-dossier`
 * (§ 3.D du plan). Son appelant réel (`EcranPartie`) est éprouvé par
 * `ouvertureVerbatim.test.tsx` ; ici on tient les deux propriétés du composant :
 * il DÉSIGNE la prose sans en faire partie, et il la rend VERBATIM.
 *
 * La troisième propriété est une ABSENCE, donc elle se tient par un balayage de
 * source (KR-169 : une propriété affirmée en docstring sans test est une
 * intention) : PAS D'AXE DE VARIANTE en it1 (§ 8, D-18). Le fichier de référence
 * du handoff teinte `--good-bg` / `--bad-bg` — les deux seules couleurs
 * sémantiques du projet, réservées à la réussite et à l'échec d'un JET. Le texte
 * d'ouverture n'est pas un jet.
 */

const CHEMIN_COMPOSANT = path.join(__dirname, '..', 'components', 'OutcomeBlock.tsx')

describe('OutcomeBlock', () => {
	it('rend l en-tete auteur et la prose, deux noeuds distincts', () => {
		render(<OutcomeBlock entete="OUVERTURE — lue au joueur, mot pour mot">La porte du sanctuaire.</OutcomeBlock>)

		const entete = screen.getByText('OUVERTURE — lue au joueur, mot pour mot')
		const prose = screen.getByText('La porte du sanctuaire.')
		// L'en-tête DÉSIGNE la prose sans en faire partie : deux nœuds, jamais un
		// préfixe collé à la prose du joueur.
		expect(entete).not.toBe(prose)
		expect(prose.textContent).toBe('La porte du sanctuaire.')
	})

	it('preserve les alineas de l auteur (pre-wrap): c est ce que VERBATIM exige', () => {
		const deuxAlineas = 'Premier alinéa.\n\nSecond alinéa.'
		render(<OutcomeBlock entete="OUVERTURE">{deuxAlineas}</OutcomeBlock>)

		const prose = screen.getByText(/Premier alinéa/)
		expect(prose.textContent).toBe(deuxAlineas)
		expect(prose).toHaveStyle({ whiteSpace: 'pre-wrap' })
	})

	it('n a AUCUN axe de variante ni aucune couleur semantique (D-18)', () => {
		const source = fs.readFileSync(CHEMIN_COMPOSANT, 'utf8')

		// Les deux teintes du fichier de référence : elles appartiennent au JET, et
		// l'axe de variante entre avec son premier appelant de jet (n° 11). Le
		// composant ne les nomme NULLE PART — pas même en commentaire, sinon ce
		// balayage-ci cesserait de mordre (le motif est dit en toutes lettres dans
		// la docstring du composant, sans écrire les jetons).
		expect(source).not.toContain('--good')
		expect(source).not.toContain('--bad')
		// Et le `8.5px` du handoff est refusé au profit d'un jeton (veto UX).
		expect(source).not.toContain('8.5px')
		// DEUX props, exactement : `entete` (requis) et `children`. La déstructuration
		// est le seul endroit où un troisième axe pourrait entrer sans bruit.
		expect(source).toContain('{ entete, children }: OutcomeBlockProps')
	})
})
