import { useEffect, useRef, useState } from 'react'

/** Idle delay (ms) before a debounced text edit commits to the store. */
const DEBOUNCE_MS = 400

export interface DebouncedText {
	value: string
	onChange: (next: string) => void
	/** Commit any pending edit now (e.g. on blur). */
	flush: () => void
}

/**
 * Debounced text editing for a panel field (node-editor iter 4): the field shows
 * a fast LOCAL draft and commits to the store only after the typing settles, so a
 * keystroke no longer fires updateNode → node:updated → a canvas/outline re-read
 * on every character. The draft is seeded ONCE from the store value (legitimate
 * editing state, not a useEffect-synced mirror — KR-013), so the panel must be
 * KEYED by node id (KR-053) to reset it on a selection swap.
 *
 * No data loss: a pending edit is FLUSHED on blur AND on unmount (the selection
 * swap that unmounts the keyed panel), and the timer is cleared on unmount (the
 * timer-safety rule). `commit` is held in a ref so the scheduled callback always
 * calls the latest one (no stale closure, KR-004).
 */
export function useDebouncedText(initial: string, commit: (value: string) => void): DebouncedText {
	// Seeded ONCE — the active local draft intentionally wins over a concurrent store
	// change to the same node (consistent with the rest of the write-through panel);
	// the keyed-by-id panel reseeds this on a selection swap (KR-053).
	const [value, setValue] = useState(initial)
	const valueRef = useRef(initial)
	const commitRef = useRef(commit)
	commitRef.current = commit
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

	function clear(): void {
		if (timer.current !== null) {
			clearTimeout(timer.current)
			timer.current = null
		}
	}

	function onChange(next: string): void {
		valueRef.current = next
		setValue(next)
		clear()
		timer.current = setTimeout(() => {
			timer.current = null
			commitRef.current(next)
		}, DEBOUNCE_MS)
	}

	function flush(): void {
		if (timer.current === null) return // nothing pending
		clear()
		commitRef.current(valueRef.current)
	}

	// Flush a pending edit on unmount (a selection swap remounts the keyed panel),
	// then clear the timer — never lose the last few typed characters.
	useEffect(() => {
		return () => {
			if (timer.current !== null) {
				clearTimeout(timer.current)
				commitRef.current(valueRef.current)
			}
		}
	}, [])

	return { value, onChange, flush }
}
