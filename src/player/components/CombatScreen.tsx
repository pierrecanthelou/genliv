import { useRef, useEffect } from 'react'
import type { MonsterConfig } from '../../brain/types'
import type { HeroState, SessionState } from '../types'
import { useCombat } from '../hooks/useCombat'
import type { UseCombatCallbacks } from '../hooks/useCombat'
import type { Posture } from '../../brain/combat'

interface CombatScreenProps {
	config: MonsterConfig
	hero: HeroState
	session: SessionState
	callbacks: UseCombatCallbacks
}

export function CombatScreen({ config, hero, session, callbacks }: CombatScreenProps): JSX.Element {
	const { combatState, canFlee, choosePosture, continueFight, flee } = useCombat(config, hero, session, callbacks)

	const logEndRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [combatState.log.length])

	const { monster, heroPv, heroPe, round, phase, outcome } = combatState
	const monsterPvPct = Math.max(0, (monster.pv / monster.pvMax) * 100)
	const heroPvPct = Math.max(0, (heroPv / hero.pvMax) * 100)
	const heroPePct = Math.max(0, (heroPe / hero.peMax) * 100)

	const isEnded = outcome !== 'ongoing'

	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--space-5)',
				padding: 'var(--space-8) var(--space-12)',
				maxWidth: 680,
				margin: '0 auto',
				width: '100%',
			}}
		>
			{/* Monster header */}
			<div
				style={{
					padding: 'var(--space-4) var(--space-5)',
					borderRadius: 'var(--r-md)',
					border: '1px solid var(--border-card)',
					background: 'var(--surface-card)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: 'var(--space-2)',
					}}
				>
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
					<span
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-label)',
						}}
					>
						{monster.pv} / {monster.pvMax} PV
					</span>
				</div>
				<Bar pct={monsterPvPct} color="var(--bad)" label={`PV ${monster.name}`} />
				{!monster.immuneToFatigue && (
					<div
						style={{
							marginTop: 'var(--space-2)',
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-muted)',
						}}
					>
						PE {monster.pe} / {monster.peMax}
					</div>
				)}
			</div>

			{/* Hero quick stats */}
			<div
				style={{
					padding: 'var(--space-3) var(--space-5)',
					borderRadius: 'var(--r-md)',
					border: '1px solid var(--border-subtle)',
					background: 'var(--surface-app)',
					display: 'flex',
					flexDirection: 'column',
					gap: 'var(--space-2)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-label)',
					}}
				>
					<span>Héros — {hero.name}</span>
					<span>
						PV {heroPv} / {hero.pvMax}
					</span>
				</div>
				<Bar pct={heroPvPct} color="var(--good)" label={`PV héros`} />
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-muted)',
					}}
				>
					<span>
						PE {heroPe} / {hero.peMax}
					</span>
					{round > 0 && <span>Round {round}</span>}
				</div>
				<Bar pct={heroPePct} color="var(--accent)" label={`PE héros`} />
			</div>

			{/* Combat log */}
			{combatState.log.length > 0 && (
				<div
					style={{
						maxHeight: 160,
						overflowY: 'auto',
						padding: 'var(--space-3) var(--space-4)',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--border-subtle)',
						background: 'var(--surface-sunken)',
						display: 'flex',
						flexDirection: 'column',
						gap: 'var(--space-1)',
					}}
				>
					{combatState.log.map((entry, i) => (
						<p
							key={`${entry.round}-${i}`}
							style={{
								margin: 0,
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								color: 'var(--text-body)',
								lineHeight: 1.5,
							}}
						>
							{entry.text}
						</p>
					))}
					<div ref={logEndRef} />
				</div>
			)}

			{/* Actions */}
			{!isEnded && phase === 'choosing' && <PosturePanel onChoose={choosePosture} canFlee={canFlee} onFlee={flee} />}

			{!isEnded && phase === 'resolved' && (
				<button type="button" onClick={continueFight} style={primaryBtn}>
					Prochain round →
				</button>
			)}

			{isEnded && <EndPanel outcome={outcome} monster={monster.name} xp={combatState.pendingXp} />}
		</div>
	)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Bar({ pct, color, label }: { pct: number; color: string; label: string }): JSX.Element {
	return (
		<div
			role="progressbar"
			aria-valuenow={Math.round(pct)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
			style={{
				height: 6, // no --space token at 6px; intentional progress-bar height
				borderRadius: 3, // half of height to pill-cap the ends
				background: 'var(--border-subtle)',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					width: `${pct}%`,
					height: '100%',
					background: color,
					transition: 'width 0.3s',
				}}
			/>
		</div>
	)
}

const POSTURE_UI_OPTIONS: { key: Posture; label: string; hint: string }[] = [
	{ key: 'normale', label: 'Normale', hint: 'Attaque standard (×1 dégât)' },
	{ key: 'precise', label: 'Précise', hint: 'Frappe puissante (×2, AT réduit)' },
	{ key: 'defensive', label: 'Défensive', hint: 'Parade (0 dégât, AT boosté)' },
]

function PosturePanel({
	onChoose,
	canFlee,
	onFlee,
}: {
	onChoose: (p: Posture) => void
	canFlee: boolean
	onFlee: () => void
}): JSX.Element {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<p
				style={{
					margin: 0,
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: 'var(--text-label)',
				}}
			>
				Choisis ta posture :
			</p>
			<div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
				{POSTURE_UI_OPTIONS.map(({ key, label, hint }) => (
					<button
						key={key}
						type="button"
						onClick={() => onChoose(key)}
						title={hint}
						style={{
							flex: 1,
							minWidth: 120,
							padding: 'var(--space-4) var(--space-3)',
							borderRadius: 'var(--r-md)',
							border: '1px solid var(--border-card)',
							background: 'var(--surface-card)',
							color: 'var(--text-body)',
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							cursor: 'pointer',
							textAlign: 'center',
							minHeight: 'var(--hit-target)',
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
						{label}
					</button>
				))}
			</div>
			{canFlee && (
				<button type="button" onClick={onFlee} style={secondaryBtn}>
					Fuir (assaut gratuit du monstre)
				</button>
			)}
		</div>
	)
}

function EndPanel({ outcome, monster, xp }: { outcome: string; monster: string; xp: number }): JSX.Element {
	const isVictory = outcome === 'hero-victory' || outcome === 'monster-fled'
	const isFled = outcome === 'hero-fled'
	const isDead = outcome === 'hero-mort'
	const isSurvived = outcome === 'hero-survived-unconscious'

	const title = isVictory
		? `${monster} vaincu !`
		: isFled
			? 'Fuite réussie'
			: isDead
				? 'Le héros est mort'
				: 'Inconscient — survie à 1 PV'

	const color = isDead ? 'var(--bad)' : isVictory ? 'var(--good)' : 'var(--text-label)'

	return (
		<div
			style={{
				padding: 'var(--space-5)',
				borderRadius: 'var(--r-md)',
				border: `1px solid ${color}`,
				background: 'var(--surface-card)',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--space-2)',
				alignItems: 'center',
				textAlign: 'center',
			}}
		>
			<span
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-body)',
					fontWeight: 'var(--fw-semibold)',
					color,
				}}
			>
				{title}
			</span>
			{isVictory && xp > 0 && (
				<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-label)' }}>
					+{xp} XP
				</span>
			)}
			{isSurvived && (
				<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
					Le combat reprend normalement depuis cet écran.
				</span>
			)}
		</div>
	)
}

const primaryBtn: React.CSSProperties = {
	padding: 'var(--space-3) var(--space-6)',
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
