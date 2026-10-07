import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

/**
 * `Modal.focusCancel` — extension ADDITIVE (n° 15 `moteur-fins`, it2, lot `contrat`) :
 * défaut `false`, aucun changement de focus pour les cinq appelants existants.
 *
 * Le besoin est un RISQUE CLAVIER : « Nouvelle partie » sur une partie en cours est une
 * action dangereuse (`color="error"`), et un dialogue qui s'ouvre avec le focus sur rien —
 * ou sur le bouton de confirmation — laisse Entrée confirmer par réflexe. Ce qui se prouve
 * ici n'est donc pas « le focus est quelque part » mais QUE ENTRÉE ANNULE, et que le focus
 * revient à qui a ouvert le dialogue.
 *
 * `Ouvrir` est un VRAI déclencheur, qui monte et démonte le `Modal` : le retour de focus
 * ne se prouve pas sur un `Modal` rendu d'emblée, qui n'a aucun « avant » à restaurer.
 */
interface BancProps {
	readonly focusCancel?: boolean
	readonly onConfirm: () => void
	readonly onCancel: () => void
}

function Banc({ focusCancel, onConfirm, onCancel }: BancProps): JSX.Element {
	const [ouvert, setOuvert] = useState(false)
	return (
		<>
			<button type="button" onClick={() => setOuvert(true)}>
				Ouvrir
			</button>
			{ouvert && (
				<Modal
					title="Abandonner la partie en cours"
					confirmLabel="Nouvelle partie"
					confirmTone="error"
					focusCancel={focusCancel}
					onCancel={() => {
						onCancel()
						setOuvert(false)
					}}
					onConfirm={() => {
						onConfirm()
						setOuvert(false)
					}}
				>
					contenu
				</Modal>
			)}
		</>
	)
}

describe('Modal — focusCancel (additif, defaut false)', () => {
	it('focusCancel - le focus est sur Annuler quand le dialogue s ouvre, pas sur la confirmation', async () => {
		const user = userEvent.setup()
		render(<Banc focusCancel onConfirm={jest.fn()} onCancel={jest.fn()} />)

		await user.click(screen.getByRole('button', { name: 'Ouvrir' }))

		expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
		// Discriminant : le focus n'est NI sur la confirmation NI sur le ✕ Fermer — trois
		// boutons, un seul porte le focus.
		expect(screen.getByRole('button', { name: 'Nouvelle partie' })).not.toHaveFocus()
		expect(screen.getByRole('button', { name: 'Fermer' })).not.toHaveFocus()
	})

	it('focusCancel - Entree ANNULE : la confirmation dangereuse ne part jamais par reflexe', async () => {
		const user = userEvent.setup()
		const onConfirm = jest.fn()
		const onCancel = jest.fn()
		render(<Banc focusCancel onConfirm={onConfirm} onCancel={onCancel} />)

		await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
		await user.keyboard('{Enter}')

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onConfirm).not.toHaveBeenCalled()
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('focusCancel - le focus est rendu au declencheur a la fermeture (Echap, puis Annuler)', async () => {
		const user = userEvent.setup()
		render(<Banc focusCancel onConfirm={jest.fn()} onCancel={jest.fn()} />)
		const declencheur = screen.getByRole('button', { name: 'Ouvrir' })

		await user.click(declencheur)
		expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
		await user.keyboard('{Escape}')
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(declencheur).toHaveFocus()

		// Et une SECONDE ouverture, fermée par le bouton cette fois : le retour de focus ne
		// dépend ni du geste de fermeture ni d'une première ouverture chanceuse.
		await user.click(declencheur)
		expect(screen.getByRole('button', { name: 'Annuler' })).toHaveFocus()
		await user.click(screen.getByRole('button', { name: 'Annuler' }))
		expect(declencheur).toHaveFocus()
	})

	it('focusCancel defaut - sans la prop, le focus n est pas force sur Annuler', async () => {
		const user = userEvent.setup()
		render(<Banc onConfirm={jest.fn()} onCancel={jest.fn()} />)

		await user.click(screen.getByRole('button', { name: 'Ouvrir' }))

		// GARDE-FOU DES CINQ APPELANTS EXISTANTS : le comportement d'avant la prop est
		// inchangé — le focus reste au déclencheur, le dialogue ne le prend pas.
		expect(screen.getByRole('button', { name: 'Annuler' })).not.toHaveFocus()
		expect(screen.getByRole('button', { name: 'Ouvrir' })).toHaveFocus()
	})

	it('focusCancel defaut - un champ autoFocus d un enfant garde le focus (NewDossierDialog et consorts)', () => {
		render(
			<Modal title="Nouveau dossier" onCancel={jest.fn()} onConfirm={jest.fn()}>
				<input aria-label="Titre du dossier" autoFocus />
			</Modal>,
		)

		expect(screen.getByLabelText('Titre du dossier')).toHaveFocus()
		expect(screen.getByRole('button', { name: 'Annuler' })).not.toHaveFocus()
	})

	it('focusCancel - sans pied (hideFooter), aucun Annuler a viser : sans effet et sans plantage', () => {
		render(
			<Modal title="Carnet d'indices" hideFooter focusCancel onClose={jest.fn()}>
				contenu
			</Modal>,
		)

		expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
	})

	it('focusCancel - le libelle d annulation personnalise porte le focus, pas le texte Annuler', () => {
		render(
			<Modal title="Retirer" cancelLabel="Garder" focusCancel onCancel={jest.fn()} onConfirm={jest.fn()}>
				contenu
			</Modal>,
		)

		// Le focus vise le BOUTON d'annulation, quel que soit son libellé : une requête sur
		// le mot « Annuler » raterait cet appelant-là.
		expect(screen.getByRole('button', { name: 'Garder' })).toHaveFocus()
	})
})
