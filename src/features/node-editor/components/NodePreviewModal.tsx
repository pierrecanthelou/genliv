import { useEffect, useRef } from 'react'
import type { BookNode, Edge, PnjConfig, MonsterConfig, TrapConfig, DecorConfig, Characteristic } from '../../../brain'
import { nodeTitle, CHARACTERISTICS, CHALLENGE_TIERS, rollTier } from '../../../brain'

interface NodePreviewModalProps {
	node: BookNode
	choices: Edge[]
	onClose: () => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function NodePreviewModal({ node, choices, onClose }: NodePreviewModalProps): JSX.Element {
	const closeRef = useRef(onClose)
	closeRef.current = onClose
	const closeBtnRef = useRef<HTMLButtonElement>(null)
	const dialogRef = useRef<HTMLDivElement>(null)

	// Focus the close button on mount so keyboard users land inside the dialog.
	useEffect(() => {
		closeBtnRef.current?.focus()
	}, [])

	// Capture the previously focused element and restore it on unmount.
	useEffect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null
		return () => {
			previouslyFocused?.focus?.()
		}
	}, [])

	// Escape to dismiss + Tab focus trap kept inside the dialog.
	useEffect(() => {
		function handleKey(e: KeyboardEvent): void {
			if (e.key === 'Escape') {
				e.stopPropagation()
				closeRef.current()
				return
			}
			if (e.key !== 'Tab' || dialogRef.current === null) return
			const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault()
				last.focus()
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault()
				first.focus()
			}
		}
		document.addEventListener('keydown', handleKey, true)
		return () => document.removeEventListener('keydown', handleKey, true)
	}, [])

	const actionType = node.actionType ?? 'aucune'

	return (
		<div role="presentation" style={backdrop} onClick={onClose}>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={`Aperçu — ${nodeTitle(node)}`}
				style={dialogShell}
				onClick={(e) => e.stopPropagation()}
			>
				<header style={dialogHeader}>
					<span style={dialogTitle}>Aperçu — {nodeTitle(node)}</span>
					<button ref={closeBtnRef} type="button" aria-label="Fermer l'aperçu" onClick={onClose} style={closeBtn}>
						{'✕'}
					</button>
				</header>

				<div style={dialogBody}>
					{/* Illustration */}
					{node.illustration !== undefined && (
						<img
							src={node.illustration}
							alt=""
							aria-hidden
							style={{
								display: 'block',
								width: '100%',
								maxHeight: 240,
								objectFit: 'cover',
								borderRadius: 'var(--r-lg)',
								flexShrink: 0,
							}}
						/>
					)}

					{/* Node text */}
					{node.text ? (
						<div style={textBlock}>{node.text}</div>
					) : (
						<p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--fs-body)' }}>
							Pas de texte.
						</p>
					)}

					{/* Action section */}
					{actionType === 'pnj' && node.pnj !== undefined && <PnjPreview pnj={node.pnj} onContinue={onClose} />}
					{actionType === 'monstre' && node.monster !== undefined && (
						<MonsterPreview monster={node.monster} onClose={onClose} />
					)}
					{actionType === 'piege' && node.trap !== undefined && <TrapPreview trap={node.trap} onClose={onClose} />}
					{actionType === 'decor' && node.decor !== undefined && (
						<DecorPreview decor={node.decor} onContinue={onClose} />
					)}

					{/* Outgoing choices (always last — like the real game) */}
					{choices.length > 0 && (
						<div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
							{choices.map((edge) => (
								<div key={edge.id} role="listitem">
									<ChoiceButton label={edge.label} onClose={onClose} />
								</div>
							))}
						</div>
					)}
					{choices.length === 0 && actionType === 'aucune' && (
						<p style={emptyChoices}>Pas de sortie depuis cet écran.</p>
					)}
				</div>
			</div>
		</div>
	)
}

// ── Action sub-previews ────────────────────────────────────────────────────────

function PnjPreview({ pnj, onContinue }: { pnj: PnjConfig; onContinue: () => void }): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
			{pnj.portrait !== undefined && (
				<img
					src={pnj.portrait}
					alt=""
					aria-hidden
					style={{
						display: 'block',
						width: 80,
						height: 80,
						borderRadius: 'var(--r-full)',
						objectFit: 'cover',
						border: '2px solid var(--border-card)',
						alignSelf: 'flex-start',
					}}
				/>
			)}
			<div>
				<div style={eyebrowLabel}>{pnj.role ? `${pnj.name} — ${pnj.role}` : pnj.name}</div>
				<div
					style={{
						fontSize: 'var(--fs-body)',
						color: 'var(--text-body)',
						lineHeight: 1.7,
						fontStyle: 'italic',
						borderLeft: '3px solid var(--border-card)',
						paddingLeft: 'var(--space-6)',
					}}
				>
					{pnj.dialogue || <span style={{ color: 'var(--text-muted)' }}>…</span>}
				</div>
			</div>
			{pnj.gift !== undefined && (
				<div style={infoCard}>
					<div style={eyebrowLabel}>Don offert</div>
					<div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{pnj.gift.object.name}</div>
					{pnj.gift.object.description && (
						<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>{pnj.gift.object.description}</div>
					)}
					{pnj.gift.effect !== 'scenario' && (
						<div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-body)' }}>
							{pnj.gift.effect === 'pv' && `+${pnj.gift.value} PV`}
							{pnj.gift.effect === 'attaque' && `+${pnj.gift.value} MC`}
							{pnj.gift.effect === 'defense' && `+${pnj.gift.value} réduction de dégâts`}
						</div>
					)}
				</div>
			)}
			<button type="button" onClick={onContinue} style={accentBtn}>
				{pnj.gift !== undefined ? 'Accepter et continuer' : 'Continuer'}
			</button>
		</div>
	)
}

function MonsterPreview({ monster, onClose }: { monster: MonsterConfig; onClose: () => void }): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<div style={infoCard}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							fontWeight: 'var(--fw-semibold)',
							color: 'var(--text-strong)',
						}}
					>
						{monster.name}
					</span>
					<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-label)' }}>
						{monster.pv} PV
					</span>
				</div>
			</div>
			<p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-label)' }}>
				Choisis ta posture :
			</p>
			<div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
				{POSTURE_OPTIONS.map(({ key, label, hint }) => (
					<ChoiceButton key={key} label={label} hint={hint} onClose={onClose} flex />
				))}
			</div>
			{monster.fleeTarget !== undefined && (
				<button type="button" onClick={onClose} style={secondaryBtn}>
					Fuir (assaut gratuit du monstre)
				</button>
			)}
		</div>
	)
}

function TrapPreview({ trap, onClose }: { trap: TrapConfig; onClose: () => void }): JSX.Element {
	const traitLabel = trap.roll ? (CHARACTERISTICS[trap.roll.trait as Characteristic]?.abbr ?? trap.roll.trait) : null
	const tierLabel = trap.roll ? CHALLENGE_TIERS[rollTier(trap.roll)].notation : null
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			{trap.description && <div style={textBlock}>{trap.description}</div>}
			{traitLabel !== null && tierLabel !== null && (
				<div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
					Jet de {traitLabel} ({tierLabel})
				</div>
			)}
			{trap.fatal && (
				<div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--bad)' }}>
					Ce piège est fatal.
				</div>
			)}
			<button type="button" onClick={onClose} style={accentBtn}>
				Affronter le piège
			</button>
		</div>
	)
}

function DecorPreview({ decor, onContinue }: { decor: DecorConfig; onContinue: () => void }): JSX.Element {
	const interactionLabel =
		decor.interaction === 'prendre' ? 'Objet à saisir' : decor.interaction === 'ecouter' ? 'Écouter' : 'Fouiller'
	const objects = decor.objects ?? []
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<div style={eyebrowLabel}>{interactionLabel}</div>
			{objects.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					{objects.map((takeable, idx) => {
						const obj = takeable.object
						if (obj === undefined) return null
						return (
							<div key={obj.id ?? idx} style={infoCard}>
								<div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{obj.name}</div>
								{obj.description && (
									<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>{obj.description}</div>
								)}
							</div>
						)
					})}
				</div>
			)}
			<button type="button" onClick={onContinue} style={accentBtn}>
				Continuer
			</button>
		</div>
	)
}

function ChoiceButton({
	label,
	hint,
	onClose,
	flex,
}: {
	label?: string
	hint?: string
	onClose: () => void
	flex?: boolean
}): JSX.Element {
	const btnRef = useRef<HTMLButtonElement>(null)
	return (
		<button
			ref={btnRef}
			type="button"
			title={hint}
			onClick={onClose}
			style={{ ...choiceBtn, ...(flex ? { flex: 1, minWidth: 120, textAlign: 'center' } : {}) }}
			onMouseEnter={() => {
				if (btnRef.current) {
					btnRef.current.style.borderColor = 'var(--accent)'
					btnRef.current.style.background = 'var(--accent-bg)'
				}
			}}
			onMouseLeave={() => {
				if (btnRef.current) {
					btnRef.current.style.borderColor = 'var(--border-card)'
					btnRef.current.style.background = 'var(--surface-card)'
				}
			}}
			onFocus={() => {
				if (btnRef.current) {
					btnRef.current.style.borderColor = 'var(--accent)'
					btnRef.current.style.background = 'var(--accent-bg)'
				}
			}}
			onBlur={() => {
				if (btnRef.current) {
					btnRef.current.style.borderColor = 'var(--border-card)'
					btnRef.current.style.background = 'var(--surface-card)'
				}
			}}
		>
			{label || '→ (choix sans libellé)'}
		</button>
	)
}

const POSTURE_OPTIONS = [
	{ key: 'normale', label: 'Normale', hint: 'Attaque standard (×1 dégât)' },
	{ key: 'precise', label: 'Précise', hint: 'Frappe puissante (×2, AT réduit)' },
	{ key: 'defensive', label: 'Défensive', hint: 'Parade (0 dégât, AT boosté)' },
]

// ── Styles ────────────────────────────────────────────────────────────────────

const backdrop: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	zIndex: 200,
	background: 'var(--overlay)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 'var(--space-9)',
}
const dialogShell: React.CSSProperties = {
	width: '100%',
	maxWidth: 560,
	maxHeight: '85vh',
	background: 'var(--surface-card)',
	borderRadius: 'var(--r-2xl)',
	border: '1px solid var(--border-card)',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
}
const dialogHeader: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: 'var(--space-5) var(--space-7)',
	borderBottom: '1px solid var(--border-divider)',
	flexShrink: 0,
}
const dialogTitle: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-label)',
	fontWeight: 'var(--fw-semibold)',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}
const closeBtn: React.CSSProperties = {
	width: 'var(--hit-target)',
	height: 'var(--hit-target)',
	border: 'none',
	background: 'transparent',
	color: 'var(--text-disabled)',
	fontSize: 16,
	cursor: 'pointer',
	flexShrink: 0,
}
const dialogBody: React.CSSProperties = {
	overflowY: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-8)',
	padding: 'var(--space-8) var(--space-9)',
}
const textBlock: React.CSSProperties = {
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 1.7,
	whiteSpace: 'pre-wrap',
	margin: 0,
}
const eyebrowLabel: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	textTransform: 'uppercase',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-1)',
}
const infoCard: React.CSSProperties = {
	padding: 'var(--space-5) var(--space-6)',
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}
const accentBtn: React.CSSProperties = {
	alignSelf: 'flex-start',
	padding: 'var(--space-4) var(--space-9)',
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--accent)',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
const secondaryBtn: React.CSSProperties = {
	alignSelf: 'flex-start',
	padding: 'var(--space-3) var(--space-4)',
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--border-card)',
	background: 'transparent',
	color: 'var(--text-label)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
const emptyChoices: React.CSSProperties = {
	color: 'var(--text-muted)',
	fontStyle: 'italic',
	fontSize: 'var(--fs-meta)',
	fontFamily: 'var(--font-mono)',
	margin: 0,
}
const choiceBtn: React.CSSProperties = {
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
}
