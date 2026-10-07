import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EcranReprise } from './EcranReprise'

describe('EcranReprise', () => {
	describe('session_perimee', () => {
		it('affiche le titre et le texte pour une session périmée', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="perimee" onNouvellePartie={onNouvellePartie} />)

			expect(screen.getByText("Cette partie n'est plus à jour")).toBeInTheDocument()
			expect(screen.getByText(/Le dossier a changé depuis votre dernière partie/)).toBeInTheDocument()
		})

		it('affiche le bouton nouveau partie', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="perimee" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			expect(button).toBeInTheDocument()
		})

		it('appelle onNouvellePartie au clic', async () => {
			const user = userEvent.setup()
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="perimee" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			await user.click(button)

			expect(onNouvellePartie).toHaveBeenCalledTimes(1)
		})

		it('focus automatique sur le bouton', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="perimee" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			expect(document.activeElement).toBe(button)
		})

		it('Entree relance', async () => {
			const user = userEvent.setup()
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="perimee" onNouvellePartie={onNouvellePartie} />)

			await user.keyboard('{Enter}')
			expect(onNouvellePartie).toHaveBeenCalledTimes(1)
		})
	})

	describe('session_illisible', () => {
		it('affiche le titre et le texte pour illisible', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="illisible" onNouvellePartie={onNouvellePartie} />)

			expect(screen.getByText(/Cette partie ne peut pas être lue/)).toBeInTheDocument()
			expect(screen.getByText(/La sauvegarde est endommagée/)).toBeInTheDocument()
		})

		it('affiche le bouton', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="illisible" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			expect(button).toBeInTheDocument()
		})

		it('appelle onNouvellePartie au clic', async () => {
			const user = userEvent.setup()
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="illisible" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			await user.click(button)

			expect(onNouvellePartie).toHaveBeenCalledTimes(1)
		})

		it('focus auto sur le bouton', () => {
			const onNouvellePartie = jest.fn()
			render(<EcranReprise statut="illisible" onNouvellePartie={onNouvellePartie} />)

			const button = screen.getByRole('button')
			expect(document.activeElement).toBe(button)
		})
	})
})
