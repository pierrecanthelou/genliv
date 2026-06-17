import { useState } from 'react'
import {
	useBrain,
	useOpenBook,
	Badge,
	Field,
	IconButton,
	nodeTitle,
	NODE_KINDS,
	EDGE_KINDS,
	type SlotContext,
} from '../../../brain'

/**
 * « Choix sortants » — a node's outgoing branches, mounted into node-editor's
 * choices slot (the feature never imports node-editor; it registers a renderer
 * via the brain SlotRegistry). Edges are the book's structure, so every
 * create/remove goes through BookService (KR-060/020); this is a live VIEW.
 *
 * Scope: list rows + « + Nouvelle branche » (new child via a `choice` edge) +
 * « Relier… » (a `relink` edge to an existing node) + remove + an editable
 * « libellé du choix » per row persisted on the edge via BookService (the player
 * button text; canvas falls back to the kind label when empty). Hidden
 * prerequisite / countdown rules arrive in later iterations (need
 * ObjectCatalogService, which lands with action-decor).
 */
export function OutgoingChoices({ bookId, nodeId }: SlotContext): JSX.Element {
	const { books, selection } = useBrain()
	const book = useOpenBook(bookId)
	const [relinking, setRelinking] = useState(false)

	const outgoing = book !== null ? book.edges.filter((e) => e.from === nodeId) : []
	const titleOf = (id: string): string => {
		const node = book?.nodes.find((n) => n.id === id)
		return node !== undefined ? nodeTitle(node) : '⚠ cible supprimée'
	}
	// Relink candidates: any node except this one (cycles/convergence allowed),
	// excluding structural screens — the Sommaire root and the Mort leaf are
	// never authored choice targets (KR-067); Mort is reached only automatically
	// in combat. Mirrors the SSOT guard in BookService.addEdge.
	const candidates = book !== null ? book.nodes.filter((n) => n.id !== nodeId && NODE_KINDS[n.kind].canBeTarget) : []

	function addBranch(): void {
		const created = books.addChoiceBranch(bookId, nodeId)
		if (created !== null) selection.select(bookId, created.node.id)
	}

	function relinkTo(targetId: string): void {
		books.addEdge(bookId, nodeId, targetId, 'relink')
		setRelinking(false)
	}

	// Handlers are recreated each render on purpose: the list is tiny and these
	// close over fresh book state — no preemptive useCallback/memo (perf rule).
	return (
		<div>
			<div style={header}>
				<span style={label}>Choix sortants</span>
				<button type="button" onClick={addBranch} style={addButton}>
					+ branche
				</button>
			</div>

			{outgoing.length === 0 ? (
				<button type="button" onClick={addBranch} style={emptyAffordance}>
					+ Ajouter une première branche…
				</button>
			) : (
				<ul
					style={{
						listStyle: 'none',
						margin: 0,
						padding: 0,
						display: 'flex',
						flexDirection: 'column',
						gap: 'var(--space-2)',
					}}
				>
					{outgoing.map((edge) => (
						<li key={edge.id} style={row}>
							<div style={rowHeader}>
								<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									→ {titleOf(edge.to)}
								</span>
								<span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 'none' }}>
									<Badge tone={EDGE_KINDS[edge.kind].rowTone}>{EDGE_KINDS[edge.kind].rowLabel}</Badge>
									<IconButton
										label="Supprimer la branche"
										tone="danger"
										onClick={() => books.removeEdge(bookId, edge.id)}
									>
										✕
									</IconButton>
								</span>
							</div>
							{/* Player-facing button text, persisted on the edge (KR-060). Empty is
							    valid — the canvas then shows the kind's fallback label. */}
							<Field
								ariaLabel={`Libellé du choix vers ${titleOf(edge.to)}`}
								value={edge.label ?? ''}
								placeholder="Texte du bouton de choix…"
								onChange={(e) => books.updateEdge(bookId, edge.id, { label: e.target.value })}
							/>
						</li>
					))}
				</ul>
			)}

			<div style={{ marginTop: 'var(--space-3)' }}>
				<button type="button" onClick={() => setRelinking((v) => !v)} style={relinkButton} aria-expanded={relinking}>
					↪ Relier à un nœud existant…
				</button>
				{relinking && (
					<ul style={picker} aria-label="Choisir un nœud cible">
						{candidates.length === 0 ? (
							<li style={{ ...candidate, color: 'var(--text-faint)' }}>Aucun autre nœud</li>
						) : (
							candidates.map((node) => (
								<li key={node.id}>
									<button type="button" style={candidate} onClick={() => relinkTo(node.id)}>
										{nodeTitle(node)}
									</button>
								</li>
							))
						)}
					</ul>
				)}
			</div>
		</div>
	)
}

/** Relink picker dropdown max height before it scrolls. */
const PICKER_MAX_HEIGHT = 180

const header: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: 'var(--space-3)',
}
const label: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow)',
	textTransform: 'uppercase',
	color: 'var(--text-muted)',
	fontWeight: 'var(--fw-semibold)',
}
const addButton: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--accent)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
}
const row: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-lg)',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	boxSizing: 'border-box',
}
const rowHeader: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
	minHeight: 'var(--hit-target)',
}
const emptyAffordance: React.CSSProperties = {
	width: '100%',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-lg)',
	background: 'var(--paper-1)',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-5)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
const relinkButton: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	background: 'transparent',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	padding: '8px 10px',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	width: '100%',
	textAlign: 'left',
}
const picker: React.CSSProperties = {
	listStyle: 'none',
	margin: 'var(--space-2) 0 0',
	padding: 'var(--space-1)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	boxShadow: 'var(--shadow-menu)',
	maxHeight: PICKER_MAX_HEIGHT,
	overflowY: 'auto',
}
const candidate: React.CSSProperties = {
	width: '100%',
	textAlign: 'left',
	background: 'transparent',
	border: 'none',
	borderRadius: 'var(--r-sm)',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
