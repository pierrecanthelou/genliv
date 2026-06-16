import { Badge } from '../../../brain'

/**
 * Editor top bar (wireframe § 02): « ← Mes livres », book title + node-count
 * badge, the view-mode switch (canvas ↔ outline), « Aperçu du jeu ▷ » (play
 * mode — out of editor scope) and the accent « + Nœud » primary action.
 */
export interface CanvasTopBarProps {
	title: string
	nodeCount: number
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

export function CanvasTopBar({ title, nodeCount, onBack, onAddNode }: CanvasTopBarProps): JSX.Element {
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
					style={{
						...monoControl,
						color: 'var(--text-label)',
						border: '1px solid transparent',
						background: 'transparent',
					}}
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
					{nodeCount} {nodeCount > 1 ? 'nœuds' : 'nœud'}
				</Badge>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
