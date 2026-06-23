import { useState, useCallback } from 'react'
import type { Edge } from '../../brain/types'
import type { AdventureDocument, PlayPhase, SessionState } from '../types'
import { createSession, navigate, listChoices, determinePhase } from '../engine/sessionEngine'
import { saveSession, loadSession, clearSession } from '../utils/persist'

export interface UsePlaySessionResult {
	session: SessionState | null
	choices: Edge[]
	phase: PlayPhase | null
	hasSavedSession: boolean
	resume: () => void
	startNew: () => void
	navigateTo: (targetNodeId: string) => void
	restart: () => void
}

export function usePlaySession(adventure: AdventureDocument): UsePlaySessionResult {
	const bookId = adventure.book.id
	const [session, setSession] = useState<SessionState | null>(null)
	// NOTE: snapshot at mount — not reactive after startNew/restart. Safe here because
	// the start prompt unmounts once session is set; do not copy this pattern.
	const [hasSavedSession] = useState<boolean>(() => loadSession(bookId) !== null)

	const choices = session ? listChoices(adventure, session) : []
	const phase = session ? determinePhase(adventure, session) : null

	const resume = useCallback(() => {
		const saved = loadSession(bookId)
		if (saved) setSession(saved)
	}, [bookId])

	const startNew = useCallback(() => {
		clearSession(bookId)
		const s = createSession(adventure)
		setSession(s)
		saveSession(bookId, s)
	}, [adventure, bookId])

	const navigateTo = useCallback(
		(targetNodeId: string) => {
			if (!session) return
			const next = navigate(session, targetNodeId)
			setSession(next)
			saveSession(bookId, next)
		},
		[session, bookId],
	)

	const restart = useCallback(() => {
		clearSession(bookId)
		const s = createSession(adventure)
		setSession(s)
		saveSession(bookId, s)
	}, [adventure, bookId])

	return { session, choices, phase, hasSavedSession, resume, startNew, navigateTo, restart }
}
