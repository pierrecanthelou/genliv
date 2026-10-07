/**
 * TESTS D'ÉCRAN DE FIN — trois cas : titre, texte verbatim, repli KR-307.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { EcranFin } from './EcranFin'
import type { FinAtteinte } from '../../../player/engine/fin'

describe('EcranFin', () => {
	it('affiche Fin.texte verbatim', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: 'Vous avez réussi votre quête.',
		}
		const nom = 'Victoire'

		render(<EcranFin fin={fin} nom={nom} />)

		screen.getByText('Vous avez réussi votre quête.')
	})

	it('KR-307 repli invitant sans texte', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			// texte absent
		}
		const nom = 'Fin vide'

		render(<EcranFin fin={fin} nom={nom} />)

		screen.getByText(/rédigez-la dans JALONS/)
	})

	it('titre FIN · nom', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: 'Fin avec texte.',
		}
		const nom = 'Ma Victoire'

		render(<EcranFin fin={fin} nom={nom} />)

		screen.getByRole('heading', { name: /FIN · Ma Victoire/ })
	})

	it('titre FIN · Fin sans nom quand nom absent', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: 'Texte.',
		}
		const nom = ''

		render(<EcranFin fin={fin} nom={nom} />)

		screen.getByRole('heading', { name: /FIN · Fin sans nom/ })
	})

	it('repli invitant quand texte vide après trim', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: '   \n   ',
		}
		const nom = 'Fin'

		render(<EcranFin fin={fin} nom={nom} />)

		screen.getByText(/rédigez-la dans JALONS/)
	})

	it('verbatim multi-ligne : espaces et sauts preserves', () => {
		const texteMultiLigne = '  Para 1.\n\nPara 2.  '
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: texteMultiLigne,
		}

		const { container } = render(<EcranFin fin={fin} nom="Fin" />)

		const prose = container.querySelector('p[style*="pre-wrap"]')
		expect(prose).not.toBeNull()
		expect(prose!.textContent).toBe(texteMultiLigne)
	})

	it('repli sans texte ne montre pas l en-tete FIN — lue au joueur', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
		}

		render(<EcranFin fin={fin} nom="Fin" />)

		expect(screen.queryByText(/lue au joueur/)).not.toBeInTheDocument()
	})

	it('affiche bouton Nouvelle partie si onNouvellePartie défini', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: 'Fin.',
		}
		const mockOnNouvellePartie = jest.fn()

		render(<EcranFin fin={fin} nom="Fin" onNouvellePartie={mockOnNouvellePartie} />)

		const bouton = screen.getByRole('button', { name: /Nouvelle partie/i })
		expect(bouton).toBeInTheDocument()
		fireEvent.click(bouton)
		expect(mockOnNouvellePartie).toHaveBeenCalledTimes(1)
	})

	it('pas de bouton Nouvelle partie si onNouvellePartie absent', () => {
		const fin: FinAtteinte = {
			fin_id: 'fin-test',
			texte: 'Fin.',
		}

		render(<EcranFin fin={fin} nom="Fin" />)

		expect(screen.queryByRole('button', { name: /Nouvelle partie/i })).not.toBeInTheDocument()
	})
})
