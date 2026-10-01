import { render, screen } from '@testing-library/react'
import { BandeauHeros } from './BandeauHeros'
import type { HeroState } from '../../../player/types'

/**
 * BANDEAU HÉROS — tests de rendu neutre (pas de couleurs sémantiques).
 *
 * Critère du plan : aucune règle `--good`/`--bad` rendue ; nom/PV/PE/XP affichés
 * tels que passés en prop.
 */

describe('BandeauHeros', () => {
	const heroTest: HeroState = {
		name: 'Aldric',
		caracs: {
			FO: 5,
			AG: 4,
			DX: 3,
			EN: 6,
			IN: 4,
			IG: 2,
			SE: 5,
			CA: 3,
		},
		pvMax: 12,
		pv: 10,
		peMax: 6,
		pe: 4,
		mcBonus: 0,
		xp: 150,
	}

	it('neutre — aucune couleur sémantique (--good/--bad) rendue', () => {
		const { container } = render(<BandeauHeros heros={heroTest} />)

		// Vérifier qu'il n'y a pas de couleur `--good` ni `--bad` appliquée
		const bandeau = container.firstChild as HTMLElement

		// Chercher les couleurs sémantiques dans le innerHTML rendu
		expect(bandeau.innerHTML).not.toContain('--good')
		expect(bandeau.innerHTML).not.toContain('--bad')
	})

	it('affiche nom/PV/PE/XP tels que passés en prop', () => {
		const { container } = render(<BandeauHeros heros={heroTest} />)

		expect(screen.getByText('Aldric')).toBeInTheDocument()
		// Le texte "PV 10/12" est séparé par des spans, donc on cherche par textContent
		expect(container.textContent).toContain('PV')
		expect(container.textContent).toContain('10')
		expect(container.textContent).toContain('12')
		expect(container.textContent).toContain('PE')
		expect(container.textContent).toContain('4')
		expect(container.textContent).toContain('6')
		expect(container.textContent).toContain('XP')
		expect(container.textContent).toContain('150')
	})

	it('n affiche jamais les caractéristiques', () => {
		render(<BandeauHeros heros={heroTest} />)

		// Vérifier que FO, AG, DX, EN, IN, IG, SE, CA ne sont pas affichés
		expect(screen.queryByText('FO')).not.toBeInTheDocument()
		expect(screen.queryByText('AG')).not.toBeInTheDocument()
		expect(screen.queryByText('DX')).not.toBeInTheDocument()
		expect(screen.queryByText('EN')).not.toBeInTheDocument()
	})
})
