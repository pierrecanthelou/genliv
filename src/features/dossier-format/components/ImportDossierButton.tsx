import { useCallback, useState, type CSSProperties } from 'react'
import { ImportDossierDialog } from './ImportDossierDialog'
import { IMPORT_BUTTON_LABEL, IMPORT_GLYPH, importConfirmationMessage } from '../messages'

/**
 * « Importer un dossier » — la carte pointillée accent (§ 3.1), injectée dans
 * `LibraryScreen.importEntry` depuis la racine de composition (`App.tsx`),
 * jamais depuis `book-library`. Possède l'ouverture de la modale et la ligne
 * de confirmation qui reste affichée après un import réussi (§ 3.2, état
 * `done` : « la modale se ferme et une confirmation nomme le dossier
 * importé » — cette ligne EST cette confirmation, hors de la modale).
 */
export function ImportDossierButton(): JSX.Element {
	const [open, setOpen] = useState(false)
	const [confirmation, setConfirmation] = useState<string | null>(null)

	const handleImported = useCallback((titre: string) => {
		setOpen(false)
		setConfirmation(importConfirmationMessage(titre))
	}, [])

	function handleOpen(): void {
		setConfirmation(null)
		setOpen(true)
	}

	return (
		<div style={wrapStyle}>
			<button type="button" onClick={handleOpen} style={buttonStyle}>
				<span aria-hidden="true">{IMPORT_GLYPH}</span>
				{IMPORT_BUTTON_LABEL}
			</button>
			{open && <ImportDossierDialog onCancel={() => setOpen(false)} onImported={handleImported} />}
			{confirmation !== null && (
				<p role="status" style={confirmationStyle}>
					{confirmation}
				</p>
			)}
		</div>
	)
}

const wrapStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const buttonStyle: CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-6) var(--space-9)',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
}

const confirmationStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}
