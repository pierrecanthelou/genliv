import type { SessionState } from '../types'
import { defaultSessionFields } from '../engine/sessionEngine'

// Must stay in sync with PLAY_SESSION_KEY_PREFIX in src/brain/persistenceKeys.ts (KR-134).
export const PLAY_SESSION_KEY_PREFIX = 'genliv:play:session:'

function sessionKey(bookId: string): string {
	return `${PLAY_SESSION_KEY_PREFIX}${bookId}`
}

export function saveSession(bookId: string, state: SessionState): void {
	try {
		window.localStorage.setItem(sessionKey(bookId), JSON.stringify(state))
	} catch {
		/* storage unavailable */
	}
}

export function loadSession(bookId: string): SessionState | null {
	try {
		const raw = window.localStorage.getItem(sessionKey(bookId))
		if (!raw) return null
		const parsed = JSON.parse(raw) as Record<string, unknown>
		// Migrate sessions saved before iter 2 (missing equipment/inventory fields).
		const defaults = defaultSessionFields()
		return {
			...defaults,
			...parsed,
		} as SessionState
	} catch {
		return null
	}
}

export function clearSession(bookId: string): void {
	try {
		window.localStorage.removeItem(sessionKey(bookId))
	} catch {
		/* storage unavailable */
	}
}
