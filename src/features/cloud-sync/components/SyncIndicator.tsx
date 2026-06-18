import { useSyncStatus, useSyncPending, plural, Badge, type SyncStatus, type BadgeTone } from '../../../brain'

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
 * (« Local »). When writes are queued offline it shows « N changements en
 * attente » with the current status tone (iter 2).
 */
export function SyncIndicator(): JSX.Element {
	const status = useSyncStatus()
	const pending = useSyncPending()
	const { label, tone } = SYNC_STATUS[status]
	// Pending writes take the label (the count is what the author needs to see);
	// the tone still follows the status (bad on error, accent while syncing).
	const display = pending > 0 ? `${pending} ${plural(pending, 'changement')} en attente` : label
	return (
		<div role="status" aria-live="polite" aria-label={`Synchronisation : ${display}`} style={wrapper}>
			<Badge tone={tone}>{display}</Badge>
		</div>
	)
}

const wrapper: React.CSSProperties = {
	position: 'fixed',
	right: 'var(--space-5)',
	bottom: 'var(--space-5)',
	zIndex: 50,
}
