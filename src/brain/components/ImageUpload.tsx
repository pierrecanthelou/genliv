import { useRef } from 'react'

export interface ImageUploadProps {
	/** Current image as a data URL, or undefined when no image is set. */
	value: string | undefined
	/** Label shown above the dropzone (also the accessible name). */
	label: string
	onChange: (dataUrl: string | undefined) => void
}

/**
 * Brain primitive for image upload. Renders a click-to-browse affordance when
 * no image is set, or an inline preview with a remove button when one is loaded.
 * Reads the selected file as a data URL via FileReader — no server round-trip.
 * ≥44 px hit targets; keyboard accessible; uses design-system tokens only.
 */
export function ImageUpload({ value, label, onChange }: ImageUploadProps): JSX.Element {
	const inputRef = useRef<HTMLInputElement>(null)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0]
		if (file === undefined) return
		const reader = new FileReader()
		reader.onload = (event) => {
			const result = event.target?.result
			if (typeof result === 'string') onChange(result)
		}
		reader.readAsDataURL(file)
		// Reset the input so the same file can be re-selected after a remove.
		e.target.value = ''
	}

	function handleRemove(): void {
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
			{value !== undefined ? (
				<div style={previewWrap}>
					<img src={value} alt={label} style={previewImg} />
					<button type="button" onClick={handleRemove} style={removeButton} aria-label={`Supprimer l'image : ${label}`}>
						✕ Supprimer
					</button>
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
}

const previewImg: React.CSSProperties = {
	maxWidth: '100%',
	maxHeight: 180,
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--border-card)',
	objectFit: 'contain',
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
