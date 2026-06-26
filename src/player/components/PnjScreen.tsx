import type { PnjConfig } from '../../brain/types'
import type { HeroState } from '../types'
import { applyPnjGift } from '../engine/actionEngine'
import type { PnjGiftMutations } from '../engine/actionEngine'

interface PnjScreenProps {
	pnj: PnjConfig
	hero: HeroState
	/** Called once the player has interacted with the PNJ. */
	onFinish: (gift: PnjGiftMutations | null, xp: number, target: string | null) => void
}

export function PnjScreen({ pnj, hero, onFinish }: PnjScreenProps): JSX.Element {
	const xp = pnj.xp ?? 0
	const target = pnj.target ?? null

	function handleAccept(): void {
		const gift = pnj.gift ? applyPnjGift(pnj.gift, hero) : null
		onFinish(gift, xp, target)
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
			{/* PNJ identity */}
			<div>
				{pnj.portrait !== undefined && (
					<img
						src={pnj.portrait}
						alt=""
						aria-hidden
						style={{ display: 'block', width: 80, height: 80, borderRadius: 'var(--r-full)', objectFit: 'cover', border: '2px solid var(--border-card)', marginBottom: 'var(--space-5)' }}
					/>
				)}
				<div
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-muted)',
						textTransform: 'uppercase',
						letterSpacing: 'var(--track-eyebrow)',
						marginBottom: 'var(--space-1)',
					}}
				>
					{pnj.role ? `${pnj.name} — ${pnj.role}` : pnj.name}
				</div>
				{/* Dialogue */}
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

			{/* Gift preview */}
			{pnj.gift !== undefined && (
				<div
					style={{
						padding: 'var(--space-5) var(--space-6)',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						display: 'flex',
						flexDirection: 'column',
						gap: 'var(--space-2)',
					}}
				>
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-muted)',
							textTransform: 'uppercase',
							letterSpacing: 'var(--track-eyebrow)',
						}}
					>
						Don offert
					</div>
					<div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
						{pnj.gift.object.name}
					</div>
					<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
						{pnj.gift.object.description}
					</div>
					{pnj.gift.effect !== 'scenario' && (
						<div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-body)' }}>
							{pnj.gift.effect === 'pv' && `+${pnj.gift.value} PV`}
							{pnj.gift.effect === 'attaque' && `+${pnj.gift.value} MC`}
							{pnj.gift.effect === 'defense' && `+${pnj.gift.value} réduction de dégâts`}
						</div>
					)}
				</div>
			)}

			<div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
				<button
					type="button"
					onClick={handleAccept}
					style={{
						padding: '10px 20px',
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
					{pnj.gift !== undefined ? 'Accepter et continuer' : 'Continuer'}
				</button>
				{xp > 0 && (
					<span
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--text-muted)',
						}}
					>
						+{xp} XP
					</span>
				)}
			</div>
		</div>
	)
}
