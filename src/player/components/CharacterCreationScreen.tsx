import { useState, useCallback } from 'react'
import { CHARACTERISTICS, CHARACTERISTIC_VALUES } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'
import type { CreationPool, CreationAssignment } from '../engine/charCreation'
import {
	emptyAssignment,
	isAssignmentComplete,
	baseValue,
	buildHeroFromCreation,
	CREATION_CAP,
} from '../engine/charCreation'
import type { HeroState } from '../types'

function plural(n: number, singular: string, pluralForm: string): string {
	return n <= 1 ? singular : pluralForm
}

interface CharacterCreationScreenProps {
	pool: CreationPool
	onConfirm: (hero: HeroState) => void
	onReroll: () => void
	rerollUsed: boolean
}

export function CharacterCreationScreen({
	pool,
	onConfirm,
	onReroll,
	rerollUsed,
}: CharacterCreationScreenProps): JSX.Element {
	const [assignment, setAssignment] = useState<CreationAssignment>(() => emptyAssignment())
	const [name, setName] = useState('')
	const [selectedPoolIdx, setSelectedPoolIdx] = useState<number | null>(null)

	const assignedIndices = new Set(
		CHARACTERISTIC_VALUES.map((c) => assignment.rollIndices[c]).filter((i) => i !== -1),
	)

	const bonusUsed = CHARACTERISTIC_VALUES.reduce((s, c) => s + assignment.bonus[c], 0)
	const bonusRemaining = pool.bonusPool - bonusUsed
	const complete = isAssignmentComplete(pool, assignment) && name.trim().length > 0

	const handlePoolClick = useCallback(
		(idx: number) => {
			if (assignedIndices.has(idx)) return
			setSelectedPoolIdx((prev) => (prev === idx ? null : idx))
		},
		[assignedIndices],
	)

	const handleCaracClick = useCallback(
		(c: Characteristic) => {
			if (selectedPoolIdx === null) {
				if (assignment.rollIndices[c] !== -1) {
					setAssignment((prev) => ({
						...prev,
						rollIndices: { ...prev.rollIndices, [c]: -1 },
						bonus: { ...prev.bonus, [c]: 0 },
					}))
				}
				return
			}
			const oldIdx = assignment.rollIndices[c]
			setAssignment((prev) => ({
				...prev,
				rollIndices: { ...prev.rollIndices, [c]: selectedPoolIdx },
			}))
			// If carac already had a roll, that roll index returns to pool (available again).
			setSelectedPoolIdx(oldIdx !== -1 ? oldIdx : null)
		},
		[selectedPoolIdx, assignment.rollIndices],
	)

	const handleBonusChange = useCallback(
		(c: Characteristic, delta: number) => {
			const current = assignment.bonus[c]
			const base = baseValue(pool, assignment.rollIndices[c])
			const newBonus = current + delta
			if (newBonus < 0) return
			if (base + newBonus > CREATION_CAP) return
			if (delta > 0 && bonusRemaining <= 0) return
			setAssignment((prev) => ({ ...prev, bonus: { ...prev.bonus, [c]: newBonus } }))
		},
		[assignment, pool, bonusRemaining],
	)

	function handleReroll(): void {
		setAssignment(emptyAssignment())
		setSelectedPoolIdx(null)
		onReroll()
	}

	function handleConfirm(): void {
		if (!complete) return
		onConfirm(buildHeroFromCreation(name, pool, assignment))
	}

	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				padding: 'var(--space-8) var(--space-12)',
				maxWidth: 640,
				margin: '0 auto',
				width: '100%',
			}}
		>
			<h2
				style={{
					fontSize: 'var(--fs-title)',
					fontWeight: 'var(--fw-bold)',
					color: 'var(--text-strong)',
					margin: '0 0 var(--space-5)',
					letterSpacing: 'var(--track-tight)',
				}}
			>
				Création du personnage
			</h2>

			<label
				style={{
					display: 'block',
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: 'var(--text-label)',
					marginBottom: 'var(--space-8)',
				}}
			>
				Nom
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Aventurier"
					maxLength={40}
					style={{
						display: 'block',
						marginTop: 'var(--space-1)',
						width: '100%',
						padding: 'var(--space-3) var(--space-4)',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						color: 'var(--text-strong)',
						fontSize: 'var(--fs-body)',
						fontFamily: 'inherit',
					}}
				/>
			</label>

			<p
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: 'var(--text-label)',
					margin: '0 0 var(--space-3)',
				}}
			>
				Sélectionne un lancer, puis clique une caractéristique pour l'assigner.
			</p>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 'var(--space-3)',
					marginBottom: 'var(--space-5)',
				}}
			>
				{pool.rolls.map((val, idx) => {
					const isAssigned = assignedIndices.has(idx)
					const isSelected = selectedPoolIdx === idx
					return (
						<button
							key={idx}
							type="button"
							onClick={() => handlePoolClick(idx)}
							disabled={isAssigned}
							aria-pressed={isSelected}
							style={{
								width: 44,
								height: 44,
								borderRadius: 'var(--r-md)',
								border: isSelected
									? '2px solid var(--accent)'
									: '1px solid var(--border-card)',
								background: isAssigned
									? 'var(--surface-sunken)'
									: isSelected
										? 'var(--accent-bg)'
										: 'var(--surface-card)',
								color: isAssigned ? 'var(--text-disabled)' : 'var(--text-strong)',
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-title)',
								fontWeight: 'var(--fw-bold)',
								cursor: isAssigned ? 'default' : 'pointer',
							}}
						>
							{val}
						</button>
					)
				})}
			</div>

			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 'var(--space-2)',
					marginBottom: 'var(--space-8)',
				}}
			>
				{CHARACTERISTIC_VALUES.map((c) => {
					const desc = CHARACTERISTICS[c]
					const rollIdx = assignment.rollIndices[c]
					const base = baseValue(pool, rollIdx)
					const bonus = assignment.bonus[c]
					const total = base + bonus
					const hasAssignment = rollIdx !== -1
					const canRemoveBonus = hasAssignment && bonus > 0
					const canAddBonus = hasAssignment && bonusRemaining > 0 && total < CREATION_CAP

					return (
						<div
							key={c}
							onClick={() => handleCaracClick(c)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCaracClick(c) }
							}}
							aria-label={`${desc.label} — ${hasAssignment ? `${base}` : 'non assignée'}`}
							style={{
								display: 'grid',
								gridTemplateColumns: '56px 1fr 100px 80px',
								alignItems: 'center',
								gap: 'var(--space-3)',
								padding: 'var(--space-2) var(--space-4)',
								borderRadius: 'var(--r-md)',
								border: '1px solid var(--border-subtle)',
								background: hasAssignment ? 'var(--surface-card)' : 'var(--surface-app)',
								cursor: selectedPoolIdx !== null ? 'pointer' : 'default',
							}}
						>
							<span
								style={{
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-meta)',
									fontWeight: 'var(--fw-semibold)',
									color: 'var(--text-label)',
								}}
							>
								{desc.abbr}
							</span>
							<span style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-body)' }}>
								{desc.label}
							</span>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--space-1)',
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-meta)',
								}}
								onClick={(e) => e.stopPropagation()}
							>
								<button
									type="button"
									onClick={(e) => { e.stopPropagation(); handleBonusChange(c, -1) }}
									disabled={!canRemoveBonus}
									aria-label={`Retirer 1 bonus à ${desc.label}`}
									style={stepperBtn}
								>
									−
								</button>
								<span style={{ minWidth: 20, textAlign: 'center', color: 'var(--text-label)' }}>
									+{bonus}
								</span>
								<button
									type="button"
									onClick={(e) => { e.stopPropagation(); handleBonusChange(c, 1) }}
									disabled={!canAddBonus}
									aria-label={`Ajouter 1 bonus à ${desc.label}`}
									style={stepperBtn}
								>
									+
								</button>
							</div>
							<span
								style={{
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-title)',
									fontWeight: 'var(--fw-bold)',
									color: hasAssignment ? 'var(--text-strong)' : 'var(--text-disabled)',
									textAlign: 'right',
								}}
							>
								{hasAssignment ? total : '—'}
							</span>
						</div>
					)
				})}
			</div>

			<div
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: bonusRemaining === 0 ? 'var(--good)' : 'var(--text-label)',
					marginBottom: 'var(--space-8)',
				}}
			>
				Bonus 1D4 : {bonusRemaining > 0
					? `${bonusRemaining} ${plural(bonusRemaining, 'point restant', 'points restants')}`
					: '✓ tout distribué'
				}
			</div>

			<div style={{ display: 'flex', gap: 'var(--space-3)' }}>
				<button
					type="button"
					onClick={handleReroll}
					disabled={rerollUsed}
					title={rerollUsed ? 'Relance déjà utilisée' : 'Relancer tous les dés (1 fois)'}
					style={{
						padding: '10px 16px',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						color: rerollUsed ? 'var(--text-disabled)' : 'var(--text-body)',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						cursor: rerollUsed ? 'not-allowed' : 'pointer',
						minHeight: 'var(--hit-target)',
					}}
				>
					⟳ Relancer{rerollUsed ? ' (utilisée)' : ''}
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					disabled={!complete}
					style={{
						padding: '10px 20px',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--accent)',
						background: complete ? 'var(--accent)' : 'var(--surface-sunken)',
						color: complete ? 'var(--text-on-accent)' : 'var(--text-disabled)',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						fontWeight: 'var(--fw-semibold)',
						cursor: complete ? 'pointer' : 'not-allowed',
						minHeight: 'var(--hit-target)',
					}}
				>
					Valider →
				</button>
			</div>
		</div>
	)
}

const stepperBtn: React.CSSProperties = {
	width: 24,
	height: 24,
	borderRadius: 'var(--r-xs)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-app)',
	color: 'var(--text-body)',
	cursor: 'pointer',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 0,
	fontFamily: 'var(--font-mono)',
}
