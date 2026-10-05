import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EcranCombat } from './EcranCombat'
import type { CombatState, CombatOutcome } from '../../../player/engine/combatTypes'

describe('EcranCombat', () => {
	const createMinimalMockState = (outcome: CombatOutcome = 'ongoing'): CombatState => ({
		monster: {
			name: 'Test',
			pvMax: 20,
			pv: 15,
			peMax: 10,
			pe: 8,
			FO: 2,
			EN: 2,
			mc: 0,
			armour: 0,
			armourDegradation: 0,
			weaponMultiplier: 1,
			creatureType: null,
			capacityId: 'aucune',
			bypassedBySilver: false,
			immuneToFatigue: false,
			tier: 1,
			victoryTarget: null,
			fleeTarget: null,
			loot: null,
		},
		heroPv: 10,
		heroPe: 8,
		heroArmorDegradation: 0,
		heroPvAtStart: 10,
		round: 1,
		consecutiveDefWins: { hero: 0, monster: 0 },
		gardeBonus: { hero: 0, monster: 0 },
		log: [],
		phase: 'choosing',
		outcome,
		bestHeroHit: 'rate',
		pendingXp: 0,
		pendingLoot: null,
		effects: {
			poisonRoundsLeft: 0,
			poisonDmgPerRound: 0,
			renversementMalus: 0,
			seismeStunned: false,
			disarmedThisRound: false,
			fureurUsed: false,
			zombieRevived: false,
			etreinte: 0,
			piquesUsed: false,
			soinsBloques: false,
		},
		pendingEnMaxDelta: 0,
		pendingPvMaxDelta: 0,
		pendingVol: false,
	})

	it('affiche le titre COMBAT', () => {
		const etat = createMinimalMockState()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.getByText('COMBAT')).toBeInTheDocument()
	})

	it('affiche le placeholder du journal quand vide', () => {
		const etat = createMinimalMockState()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.getByText(/Le combat commence/)).toBeInTheDocument()
	})

	it("affiche badge VICTOIRE à l'issue terminale", () => {
		const etat = createMinimalMockState('hero-victory')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.getByText('VICTOIRE')).toBeInTheDocument()
	})

	it('affiche badge DÉFAITE et masque boutons sur hero-mort', () => {
		const etat = createMinimalMockState('hero-mort')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.getByText('DÉFAITE')).toBeInTheDocument()
		expect(screen.getByText(/PARTIE TERMINÉE/)).toBeInTheDocument()
	})

	it('appelle onJouer avec la posture selectionnee au clic sur Jouer le round', async () => {
		const user = userEvent.setup()
		const etat = createMinimalMockState()
		const onJouer = jest.fn()
		render(<EcranCombat etat={etat} onJouer={onJouer} onFuir={jest.fn()} />)
		await user.click(screen.getByRole('radio', { name: 'Précise' }))
		await user.click(screen.getByRole('button', { name: /Jouer le round/ }))
		expect(onJouer).toHaveBeenCalledWith('precise')
	})

	it('appelle onClore au clic sur Continuer en fin de combat non mortel', async () => {
		const user = userEvent.setup()
		const etat = createMinimalMockState('hero-victory')
		const onClore = jest.fn()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} onClore={onClore} />)
		await user.click(screen.getByRole('button', { name: /Continuer/ }))
		expect(onClore).toHaveBeenCalledTimes(1)
	})

	it('aucun bouton Continuer sur hero-mort', () => {
		const etat = createMinimalMockState('hero-mort')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.queryByRole('button', { name: /Continuer/ })).not.toBeInTheDocument()
	})

	it('affiche les entetes ROUND pour chaque ligne du journal', () => {
		const etat = {
			...createMinimalMockState(),
			log: [
				{ round: 1, text: 'Le gobelin attaque' },
				{ round: 2, text: 'Riposte du heros' },
			],
		}
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		expect(screen.getByText('ROUND 1')).toBeInTheDocument()
		expect(screen.getByText('ROUND 2')).toBeInTheDocument()
	})

	it('Fuir present et actif en cours de combat', () => {
		const etat = createMinimalMockState('ongoing')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		const btn = screen.getByRole('button', { name: /Fuir le combat/ })
		expect(btn).toBeInTheDocument()
		expect(btn).toBeEnabled()
	})

	it('Fuir hors du groupe POSTURE', () => {
		const etat = createMinimalMockState('ongoing')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} />)
		const playButton = screen.getByRole('button', { name: /Jouer le round/ })
		const fleeButton = screen.getByRole('button', { name: /Fuir le combat/ })
		expect(playButton).toBeInTheDocument()
		expect(fleeButton).toBeInTheDocument()
		const playParent = playButton.parentElement
		const fleeParent = fleeButton.parentElement
		expect(playParent).toBe(fleeParent)
		const radiogroup = screen.getByRole('radiogroup')
		expect(radiogroup.contains(fleeButton)).toBe(false)
	})

	it('clic Fuir appelle onFuir une fois', async () => {
		const user = userEvent.setup()
		const etat = createMinimalMockState('ongoing')
		const onFuir = jest.fn()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={onFuir} />)
		await user.click(screen.getByRole('button', { name: /Fuir le combat/ }))
		expect(onFuir).toHaveBeenCalledTimes(1)
	})

	it('Fuir absent en issue terminale', () => {
		const terminals: Exclude<CombatOutcome, 'ongoing'>[] = [
			'hero-victory',
			'monster-fled',
			'hero-survived-unconscious',
			'hero-mort',
			'hero-fled',
		]
		for (const outcome of terminals) {
			const { unmount } = render(
				<EcranCombat etat={createMinimalMockState(outcome)} onJouer={jest.fn()} onFuir={jest.fn()} />,
			)
			expect(screen.queryByRole('button', { name: /Fuir le combat/ })).not.toBeInTheDocument()
			unmount()
		}
	})

	it('issue hero-fled : badge FUITE et Continuer focus', () => {
		const etat = createMinimalMockState('hero-fled')
		const onClore = jest.fn()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} onClore={onClore} />)
		expect(screen.getByText('FUITE')).toBeInTheDocument()
		const continuerBtn = screen.getByRole('button', { name: /Continuer/ })
		expect(continuerBtn).toBeInTheDocument()
		expect(continuerBtn).toHaveFocus()
	})

	it('chaque issue terminale a un badge', () => {
		const outcomes: Exclude<CombatOutcome, 'ongoing'>[] = [
			'hero-victory',
			'monster-fled',
			'hero-survived-unconscious',
			'hero-mort',
			'hero-fled',
		]
		const expectedBadges = ['VICTOIRE', 'VICTOIRE', 'INCONSCIENT', 'DÉFAITE', 'FUITE']

		outcomes.forEach((outcome, idx) => {
			const { unmount } = render(
				<EcranCombat etat={createMinimalMockState(outcome)} onJouer={jest.fn()} onFuir={jest.fn()} />,
			)
			expect(screen.getByText(expectedBadges[idx])).toBeInTheDocument()
			unmount()
		})
	})

	it('affiche Badge "Commentaire en cours…" quand etat attente', () => {
		const etat = {
			...createMinimalMockState(),
			log: [{ round: 1, text: 'Round 1' }],
		}
		const commentaires = new Map([[1, { etat: 'attente' as const }]])
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} commentaires={commentaires} />)
		expect(screen.getByText('Commentaire en cours…')).toBeInTheDocument()
	})

	it('affiche la narration quand commentaire recu', () => {
		const etat = {
			...createMinimalMockState(),
			log: [{ round: 1, text: 'Round 1' }],
		}
		const commentaires = new Map([[1, { etat: 'recu' as const, narration: 'Ta lame glisse sur le cuir du gobelin.' }]])
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} commentaires={commentaires} />)
		expect(screen.getByText('Ta lame glisse sur le cuir du gobelin.')).toBeInTheDocument()
	})

	it('pas de zone recit quand pas de commentaire', () => {
		const etat = {
			...createMinimalMockState(),
			log: [{ round: 1, text: 'Round 1' }],
		}
		const commentaires = new Map()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} commentaires={commentaires} />)
		expect(screen.queryByText('Commentaire en cours…')).not.toBeInTheDocument()
	})

	it('recitLivre utilise les tokens --font-ui, --text-muted et --border-rule (sonde source)', () => {
		const src = fs.readFileSync(path.join(__dirname, 'EcranCombat.tsx'), 'utf8')
		const start = src.indexOf('const recitLivre')
		expect(start).toBeGreaterThan(-1)
		const blockEnd = src.indexOf('}', start)
		const recitBlock = src.slice(start, blockEnd + 1)
		expect(recitBlock).toContain('--font-ui')
		expect(recitBlock).toContain('--text-muted')
		expect(recitBlock).toContain('--border-rule')
		expect(recitBlock).not.toMatch(/#[0-9a-fA-F]{3,8}/)
		expect(recitBlock).not.toMatch(/rgb\(/)
	})

	it('narration affichee une seule fois, apres la derniere entree du round', () => {
		const etat = {
			...createMinimalMockState(),
			log: [
				{ round: 1, text: 'Le gobelin attaque' },
				{ round: 1, text: 'Garde aiguisee' },
			],
		}
		const commentaires = new Map([[1, { etat: 'recu' as const, narration: 'Lame tranchante.' }]])
		const { container } = render(
			<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} commentaires={commentaires} />,
		)
		const narrations = screen.getAllByText('Lame tranchante.')
		expect(narrations.length).toBe(1)
		const narrationEl = narrations[0]
		const gardeEl = screen.getByText('Garde aiguisee')
		const allP = Array.from(container.querySelectorAll('p'))
		const gardeIdx = allP.indexOf(gardeEl as HTMLParagraphElement)
		const narrationIdx = allP.indexOf(narrationEl as HTMLParagraphElement)
		expect(narrationIdx).toBeGreaterThan(gardeIdx)
	})

	it('nœud absent = silence (pas de div vide)', () => {
		const etat = {
			...createMinimalMockState(),
			log: [{ round: 1, text: 'Round 1' }],
		}
		const commentaires = new Map()
		const { container } = render(
			<EcranCombat etat={etat} onJouer={jest.fn()} onFuir={jest.fn()} commentaires={commentaires} />,
		)
		const statusDivs = container.querySelectorAll('[role="status"]')
		const emptyStatus = Array.from(statusDivs).filter((div) => div.textContent?.trim() === '')
		expect(emptyStatus.length).toBe(0)
	})
})
