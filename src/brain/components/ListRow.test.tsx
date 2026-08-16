import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListRow } from './ListRow'

/**
 * LA LIGNE DE LISTE portée depuis la source de design MOINS sa poignée de
 * glisser. Deux propriétés portent tout le reste : c'est un vrai `<button>`
 * (donc le clavier marche sans code), et `aria-current` ne s'allume que sur la
 * ligne sélectionnée.
 */

/** Le glyphe de la poignée de la source — il ne doit apparaître nulle part. */
const POIGNEE = '⠿'

describe('ListRow, rendu sans poignee', () => {
	it('rend titre, sous-titre, leading et trailing, sans le glyphe de poignee', () => {
		render(
			<ListRow
				title="Personnages"
				subtitle="monde.personnages"
				leading={<span data-testid="leading">❏</span>}
				trailing={<span data-testid="trailing">2 fiches</span>}
				onSelect={jest.fn()}
			/>,
		)

		expect(screen.getByText('Personnages')).toBeInTheDocument()
		expect(screen.getByText('monde.personnages')).toBeInTheDocument()
		expect(screen.getByTestId('leading')).toBeInTheDocument()
		expect(screen.getByTestId('trailing')).toBeInTheDocument()
		// La poignée `⠿` de la source est retirée : le réordonnancement est
		// composé PAR la feature n° 5 (deux `IconButton` frères, hors de ce
		// composant), pas porté par `ListRow` — voir son docstring.
		expect(document.body.textContent).not.toContain(POIGNEE)
	})

	it('est un bouton de type button, haut d au moins la cible tactile', () => {
		render(<ListRow title="Canon" onSelect={jest.fn()} />)

		const ligne = screen.getByRole('button', { name: 'Canon' })

		expect(ligne).toHaveAttribute('type', 'button')
		expect(ligne.style.minHeight).toBe('var(--hit-target)')
	})

	it('n affiche aucune ligne de sous-titre quand la prop est omise', () => {
		render(<ListRow title="Canon" onSelect={jest.fn()} />)

		expect(screen.getByRole('button', { name: 'Canon' }).textContent).toBe('Canon')
	})

	it('declenche onSelect au clic', async () => {
		const user = userEvent.setup()
		const onSelect = jest.fn()
		render(<ListRow title="Lieux" subtitle="monde.lieux" onSelect={onSelect} />)

		await user.click(screen.getByRole('button', { name: /Lieux/ }))

		expect(onSelect).toHaveBeenCalledTimes(1)
	})

	it('se selectionne au clavier comme au clic, sans gestionnaire maison', async () => {
		const user = userEvent.setup()
		const onSelect = jest.fn()
		render(<ListRow title="Objets" onSelect={onSelect} />)

		await user.tab()
		expect(screen.getByRole('button', { name: 'Objets' })).toHaveFocus()

		await user.keyboard('{Enter}')
		await user.keyboard(' ')

		expect(onSelect).toHaveBeenCalledTimes(2)
	})
})

/**
 * CE QUE CE FICHIER NE PEUT PAS ÉPINGLER, mesuré et non supposé : la TEINTE de la
 * ligne sélectionnée. `cssstyle`, l'implémentation CSSOM de jsdom, REFUSE toute
 * valeur de propriété colorée contenant `var(…)` — `background`, `background-color`,
 * `border` et `border-color` disparaissent de l'attribut `style` sérialisé, à
 * l'inverse de `min-height` ou `padding-block`, conservés. Une assertion de couleur
 * ici serait donc rouge sur un composant juste. Le repère observable de la
 * sélection est `aria-current`, et c'est lui qui est tenu.
 */
describe('ListRow, la ligne selectionnee', () => {
	it('porte aria-current quand selected', () => {
		render(<ListRow title="Indices" selected onSelect={jest.fn()} />)

		expect(screen.getByRole('button', { name: 'Indices' })).toHaveAttribute('aria-current', 'true')
	})

	it('ne porte aucun aria-current par defaut', () => {
		render(<ListRow title="Indices" onSelect={jest.fn()} />)

		// Absent, jamais `aria-current="false"` : une liste où toutes les lignes
		// annoncent leur non-sélection est plus bavarde qu'informative.
		expect(screen.getByRole('button', { name: 'Indices' })).not.toHaveAttribute('aria-current')
	})
})
