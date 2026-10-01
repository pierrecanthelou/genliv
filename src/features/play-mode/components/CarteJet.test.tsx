import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarteJet } from './CarteJet'
import type { CarteJetState } from '../hooks/useTourDeJeu'

describe('CarteJet — carte du jet (moteur-arbitre it2)', () => {
	const carteJetFixture: CarteJetState = {
		carac: 'FO',
		tc: 'TC2',
		enjeuReussite: 'vaincre le monstre',
		enjeuEchec: 'prendre du dégât',
	}

	it('Avant lancer : affiche carac (eyebrow), TC (title), enjeux, bouton actif', () => {
		const onLancer = jest.fn()
		render(<CarteJet carteJet={carteJetFixture} onLancer={onLancer} />)

		expect(screen.getByText('Force')).toBeInTheDocument() // CHARACTERISTICS[FO].label (textTransform: uppercase en CSS)
		expect(screen.getByText(/2D5/)).toBeInTheDocument() // CHALLENGE_TIERS[TC2].notation
		expect(screen.getByText('SI RÉUSSITE')).toBeInTheDocument()
		expect(screen.getByText('vaincre le monstre')).toBeInTheDocument()
		expect(screen.getByText('SI ÉCHEC')).toBeInTheDocument()
		expect(screen.getByText('prendre du dégât')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Lancer/ })).not.toBeDisabled()
	})

	it('Après résolution : affiche roll vs valeur, Badge RÉUSSITE', () => {
		const carteJetResoluSucces: CarteJetState = {
			...carteJetFixture,
			resultat: { roll: 7, success: true, characteristicValue: 9 },
		}
		const onLancer = jest.fn()
		render(<CarteJet carteJet={carteJetResoluSucces} onLancer={onLancer} />)

		expect(screen.getByText('7 vs 9')).toBeInTheDocument()
		expect(screen.getByText('RÉUSSITE')).toBeInTheDocument()
		expect(screen.queryByText('vaincre le monstre')).not.toBeInTheDocument() // état 3 remplacé
		expect(screen.getByRole('button', { name: /Lancer/ })).toBeDisabled()
	})

	it('Enter sur carte focusée lance le jet', async () => {
		const user = userEvent.setup()
		const onLancer = jest.fn()
		const { container } = render(<CarteJet carteJet={carteJetFixture} onLancer={onLancer} />)

		const card = container.querySelector('[tabindex="0"]')
		expect(card).toHaveFocus() // focus programmatique au montage

		await user.keyboard('{Enter}')
		expect(onLancer).toHaveBeenCalled()
	})

	it('Pendant résolution (isLoading=true) : bouton marqué …, opacité 0.5', async () => {
		const user = userEvent.setup()
		let resolveOnLancer: () => void = () => {}
		const onLancer = jest.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveOnLancer = resolve
				}),
		)
		render(<CarteJet carteJet={carteJetFixture} onLancer={onLancer} />)

		const btn = screen.getByRole('button', { name: /Lancer/ })
		await user.click(btn)
		expect(btn).toBeDisabled()
		expect(btn).toHaveTextContent('…')

		resolveOnLancer()
	})
})
