import type { SessionState } from '../types'

// Must stay in sync with PLAY_SESSION_KEY_PREFIX in src/brain/persistenceKeys.ts (KR-134).
export const PLAY_SESSION_KEY_PREFIX = 'genliv:play:session:'

function sessionKey(bookId: string): string {
	return `${PLAY_SESSION_KEY_PREFIX}${bookId}`
}

export function saveSession(bookId: string, state: SessionState): void {
	try {
		window.localStorage.setItem(sessionKey(bookId), JSON.stringify(state))
	} catch { /* storage unavailable */ }
}

export function loadSession(bookId: string): SessionState | null {
	try {
		const raw = window.localStorage.getItem(sessionKey(bookId))
		return raw ? (JSON.parse(raw) as SessionState) : null
	} catch {
		return null
	}
}

export function clearSession(bookId: string): void {
	try {
		window.localStorage.removeItem(sessionKey(bookId))
	} catch { /* storage unavailable */ }
}
