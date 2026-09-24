import { render, screen } from '@testing-library/react'
import { Field } from './Field'

/**
 * `Field` — LA PROPRIÉTÉ `mono`, ET RIEN D'AUTRE.
 *
 * PREMIER TEST DE CE COMPOSANT, ET IL ARRIVE AVEC LA PROPRIÉTÉ QU'IL GARDE : le
 * contrôle de rédaction de base n'avait AUCUN test au dépôt (mesuré), et une
 * propriété nommée dans une docstring sans test est une INTENTION, pas un
 * contrat (KR-169). Étendre `Field` sans ce fichier était un `REJETÉ` explicite
 * du raffinage (T-17).
 *
 * LES DEUX SENS, TOUJOURS — et c'est la moitié qui manque le plus souvent : une
 * assertion « mono rend `--font-mono` » est vraie d'un composant qui rendrait
 * `--font-mono` PARTOUT. C'est le défaut par défaut qui sépare, pas le cas
 * demandé.
 *
 * LES DEUX BOÎTES, AUSSI : la docstring de la propriété dit « input ET
 * textarea ». Une propriété relayée sur une seule des deux branches satisferait
 * la moitié de sa promesse sans qu'aucune ligne ne rougisse (KR-199 — le nom du
 * test couvrirait plus que ses assertions).
 *
 * LA FAMILLE SE LIT SUR `style.fontFamily` DU NŒUD, jamais sur une classe : le
 * composant compose son style EN LIGNE, et jsdom ne résout aucune feuille de
 * styles. Ce qu'on épingle est donc exactement ce que le composant écrit.
 */

/** Ce que la BOÎTE porte comme famille — le nœud de saisie, jamais le libellé. */
function familleDeLaBoite(boite: HTMLElement): string {
	return boite.style.fontFamily
}

describe('Field, la propriete mono', () => {
	it('par defaut la boite est en --font-ui, sur l input comme sur le textarea', () => {
		render(
			<>
				<Field ariaLabel="ligne" value="lieu.val-cendre" onChange={() => {}} />
				<Field ariaLabel="paragraphe" multiline value="lieu.val-cendre" onChange={() => {}} />
			</>,
		)

		expect(familleDeLaBoite(screen.getByLabelText('ligne'))).toBe('var(--font-ui)')
		expect(familleDeLaBoite(screen.getByLabelText('paragraphe'))).toBe('var(--font-ui)')
	})

	it('mono bascule la boite en --font-mono, sur l input comme sur le textarea', () => {
		render(
			<>
				<Field ariaLabel="ligne" mono value="lieu.val-cendre" onChange={() => {}} />
				<Field ariaLabel="paragraphe" mono multiline value="lieu.val-cendre" onChange={() => {}} />
			</>,
		)

		expect(familleDeLaBoite(screen.getByLabelText('ligne'))).toBe('var(--font-mono)')
		expect(familleDeLaBoite(screen.getByLabelText('paragraphe'))).toBe('var(--font-mono)')
	})

	it('mono ne touche QUE la boite — le libelle est deja mono et ne bouge pas', () => {
		// La docstring de la propriété affirme « le libellé ne bouge pas ». Sans cette
		// ligne, la promesse serait tenue par accident : le libellé est mono dans les
		// deux cas, donc seule une comparaison ENTRE LES DEUX rendus la prouve.
		const { rerender } = render(<Field id="f" label="CONSOLE" value="" onChange={() => {}} />)
		const sansMono = screen.getByText('CONSOLE').style.fontFamily

		rerender(<Field id="f" label="CONSOLE" mono value="" onChange={() => {}} />)

		expect(screen.getByText('CONSOLE').style.fontFamily).toBe(sansMono)
		expect(sansMono).toBe('var(--font-mono)')
	})

	it('la propriete est ADDITIVE : rien d autre de la boite ne bouge', () => {
		// Les 25 appelants mesurés ne passent pas `mono` et ne doivent rien voir
		// changer. L'anatomie de la boîte — bordure, fond, taille — est la même dans
		// les deux régimes ; seule la famille varie.
		const { rerender } = render(<Field ariaLabel="ligne" value="" onChange={() => {}} />)
		const avant = screen.getByLabelText('ligne').getAttribute('style') ?? ''

		rerender(<Field ariaLabel="ligne" mono value="" onChange={() => {}} />)
		const apres = screen.getByLabelText('ligne').getAttribute('style') ?? ''

		expect(apres.replace('var(--font-mono)', 'var(--font-ui)')).toBe(avant)
	})
})
