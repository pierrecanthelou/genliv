import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

/**
 * `Modal.hideFooter` — extension ADDITIVE (itération 2 de `moteur-acteurs`,
 * 2026-10-02, lot `contrat`) : défaut `false`, zéro régression sur les cinq
 * appelants existants (`RetirerObjetDialog`, `RetirerPersonnageDialog`,
 * `ImportDossierDialog`, `NewDossierDialog`, `DeleteDossierDialog` —
 * `ConflictDialog` composant sa propre variante hors de ce test).
 *
 * Précédent d'usage réel : le tiroir « Carnet d'indices » (`CarnetIndices.tsx`,
 * lot `feature`), lecture seule, dont le seul exit est `✕ Fermer`.
 */
describe('Modal — hideFooter (additif, defaut false)', () => {
	it('par defaut (hideFooter omis), le pied — Annuler/Enregistrer — reste rendu', () => {
		render(
			<Modal title="Un titre" onCancel={jest.fn()} onConfirm={jest.fn()}>
				contenu
			</Modal>,
		)

		expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
	})

	it('hideFooter=true retire ENTIEREMENT le pied, destructive compris, et garde le contenu', () => {
		render(
			<Modal
				title="Carnet d'indices"
				hideFooter
				destructive={{ label: 'Supprimer', onClick: jest.fn() }}
				onCancel={jest.fn()}
				onConfirm={jest.fn()}
			>
				<p>{"Aucun indice découvert pour l'instant"}</p>
			</Modal>,
		)

		expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument()
		expect(screen.getByText("Aucun indice découvert pour l'instant")).toBeInTheDocument()
	})

	it('hideFooter=true laisse le bouton ✕ Fermer operant (focus capture/restore inchanges)', async () => {
		const user = userEvent.setup()
		const onClose = jest.fn()
		render(
			<Modal title="Carnet d'indices" hideFooter onClose={onClose}>
				contenu
			</Modal>,
		)

		await user.click(screen.getByRole('button', { name: 'Fermer' }))
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('hideFooter=true : Echap ferme toujours, meme sans pied', async () => {
		const user = userEvent.setup()
		const onClose = jest.fn()
		render(
			<Modal title="Carnet d'indices" hideFooter onClose={onClose}>
				contenu
			</Modal>,
		)

		await user.keyboard('{Escape}')
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
