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

/**
 * `onSelect` OPTIONNEL (itération 2 de `moteur-acteurs`, 2026-10-02) — ABSENT ⇒
 * rendu en `<div>` NON FOCUSABLE, jamais un `<button>` désactivé. Précédent
 * appelant réel : le carnet d'indices (lot `feature`), qui liste sans naviguer.
 */
describe('ListRow, onSelect absent — rendu lecture seule', () => {
	it('rend un <div>, jamais un <button>, quand onSelect est omis', () => {
		render(<ListRow title="Carnet" subtitle="#4 — PARLER" />)

		expect(screen.queryByRole('button', { name: /Carnet/ })).not.toBeInTheDocument()
		expect(screen.getByText('Carnet')).toBeInTheDocument()
		expect(screen.getByText('#4 — PARLER')).toBeInTheDocument()
	})

	it('n est JAMAIS atteint par Tab : la ligne sort de l ordre de tabulation', async () => {
		const user = userEvent.setup()
		render(
			<>
				<button type="button">avant</button>
				<ListRow title="Sans selection" />
				<button type="button">apres</button>
			</>,
		)

		await user.tab()
		expect(screen.getByRole('button', { name: 'avant' })).toHaveFocus()
		await user.tab()
		// La ligne lecture seule est sautée : le focus va DIRECTEMENT au bouton suivant.
		expect(screen.getByRole('button', { name: 'apres' })).toHaveFocus()
	})

	it('memes styles que la variante bouton, MOINS cursor:pointer (§ 3 du plan)', () => {
		const { container: avecBouton } = render(<ListRow title="X" onSelect={jest.fn()} />)
		const bouton = avecBouton.querySelector('button') as HTMLElement
		const { container: sansBouton } = render(<ListRow title="X" />)
		const div = sansBouton.querySelector('div') as HTMLElement

		expect(bouton.style.cursor).toBe('pointer')
		expect(div.style.cursor).toBe('default')
		// Le reste des styles en ligne mesurés est IDENTIQUE.
		expect(div.style.minHeight).toBe(bouton.style.minHeight)
		expect(div.style.padding).toBe(bouton.style.padding)
		expect(div.style.borderRadius).toBe(bouton.style.borderRadius)
	})

	it('n a ni role button ni onClick attache — un clic sur la ligne ne leve rien', async () => {
		const user = userEvent.setup()
		render(<ListRow title="Sans gestionnaire" />)

		// Aucune exception, aucun role interactif : juste du texte statique.
		await user.click(screen.getByText('Sans gestionnaire'))
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})
})
