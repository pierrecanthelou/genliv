import {
	useBrain,
	useRoute,
	useSelectedNode,
	useOpenBook,
	NodeBadge,
	Field,
	Toggle,
	effectiveKind,
	endLabel,
	nodeTitle,
	SLOT_NODE_EDITOR_CHOICES,
	isStructural,
	canHaveOutgoing,
	type NodeActionType,
	type NodePatch,
} from '../../../brain'
import { SectionLabel } from './SectionLabel'
import { ActionSection } from './ActionSection'

const PANEL_WIDTH = 372

/**
 * node-editor — the § 02 side panel. A HOST SHELL (KR-050): it owns the frame
 * + text + end toggles + action slot, and REACTS to selection (never owns it,
 * KR-024). All edits go through BookService (KR-020); fields bind directly to
 * the store so a selection swap can't leak stale field state (KR-053). The
 * libellé lives on the incoming edge, so its field is delegated to
 * choice-linking; illustration + inventory + choices are deferred slots.
 */
export function NodeEditorPanel(): JSX.Element {
	const { books, selection, events, slots } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()

	const index = book !== null ? book.nodes.findIndex((n) => n.id === selectedId) : -1
	const node = index >= 0 && book !== null ? book.nodes[index] : null

	if (bookId === null || node === null) {
		return (
			<aside style={panelShell}>
				<div style={emptyState}>
					<NodeBadge kind="choix" />
					<p style={{ margin: 'var(--space-5) 0 0', fontSize: 'var(--fs-body)', color: 'var(--text-faint)' }}>
						Sélectionnez un nœud dans l’arbre pour l’éditer.
					</p>
				</div>
			</aside>
		)
	}

	// Narrowed non-null locals for use inside the handler closures.
	const activeBookId: string = bookId
	const activeNode = node
	const locked = node.locked === true

	// Sommaire (root) and Mort (death leaf) are STRUCTURAL screens: no incoming
	// choice label, no required action, no Fin victoire/échec. Mort additionally
	// has no outgoing choices (KR-055). Their only editable field is the text.
	// Driven by the kind registry predicates, not kind tests (KR-068).
	const structural = isStructural(node.kind)
	const showLabel = !structural
	const showAction = !structural
	const showEndToggles = !structural
	const showOutgoing = canHaveOutgoing(node.kind)

	function patch(p: NodePatch): void {
		books.updateNode(activeBookId, activeNode.id, p)
	}

	function setActionType(actionType: NodeActionType): void {
		patch({ actionType })
		events.emit('action:changed', { bookId: activeBookId, nodeId: activeNode.id, actionType })
	}

	return (
		// key by node id: a fresh subtree per selection, no stale field state (KR-053).
		<aside key={node.id} style={panelShell} aria-label="Éditeur de nœud">
			<header style={panelHeader}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
					<NodeBadge kind={effectiveKind(node)} label={endLabel(node)} selected />
					<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', color: 'var(--text-faint)' }}>
						#{index + 1}
					</span>
					<span
						style={{
							fontSize: 'var(--fs-row)',
							fontWeight: 'var(--fw-semibold)',
							color: 'var(--text-strong)',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{nodeTitle(node)}
					</span>
				</div>
				<button
					type="button"
					aria-label="Fermer l’éditeur"
					onClick={() => selection.select(activeBookId, null)}
					style={closeButton}
				>
					✕
				</button>
			</header>

			<div style={panelBody}>
				{showLabel && (
					<section>
						<SectionLabel hint="— défini par la branche entrante (choice-linking)">Libellé du choix</SectionLabel>
						<div style={deferredBox}>Le libellé du bouton se règle sur la branche qui mène à ce nœud.</div>
					</section>
				)}

				<section>
					<Field
						label="Description"
						multiline
						rows={4}
						value={node.text}
						placeholder="Décrivez l’écran tel que le joueur le lit…"
						onChange={(e) => patch({ text: e.target.value })}
					/>
				</section>

				<section>
					<SectionLabel hint="— optionnelle, à venir">Illustration</SectionLabel>
					<div style={{ ...deferredBox, borderStyle: 'dashed', textAlign: 'center' }}>
						⬚ Dépôt d’image bientôt disponible
					</div>
				</section>

				{showAction && (
					<ActionSection
						bookId={bookId}
						nodeId={node.id}
						value={node.actionType ?? 'aucune'}
						onChange={setActionType}
					/>
				)}

				{showOutgoing &&
					(() => {
						const renderChoices = slots.get(SLOT_NODE_EDITOR_CHOICES)
						return (
							<section>
								{renderChoices !== null ? (
									renderChoices({ bookId: activeBookId, nodeId: activeNode.id })
								) : (
									<>
										<SectionLabel hint="— à venir (choice-linking)">Choix sortants</SectionLabel>
										<div style={deferredBox}>Les branches sortantes se gèrent depuis l’arbre.</div>
									</>
								)}
							</section>
						)
					})()}

				{showEndToggles && (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
						<Toggle
							label="Fin victoire"
							checked={node.endVictory === true}
							disabled={locked}
							onChange={(v) => patch({ endVictory: v })}
						/>
						<Toggle
							label="Fin échec"
							checked={node.endFailure === true}
							disabled={locked}
							onChange={(v) => patch({ endFailure: v })}
						/>
					</section>
				)}
			</div>
		</aside>
	)
}

const panelShell: React.CSSProperties = {
	flex: `0 0 ${PANEL_WIDTH}px`,
	width: PANEL_WIDTH,
	height: '100%',
	borderLeft: '1px solid var(--border-subtle)',
	background: 'var(--surface-card)',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
}

const panelHeader: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
	padding: 'var(--space-6) var(--space-7)',
	borderBottom: '1px solid var(--border-divider)',
}

const panelBody: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-9)',
	padding: 'var(--space-7)',
	overflowY: 'auto',
}

const emptyState: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	textAlign: 'center',
	height: '100%',
	padding: 'var(--space-9)',
}

const deferredBox: React.CSSProperties = {
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-lg)',
	background: 'var(--surface-sunken)',
	padding: 'var(--space-5)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const closeButton: React.CSSProperties = {
	width: 'var(--hit-target)',
	height: 'var(--hit-target)',
	border: 'none',
	background: 'transparent',
	color: 'var(--text-disabled)',
	fontSize: 16,
	cursor: 'pointer',
	flex: 'none',
}
