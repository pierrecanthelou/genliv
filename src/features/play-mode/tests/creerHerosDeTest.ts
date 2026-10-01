import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * HELPER DE TEST — Termine l'écran de création d'un héros pour les tests
 * qui montent `<EcranPartie>` sans héros existant.
 *
 * Geste à deux temps : cliquer un dé (le sélectionne), puis cliquer la caractéristique
 * (l'assigne). Réalise l'assignation des 8 dés et distribution du bonus.
 *
 * Usage :
 *   const user = userEvent.setup()
 *   render(<EcranPartie dossierId="..." />)
 *   await terminerCreationHeros(user)
 *   // Le reste de l'écran de partie est maintenant visible
 */

export async function terminerCreationHeros(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	// Collecte tous les dés disponibles
	const rolls = screen.queryAllByRole('button').filter((btn) => btn.getAttribute('aria-label')?.includes('Lancer'))

	// Collecte tous les boutons "Assigner à ..."
	const caracButtons = screen
		.queryAllByRole('button')
		.filter((btn) => btn.getAttribute('aria-label')?.startsWith('Assigner à'))

	// Geste à deux temps pour chaque dé
	for (let i = 0; i < rolls.length && i < caracButtons.length; i++) {
		const roll = rolls[i]
		const caracBtn = caracButtons[i]

		// 1. Clic sur le dé : le sélectionne
		await user.click(roll)

		// 2. Clic sur la caractéristique : assigne le dé sélectionné
		await user.click(caracBtn)
	}

	// Distribuer tout le bonus en itérant sur tous les boutons "+"
	// Chaque bouton s'arrête quand sa carac plafonne, le suivant prend le relais
	const btnAjouter = screen.getAllByRole('button', { name: '+' })
	for (const btn of btnAjouter) {
		while (!btn.hasAttribute('disabled')) {
			await user.click(btn)
		}
	}

	// Valider
	const btnValider = screen.getByRole('button', { name: 'Valider →' })
	await user.click(btnValider)

	// S'assurer que le rendu est terminé et que la GARDE 7 a montré le journal
	// (re-rendu synchrone mais sous charge en suite complète peut être légèrement délai)
	await waitFor(
		() => {
			expect(screen.queryByText('Créez votre héros')).not.toBeInTheDocument()
		},
		{ timeout: 2000 },
	)
}
