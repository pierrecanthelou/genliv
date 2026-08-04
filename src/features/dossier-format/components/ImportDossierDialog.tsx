import { useEffect, useRef, type ChangeEvent, type CSSProperties } from 'react'
import { Modal, Badge, plural } from '../../../brain'
import { useImportDossier } from '../hooks/useImportDossier'
import { IssueList } from './IssueList'
import {
	DROPZONE_LABEL,
	FILE_ERROR_BADGE_LABEL,
	FILE_ERROR_MESSAGES,
	READING_BADGE_LABEL,
	REASSURANCE_TEXT,
	RETRY_LABEL,
	VALID_BADGE_LABEL,
	WARNINGS_EYEBROW,
} from '../messages'

export interface ImportDossierDialogProps {
	onCancel: () => void
	onImported: (titre: string) => void
}

/** Cherche, dans la boîte de dialogue actuellement montée, le bouton portant CE libellé exact. */
function focusButtonByLabel(label: string): void {
	const dialogEl = document.querySelector('[role="dialog"]')
	if (dialogEl === null) return
	const cible = Array.from(dialogEl.querySelectorAll('button')).find((bouton) => bouton.textContent?.trim() === label)
	cible?.focus()
}

/**
 * La modale à cinq états (§ 3.2). `step` vient du hook, DÉRIVÉ au rendu — ce
 * composant ne fait que le brancher sur `Modal` et choisir quoi afficher.
 * Échap, focus-trap et retour de focus sont gérés par `Modal` ; le focus
 * PROGRAMMATIQUE à chaque transition d'état (colonne « Rendu » du § 3.2) est
 * géré ici par un effet imperatif-DOM légitime (KR-013 — ce n'est pas un
 * miroir d'état, juste un déplacement de focus).
 */
export function ImportDossierDialog({ onCancel, onImported }: ImportDossierDialogProps): JSX.Element {
	const { step, fileName, inspection, selectFile, confirm } = useImportDossier(onImported)
	const inputRef = useRef<HTMLInputElement>(null)
	const retryButtonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (step === 'reading') focusButtonByLabel('Annuler')
		else if (step === 'valid') focusButtonByLabel('Importer')
		else if (step === 'file-error' || step === 'invalid') retryButtonRef.current?.focus()
	}, [step])

	function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0]
		if (file === undefined) return
		selectFile(file)
		// Autorise de re-choisir le même fichier après une reprise.
		e.target.value = ''
	}

	function handleBrowse(): void {
		inputRef.current?.click()
	}

	return (
		<Modal
			title="Importer un dossier"
			cancelLabel="Annuler"
			confirmLabel="Importer"
			confirmTone="accent"
			confirmDisabled={step !== 'valid'}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={confirm}
		>
			<input
				ref={inputRef}
				type="file"
				accept=".json"
				aria-label="Choisir un fichier de dossier"
				style={hiddenInputStyle}
				onChange={handleFileChange}
			/>

			{step === 'empty' && (
				<button type="button" onClick={handleBrowse} style={dropzoneStyle}>
					{DROPZONE_LABEL}
				</button>
			)}

			{step !== 'empty' && (
				<div style={bodyStyle}>
					<div style={fileRowStyle}>
						<p style={fileNameStyle} title={fileName ?? undefined}>
							{fileName}
						</p>
						{step === 'reading' && <Badge tone="accent">{READING_BADGE_LABEL}</Badge>}
						{step === 'file-error' && <Badge tone="bad">{FILE_ERROR_BADGE_LABEL}</Badge>}
						{step === 'invalid' && inspection?.statut === 'invalid' && (
							<Badge tone="bad">
								{inspection.errors.length} {plural(inspection.errors.length, 'anomalie')}
							</Badge>
						)}
						{step === 'valid' && <Badge tone="good">{VALID_BADGE_LABEL}</Badge>}
					</div>

					{step === 'file-error' && inspection?.statut === 'file-error' && (
						<>
							<p style={messageStyle}>{FILE_ERROR_MESSAGES[inspection.code]}</p>
							<button ref={retryButtonRef} type="button" onClick={handleBrowse} style={retryButtonStyle}>
								{RETRY_LABEL}
							</button>
						</>
					)}

					{step === 'invalid' && inspection?.statut === 'invalid' && (
						<>
							<IssueList issues={inspection.errors} />
							<button ref={retryButtonRef} type="button" onClick={handleBrowse} style={retryButtonStyle}>
								{RETRY_LABEL}
							</button>
						</>
					)}

					{step === 'valid' && inspection?.statut === 'valid' && (
						<>
							<p style={reassuranceStyle}>{REASSURANCE_TEXT}</p>
							{inspection.warnings.length > 0 && (
								<div style={warningsBlockStyle}>
									<p style={eyebrowStyle}>{WARNINGS_EYEBROW}</p>
									<IssueList issues={inspection.warnings} />
								</div>
							)}
						</>
					)}
				</div>
			)}
		</Modal>
	)
}

const hiddenInputStyle: CSSProperties = {
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	border: 0,
}

const dropzoneStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-5)',
	border: '1.5px dashed var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-sunken)',
	color: 'var(--text-faint)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
	width: '100%',
	boxSizing: 'border-box',
}

const bodyStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const fileRowStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
	minWidth: 0,
}

const fileNameStyle: CSSProperties = {
	margin: 0,
	flex: '1 1 auto',
	minWidth: 0,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-sm)',
	color: 'var(--text-body)',
}

const messageStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

const retryButtonStyle: CSSProperties = {
	alignSelf: 'flex-start',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
	border: 'none',
	background: 'none',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}

const reassuranceStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

const warningsBlockStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const eyebrowStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}
