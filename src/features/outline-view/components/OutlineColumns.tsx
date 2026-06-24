import { useReducer, useMemo, useLayoutEffect, useRef } from 'react'
import { useBrain, useSelectedNode, type Book } from '../../../brain'
import { buildColumnNodes, findChoicePath } from '../utils/buildColumnNodes'
import { ColumnPanel } from './ColumnPanel'

export interface OutlineColumnsProps {
	book: Book
	bookId: string
	warnedNodeIds?: ReadonlySet<string>
}

// ---------------------------------------------------------------------------
// Navigation state — local to this component, never in brain (KR-022)
// ---------------------------------------------------------------------------

type ColumnsState = {
	/** The breadcrumb trail: path[0] = sommaire, path[i] = selected node at depth i. */
	path: string[]
	/** Last selectedId from SelectionService we processed (for change detection). */
	syncedId: string | null
}

type ColumnsAction =
	| { type: 'navigate'; path: string[] }
	| { type: 'sync'; newId: string | null; resolvedPath: string[] | null }

function columnsReducer(state: ColumnsState, action: ColumnsAction): ColumnsState {
	if (action.type === 'navigate') {
		return { ...state, path: action.path }
	}
	// External selection changed: update syncedId, and update path if the node
	// is reachable via choice edges (findChoicePath returned a path).
	const { newId, resolvedPath } = action
	if (resolvedPath !== null) {
		return { path: resolvedPath, syncedId: newId }
	}
	return { ...state, syncedId: newId }
}

/**
 * Miller-columns outline view (§ 03 — iteration 4). Renders the book as a
 * horizontal sequence of columns: the leftmost shows the sommaire's children,
 * each subsequent column shows the selected node's children. Clicking a row
 * drills into it (appending to the path) and clears columns to its right.
 *
 * External canvas selections are reconciled by BFS (findChoicePath): if the
 * selected node is reachable via choice edges, the path extends to it; otherwise
 * the current path is kept. Derived during render (KR-013 — no useEffect).
 *
 * Keyed on bookId by the parent (OutlineView) so state resets on book switch.
 * The node-editor panel (always mounted on the right of the editor shell)
 * shows the full content of the selected node — no separate preview panel needed.
 */
export function OutlineColumns({ book, bookId, warnedNodeIds }: OutlineColumnsProps): JSX.Element {
	const { selection } = useBrain()
	const selectedId = useSelectedNode()

	const sommaireId = useMemo(() => book.nodes.find((n) => n.kind === 'sommaire')?.id ?? '', [book])

	const [state, dispatch] = useReducer(columnsReducer, null, () => ({
		path: [sommaireId],
		syncedId: null,
	}))

	// ── Reconcile external selection (KR-013: derived during render, not useEffect) ──
	// If selectedId has changed since last sync, compute the new path via BFS.
	if (selectedId !== state.syncedId) {
		let resolvedPath: string[] | null = null
		if (selectedId !== null && !state.path.includes(selectedId)) {
			resolvedPath = findChoicePath(book, sommaireId, selectedId)
		}
		dispatch({ type: 'sync', newId: selectedId, resolvedPath })
	}

	const columns = useMemo(() => buildColumnNodes(book, state.path), [book, state.path])
	const activePath = useMemo(() => new Set(state.path), [state.path])

	// Auto-scroll the columns container to the rightmost column when the path grows.
	const scrollRef = useRef<HTMLDivElement>(null)
	useLayoutEffect(() => {
		if (scrollRef.current !== null) {
			scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
		}
	}, [state.path.length])

	function handleNavigate(columnIndex: number, targetId: string): void {
		// Extend the path up to the clicked column depth, then append the new selection.
		const newPath = [...state.path.slice(0, columnIndex + 1), targetId]
		dispatch({ type: 'navigate', path: newPath })
		selection.select(bookId, targetId)
	}

	return (
		<div ref={scrollRef} style={columnsScroll}>
			{columns.map((col, i) => (
				<ColumnPanel
					key={col.parentId}
					column={col}
					activePath={activePath}
					warnedNodeIds={warnedNodeIds}
					onNavigate={(targetId) => handleNavigate(i, targetId)}
				/>
			))}
		</div>
	)
}

const columnsScroll: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	flex: 1,
	overflowX: 'auto',
	overflowY: 'hidden',
	height: '100%',
}
