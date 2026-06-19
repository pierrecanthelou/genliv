import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '../layout/geometry'

/** Pointer travel (screen px) before a press becomes a drag rather than a click. */
const DRAG_THRESHOLD = 4

export interface UseNodeDrag {
	/** Live drag offset in canvas units (null when not dragging) — added to the card position. */
	delta: Point | null
	onPointerDown: (e: ReactPointerEvent) => void
	/**
	 * True if the just-finished gesture was a drag, so the card's click handler
	 * can skip selecting on drag-release. Consumes the flag (resets it).
	 */
	consumeDragClick: () => boolean
}

/**
 * Drag-to-move for a single node card. The card follows the pointer live (delta
 * in canvas units, screen travel ÷ zoom); on release past the threshold it
 * commits the new position via `onMove` (persisted through UIPreferencesService
 * by the canvas, overriding the auto-layout slot, KR-022/023). A press without
 * travel is a plain click → selection (the card guards it via consumeDragClick).
 * Window listeners are tracked and detached on unmount (no dangling listener).
 */
export function useNodeDrag(position: Point, zoom: number, onMove: (position: Point) => void): UseNodeDrag {
	const [delta, setDelta] = useState<Point | null>(null)
	const movedRef = useRef(false)
	/** Detach the active drag listeners — also used as unmount cleanup. */
	const detachRef = useRef<(() => void) | null>(null)

	const onPointerDown = useCallback(
		(e: ReactPointerEvent) => {
			// The card stops propagation so the canvas background does not start a pan.
			e.stopPropagation()
			const ox = e.clientX
			const oy = e.clientY
			movedRef.current = false

			const onPointerMove = (ev: PointerEvent) => {
				const sdx = ev.clientX - ox
				const sdy = ev.clientY - oy
				if (!movedRef.current && Math.hypot(sdx, sdy) > DRAG_THRESHOLD) movedRef.current = true
				if (movedRef.current) setDelta({ x: sdx / zoom, y: sdy / zoom })
			}
			const onPointerUp = (ev: PointerEvent) => {
				detach()
				if (movedRef.current) {
					onMove({ x: position.x + (ev.clientX - ox) / zoom, y: position.y + (ev.clientY - oy) / zoom })
				}
				setDelta(null)
			}
			function detach(): void {
				window.removeEventListener('pointermove', onPointerMove)
				window.removeEventListener('pointerup', onPointerUp)
				detachRef.current = null
			}
			// Replace any stale in-flight drag before attaching a fresh one.
			detachRef.current?.()
			detachRef.current = detach
			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp)
		},
		[position.x, position.y, zoom, onMove],
	)

	const consumeDragClick = useCallback(() => {
		if (!movedRef.current) return false
		movedRef.current = false
		return true
	}, [])

	// Cancel an in-flight drag if the card unmounts mid-gesture (no leak).
	useEffect(() => () => detachRef.current?.(), [])

	return { delta, onPointerDown, consumeDragClick }
}
