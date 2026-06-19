import { useBrain, useRoute, useSyncConflict, Modal } from '../../../brain'

/**
 * cloud-sync iteration 3 — the sync CONFLICT resolution affordance. When a book
 * diverged on both sides (local unpushed edits AND a newer cloud copy),
 * reconciliation does NOT silently overwrite either side; this dialog surfaces
 * the choice for the OPEN book — keep the local version or adopt the cloud one.
 * A VIEW over the brain CloudSyncService (useSyncConflict external store); it
 * holds no state and resolves through sync.resolveConflict. Mounted once by App.
 */
export function ConflictDialog(): JSX.Element | null {
	const { sync } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const inConflict = useSyncConflict(bookId)

	if (bookId === null || !inConflict) return null

	return (
		<Modal
			title="Conflit de synchronisation"
			cancelLabel="Garder ma version"
			confirmLabel="Prendre la version du cloud"
			confirmTone="error"
			onCancel={() => sync.resolveConflict(bookId, 'local')}
			onClose={() => sync.resolveConflict(bookId, 'local')}
			onConfirm={() => sync.resolveConflict(bookId, 'cloud')}
		>
			<p style={{ margin: 0, fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				Ce livre a été modifié <strong>ici</strong> et <strong>dans le cloud</strong> depuis la dernière
				synchronisation. Gardez votre version (elle écrasera celle du cloud), ou prenez la version du cloud (vos
				modifications locales non synchronisées seront perdues).
			</p>
		</Modal>
	)
}
