import {
	findSommaire,
	getNode,
	listChoices,
	determinePhase,
	createSession,
	createSessionFromHero,
	navigate,
} from './sessionEngine'
import type { AdventureDocument, SessionState } from '../types'
import type { Edge } from '../../brain/types'

function makeAdventure(overrides: Partial<AdventureDocument> = {}): AdventureDocument {
	return {
		format: 'genliv-play',
		version: 1,
		exportedAt: '2026-06-23T00:00:00Z',
		book: { id: 'book-1', title: 'Test' },
		nodes: [
			{ id: 'n-sommaire', kind: 'sommaire', text: 'Bienvenue' },
			{ id: 'n-choix', kind: 'choix', text: 'Couloir' },
			{ id: 'n-fin', kind: 'fin', text: 'Victoire !', endVictory: true },
			{ id: 'n-echec', kind: 'fin', text: 'Echec…', endFailure: true },
			{ id: 'n-mort', kind: 'mort', text: 'Vous etes mort.' },
		],
		edges: [
			{ id: 'e1', from: 'n-sommaire', to: 'n-choix', kind: 'choice', label: 'Avancer' } as Edge,
			{ id: 'e2', from: 'n-choix', to: 'n-fin', kind: 'choice', label: 'Ouvrir le coffre' } as Edge,
		],
		objects: [],
		warnings: [],
		...overrides,
	} as unknown as AdventureDocument
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
	return {
		bookId: 'book-1',
		currentNodeId: 'n-sommaire',
		hero: {
			name: 'Test',
			caracs: { FO: 4, AG: 4, DX: 4, EN: 4, IN: 4, IG: 4, SE: 4, CA: 4 },
			pvMax: 12,
			pv: 12,
			peMax: 4,
			pe: 4,
			mcBonus: 0,
			xp: 0,
		},
		visitedNodes: [],
		inventory: [],
		activeWeapon: 'mains-nues',
		activeProtection: null,
		activeShield: false,
		armorDegradation: 0,
		activeMagicBonus: 0,
		activeSilverWeapon: false,
		permanentArmorBonus: 0,
		...overrides,
	}
}

describe('findSommaire', () => {
	it('returns the id of the sommaire node', () => {
		expect(findSommaire(makeAdventure())).toBe('n-sommaire')
	})

	it('throws when no sommaire exists', () => {
		const adv = makeAdventure({ nodes: [{ id: 'x', kind: 'choix', text: '' }] } as Partial<AdventureDocument>)
		expect(() => findSommaire(adv as AdventureDocument)).toThrow()
	})
})

describe('getNode', () => {
	it('returns the node by id', () => {
		const node = getNode(makeAdventure(), 'n-choix')
		expect(node?.id).toBe('n-choix')
	})

	it('returns null for unknown id', () => {
		expect(getNode(makeAdventure(), 'unknown')).toBeNull()
	})
})

describe('listChoices', () => {
	it('returns choice edges from the current node', () => {
		const session = makeSession({ currentNodeId: 'n-sommaire' })
		const choices = listChoices(makeAdventure(), session)
		expect(choices).toHaveLength(1)
		expect(choices[0].id).toBe('e1')
	})

	it('excludes edges from other nodes', () => {
		const session = makeSession({ currentNodeId: 'n-choix' })
		const choices = listChoices(makeAdventure(), session)
		expect(choices).toHaveLength(1)
		expect(choices[0].id).toBe('e2')
	})

	it('returns empty array when no choices', () => {
		const session = makeSession({ currentNodeId: 'n-fin' })
		expect(listChoices(makeAdventure(), session)).toHaveLength(0)
	})

	it('shows a prereq choice when the hero owns the required object (A3)', () => {
		const advWithPrereq = makeAdventure({
			edges: [
				{
					id: 'e-prereq',
					from: 'n-sommaire',
					to: 'n-choix',
					kind: 'choice',
					label: 'Secret',
					prereq: { objectId: 'obj-1' },
				} as Edge,
			],
		})
		const session = makeSession({ currentNodeId: 'n-sommaire', inventory: ['obj-1'] })
		expect(listChoices(advWithPrereq, session)).toHaveLength(1)
	})

	it('hides a prereq choice when the hero does not own the required object (A3)', () => {
		const advWithPrereq = makeAdventure({
			edges: [
				{
					id: 'e-prereq',
					from: 'n-sommaire',
					to: 'n-choix',
					kind: 'choice',
					label: 'Secret',
					prereq: { objectId: 'obj-1' },
				} as Edge,
			],
		})
		const session = makeSession({ currentNodeId: 'n-sommaire', inventory: [] })
		expect(listChoices(advWithPrereq, session)).toHaveLength(0)
	})

	it('hides a prereq choice when objectId is empty (unconfigured, safe default)', () => {
		const advWithPrereq = makeAdventure({
			edges: [
				{
					id: 'e-prereq',
					from: 'n-sommaire',
					to: 'n-choix',
					kind: 'choice',
					label: 'Non configuré',
					prereq: { objectId: '' },
				} as Edge,
			],
		})
		const session = makeSession({ currentNodeId: 'n-sommaire', inventory: ['obj-1'] })
		expect(listChoices(advWithPrereq, session)).toHaveLength(0)
	})
})

describe('determinePhase', () => {
	it('returns playing for a normal node', () => {
		expect(determinePhase(makeAdventure(), makeSession({ currentNodeId: 'n-choix' }))).toBe('playing')
	})

	it('returns victory for endVictory node', () => {
		expect(determinePhase(makeAdventure(), makeSession({ currentNodeId: 'n-fin' }))).toBe('victory')
	})

	it('returns failure for endFailure node', () => {
		expect(determinePhase(makeAdventure(), makeSession({ currentNodeId: 'n-echec' }))).toBe('failure')
	})

	it('returns death for mort node', () => {
		expect(determinePhase(makeAdventure(), makeSession({ currentNodeId: 'n-mort' }))).toBe('death')
	})
})

describe('createSession', () => {
	it('starts at the sommaire node', () => {
		const session = createSession(makeAdventure())
		expect(session.currentNodeId).toBe('n-sommaire')
	})

	it('sets bookId from the adventure', () => {
		expect(createSession(makeAdventure()).bookId).toBe('book-1')
	})

	it('hero PV starts at pvMax', () => {
		const session = createSession(makeAdventure())
		expect(session.hero.pv).toBe(session.hero.pvMax)
	})
})

describe('createSessionFromHero', () => {
	const hero = makeSession().hero

	it('places the hero at sommaire', () => {
		const s = createSessionFromHero(makeAdventure(), hero)
		expect(s.currentNodeId).toBe('n-sommaire')
	})

	it('preserves the supplied hero', () => {
		const s = createSessionFromHero(makeAdventure(), hero)
		expect(s.hero).toEqual(hero)
	})

	it('initialises default equipment fields', () => {
		const s = createSessionFromHero(makeAdventure(), hero)
		expect(s.inventory).toEqual([])
		expect(s.activeWeapon).toBe('mains-nues')
		expect(s.activeProtection).toBeNull()
		expect(s.activeShield).toBe(false)
		expect(s.armorDegradation).toBe(0)
	})
})

describe('navigate', () => {
	it('moves to the target node', () => {
		const session = makeSession()
		const next = navigate(session, 'n-choix')
		expect(next.currentNodeId).toBe('n-choix')
	})

	it('adds +5 PE per transition, capped at peMax', () => {
		const session = makeSession({ hero: { ...makeSession().hero, pe: 2, peMax: 4 } })
		const next = navigate(session, 'n-choix')
		expect(next.hero.pe).toBe(4)
	})

	it('does not exceed peMax', () => {
		const session = makeSession({ hero: { ...makeSession().hero, pe: 4, peMax: 4 } })
		const next = navigate(session, 'n-choix')
		expect(next.hero.pe).toBe(4)
	})

	it('preserves other hero fields', () => {
		const session = makeSession()
		const next = navigate(session, 'n-choix')
		expect(next.hero.xp).toBe(0)
		expect(next.hero.mcBonus).toBe(0)
	})
})
