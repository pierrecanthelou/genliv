import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type WheelEvent as ReactWheelEvent,
} from 'react'
import { useUIPreferences, type Viewport } from '../../../brain'

/**
 * Local pan/zoom for the canvas. The live viewport is fast per-frame state, but
 * it is now SEEDED from and PERSISTED to UIPreferencesService per book — a
 * per-device, non-synced preference (KR-022), written on settle (drag-release,
 * each zoom step) rather than every pan frame. The `Viewport`
 * shape is the brain one (UIPreferencesService), reused so the two can't drift.
 */
export type { Viewport }

const ZOOM_MIN = 0.4
const ZOOM_MAX: number = 2
const ZOOM_STEP = 0.15
const DRAG_THRESHOLD = 4
const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

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

export function useViewport(bookId: string | null): UseViewport {
	const uiPreferences = useUIPreferences()
	// Seed the live viewport from the persisted per-book value (lazy init, KR-013).
	const [viewport, setViewportState] = useState<Viewport>(
		() => (bookId !== null ? uiPreferences.getBookPrefs(bookId).viewport : undefined) ?? DEFAULT_VIEWPORT,
	)
	// A mirror of the live viewport so handlers read the latest without a functional
	// updater, and so the settle-time persist writes the current value.
	const viewportRef = useRef(viewport)
	const didDragRef = useRef(false)
	/** Detach the active drag listeners — also used as unmount cleanup. */
	const detachDragRef = useRef<(() => void) | null>(null)

	const applyViewport = useCallback((next: Viewport) => {
		viewportRef.current = next
		setViewportState(next)
	}, [])

	const persistViewport = useCallback(() => {
		if (bookId !== null) uiPreferences.setViewport(bookId, viewportRef.current)
	}, [bookId, uiPreferences])

	const zoomBy = useCallback(
		(delta: number) => {
			applyViewport({ ...viewportRef.current, zoom: clampZoom(viewportRef.current.zoom + delta) })
			persistViewport()
		},
		[applyViewport, persistViewport],
	)

	const onBackgroundPointerDown = useCallback(
		(e: ReactPointerEvent) => {
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
					applyViewport({ ...viewportRef.current, x: viewportRef.current.x + dx, y: viewportRef.current.y + dy })
				}
			}
			const detach = () => {
				window.removeEventListener('pointermove', onMove)
				window.removeEventListener('pointerup', detach)
				detachDragRef.current = null
				// Persist once the pan settles (not every frame).
				if (didDragRef.current) persistViewport()
			}
			// Replace any stale in-flight drag before attaching a fresh one.
			detachDragRef.current?.()
			detachDragRef.current = detach
			window.addEventListener('pointermove', onMove)
			window.addEventListener('pointerup', detach)
		},
		[applyViewport, persistViewport],
	)

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
