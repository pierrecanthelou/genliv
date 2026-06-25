import { useBrain, useSyncStatus, useSyncPending, plural, Badge, type SyncStatus, type BadgeTone } from '../../../brain'

/**
 * Single source for each sync state's label + Badge tone (KR-117): the
 * indicator derives its rendering from this Record rather than branching on the
 * status value. `offline` = local-only (no transport); the only semantic tones
 * are good (synced) / bad (error).
 */
const SYNC_STATUS: Record<SyncStatus, { label: string; tone: BadgeTone }> = {
	idle: { label: 'Prêt', tone: 'muted' },
	syncing: { label: 'Synchronisation…', tone: 'accent' },
	synced: { label: 'Synchronisé', tone: 'good' },
	offline: { label: 'Local', tone: 'muted' },
	error: { label: 'Erreur de synchronisation', tone: 'bad' },
}

/**
 * cloud-sync — a small live status pill in the corner reflecting the local-first
 * store's sync state (KR-022). A VIEW over the brain CloudSyncService via
 * useSyncStatus / useSyncPending (the sync:status external store); holds no state.
 * The real cloud transport lands later — by default the store is local-only
 * (« Local »). When writes are queued it shows « N sauvegarde(s) en attente »
 * (« sauvegarde » is the domain term — it is always book writes that are queued).
 * In error state the badge becomes a « Réessayer » button that calls sync.retry().
 */
export function SyncIndicator(): JSX.Element {
	const { sync } = useBrain()
	const status = useSyncStatus()
	const pending = useSyncPending()
	const { tone } = SYNC_STATUS[status]

	// Pending writes replace the status label with a concrete count.
	// « sauvegarde » names what is actually queued (a book write), not a generic
	// « changement » whose meaning the author has to infer.
	const baseLabel =
		pending > 0
			? `${pending} ${plural(pending, 'sauvegarde')} en attente`
			: SYNC_STATUS[status].label

	// Error state is always actionable — retry flushes the offline queue.
	if (status === 'error') {
		const errorLabel = `${baseLabel} · Réessayer`
		return (
			<div role="status" aria-live="polite" aria-label={`Synchronisation : ${errorLabel}`} style={wrapper}>
				<button
					type="button"
					onClick={() => sync.retry()}
					aria-label="Réessayer la synchronisation"
					style={retryBtn}
				>
					<Badge tone={tone}>{errorLabel}</Badge>
				</button>
			</div>
		)
	}

	return (
		<div role="status" aria-live="polite" aria-label={`Synchronisation : ${baseLabel}`} style={wrapper}>
			<Badge tone={tone}>{baseLabel}</Badge>
		</div>
	)
}

const wrapper: React.CSSProperties = {
	position: 'fixed',
	right: 'var(--space-5)',
	bottom: 'var(--space-5)',
	zIndex: 50,
}

const retryBtn: React.CSSProperties = {
	background: 'none',
	border: 'none',
	padding: 0,
	cursor: 'pointer',
}
