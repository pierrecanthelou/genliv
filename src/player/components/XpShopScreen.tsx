import { useEffect } from 'react'
import type { HeroState } from '../types'
import { computeCaracUpgrade, computeMcUpgrade } from '../engine/actionEngine'
import { CHARACTERISTICS, CHARACTERISTIC_VALUES } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'

interface XpShopScreenProps {
	hero: HeroState
	onSpendCarac: (carac: Characteristic) => void
	onSpendMc: () => void
	onClose: () => void
}

export function XpShopScreen({ hero, onSpendCarac, onSpendMc, onClose }: XpShopScreenProps): JSX.Element {
	const mcInfo = computeMcUpgrade(hero)

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [onClose])

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Boutique de progression"
			style={{
				position: 'fixed',
				inset: 0,
				background: 'var(--overlay)',
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'center',
				zIndex: 200,
			}}
		>
			<div
				style={{
					background: 'var(--surface-app)',
					borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
					width: '100%',
					maxWidth: 680,
					maxHeight: '80vh',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: 'var(--space-6)',
					padding: 'var(--space-8) var(--space-12)',
					paddingBottom: 'calc(var(--space-8) + env(safe-area-inset-bottom))',
				}}
			>
				{/* Header */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<h2
						style={{
							margin: 0,
							fontSize: 'var(--fs-title)',
							fontWeight: 'var(--fw-bold)',
							color: 'var(--text-strong)',
						}}
					>
						Progression
					</h2>
					<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
						<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
							{hero.xp} XP disponibles
						</span>
						<button
							type="button"
							onClick={onClose}
							aria-label="Fermer"
							style={{
								background: 'none',
								border: 'none',
								fontSize: 'var(--fs-title)',
								cursor: 'pointer',
								color: 'var(--text-muted)',
								padding: 'var(--space-2)',
								minHeight: 'var(--hit-target)',
								minWidth: 'var(--hit-target)',
							}}
						>
							×
						</button>
					</div>
				</div>

				{/* Caractéristiques */}
				<section>
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-muted)',
							textTransform: 'uppercase',
							letterSpacing: 'var(--track-eyebrow)',
							marginBottom: 'var(--space-4)',
						}}
					>
						Caractéristiques
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
						{CHARACTERISTIC_VALUES.map((carac: Characteristic) => {
							const info = computeCaracUpgrade(carac, hero)
							const current = hero.caracs[carac]
							const desc = CHARACTERISTICS[carac]
							return (
								<div
									key={carac}
									style={{
										padding: 'var(--space-4) var(--space-5)',
										borderRadius: 'var(--r-md)',
										border: '1px solid var(--border-card)',
										background: 'var(--surface-card)',
										display: 'flex',
										flexDirection: 'column',
										gap: 'var(--space-2)',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
										<span
											style={{
												fontFamily: 'var(--font-mono)',
												fontSize: 'var(--fs-meta)',
												fontWeight: 'var(--fw-semibold)',
												color: 'var(--text-body)',
											}}
										>
											{desc.abbr}
										</span>
										<span
											style={{
												fontFamily: 'var(--font-mono)',
												fontSize: 'var(--fs-title)',
												fontWeight: 'var(--fw-bold)',
												color: 'var(--text-strong)',
											}}
										>
											{current}
										</span>
									</div>
									<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
										{desc.describe}
									</div>
									<button
										type="button"
										onClick={() => onSpendCarac(carac)}
										disabled={!info.canUpgrade}
										style={{
											marginTop: 'var(--space-2)',
											padding: 'var(--space-2) var(--space-5)',
											borderRadius: 'var(--r-sm)',
											border: info.canUpgrade ? '1px solid var(--accent)' : '1px solid var(--border-card)',
											background: info.canUpgrade ? 'var(--accent)' : 'var(--surface-chip)',
											color: info.canUpgrade ? 'var(--text-on-accent)' : 'var(--text-muted)',
											fontFamily: 'var(--font-mono)',
											fontSize: 'var(--fs-meta)',
											cursor: info.canUpgrade ? 'pointer' : 'not-allowed',
											minHeight: 'var(--hit-target)',
											opacity: info.canUpgrade ? 1 : 0.5,
										}}
									>
										{info.cost === null
											? 'Max'
											: info.canUpgrade
												? `+1 pour ${info.cost} XP`
												: `${info.cost} XP requis`}
									</button>
								</div>
							)
						})}
					</div>
				</section>

				{/* MC upgrade */}
				<section>
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-muted)',
							textTransform: 'uppercase',
							letterSpacing: 'var(--track-eyebrow)',
							marginBottom: 'var(--space-4)',
						}}
					>
						Maîtrise des Coups
					</div>
					<div
						style={{
							padding: 'var(--space-5) var(--space-6)',
							borderRadius: 'var(--r-md)',
							border: '1px solid var(--border-card)',
							background: 'var(--surface-card)',
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--space-3)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
							<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-body)' }}>
								Bonus actuel
							</span>
							<span
								style={{
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-title)',
									fontWeight: 'var(--fw-bold)',
									color: 'var(--text-strong)',
								}}
							>
								+{hero.mcBonus}
							</span>
						</div>
						{hero.caracs.IN < 6 && (
							<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
								IN ≥ 6 requise pour améliorer MC (actuellement {hero.caracs.IN}).
							</div>
						)}
						<button
							type="button"
							onClick={onSpendMc}
							disabled={!mcInfo.canUpgrade}
							style={{
								padding: 'var(--space-3) var(--space-6)',
								borderRadius: 'var(--r-sm)',
								border: mcInfo.canUpgrade ? '1px solid var(--accent)' : '1px solid var(--border-card)',
								background: mcInfo.canUpgrade ? 'var(--accent)' : 'var(--surface-chip)',
								color: mcInfo.canUpgrade ? 'var(--text-on-accent)' : 'var(--text-muted)',
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								cursor: mcInfo.canUpgrade ? 'pointer' : 'not-allowed',
								minHeight: 'var(--hit-target)',
								opacity: mcInfo.canUpgrade ? 1 : 0.5,
								alignSelf: 'flex-start',
							}}
						>
							{mcInfo.cost === null
								? 'Bonus maximum atteint'
								: mcInfo.canUpgrade
									? `+1 MC pour ${mcInfo.cost} XP`
									: `${mcInfo.cost} XP requis`}
						</button>
					</div>
				</section>
			</div>
		</div>
	)
}
