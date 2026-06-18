import { EDGE_KINDS } from '../../../brain'
import { type NodeInspection } from '../utils/buildNodeInspector'

export interface NodeInspectorProps {
	/** Title of the inspected node (its card header). */
	title: string
	inspection: NodeInspection
	/** Select the node for editing (the node-editor panel). */
	onEdit: () => void
	/** Reveal + centre the node in the canvas (switches to the tree view). */
	onCenter: () => void
}

/**
 * Node inspector card (wireframe § 03 B): a compact summary of the focused
 * node's structural relations — « entre depuis » (who links here) and its combat
 * outcomes (« victoire » / « fuite ») — with Éditer + « Centrer dans l'arbre »
 * actions. Pinned at the foot of the outline pane; it READS a pure inspection
 * (buildNodeInspector) and emits intents via callbacks, holding no book state.
 */
export function NodeInspector({ title, inspection, onEdit, onCenter }: NodeInspectorProps): JSX.Element {
	const { incoming, outcomes } = inspection
	return (
		<aside style={card} aria-label={`Aperçu du nœud ${title}`}>
			<header style={cardTitle}>{title}</header>

			<section style={section}>
				<span style={sectionLabel}>Entre depuis</span>
				{incoming.length === 0 ? (
					<span style={faint}>Aucune entrée</span>
				) : (
					<ul style={list}>
						{incoming.map((link, i) => (
							<li key={`${link.fromId}-${i}`} style={relationRow}>
								<span style={mono}>{EDGE_KINDS[link.via].rowLabel}</span>
								<span style={relationTitle}>{link.title ?? '⚠ source supprimée'}</span>
							</li>
						))}
					</ul>
				)}
			</section>

			{outcomes.length > 0 && (
				<section style={section}>
					<span style={sectionLabel}>Issues du combat</span>
					<ul style={list}>
						{outcomes.map((o) => (
							<li key={o.outcome} style={relationRow}>
								<span style={mono}>{o.outcome}</span>
								<span style={relationTitle}>→ {o.title ?? '⚠ cible supprimée'}</span>
							</li>
						))}
					</ul>
				</section>
			)}

			<footer style={actions}>
				<button type="button" onClick={onEdit} style={editButton}>
					Éditer
				</button>
				<button type="button" onClick={onCenter} style={centerButton}>
					Centrer dans l’arbre
				</button>
			</footer>
		</aside>
	)
}

const card: React.CSSProperties = {
	// A pinned panel, not a floating menu: hierarchy comes from the border +
	// surface tint, not a shadow (shadows are for menus/modals only).
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-lg)',
	background: 'var(--surface-card)',
	padding: 'var(--space-4)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const cardTitle: React.CSSProperties = {
	fontWeight: 'var(--fw-semibold)',
	fontSize: 'var(--fs-row)',
	color: 'var(--text-strong)',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}

const section: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}

const sectionLabel: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow)',
	textTransform: 'uppercase',
	color: 'var(--text-muted)',
}

const list: React.CSSProperties = {
	listStyle: 'none',
	margin: 0,
	padding: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-1)',
}

const relationRow: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

const mono: React.CSSProperties = {
	flex: 'none',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-faint)',
}

const relationTitle: React.CSSProperties = {
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}

const faint: React.CSSProperties = {
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const actions: React.CSSProperties = {
	display: 'flex',
	gap: 'var(--space-2)',
	marginTop: 'var(--space-1)',
}

const baseButton: React.CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-4)',
	borderRadius: 'var(--r-md)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
}

const editButton: React.CSSProperties = {
	...baseButton,
	border: 'none',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontWeight: 'var(--fw-semibold)',
}

const centerButton: React.CSSProperties = {
	...baseButton,
	border: '1px solid var(--border-card)',
	background: 'transparent',
	color: 'var(--text-body)',
}
