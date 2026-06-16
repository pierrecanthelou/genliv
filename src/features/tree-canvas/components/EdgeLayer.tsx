import { EDGE_KINDS } from '../../../brain'
import { type EdgeGeometry } from '../layout/geometry'

/**
 * SVG connectors between nodes (wireframe § 02): a shared arrowhead marker,
 * `choice` edges solid and `relink`/`flee` (« fuite ») edges dashed, each
 * carrying a centered mono label chip with the choice text. Orphaned edges
 * are already filtered out upstream (KR-021), so every segment has anchors.
 */
export interface EdgeLayerProps {
	edges: EdgeGeometry[]
	width: number
	height: number
}

export function EdgeLayer({ edges, width, height }: EdgeLayerProps): JSX.Element {
	return (
		<>
			<svg
				width={width}
				height={height}
				style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
				aria-hidden="true"
			>
				<defs>
					<marker id="tc-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
						<path d="M0,0 L7,3.2 L0,6.4 z" fill="var(--ink-5)" />
					</marker>
				</defs>
				{edges.map((edge) => {
					const dashed = edge.kind !== 'choice'
					return (
						<line
							key={edge.id}
							x1={edge.x1}
							y1={edge.y1}
							x2={edge.x2}
							y2={edge.y2}
							stroke="var(--ink-5)"
							strokeWidth={1.5}
							strokeDasharray={dashed ? '6 5' : undefined}
							markerEnd="url(#tc-arrow)"
						/>
					)
				})}
			</svg>
			{edges.map((edge) => (
				<div
					key={edge.id}
					style={{
						position: 'absolute',
						left: edge.mx,
						top: edge.my,
						transform: 'translate(-50%, -50%)',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-eyebrow)',
						color: 'var(--text-muted)',
						background: 'var(--surface-card)',
						border: '1px solid var(--border-divider)',
						borderRadius: 'var(--r-xs)',
						padding: '2px 6px',
						whiteSpace: 'nowrap',
						pointerEvents: 'none',
					}}
				>
					{edge.label ?? EDGE_KINDS[edge.kind].canvasLabel}
				</div>
			))}
		</>
	)
}
