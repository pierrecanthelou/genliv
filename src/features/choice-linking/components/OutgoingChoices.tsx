import { useState } from 'react'
import {
	useBrain,
	useOpenBook,
	Badge,
	Field,
	IconButton,
	nodeTitle,
	getNode,
	canBeTarget,
	collectObjects,
	EDGE_KINDS,
	type Edge,
	type ChoicePrereq,
	type ChoiceCountdown,
	type SlotContext,
} from '../../../brain'
import { DeleteBranchDialog } from './DeleteBranchDialog'
import { ChoicePrereqEditor } from './ChoicePrereqEditor'
import { ChoiceCountdownEditor } from './ChoiceCountdownEditor'

/**
 * « Choix sortants » — a node's outgoing branches, mounted into node-editor's
 * choices slot (the feature never imports node-editor; it registers a renderer
 * via the brain SlotRegistry). Edges are the book's structure, so every
 * create/remove goes through BookService (KR-060/020); this is a live VIEW.
 *
 * Scope: list rows + « + Nouvelle branche » (new child via a `choice` edge) +
 * « Relier… » (a `relink` edge to an existing node) + a confirmation-gated
 * remove (dangerous-action rule; warns on orphaning, KR-064) + an editable
 * « libellé du choix » per row persisted on the edge via BookService (the player
 * button text; canvas falls back to the kind label when empty). Hidden
 * prerequisite / countdown rules arrive in later iterations (need
 * ObjectCatalogService, which lands with action-decor).
 */
export function OutgoingChoices({ bookId, nodeId }: SlotContext): JSX.Element {
	const { books, selection } = useBrain()
	const book = useOpenBook(bookId)
	const [relinking, setRelinking] = useState(false)
	const [query, setQuery] = useState('')
	// The branch awaiting delete confirmation (null = no dialog open). Removing an
	// edge is destructive + irreversible, so it is gated (dangerous-action rule).
	const [pendingDelete, setPendingDelete] = useState<Edge | null>(null)

	const outgoing = book !== null ? book.edges.filter((e) => e.from === nodeId) : []
	const titleOf = (id: string): string => {
		const node = getNode(book, id)
		return node !== null ? nodeTitle(node) : '⚠ cible supprimée'
	}
	// The book's acquirable-object catalog (derived VIEW, KR-062): the hidden-prereq
	// picker references these by stable id. Recomputed inline from the live book
	// (KR-013) so adding/removing an object elsewhere updates the picker + dangling check.
	const catalog = collectObjects(book)
	const prereqResolves = (prereq: ChoicePrereq): boolean => catalog.some((o) => o.id === prereq.objectId)
	// A countdown's fallback node must resolve to an existing node (KR-063/021) —
	// '' (unconfigured) or a deleted target dangles and is surfaced on the row.
	const countdownResolves = (cd: ChoiceCountdown): boolean => cd.fallback !== '' && getNode(book, cd.fallback) !== null
	const allNodes = book !== null ? book.nodes : []
	// Relink candidates: any node except this one (self-link guarded, KR-061),
	// excluding structural screens — the Sommaire root and the Mort leaf are
	// never authored choice targets (KR-067); Mort is reached only automatically
	// in combat. A node already reached by a `relink` from here is excluded too,
	// so this control never offers a duplicate edge — the exclusion is scoped to
	// `relink` because that is the only kind this control mints (a future kind
	// minted here would need to key the set on kind too). Both mirror SSOT guards
	// in BookService.addEdge (the picker is convenience; the SSOT is the law).
	const relinkedTargets = new Set(outgoing.filter((e) => e.kind === 'relink').map((e) => e.to))
	const candidates =
		book !== null ? book.nodes.filter((n) => n.id !== nodeId && canBeTarget(n.kind) && !relinkedTargets.has(n.id)) : []
	// Search is derived inline from the live candidates (KR-013), not mirrored.
	const needle = query.trim().toLowerCase()
	const matches = needle === '' ? candidates : candidates.filter((n) => nodeTitle(n).toLowerCase().includes(needle))

	function addBranch(): void {
		const created = books.addChoiceBranch(bookId, nodeId)
		if (created !== null) selection.select(bookId, created.node.id)
	}

	function relinkTo(targetId: string): void {
		books.addEdge(bookId, nodeId, targetId, 'relink')
		setRelinking(false)
		setQuery('')
	}

	function toggleRelink(): void {
		setQuery('')
		setRelinking((v) => !v)
	}

	function confirmDelete(): void {
		if (pendingDelete !== null) books.removeEdge(bookId, pendingDelete.id)
		setPendingDelete(null)
	}

	// A branch removal orphans its destination when this is the node's ONLY
	// incoming link — the dialog warns about it (KR-064). Computed from the live
	// book, not stored, so it stays correct if edges change before confirming.
	const pendingOrphans =
		pendingDelete !== null &&
		book !== null &&
		book.edges.filter((e) => e.to === pendingDelete.to && e.id !== pendingDelete.id).length === 0

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
									{edge.prereq !== undefined &&
										(prereqResolves(edge.prereq) ? (
											<Badge tone="muted">⊘ pré-requis</Badge>
										) : (
											// Text (not just the ⚠ glyph) names the dangling state for screen readers.
											<Badge tone="bad">⚠ pré-requis introuvable</Badge>
										))}
									{edge.countdown !== undefined &&
										(countdownResolves(edge.countdown) ? (
											<Badge tone="muted">⏱ {edge.countdown.delay}s</Badge>
										) : (
											<Badge tone="bad">⏱ repli manquant</Badge>
										))}
									<IconButton label="Supprimer la branche" tone="danger" onClick={() => setPendingDelete(edge)}>
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
							{/* Hidden-prerequisite rule (§ 05, KR-062): persisted on the edge; the
							    picker references the book's object catalog by stable id. */}
							<ChoicePrereqEditor
								prereq={edge.prereq}
								catalog={catalog}
								onChange={(prereq) => books.updateEdge(bookId, edge.id, { prereq })}
							/>
							{/* Countdown rule (§ 05, KR-063/065): persisted on the edge; the
							    fallback is picked via the shared brain TargetPicker. */}
							<ChoiceCountdownEditor
								countdown={edge.countdown}
								nodes={allNodes}
								fromNodeId={nodeId}
								onChange={(countdown) => books.updateEdge(bookId, edge.id, { countdown })}
							/>
						</li>
					))}
				</ul>
			)}

			<div style={{ marginTop: 'var(--space-3)' }}>
				<button type="button" onClick={toggleRelink} style={relinkButton} aria-expanded={relinking}>
					↪ Relier à un nœud existant…
				</button>
				{relinking && (
					<div style={pickerWrap}>
						{/* Search the candidates by title; autofocus so the popover is
						    keyboard-operable from the moment it opens. */}
						<Field
							ariaLabel="Rechercher un nœud à relier"
							value={query}
							placeholder="Rechercher un nœud…"
							autoFocus
							onChange={(e) => setQuery(e.target.value)}
						/>
						<ul style={picker} aria-label="Choisir un nœud cible">
							{matches.length === 0 ? (
								<li style={{ ...candidate, color: 'var(--text-faint)' }}>
									{candidates.length === 0 ? 'Aucun autre nœud' : 'Aucun nœud ne correspond'}
								</li>
							) : (
								matches.map((node) => (
									<li key={node.id}>
										<button type="button" style={candidate} onClick={() => relinkTo(node.id)}>
											{nodeTitle(node)}
										</button>
									</li>
								))
							)}
						</ul>
					</div>
				)}
			</div>

			{pendingDelete !== null && (
				<DeleteBranchDialog
					destination={titleOf(pendingDelete.to)}
					wouldOrphan={pendingOrphans}
					onCancel={() => setPendingDelete(null)}
					onConfirm={confirmDelete}
				/>
			)}
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
const pickerWrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	marginTop: 'var(--space-2)',
}
const picker: React.CSSProperties = {
	listStyle: 'none',
	margin: 0,
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
