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
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} />)

		// Vérifier qu'il n'y a pas de couleur `--good` ni `--bad` appliquée
		const bandeau = container.firstChild as HTMLElement

		// Chercher les couleurs sémantiques dans le innerHTML rendu
		expect(bandeau.innerHTML).not.toContain('--good')
		expect(bandeau.innerHTML).not.toContain('--bad')
	})

	it('affiche nom/PV/PE/XP tels que passés en prop', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} />)

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
		render(<BandeauHeros heros={heroTest} pas={1} />)

		// Vérifier que FO, AG, DX, EN, IN, IG, SE, CA ne sont pas affichés
		expect(screen.queryByText('FO')).not.toBeInTheDocument()
		expect(screen.queryByText('AG')).not.toBeInTheDocument()
		expect(screen.queryByText('DX')).not.toBeInTheDocument()
		expect(screen.queryByText('EN')).not.toBeInTheDocument()
	})

	it('pvLive remplace heros.pv quand fourni', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} pvLive={3} />)
		expect(container.textContent).toContain('3')
		expect(container.textContent).not.toMatch(/PV\s*10/)
	})

	it('peLive remplace heros.pe quand fourni', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} peLive={2} />)
		const text = container.textContent ?? ''
		expect(text).toMatch(/PE\s*2\/6/)
		expect(text).not.toMatch(/PE\s*4/)
	})

	it('pvLive={0} affiche 0 (hero-mort)', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} pvLive={0} />)
		const text = container.textContent ?? ''
		expect(text).toMatch(/PV\s*0\/12/)
	})

	it('pas={3} affiche PAS #3', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={3} />)
		expect(container.textContent).toMatch(/PAS\s*#3/)
	})

	it('pas={0} affiche PAS #0 (ouverture)', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={0} />)
		expect(container.textContent).toMatch(/PAS\s*#0/)
	})

	it('climatNom="Tempête de sable" affiche CLIMAT · Tempête de sable', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} climatNom="Tempête de sable" />)
		expect(container.textContent).toMatch(/CLIMAT\s*·\s*Tempête de sable/)
	})

	it('climatNom={undefined} n affiche pas le bloc CLIMAT', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} />)
		expect(container.textContent).not.toContain('CLIMAT')
	})

	it('séparateurs existent entre les blocs', () => {
		const { container } = render(<BandeauHeros heros={heroTest} pas={1} />)
		const separateurs = container.querySelectorAll('[aria-hidden="true"]')
		// Il doit y avoir au moins 4 séparateurs : après nom, après PV, après PE, après XP
		expect(separateurs.length).toBeGreaterThanOrEqual(4)
	})
})
