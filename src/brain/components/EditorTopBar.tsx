import { Badge } from './Badge'
import { SegmentedControl } from './SegmentedControl'
import { plural } from '../utils/plural'

/** Which editor body is shown: the graph canvas or the indented outline. */
export type EditorViewMode = 'canvas' | 'outline'

/**
 * Editor top bar (wireframe § 02/03): « ← Mes livres », book title + node-count
 * badge, the canvas ↔ outline view-mode switch, « Aperçu du jeu ▷ » (play mode —
 * out of editor scope) and the accent « + Nœud » primary action. Shared chrome
 * above both the canvas and the outline (KR-109), so the switch and the title
 * live in one place rather than being duplicated per view.
 */
export interface EditorTopBarProps {
	title: string
	nodeCount: number
	viewMode: EditorViewMode
	onViewModeChange: (mode: EditorViewMode) => void
	onBack: () => void
	onAddNode: () => void
}

const monoControl: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	borderRadius: 'var(--r-md)',
	padding: '8px 12px',
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
	cursor: 'pointer',
}

const VIEW_OPTIONS: { value: EditorViewMode; label: string }[] = [
	{ value: 'canvas', label: '⌗ Arbre' },
	{ value: 'outline', label: '≣ Plan' },
]

export function EditorTopBar({
	title,
	nodeCount,
	viewMode,
	onViewModeChange,
	onBack,
	onAddNode,
}: EditorTopBarProps): JSX.Element {
	return (
		<header
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '10px 16px',
				borderBottom: '1px solid var(--border-subtle)',
				background: 'var(--surface-card)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
				<button
					type="button"
					onClick={onBack}
					style={{ ...monoControl, color: 'var(--text-label)', border: '1px solid transparent', background: 'transparent' }}
				>
					<span aria-hidden="true">←</span> Mes livres
				</button>
				<span style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
				<h1
					style={{
						fontSize: 'var(--fs-title)',
						fontWeight: 'var(--fw-bold)',
						letterSpacing: 'var(--track-tight)',
						color: 'var(--text-strong)',
						margin: 0,
					}}
				>
					{title}
				</h1>
				<Badge tone="muted">
					{nodeCount} {plural(nodeCount, 'nœud')}
				</Badge>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				<SegmentedControl
					ariaLabel="Mode d’affichage"
					options={VIEW_OPTIONS}
					value={viewMode}
					onChange={onViewModeChange}
				/>
				<button
					type="button"
					disabled
					title="Aperçu du jeu — mode lecture (hors éditeur)"
					style={{
						...monoControl,
						color: 'var(--text-muted)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						cursor: 'not-allowed',
					}}
				>
					Aperçu du jeu <span aria-hidden="true">▷</span>
				</button>
				<button
					type="button"
					onClick={onAddNode}
					aria-label="Ajouter un nœud"
					style={{
						...monoControl,
						color: 'var(--text-on-accent)',
						border: '1px solid var(--accent)',
						background: 'var(--accent)',
						fontWeight: 'var(--fw-semibold)',
					}}
				>
					<span aria-hidden="true">+</span> Nœud
				</button>
			</div>
		</header>
	)
}
