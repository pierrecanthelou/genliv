import { useState } from 'react'
import { useBrain, useSyncStatus, useSyncPending, plural, Badge, type SyncStatus, type BadgeTone } from '../../../brain'
import { CloudSyncSettings } from './CloudSyncSettings'

const SYNC_STATUS: Record<SyncStatus, { label: string; tone: BadgeTone }> = {
	idle: { label: 'Prêt', tone: 'muted' },
	syncing: { label: 'Synchronisation…', tone: 'accent' },
	synced: { label: 'Synchronisé', tone: 'good' },
	offline: { label: 'Local', tone: 'muted' },
	error: { label: 'Erreur de synchronisation', tone: 'bad' },
}

/**
 * cloud-sync — pill de statut en bas à droite (KR-022).
 *
 * En fonctionnement normal (idle/syncing/synced) on affiche le statut brut —
 * jamais le compteur de sauvegardes en attente, qui clignote après chaque
 * frappe. Le compteur n'apparaît que sur status === 'error' où il est
 * actionnable. Sur status === 'offline' la pill est un bouton qui ouvre les
 * réglages cloud.
 */
export function SyncIndicator(): JSX.Element {
	const { sync } = useBrain()
	const status = useSyncStatus()
	const pending = useSyncPending()
	const { tone } = SYNC_STATUS[status]
	const [settingsOpen, setSettingsOpen] = useState(false)

	if (status === 'error') {
		const label =
			pending > 0 ? `${pending} ${plural(pending, 'sauvegarde')} en attente · Réessayer` : 'Erreur · Réessayer'
		return (
			<div role="status" aria-live="polite" aria-label={`Synchronisation : ${label}`} style={wrapper}>
				<button type="button" onClick={() => sync.retry()} aria-label="Réessayer la synchronisation" style={bareBtn}>
					<Badge tone={tone}>{label}</Badge>
				</button>
			</div>
		)
	}

	if (status === 'offline') {
		const { label } = SYNC_STATUS.offline
		return (
			<>
				<div
					role="status"
					aria-live="polite"
					aria-label="Synchronisation : Local (configurer le cloud)"
					style={wrapper}
				>
					<button
						type="button"
						onClick={() => setSettingsOpen(true)}
						aria-label="Configurer la synchronisation Cloudflare"
						title="Configurer la synchronisation Cloudflare"
						style={bareBtn}
					>
						<Badge tone={tone}>{label}</Badge>
					</button>
				</div>
				{settingsOpen && <CloudSyncSettings onClose={() => setSettingsOpen(false)} />}
			</>
		)
	}

	const { label } = SYNC_STATUS[status]
	return (
		<div role="status" aria-live="polite" aria-label={`Synchronisation : ${label}`} style={wrapper}>
			<Badge tone={tone}>{label}</Badge>
		</div>
	)
}

const wrapper: React.CSSProperties = {
	position: 'fixed',
	right: 'var(--space-5)',
	bottom: 'var(--space-5)',
	zIndex: 50,
}

const bareBtn: React.CSSProperties = {
	background: 'none',
	border: 'none',
	padding: 0,
	cursor: 'pointer',
}
