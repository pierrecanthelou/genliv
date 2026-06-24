import { useRef, useState, useEffect } from 'react'

export interface ImageUploadProps {
	/** Current image as a data URL, or undefined when no image is set. */
	value: string | undefined
	/** Label shown above the dropzone (also the accessible name). */
	label: string
	onChange: (dataUrl: string | undefined) => void
}

/**
 * Brain primitive for image upload. Renders a click-to-browse affordance when
 * no image is set, or a thumbnail preview with a remove button when one is loaded.
 * Clicking the thumbnail opens a full-screen lightbox (Escape / click-outside closes).
 * Reads the selected file as a data URL via FileReader — no server round-trip.
 * ≥44 px hit targets; keyboard accessible; uses design-system tokens only.
 */
export function ImageUpload({ value, label, onChange }: ImageUploadProps): JSX.Element {
	const inputRef = useRef<HTMLInputElement>(null)
	const [expanded, setExpanded] = useState(false)
	// Optimistic local state so the image appears immediately after FileReader completes,
	// without waiting for onChange → BookService → useSyncExternalStore to propagate.
	// localUrl: data URL just uploaded (takes priority over value from store).
	// localRemoved: true after the user removes, so the dropzone shows instantly even
	// before the store clears value.
	const [localUrl, setLocalUrl] = useState<string | undefined>(undefined)
	const [localRemoved, setLocalRemoved] = useState(false)
	const displayValue = localRemoved ? undefined : (localUrl ?? value)

	// Close the lightbox on Escape (imperative DOM subscription, KR-013 ok).
	useEffect(() => {
		if (!expanded) return
		function onKey(e: KeyboardEvent): void {
			if (e.key === 'Escape') setExpanded(false)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [expanded])

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0]
		if (file === undefined) return
		const reader = new FileReader()
		reader.onload = (event) => {
			const result = event.target?.result
			if (typeof result === 'string') {
				setLocalUrl(result)
				setLocalRemoved(false)
				onChange(result)
			}
		}
		reader.readAsDataURL(file)
		// Reset the input so the same file can be re-selected after a remove.
		e.target.value = ''
	}

	function handleRemove(): void {
		setLocalUrl(undefined)
		setLocalRemoved(true)
		onChange(undefined)
	}

	return (
		<div style={wrap}>
			<span style={labelStyle}>{label}</span>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				aria-label={label}
				style={hiddenInput}
				onChange={handleFileChange}
			/>
			{displayValue !== undefined ? (
				<div style={previewWrap}>
					<button
						type="button"
						onClick={() => setExpanded(true)}
						style={thumbnailButton}
						aria-label={`Agrandir l'illustration : ${label}`}
					>
						<img src={displayValue} alt={label} style={previewImg} />
					</button>
					<button type="button" onClick={handleRemove} style={removeButton} aria-label={`Supprimer l'image : ${label}`}>
						✕ Supprimer
					</button>
					{expanded && (
						<div
							autoFocus
							tabIndex={-1}
							style={lightboxOverlay}
							onClick={() => setExpanded(false)}
							role="dialog"
							aria-modal="true"
							aria-label={`Illustration agrandie : ${label}`}
						>
							<img
								src={displayValue}
								alt={label}
								style={lightboxImg}
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					)}
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					style={dropzone}
					aria-label={`Choisir une image pour : ${label}`}
				>
					⬚ Cliquer pour importer une image
				</button>
			)}
		</div>
	)
}

const wrap: React.CSSProperties = {
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	textTransform: 'uppercase',
	letterSpacing: 'var(--track-wide)',
}

const hiddenInput: React.CSSProperties = {
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	border: 0,
}

const dropzone: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-5)',
	border: '1.5px dashed var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-raised)',
	color: 'var(--text-faint)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
	width: '100%',
	boxSizing: 'border-box',
}

const previewWrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	alignItems: 'flex-start',
	position: 'relative',
}

const thumbnailButton: React.CSSProperties = {
	padding: 0,
	border: 'none',
	background: 'none',
	cursor: 'zoom-in',
	borderRadius: 'var(--r-md)',
	display: 'block',
}

const previewImg: React.CSSProperties = {
	maxWidth: '100%',
	maxHeight: 180,
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--border-card)',
	objectFit: 'contain',
	display: 'block',
}

const removeButton: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--bad)',
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	padding: '4px 0',
	minHeight: 'var(--hit-target)',
}

const lightboxOverlay: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	zIndex: 9999,
	background: 'var(--overlay-strong)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	cursor: 'zoom-out',
}

const lightboxImg: React.CSSProperties = {
	maxWidth: '90vw',
	maxHeight: '90vh',
	objectFit: 'contain',
	borderRadius: 'var(--r-lg)',
	cursor: 'default',
}
