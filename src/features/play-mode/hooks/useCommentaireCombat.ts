import { useCallback, useRef, useState, useEffect } from 'react'
import { useBrain } from '../../../brain'
import type { Dossier } from '../../../brain/dossier/types'
import type { CombatState } from '../../../player/engine/combatTypes'
import { projeterAssaut } from '../utils/combatProjection'

export type CommentaireRound = { readonly etat: 'attente' } | { readonly etat: 'recu'; readonly narration: string }

export interface UseCommentaireCombatResult {
	readonly commentaires: ReadonlyMap<number, CommentaireRound>
	readonly commenter: (etat: CombatState, heroPvMax: number, monstreRef: string) => void
}

export function useCommentaireCombat(dossier: Dossier): UseCommentaireCombatResult {
	const { copilote } = useBrain()
	const [commentaires, setCommentaires] = useState<Map<number, CommentaireRound>>(new Map())
	const requestedRoundsRef = useRef<Set<number>>(new Set())
	const controllersRef = useRef<Set<AbortController>>(new Set())

	useEffect(() => {
		const controllers = controllersRef.current
		return () => {
			for (const ctrl of controllers) ctrl.abort()
		}
	}, [])

	const commenter = useCallback(
		(etat: CombatState, heroPvMax: number, monstreRef: string) => {
			const round = etat.dernierAssaut?.round
			if (round === undefined) return
			if (requestedRoundsRef.current.has(round)) return

			const projection = projeterAssaut(etat, heroPvMax, monstreRef)
			if (!projection) return

			requestedRoundsRef.current.add(round)
			setCommentaires((prev) => new Map(prev).set(round, { etat: 'attente' }))

			const ctrl = new AbortController()
			controllersRef.current.add(ctrl)
			;(async () => {
				try {
					const reponse = await copilote.demander(dossier, { role: 'commentateur', projection }, ctrl.signal)
					if (ctrl.signal.aborted) return

					if ('statut' in reponse) {
						setCommentaires((prev) => {
							const next = new Map(prev)
							next.delete(round)
							return next
						})
						return
					}

					setCommentaires((prev) => new Map(prev).set(round, { etat: 'recu', narration: reponse.narration }))
				} catch {
					if (ctrl.signal.aborted) return
					setCommentaires((prev) => {
						const next = new Map(prev)
						next.delete(round)
						return next
					})
				} finally {
					controllersRef.current.delete(ctrl)
				}
			})()
		},
		[dossier, copilote],
	)

	return { commentaires, commenter }
}
