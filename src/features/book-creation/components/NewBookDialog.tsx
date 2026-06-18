import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Field, Modal, useSyncStatus, type SyncStatus } from '../../../brain'

export interface NewBookDialogProps {
	onCancel: () => void
	onCreate: (title: string) => void
}

const PLACEHOLDER = "La Caverne d'Aldûr"

/**
 * Cloud-first reassurance for the « Créer » action, derived per sync state from
 * one closed-set Record rather than branching on the status (KR-117): the book
 * is always written to this device first (local-first, KR-093), so creating
 * offline is expected — when there is no connection the copy promises a later
 * sync instead of an immediate one.
 */
const CLOUD_FIRST_HINT: Record<SyncStatus, string> = {
	idle: 'Enregistré sur cet appareil, puis synchronisé dans le cloud.',
	syncing: 'Enregistré sur cet appareil, puis synchronisé dans le cloud.',
	synced: 'Enregistré sur cet appareil, puis synchronisé dans le cloud.',
	offline: 'Enregistré sur cet appareil, synchronisé au retour en ligne.',
	error: 'Enregistré sur cet appareil, synchronisé au retour en ligne.',
}

/**
 * Creation dialog: a single « Titre » field plus « Annuler » / « Créer ».
 * « Créer » is disabled while the trimmed title is empty (computed inline,
 * no useEffect derived state — KR-013). Enter submits; trims on submit. A
 * cloud-first hint (sync-aware via the brain useSyncStatus external store)
 * tells the author the book is saved on this device first, so « Créer » works
 * offline and the book syncs later (book-creation iter 3 / KR-093).
 */
export function NewBookDialog({ onCancel, onCreate }: NewBookDialogProps): JSX.Element {
	const [title, setTitle] = useState('')
	const syncStatus = useSyncStatus()
	const canCreate = title.trim().length > 0

	function handleCreate() {
		if (!canCreate) return
		onCreate(title.trim())
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleCreate()
		}
	}

	return (
		<Modal
			title="Nouveau livre"
			cancelLabel="Annuler"
			confirmLabel="Créer"
			confirmDisabled={!canCreate}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={handleCreate}
		>
			<Field
				id="new-book-title"
				label="TITRE"
				value={title}
				placeholder={PLACEHOLDER}
				autoFocus
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
			<p style={hintStyle}>
				<span aria-hidden="true" style={hintIconStyle}>
					☁
				</span>
				{CLOUD_FIRST_HINT[syncStatus]}
			</p>
		</Modal>
	)
}

const hintStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'baseline',
	gap: 'var(--space-2)',
	margin: 'var(--space-3) 0 0',
	color: 'var(--text-muted)',
	fontSize: 'var(--fs-meta)',
	lineHeight: 1.4,
}

const hintIconStyle: CSSProperties = { flexShrink: 0 }
