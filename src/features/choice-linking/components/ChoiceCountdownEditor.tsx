import { Toggle, Stepper, TargetPicker, type BookNode, type ChoiceCountdown } from '../../../brain'

/** Countdown délai bounds (seconds): a sane low-fi range, default 15. */
const DELAY_MIN = 5
const DELAY_MAX = 60
const DELAY_DEFAULT = 15

export interface ChoiceCountdownEditorProps {
	/** The choice's current countdown rule, or undefined when none is set. */
	countdown: ChoiceCountdown | undefined
	/** All book nodes (the fallback picker resolves/excludes targets). */
	nodes: BookNode[]
	/** This choice's source node id (excluded as a fallback target). */
	fromNodeId: string
	/** Persist a new rule, or null to clear it (toggle off). */
	onChange: (next: ChoiceCountdown | null) => void
}

/**
 * « Compte à rebours » (§ 05) — a per-choice countdown rule: the choice expires
 * after a délai (clamped 5–60s, default 15 — Stepper enforces the bounds) to a
 * fallback node. The fallback is picked via the shared brain TargetPicker, which
 * excludes structural screens + this node (KR-067) and surfaces a deleted target
 * (KR-021/063). Controlled — the owner persists each change via updateEdge.
 */
export function ChoiceCountdownEditor({
	countdown,
	nodes,
	fromNodeId,
	onChange,
}: ChoiceCountdownEditorProps): JSX.Element {
	const enabled = countdown !== undefined

	function toggle(on: boolean): void {
		onChange(on ? { delay: DELAY_DEFAULT, fallback: '' } : null)
	}

	return (
		<div style={wrap}>
			<Toggle label="Compte à rebours" checked={enabled} onChange={toggle} />
			{enabled && (
				<>
					<Stepper
						label="Délai (secondes)"
						value={countdown.delay}
						min={DELAY_MIN}
						max={DELAY_MAX}
						onChange={(delay) => onChange({ ...countdown, delay })}
					/>
					<TargetPicker
						label="À l’expiration, aller à"
						emptyLabel="Choisir le nœud de repli…"
						nodes={nodes}
						nodeId={fromNodeId}
						target={countdown.fallback === '' ? undefined : countdown.fallback}
						onChange={(fallback) => onChange({ ...countdown, fallback: fallback ?? '' })}
					/>
				</>
			)}
		</div>
	)
}

const wrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}
