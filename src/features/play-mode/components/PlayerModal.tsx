import { useEffect, useRef } from 'react'
import type { AdventureDocument } from '../../../player/types'
import { PlayerRuntime } from '../../../player/components/PlayerRuntime'
import { plural } from '../../../brain/utils/plural'

interface PlayerModalProps {
	adventure: AdventureDocument | null
	onClose: () => void
}

export function PlayerModal({ adventure, onClose }: PlayerModalProps): JSX.Element | null {
	if (adventure === null) return null

	return <PlayerModalInner adventure={adventure} onClose={onClose} />
}

function PlayerModalInner({ adventure, onClose }: { adventure: AdventureDocument; onClose: () => void }): JSX.Element {
	const closeRef = useRef(onClose)
	closeRef.current = onClose

	useEffect(() => {
		function handleKey(e: KeyboardEvent): void {
			if (e.key === 'Escape') closeRef.current()
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [])

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Aperçu du jeu"
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 100,
				background: 'var(--surface-app)',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<header
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '8px 16px',
					borderBottom: '1px solid var(--border-subtle)',
					background: 'var(--surface-card)',
					flexShrink: 0,
				}}
			>
				<span
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-label)',
					}}
				>
					Aperçu du jeu
					{adventure.warnings.length > 0 && (
						<span
							style={{ marginLeft: 8, color: 'var(--bad)' }}
							title={`${adventure.warnings.length} avertissement(s) détecté(s)`}
						>
							⚠ {adventure.warnings.length} {plural(adventure.warnings.length, 'avertissement')}
						</span>
					)}
				</span>
				<button
					type="button"
					onClick={onClose}
					aria-label="Quitter le test"
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						padding: '6px 12px',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--border-card)',
						background: 'transparent',
						color: 'var(--text-label)',
						cursor: 'pointer',
						minHeight: 'var(--hit-target)',
					}}
				>
					✕ Quitter le test
				</button>
			</header>
			<div style={{ flex: 1, minHeight: 0 }}>
				<PlayerRuntime adventure={adventure} onQuit={onClose} />
			</div>
		</div>
	)
}
