/**
 * moteur-fins it3 — tests d'integration mort du heros
 *
 * Criteres couverts :
 *  CA1+CA3 — PartieEnCours hero-mort affiche EcranMort sans actionsEntete + clic Nouvelle partie
 *  CA7 — rechargement hero-mort reroute vers nouvelle partie directe (AiguillagePartie)
 *  KR-013 — cloreCombat(hero-mort) retourne session AS-IS, pas de mort_confirmee
 */

import { render, screen, fireEvent } from '@testing-library/react'
import {
	createBrain,
	BrainProvider,
	fixerHeros,
	cloreCombat,
	type Brain,
	type Dossier,
	type EtatSession,
	ouvrirSession,
} from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { bilanDe, rejouerCombat } from '../../../player/engine/rencontre'
import type { CombatState } from '../../../player/engine/combatTypes'
import { defaultEffectsState } from '../../../player/engine/combatTypes'
import { EcranPartie } from '../components/EcranPartie'
import { PartieEnCours } from '../components/PartieEnCours'

jest.mock('../../../player/engine/rencontre', () => ({
	...jest.requireActual('../../../player/engine/rencontre'),
	rejouerCombat: jest.fn(),
}))

const mockRejouerCombat = rejouerCombat as jest.MockedFunction<typeof rejouerCombat>

const HEROS_TEST = {
	name: 'Aldric',
	caracs: { FO: 12, AG: 10, DX: 10, EN: 10, IN: 10, IG: 10, SE: 10, CA: 10 } as Record<string, number>,
	pvMax: 20,
	pv: 20,
	peMax: 10,
	pe: 10,
	mcBonus: 0,
	xp: 0,
}

function avecOuverture(dossier: Dossier): Dossier {
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: 'Vous entrez...' },
		},
		updatedAt: '2026-10-07T10:00:00.000Z',
	}
}

function monterPartieJouable(brain: Brain): Dossier {
	const seme = brain.dossiers.create('Test mort du heros')
	brain.persistence.set(dossierKey(seme.id), avecOuverture(seme))
	return brain.dossiers.get(seme.id) as Dossier
}

function creerSessionAvecCombat(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 42 })
	if (!resultat.ok) throw new Error('ouvrirSession a refuse')
	const avecHeros = fixerHeros(resultat.session, HEROS_TEST)
	return {
		...avecHeros,
		combat: {
			monstre_ref: 'monstre.test',
			postures: [],
		},
	}
}

function sauvegarderSessionAvecCombat(brain: Brain, dossier: Dossier): void {
	brain.sessions.ecrire(dossier.id, creerSessionAvecCombat(dossier))
}

const etatMort: CombatState = {
	monster: {
		name: 'Gobelin',
		pv: 5,
		pvMax: 5,
		peMax: 0,
		pe: 0,
		FO: 8,
		EN: 8,
		mc: 8,
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
	heroPv: 0,
	heroPe: 10,
	heroArmorDegradation: 0,
	heroPvAtStart: 20,
	round: 3,
	consecutiveDefWins: { hero: 0, monster: 0 },
	gardeBonus: { hero: 0, monster: 0 },
	log: [
		{ round: 1, text: 'Le gobelin frappe.' },
		{ round: 2, text: 'Le heros tombe.' },
	],
	phase: 'ended',
	outcome: 'hero-mort',
	bestHeroHit: 'rate',
	pendingXp: 0,
	pendingLoot: null,
	effects: defaultEffectsState(),
	pendingEnMaxDelta: 0,
	pendingPvMaxDelta: 0,
	pendingVol: false,
}

describe('moteur-fins it3 mort du heros', () => {
	beforeEach(() => {
		window.localStorage.clear()
		mockRejouerCombat.mockReset()
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('KR-013 — cloreCombat(hero-mort) retourne session AS-IS, pas de mort_confirmee', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		sauvegarderSessionAvecCombat(brain, dossier)

		const lecture = brain.sessions.lire(dossier)
		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut !== 'reprenable') return

		const session = lecture.session
		expect(session.heros).toBeDefined()
		expect(session.combat).toBeDefined()
		expect('mort_confirmee' in session).toBe(false)

		const bilan = bilanDe(etatMort)
		expect(bilan).not.toBeNull()
		if (!bilan) return

		expect(bilan.issue).toBe('hero-mort')
		const sessionApres = cloreCombat(session, bilan)
		expect(sessionApres).toBe(session)
	})

	it('CA7 — reprise hero-mort reroute vers creation de heros (nouvelle partie directe)', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		sauvegarderSessionAvecCombat(brain, dossier)

		mockRejouerCombat.mockReturnValue({ ok: true, etat: etatMort })

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
		expect(screen.queryByText('PARTIE TERMINÉE')).not.toBeInTheDocument()
	})

	it('CA1+CA3 — PartieEnCours hero-mort affiche EcranMort sans actionsEntete', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		const session = creerSessionAvecCombat(dossier)
		const handleNouvellePartie = jest.fn()
		const handleRejouer = jest.fn()

		mockRejouerCombat.mockReturnValue({ ok: true, etat: etatMort })

		render(
			<BrainProvider brain={brain}>
				<PartieEnCours
					dossier={dossier}
					dossierId={dossier.id}
					session={session}
					onNouvellePartie={handleNouvellePartie}
					onRejouer={handleRejouer}
				/>
			</BrainProvider>,
		)

		expect(screen.getByText(/MORT · Aldric/)).toBeInTheDocument()
		expect(screen.getByText('PARTIE TERMINÉE')).toBeInTheDocument()
		expect(screen.queryByText('COMBAT')).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: "Carnet d'indices" })).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: /Nouvelle partie/i }))
		expect(handleNouvellePartie).toHaveBeenCalledTimes(1)
	})

	it('clic Rejouer appelle onRejouer avec session.graine_alea', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		const session = creerSessionAvecCombat(dossier)
		const handleNouvellePartie = jest.fn()
		const handleRejouer = jest.fn()

		mockRejouerCombat.mockReturnValue({ ok: true, etat: etatMort })

		render(
			<BrainProvider brain={brain}>
				<PartieEnCours
					dossier={dossier}
					dossierId={dossier.id}
					session={session}
					onNouvellePartie={handleNouvellePartie}
					onRejouer={handleRejouer}
				/>
			</BrainProvider>,
		)

		expect(screen.getByText(/MORT · Aldric/)).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', { name: /Rejouer/i }))
		expect(handleRejouer).toHaveBeenCalledTimes(1)
		expect(handleRejouer).toHaveBeenCalledWith(42)
	})

	it('aide Rejouer affichee sur ecran de mort', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		const session = creerSessionAvecCombat(dossier)

		mockRejouerCombat.mockReturnValue({ ok: true, etat: etatMort })

		render(
			<BrainProvider brain={brain}>
				<PartieEnCours
					dossier={dossier}
					dossierId={dossier.id}
					session={session}
					onNouvellePartie={jest.fn()}
					onRejouer={jest.fn()}
				/>
			</BrainProvider>,
		)

		expect(screen.getByText(/Mêmes dés dès la création/)).toBeInTheDocument()
	})
})
