import { Badge } from './Badge'
import { plural } from '../utils/plural'

/**
 * Editor top bar (wireframe § 02/03): « ← Mes livres », book title + node-count
 * badge, « Aperçu du jeu ▷ » and the accent « + Nœud » primary action. Shared
 * chrome above the editor body (KR-109), so the title and the actions live in
 * one place rather than being duplicated per view.
 */
export interface EditorTopBarProps {
	title: string
	nodeCount: number
	onBack: () => void
	onAddNode: () => void
	/**
	 * Composition-root injected feature actions (today tree-canvas's spacing and
	 * auto-layout toggles), rendered in the right cluster before « Aperçu du jeu ».
	 * A generic ReactNode slot keeps this shared chrome feature-agnostic
	 * (Open/Closed) — the bar never imports a feature; the shell wires the node in.
	 */
	actions?: React.ReactNode
	/** Wired by EditorScreen once the play runtime exists (play-mode iter 0). */
	onPreview?: () => void
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

export function EditorTopBar({
	title,
	nodeCount,
	onBack,
	onAddNode,
	actions,
	onPreview,
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
					{nodeCount} {plural(nodeCount, 'nœud')}
				</Badge>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				{actions}
				<button
					type="button"
					onClick={onPreview}
					disabled={!onPreview}
					title={onPreview ? 'Aperçu du jeu' : 'Aperçu du jeu — mode lecture (hors éditeur)'}
					style={{
						...monoControl,
						color: onPreview ? 'var(--text-body)' : 'var(--text-muted)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						cursor: onPreview ? 'pointer' : 'not-allowed',
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
