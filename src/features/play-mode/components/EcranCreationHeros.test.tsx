import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EcranCreationHeros } from './EcranCreationHeros'

/**
 * ÉCRAN DE CRÉATION DE HÉROS — tests de comportement du formulaire.
 *
 * Les deux tests critiques du plan d'itération 1 :
 *  - Zéro hasard : `jest.spyOn(Math,'random')` reste à 0 appel du montage à la validation
 *  - Relance : le pool affiché après « Relancer » diffère du pool initial, sur une graine fixée
 *
 * Plus un test du geste à deux temps : sélectionner un dé puis une carac le lui assigne.
 */

describe('EcranCreationHeros', () => {
	it('zéro hasard — Math.random n est jamais appele entre le montage et la validation', async () => {
		const user = userEvent.setup()
		const randomSpy = jest.spyOn(Math, 'random')
		try {
			const onValider = jest.fn()
			const graine = 12345

			render(<EcranCreationHeros graine={graine} onValider={onValider} />)

			// Au montage, aucun appel à Math.random
			expect(randomSpy).not.toHaveBeenCalled()

			// Geste à deux temps : cliquer un dé, puis la carac
			const rolls = screen.queryAllByRole('button').filter((btn) => btn.getAttribute('aria-label')?.includes('Lancer'))
			const caracButtons = screen
				.queryAllByRole('button')
				.filter((btn) => btn.getAttribute('aria-label')?.includes('Assigner'))

			for (let i = 0; i < Math.min(rolls.length, caracButtons.length); i++) {
				await user.click(rolls[i])
				await user.click(caracButtons[i])
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
			await user.click(screen.getByRole('button', { name: 'Valider →' }))

			// Vérifier que Math.random n'a jamais été appelé
			expect(randomSpy).not.toHaveBeenCalled()
			expect(onValider).toHaveBeenCalled()
		} finally {
			randomSpy.mockRestore()
		}
	})

	it('relance — le pool affiché après « Relancer » diffère du pool initial, sur une graine fixée', async () => {
		const user = userEvent.setup()
		const graine = 54321
		const onValider = jest.fn()

		render(<EcranCreationHeros graine={graine} onValider={onValider} />)

		// Lire les dés initiaux
		const diceInitiaux = screen
			.queryAllByRole('button')
			.filter((btn) => btn.getAttribute('aria-label')?.includes('Lancer'))
			.map((btn) => btn.textContent)

		// Relancer
		const btnRelancer = screen.queryAllByRole('button').find((btn) => btn.textContent?.includes('Relancer'))
		if (btnRelancer) {
			await user.click(btnRelancer)
		}

		// Lire les dés après relance
		const diceApres = screen
			.queryAllByRole('button')
			.filter((btn) => btn.getAttribute('aria-label')?.includes('Lancer'))
			.map((btn) => btn.textContent)

		// Les deux pools doivent être DIFFÉRENTS sur une graine fixée
		// (avec la graine, le tirage est déterministe, donc 0 et 1 doivent produire des suites différentes)
		expect(diceApres).not.toEqual(diceInitiaux)
	})

	it('geste à deux temps — cliquer un dé puis une carac l assigne au bon dé', async () => {
		const user = userEvent.setup()
		const graine = 99999
		const onValider = jest.fn()

		render(<EcranCreationHeros graine={graine} onValider={onValider} />)

		// Chercher le premier dé et la première carac
		const rolls = screen.queryAllByRole('button').filter((btn) => btn.getAttribute('aria-label')?.includes('Lancer'))
		const caracBtns = screen
			.queryAllByRole('button')
			.filter((btn) => btn.getAttribute('aria-label')?.includes('Assigner'))

		expect(rolls.length).toBeGreaterThan(0)
		expect(caracBtns.length).toBeGreaterThan(0)

		// Cliquer le dé → il devient sélectionné
		await user.click(rolls[0])
		expect(rolls[0]).toHaveAttribute('aria-pressed', 'true')

		// Cliquer la carac → le dé s'assigne
		await user.click(caracBtns[0])

		// Vérifier que le dé n'est plus sélectionné (aria-pressed revient à false)
		expect(rolls[0]).toHaveAttribute('aria-pressed', 'false')

		// Cliquer le dé assigné ne le désélectionne plus (il est disabled)
		expect(rolls[0]).toHaveAttribute('disabled')
	})
})
