import { NodeBadge, nodeTitle, effectiveKind, endLabel } from '../../../brain'
import type { BookColumn, ColumnEntry } from '../utils/buildColumnNodes'

export interface ColumnPanelProps {
	column: BookColumn
	/** All node ids in the current navigation path (highlighted as breadcrumb). */
	activePath: ReadonlySet<string>
	warnedNodeIds?: ReadonlySet<string>
	/** Navigate into this entry (updates the path + shared selection). */
	onNavigate: (targetId: string) => void
}

/**
 * One scrollable column in the Miller-columns outline view. Lists the
 * choice-children of one navigation step. Highlights entries that are in the
 * current path (the breadcrumb trail). Back-links (↩) and references (↪) are
 * visually distinct and labelled; references are still navigable (they reset the
 * path to include that branch).
 */
export function ColumnPanel({ column, activePath, warnedNodeIds, onNavigate }: ColumnPanelProps): JSX.Element {
	return (
		<div style={columnStyle} role="list" aria-label="Colonne de navigation">
			{column.entries.length === 0 && <div style={emptyRow}>—</div>}
			{column.entries.map((entry, idx) => (
				<ColumnEntryRow
					key={`${entry.targetId}-${idx}`}
					entry={entry}
					isActive={activePath.has(entry.targetId)}
					isWarned={entry.node !== null && (warnedNodeIds?.has(entry.node.id) ?? false)}
					onNavigate={onNavigate}
				/>
			))}
		</div>
	)
}

interface ColumnEntryRowProps {
	entry: ColumnEntry
	isActive: boolean
	isWarned: boolean
	onNavigate: (targetId: string) => void
}

function ColumnEntryRow({ entry, isActive, isWarned, onNavigate }: ColumnEntryRowProps): JSX.Element {
	const { node, targetId, entryKind, firstSeenColumn, edgeLabel, outcomes } = entry
	const isBacklink = entryKind === 'backlink'
	const isReference = entryKind === 'reference'
	const isDisabled = node === null || isBacklink
	const title = node !== null ? nodeTitle(node) : '⚠ cible supprimée'

	const handleClick = (): void => {
		if (!isDisabled) onNavigate(targetId)
	}

	return (
		<div role="listitem" style={rowWrap}>
			<button
				type="button"
				onClick={handleClick}
				disabled={isDisabled}
				aria-pressed={isActive && !isBacklink && !isReference}
				style={{
					...rowBtn,
					background: isActive && !isBacklink && !isReference ? 'var(--accent-bg)' : 'transparent',
					color: isBacklink || isReference ? 'var(--text-muted)' : isWarned ? 'var(--bad)' : 'var(--text-body)',
					cursor: isDisabled ? 'default' : 'pointer',
					opacity: isBacklink ? 0.6 : 1,
				}}
			>
				{isBacklink || isReference ? (
					<span style={refPrefix} aria-hidden="true">
						{isBacklink ? '↩' : '↪'}
					</span>
				) : null}
				{node !== null && !isBacklink && !isReference ? (
					<NodeBadge kind={effectiveKind(node)} label={endLabel(node)} selected={isActive} />
				) : null}
				<span style={rowTitle}>
					{title}
					{isReference && firstSeenColumn !== undefined && (
						<span style={refChip}>col. {firstSeenColumn + 1}</span>
					)}
					{isWarned && (
						<span aria-label="Référence cassée" style={{ color: 'var(--bad)', marginLeft: 4 }}>
							⚠
						</span>
					)}
				</span>
			</button>

			{edgeLabel !== undefined && edgeLabel !== '' && (
				<div style={edgeLabelStyle} title={edgeLabel}>
					{edgeLabel}
				</div>
			)}

			{outcomes.length > 0 && (
				<div style={outcomesRow}>
					{outcomes.map((o) => (
						<span key={o.kind} style={outcomeChip}>
							{o.kind === 'victoire' ? '⚔' : '↩'} {o.kind}{' '}
							<span style={{ color: 'var(--text-faint)' }}>→ {o.target !== null ? nodeTitle(o.target) : '⚠'}</span>
						</span>
					))}
				</div>
			)}
		</div>
	)
}

const columnStyle: React.CSSProperties = {
	width: 220,
	flexShrink: 0,
	borderRight: '1px solid var(--border-divider)',
	overflowY: 'auto',
	display: 'flex',
	flexDirection: 'column',
	background: 'var(--surface-app)',
}

const emptyRow: React.CSSProperties = {
	padding: 'var(--space-4) var(--space-5)',
	color: 'var(--text-faint)',
	fontSize: 'var(--fs-meta)',
}

const rowWrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	borderBottom: '1px solid var(--border-divider)',
}

const rowBtn: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	width: '100%',
	minHeight: 'var(--hit-target)',
	padding: '6px var(--space-4)',
	border: 'none',
	borderRadius: 0,
	textAlign: 'left',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
}

const rowTitle: React.CSSProperties = {
	flex: 1,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}

const refPrefix: React.CSSProperties = {
	flex: 'none',
	color: 'var(--text-faint)',
	fontSize: 'var(--fs-meta)',
}

const refChip: React.CSSProperties = {
	marginLeft: 6,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-faint)',
}

const edgeLabelStyle: React.CSSProperties = {
	padding: '0 var(--space-4) 4px',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}

const outcomesRow: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: 4,
	padding: '0 var(--space-4) 6px',
}

const outcomeChip: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-muted)',
}
