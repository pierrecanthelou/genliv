import { useState } from 'react'
import type { TrapConfig, GameObject } from '../../brain/types'
import type { HeroState } from '../types'
import { resolveTrap, computeInventoryLoss } from '../engine/actionEngine'
import type { TrapResult } from '../engine/actionEngine'
import { CHALLENGE_TIERS, rollTier } from '../../brain/challenge'
import { CHARACTERISTICS } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'
import { ReinforcementPicker } from './ReinforcementPicker'

interface TrapScreenProps {
	trap: TrapConfig
	hero: HeroState
	inventory: string[]
	adventureObjects: GameObject[]
	onFinish: (isLethal: boolean, xp: number, lostObjectIds: string[]) => void
}

export function TrapScreen({ trap, hero, inventory, adventureObjects, onFinish }: TrapScreenProps): JSX.Element {
	const [selectedObjId, setSelectedObjId] = useState<string | null>(null)

	// Resolve immediately if no roll (auto-échec — no bonus can help).
	// When a roll exists, start in pick phase (result = null) so the player
	// can choose a reinforcement object before the dice fall.
	const [result, setResult] = useState<TrapResult | null>(() => (trap.roll ? null : resolveTrap(trap, hero)))

	const traitLabel = trap.roll ? (CHARACTERISTICS[trap.roll.trait as Characteristic]?.abbr ?? trap.roll.trait) : null
	const tierLabel = trap.roll ? CHALLENGE_TIERS[rollTier(trap.roll)].notation : null

	// Pure derived state — no useEffect needed (KR-013).
	const lostObjectIds =
		result !== null ? computeInventoryLoss(trap.inventoryLoss, result.outcome, inventory, adventureObjects) : []
	const lostObjectNames = lostObjectIds.map((id) => adventureObjects.find((o) => o.id === id)?.name ?? id)

	function handleFaceTrap(): void {
		const obj = selectedObjId ? adventureObjects.find((o) => o.id === selectedObjId) : null
		const rollBonus = obj?.reinforcementBonus?.rollBonus ?? 0
		setResult(resolveTrap(trap, hero, Math.random, rollBonus))
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
			{/* Trap description */}
			<div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>{trap.description}</div>

			{/* Roll legend (always visible when a roll is authored) */}
			{traitLabel !== null && tierLabel !== null && (
				<div
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-muted)',
					}}
				>
					Jet de {traitLabel} ({tierLabel})
					{result !== null && ` — valeur ${result.characteristicValue} / jet ${result.diceRoll}`}
				</div>
			)}

			{/* Pre-roll: reinforcement picker + face-the-trap button */}
			{result === null && (
				<>
					<ReinforcementPicker
						label="Utiliser un objet avant d'affronter le piège"
						inventory={inventory}
						objects={adventureObjects}
						selectedId={selectedObjId}
						onSelect={setSelectedObjId}
					/>
					<button
						type="button"
						onClick={handleFaceTrap}
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
						Affronter le piège
					</button>
				</>
			)}

			{/* Post-roll: outcome panel + continue */}
			{result !== null && (
				<>
					<div
						style={{
							padding: 'var(--space-6) var(--space-8)',
							borderRadius: 'var(--r-md)',
							border: `1px solid ${result.outcome === 'reussite' ? 'var(--good)' : 'var(--bad)'}`,
							background: result.outcome === 'reussite' ? 'var(--good-bg)' : 'var(--bad-bg)',
						}}
					>
						<div
							style={{
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								fontWeight: 'var(--fw-semibold)',
								marginBottom: 'var(--space-2)',
								color: result.outcome === 'reussite' ? 'var(--good)' : 'var(--bad)',
								textTransform: 'uppercase',
								letterSpacing: 'var(--track-eyebrow)',
							}}
						>
							{result.outcome === 'reussite' ? 'Réussite' : 'Échec'}
							{result.xp > 0 && <span style={{ marginLeft: 'var(--space-4)' }}>+{result.xp} XP</span>}
						</div>
						<div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 1.6 }}>{result.text}</div>
						{result.isLethal && (
							<div
								style={{
									marginTop: 'var(--space-3)',
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-meta)',
									color: 'var(--bad)',
								}}
							>
								Ce piège est fatal.
							</div>
						)}
					</div>

					{/* Lost objects (KR-142) */}
					{lostObjectNames.length > 0 && (
						<div
							style={{
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								color: 'var(--bad)',
							}}
						>
							Objet{lostObjectNames.length > 1 ? 's' : ''} perdu{lostObjectNames.length > 1 ? 's' : ''} :{' '}
							{lostObjectNames.join(', ')}
						</div>
					)}

					<button
						type="button"
						onClick={() => onFinish(result.isLethal, result.xp, lostObjectIds)}
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
						Continuer
					</button>
				</>
			)}
		</div>
	)
}
