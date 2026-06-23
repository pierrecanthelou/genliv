import { saveSession, loadSession, clearSession, PLAY_SESSION_KEY_PREFIX } from './persist'
import type { SessionState } from '../types'

function makeSession(bookId = 'book-1'): SessionState {
	return {
		bookId,
		currentNodeId: 'n-1',
		hero: {
			name: 'Hero',
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
	}
}

describe('PLAY_SESSION_KEY_PREFIX', () => {
	it('matches the value registered in brain/persistenceKeys.ts (KR-134)', () => {
		expect(PLAY_SESSION_KEY_PREFIX).toBe('genliv:play:session:')
	})
})

beforeEach(() => {
	window.localStorage.clear()
})

describe('saveSession / loadSession', () => {
	it('round-trips a session through localStorage', () => {
		const s = makeSession()
		saveSession('book-1', s)
		expect(loadSession('book-1')).toEqual(s)
	})

	it('uses the correct key prefix', () => {
		saveSession('book-1', makeSession())
		expect(window.localStorage.getItem(`${PLAY_SESSION_KEY_PREFIX}book-1`)).not.toBeNull()
	})

	it('returns null when nothing is saved', () => {
		expect(loadSession('book-99')).toBeNull()
	})

	it('isolates sessions by bookId', () => {
		const s1 = makeSession('book-1')
		const s2 = makeSession('book-2')
		s2.currentNodeId = 'n-2'
		saveSession('book-1', s1)
		saveSession('book-2', s2)
		expect(loadSession('book-1')?.currentNodeId).toBe('n-1')
		expect(loadSession('book-2')?.currentNodeId).toBe('n-2')
	})
})

describe('loadSession migration', () => {
	it('applies default equipment fields when loading a session saved before iter 2', () => {
		const legacy = {
			bookId: 'book-1',
			currentNodeId: 'n-1',
			hero: { name: 'Old', caracs: {}, pvMax: 10, pv: 10, peMax: 4, pe: 4, mcBonus: 0, xp: 0 },
			visitedNodes: [],
		}
		window.localStorage.setItem(`${PLAY_SESSION_KEY_PREFIX}book-1`, JSON.stringify(legacy))
		const loaded = loadSession('book-1')
		expect(loaded?.inventory).toEqual([])
		expect(loaded?.activeWeapon).toBe('mains-nues')
		expect(loaded?.activeProtection).toBeNull()
		expect(loaded?.activeShield).toBe(false)
		expect(loaded?.armorDegradation).toBe(0)
	})
})

describe('clearSession', () => {
	it('removes the saved session', () => {
		saveSession('book-1', makeSession())
		clearSession('book-1')
		expect(loadSession('book-1')).toBeNull()
	})

	it('is a no-op when nothing is saved', () => {
		expect(() => clearSession('book-99')).not.toThrow()
	})
})
