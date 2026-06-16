/**
 * Bottom-right vertical zoom controls (wireframe § 02). Pan/zoom is local UI
 * state, not part of the synced book document (KR-022).
 */
export interface ZoomControlsProps {
	zoom: number
	onZoomIn: () => void
	onZoomOut: () => void
}

const button: React.CSSProperties = {
	width: 'var(--hit-target)',
	height: 'var(--hit-target)',
	background: 'var(--surface-card)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	color: 'var(--text-muted)',
	fontSize: 18,
	lineHeight: 1,
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps): JSX.Element {
	return (
		<div
			style={{
				position: 'absolute',
				bottom: 14,
				right: 14,
				display: 'flex',
				flexDirection: 'column',
				gap: 4,
				alignItems: 'center',
			}}
		>
			<button type="button" aria-label="Zoom avant" onClick={onZoomIn} style={button}>
				+
			</button>
			<span
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-eyebrow)',
					color: 'var(--text-faint)',
				}}
			>
				{Math.round(zoom * 100)}%
			</span>
			<button type="button" aria-label="Zoom arrière" onClick={onZoomOut} style={button}>
				−
			</button>
		</div>
	)
}
