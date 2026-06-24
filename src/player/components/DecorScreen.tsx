import { useState } from 'react'
import type { DecorConfig, TakeableObject, GameObject } from '../../brain/types'
import type { HeroState, AdventureDocument, SessionEquipmentState } from '../types'
import { resolveTakeableRoll, resolveDecorReveal, autoEquipObject } from '../engine/actionEngine'
import type { EquipMutations } from '../engine/actionEngine'
import { CHALLENGE_TIERS, rollTier } from '../../brain/challenge'
import { CHARACTERISTICS } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'
import { ReinforcementPicker } from './ReinforcementPicker'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveObject(takeable: TakeableObject, adventure: AdventureDocument): GameObject | null {
	if (takeable.object) return takeable.object
	if (takeable.objectRef) return adventure.objects.find((o) => o.id === takeable.objectRef) ?? null
	return null
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TakeState {
	canTake: boolean
	xp: number
	diceRoll?: number
	characteristicValue?: number
	outcome?: 'reussite' | 'echec'
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DecorScreenProps {
	decor: DecorConfig
	hero: HeroState
	adventure: AdventureDocument
	/** Current equipment state — used to determine auto-equip eligibility. */
	session: SessionEquipmentState
	onTakeObject: (obj: GameObject, xp: number, equip: EquipMutations) => void
	onFinish: (xp: number) => void
}

export function DecorScreen({ decor, hero, adventure, session, onTakeObject, onFinish }: DecorScreenProps): JSX.Element {
	// Record of resolved take attempts, keyed by object id.
	const [takeResults, setTakeResults] = useState<Record<string, TakeState>>({})
	// Reinforcement object selected before a « prendre » roll (AC C5, KR-141).
	const [selectedReinforceId, setSelectedReinforceId] = useState<string | null>(null)
	const decorXp = decor.xp ?? 0

	// Lazy useState initializer — called exactly once on mount, not on re-renders — so the random roll result is fixed for this screen lifetime.
	const [revealResult] = useState(() => {
		const reveal = decor.reveals?.[decor.interaction]
		return reveal ? resolveDecorReveal(reveal, hero) : null
	})

	const objects = decor.objects ?? []

	function handleTakeAttempt(takeable: TakeableObject): void {
		const obj = resolveObject(takeable, adventure)
		if (!obj) return

		const selectedObj = selectedReinforceId
			? adventure.objects.find((o) => o.id === selectedReinforceId)
			: null
		const rollBonus = selectedObj?.reinforcementBonus?.rollBonus ?? 0

		let rollResult: Omit<TakeState, 'canTake'> & { canTake: boolean }

		if (!takeable.roll) {
			rollResult = { canTake: true, xp: 0 }
		} else {
			const r = resolveTakeableRoll(takeable.roll, hero, Math.random, rollBonus)
			rollResult = {
				canTake: r.canTake,
				xp: r.xp,
				diceRoll: r.diceRoll,
				characteristicValue: r.characteristicValue,
				outcome: r.outcome,
			}
		}

		setTakeResults((prev) => ({ ...prev, [obj.id]: rollResult }))

		if (rollResult.canTake) {
			// session is the current equipment state at the time of the click — accurate for auto-equip.
			const equip = autoEquipObject(obj, session)
			onTakeObject(obj, rollResult.xp, equip)
		}
	}

	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--space-8)',
				padding: 'var(--space-12)',
				maxWidth: 680,
				margin: '0 auto',
				width: '100%',
			}}
		>
			{/* Interaction label */}
			<div
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: 'var(--text-muted)',
					textTransform: 'uppercase',
					letterSpacing: 'var(--track-eyebrow)',
				}}
			>
				{decor.interaction === 'prendre'
					? 'Objet à saisir'
					: decor.interaction === 'ecouter'
						? 'Écouter'
						: 'Fouiller'}
			</div>

			{/* Reveal result (écouter / fouiller) */}
			{revealResult !== null && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					{revealResult.hasRoll && revealResult.outcome !== undefined && (
						<div
							style={{
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								color: revealResult.outcome === 'reussite' ? 'var(--good)' : 'var(--bad)',
								textTransform: 'uppercase',
								letterSpacing: 'var(--track-eyebrow)',
							}}
						>
							{revealResult.outcome === 'reussite' ? 'Réussite' : 'Échec'}
						</div>
					)}
					<div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
						{revealResult.revealText || (
							<span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Rien à découvrir ici.</span>
						)}
					</div>
				</div>
			)}

			{/* Reinforcement picker (prendre — shown above objects if any applicable) */}
			{decor.interaction === 'prendre' && (
				<ReinforcementPicker
					label="Utiliser un objet avant de prendre"
					inventory={session.inventory}
					objects={adventure.objects}
					selectedId={selectedReinforceId}
					onSelect={setSelectedReinforceId}
				/>
			)}

			{/* Takeable objects (prendre) */}
			{decor.interaction === 'prendre' && objects.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
					{objects.map((takeable, idx) => {
						const obj = resolveObject(takeable, adventure)
						if (!obj) return null
						const result = takeResults[obj.id]
						const traitLabel = takeable.roll
							? (CHARACTERISTICS[takeable.roll.trait as Characteristic]?.abbr ?? takeable.roll.trait)
							: null
						const tierLabel = takeable.roll ? CHALLENGE_TIERS[rollTier(takeable.roll)].notation : null

						return (
							<div
								key={obj.id ?? idx}
								style={{
									padding: 'var(--space-5) var(--space-6)',
									borderRadius: 'var(--r-md)',
									border: '1px solid var(--border-card)',
									background: 'var(--surface-card)',
									opacity: result !== undefined ? 0.8 : 1,
									display: 'flex',
									flexDirection: 'column',
									gap: 'var(--space-2)',
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
									<div>
										<div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{obj.name}</div>
										<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>{obj.description}</div>
									</div>
									{result === undefined && (
										<button
											type="button"
											onClick={() => handleTakeAttempt(takeable)}
											style={{
												flexShrink: 0,
												padding: 'var(--space-3) var(--space-6)',
												borderRadius: 'var(--r-sm)',
												border: '1px solid var(--border-card)',
												background: 'var(--surface-chip)',
												color: 'var(--text-body)',
												fontFamily: 'var(--font-mono)',
												fontSize: 'var(--fs-meta)',
												cursor: 'pointer',
												minHeight: 'var(--hit-target)',
											}}
										>
											Prendre
										</button>
									)}
									{result?.canTake === true && (
										<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--good)', flexShrink: 0 }}>
											Pris
										</span>
									)}
									{result?.canTake === false && (
										<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--bad)', flexShrink: 0 }}>
											Échec
										</span>
									)}
								</div>

								{/* Roll detail */}
								{result?.outcome !== undefined && traitLabel !== null && (
									<div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
										Jet {traitLabel} ({tierLabel}) : {result.characteristicValue} vs {result.diceRoll}
										{result.xp > 0 ? ` — +${result.xp} XP` : ''}
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Finish */}
			<button
				type="button"
				onClick={() => onFinish(decorXp)}
				style={{
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
				}}
			>
				{decorXp > 0 ? `Continuer (+${decorXp} XP)` : 'Continuer'}
			</button>
		</div>
	)
}
