import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import { EcranMort, TEXTE_MORT_HEROS } from './EcranMort'
import type { CombatLogEntry } from '../../../player/engine/combatTypes'

describe('EcranMort', () => {
	const mockLog: CombatLogEntry[] = [
		{ round: 1, text: 'Le héros attaque.' },
		{ round: 2, text: 'Le monstre riposte.' },
	]
	const mockOnNouvellePartie = jest.fn()
	const mockOnRejouer = jest.fn()

	afterEach(() => jest.clearAllMocks())

	it('affiche TEXTE_MORT_HEROS', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		expect(screen.getByText(TEXTE_MORT_HEROS)).toBeInTheDocument()
	})

	it('affiche h2 MORT · nom du héros', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		const h2 = screen.getByRole('heading', { level: 2 })
		expect(h2).toHaveTextContent('MORT · Aldric')
	})

	it('affiche h2 Héros sans nom si nom vide', () => {
		render(<EcranMort nom="" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		const h2 = screen.getByRole('heading', { level: 2 })
		expect(h2).toHaveTextContent('MORT · Héros sans nom')
	})

	it('affiche le journal des rounds', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		expect(screen.getByText('Le héros attaque.')).toBeInTheDocument()
		expect(screen.getByText('Le monstre riposte.')).toBeInTheDocument()
	})

	it('clés stables avec des rounds dupliqués', () => {
		const logDoublons: CombatLogEntry[] = [
			{ round: 1, text: 'Le monstre attaque.' },
			{ round: 1, text: 'Le héros est mort.' },
		]
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
		render(
			<EcranMort nom="Aldric" log={logDoublons} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />,
		)
		expect(screen.getByText('Le monstre attaque.')).toBeInTheDocument()
		expect(screen.getByText('Le héros est mort.')).toBeInTheDocument()
		expect(spy.mock.calls.some(([m]) => String(m).includes('same key'))).toBe(false)
		spy.mockRestore()
	})

	it('affiche Badge PARTIE TERMINÉE', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		expect(screen.getByText('PARTIE TERMINÉE')).toBeInTheDocument()
	})

	it('affiche aide sous le bouton', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		expect(screen.getByText(/La partie est terminée/)).toBeInTheDocument()
	})

	it('clic Nouvelle partie appelle onNouvellePartie', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		const bouton = screen.getByRole('button', { name: /Nouvelle partie/i })
		fireEvent.click(bouton)
		expect(mockOnNouvellePartie).toHaveBeenCalledTimes(1)
	})

	it('bouton Nouvelle partie focalisé au montage (autoFocus)', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		const bouton = screen.getByRole('button', { name: /Nouvelle partie/i })
		expect(document.activeElement).toBe(bouton)
	})

	it('KR-308 — balayage source : --text-strong, pas --bad ni --good', () => {
		const source = fs.readFileSync(path.join(__dirname, 'EcranMort.tsx'), 'utf8')
		expect(source).toContain('--text-strong')
		expect(source).not.toContain('--bad')
		expect(source).not.toContain('--good')
	})

	it('bouton Rejouer existe et appelle onRejouer', () => {
		const mockOnRejouer = jest.fn()
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)

		const boutonRejouer = screen.getByRole('button', { name: /Rejouer/i })
		expect(boutonRejouer).toBeInTheDocument()
		fireEvent.click(boutonRejouer)
		expect(mockOnRejouer).toHaveBeenCalledTimes(1)
	})

	it('aide Rejouer affichee', () => {
		render(<EcranMort nom="Aldric" log={mockLog} onNouvellePartie={mockOnNouvellePartie} onRejouer={mockOnRejouer} />)
		expect(screen.getByText(/Mêmes dés dès la création/)).toBeInTheDocument()
	})
})
