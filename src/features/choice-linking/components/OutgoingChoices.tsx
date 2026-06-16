import { useState } from 'react'
import { useBrain, useOpenBook, Badge, IconButton, nodeTitle, type SlotContext } from '../../../brain'

/**
 * « Choix sortants » — a node's outgoing branches, mounted into node-editor's
 * choices slot (the feature never imports node-editor; it registers a renderer
 * via the brain SlotRegistry). Edges are the book's structure, so every
 * create/remove goes through BookService (KR-060/020); this is a live VIEW.
 *
 * Skeleton scope: list rows + « + Nouvelle branche » (new child via a `choice`
 * edge) + « Relier… » (a `relink` edge to an existing node) + remove. Hidden
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
	// Relink candidates: any node except this one (cycles/convergence allowed).
	const candidates = book !== null ? book.nodes.filter((n) => n.id !== nodeId) : []

	function addBranch(): void {
		const created = books.addChoiceBranch(bookId, nodeId)
		if (created !== null) selection.select(bookId, created.node.id)
	}

	function relinkTo(targetId: string): void {
		books.addEdge(bookId, nodeId, targetId, 'relink')
		setRelinking(false)
	}

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
				<ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
					{outgoing.map((edge) => (
						<li key={edge.id} style={row}>
							<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {titleOf(edge.to)}</span>
							<span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 'none' }}>
								<Badge tone={edge.kind === 'choice' ? 'neutral' : 'muted'}>
									{edge.kind === 'choice' ? 'choix' : edge.kind === 'relink' ? 'reliaison' : 'fuite'}
								</Badge>
								<IconButton label="Supprimer la branche" tone="danger" onClick={() => books.removeEdge(bookId, edge.id)}>
									✕
								</IconButton>
							</span>
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
	minHeight: 44,
	padding: '0 var(--space-2)',
}
const row: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-lg)',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	minHeight: 44,
	boxSizing: 'border-box',
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
	minHeight: 44,
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
	minHeight: 44,
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
	maxHeight: 180,
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
	minHeight: 40,
}
