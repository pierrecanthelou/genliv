import { useState, useEffect, useRef } from 'react'
import type { Edge } from '../../brain/types'

interface CountdownChoiceProps {
	edge: Edge
	onChoice: (nodeId: string) => void
}

function CountdownChoice({ edge, onChoice }: CountdownChoiceProps): JSX.Element {
	// Extract primitives so the effect dep array uses only stable values.
	const delay = edge.countdown?.delay ?? 0
	const fallback = edge.countdown?.fallback ?? ''
	const [remaining, setRemaining] = useState(delay)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const onChoiceRef = useRef(onChoice)
	onChoiceRef.current = onChoice

	useEffect(() => {
		if (!fallback) return
		intervalRef.current = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current!)
					onChoiceRef.current(fallback)
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [delay, fallback])

	return (
		<button
			type="button"
			onClick={() => onChoice(edge.to)}
			style={{
				width: '100%',
				textAlign: 'left',
				padding: 'var(--space-5) var(--space-7)',
				borderRadius: 'var(--r-md)',
				border: '1px solid var(--border-card)',
				background: 'var(--surface-card)',
				color: 'var(--text-body)',
				fontSize: 'var(--fs-body)',
				cursor: 'pointer',
				minHeight: 'var(--hit-target)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 'var(--space-4)',
				transition: 'border-color 0.1s, background 0.1s',
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = 'var(--accent)'
				e.currentTarget.style.background = 'var(--accent-bg)'
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = 'var(--border-card)'
				e.currentTarget.style.background = 'var(--surface-card)'
			}}
		>
			<span>{edge.label || '→ (choix sans libellé)'}</span>
			{fallback && (
				<span
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: remaining <= 5 ? 'var(--bad)' : 'var(--text-muted)',
						flexShrink: 0,
						fontWeight: remaining <= 5 ? 'var(--fw-semibold)' : undefined,
					}}
				>
					{remaining}s
				</span>
			)}
		</button>
	)
}

interface ChoiceListProps {
	choices: Edge[]
	onChoice: (nodeId: string) => void
}

export function ChoiceList({ choices, onChoice }: ChoiceListProps): JSX.Element | null {
	if (choices.length === 0) {
		return (
			<p
				style={{
					color: 'var(--text-muted)',
					fontStyle: 'italic',
					fontSize: 'var(--fs-meta)',
					fontFamily: 'var(--font-mono)',
					margin: 0,
				}}
			>
				Pas de sortie depuis cet écran.
			</p>
		)
	}

	return (
		<div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			{choices.map((edge) =>
				edge.countdown && edge.countdown.fallback ? (
					<div key={edge.id} role="listitem">
						<CountdownChoice edge={edge} onChoice={onChoice} />
					</div>
				) : (
					<div key={edge.id} role="listitem">
						<button
							type="button"
							onClick={() => onChoice(edge.to)}
							style={{
								width: '100%',
								textAlign: 'left',
								padding: 'var(--space-5) var(--space-7)',
								borderRadius: 'var(--r-md)',
								border: '1px solid var(--border-card)',
								background: 'var(--surface-card)',
								color: 'var(--text-body)',
								fontSize: 'var(--fs-body)',
								cursor: 'pointer',
								minHeight: 'var(--hit-target)',
								transition: 'border-color 0.1s, background 0.1s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = 'var(--accent)'
								e.currentTarget.style.background = 'var(--accent-bg)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = 'var(--border-card)'
								e.currentTarget.style.background = 'var(--surface-card)'
							}}
						>
							{edge.label || '→ (choix sans libellé)'}
						</button>
					</div>
				),
			)}
		</div>
	)
}
