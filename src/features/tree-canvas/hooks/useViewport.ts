import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type WheelEvent as ReactWheelEvent,
} from 'react'

/**
 * Local pan/zoom for the canvas. This is per-session UI state only — it is
 * NOT persisted here and explicitly NOT cloud-synced (KR-022). Persisting
 * pan/zoom per book lands with UIPreferencesService in a later iteration.
 */
export interface Viewport {
	x: number
	y: number
	zoom: number
}

const ZOOM_MIN = 0.4
const ZOOM_MAX: number = 2
const ZOOM_STEP = 0.15
const DRAG_THRESHOLD = 4

function clampZoom(z: number): number {
	return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
}

export interface UseViewport {
	viewport: Viewport
	zoomIn: () => void
	zoomOut: () => void
	/** Pointer-drag panning on the canvas background. */
	onBackgroundPointerDown: (e: ReactPointerEvent) => void
	onWheel: (e: ReactWheelEvent) => void
	/**
	 * True if the last pointer interaction was a drag (so a click handler can
	 * skip clearing selection on drag-release). Reset on each pointer down.
	 */
	didDragRef: React.MutableRefObject<boolean>
}

export function useViewport(): UseViewport {
	const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
	const didDragRef = useRef(false)
	/** Detach the active drag listeners — also used as unmount cleanup. */
	const detachDragRef = useRef<(() => void) | null>(null)

	const zoomBy = useCallback((delta: number) => {
		setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom + delta) }))
	}, [])

	const onBackgroundPointerDown = useCallback((e: ReactPointerEvent) => {
		// Node cards / controls stop propagation, so reaching here means the
		// press began on empty canvas — safe to start a pan.
		didDragRef.current = false
		const origin = { x: e.clientX, y: e.clientY }

		const onMove = (ev: PointerEvent) => {
			const dx = ev.clientX - origin.x
			const dy = ev.clientY - origin.y
			if (!didDragRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
				didDragRef.current = true
			}
			if (didDragRef.current) {
				origin.x = ev.clientX
				origin.y = ev.clientY
				setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
			}
		}
		const detach = () => {
			window.removeEventListener('pointermove', onMove)
			window.removeEventListener('pointerup', detach)
			detachDragRef.current = null
		}
		// Replace any stale in-flight drag before attaching a fresh one.
		detachDragRef.current?.()
		detachDragRef.current = detach
		window.addEventListener('pointermove', onMove)
		window.addEventListener('pointerup', detach)
	}, [])

	// Cancel an in-flight drag if the canvas unmounts mid-gesture (no leak).
	useEffect(() => () => detachDragRef.current?.(), [])

	const onWheel = useCallback(
		(e: ReactWheelEvent) => {
			if (e.deltaY === 0) return
			zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
		},
		[zoomBy],
	)

	return {
		viewport,
		zoomIn: () => zoomBy(ZOOM_STEP),
		zoomOut: () => zoomBy(-ZOOM_STEP),
		onBackgroundPointerDown,
		onWheel,
		didDragRef,
	}
}
