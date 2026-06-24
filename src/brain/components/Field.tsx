import { type CSSProperties, type KeyboardEvent, type Ref, useRef, useEffect } from 'react'

/**
 * Field — a labelled value box. The base authoring control: a mono
 * uppercase label over a bordered box. Multiline for descriptions.
 */
export interface FieldProps {
	/** Mono uppercase label above the box. */
	label?: string
	/** Faint qualifier appended to the label ("interne", "lue par le joueur"). */
	hint?: string
	value?: string
	placeholder?: string
	/** Accessible name when there is no visible `label` (e.g. a Badge captions it). */
	ariaLabel?: string
	/** Renders a textarea instead of an input. */
	multiline?: boolean
	rows?: number
	id?: string
	autoFocus?: boolean
	inputRef?: Ref<HTMLInputElement>
	onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const shared: CSSProperties = {
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 10px',
	background: 'var(--surface-sunken)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
	width: '100%',
	boxSizing: 'border-box',
	resize: 'none',
}

export function Field({
	label,
	hint,
	value,
	placeholder,
	ariaLabel,
	multiline = false,
	rows = 2,
	id,
	autoFocus = false,
	inputRef,
	onChange,
	onKeyDown,
	onBlur,
}: FieldProps): JSX.Element {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	// 4× cap snapshotted once at mount (browser-computed rows height).
	// Legitimate useEffects: both sync with imperative DOM APIs (offsetHeight / scrollHeight).
	const maxHeightRef = useRef<number | null>(null)

	useEffect(() => {
		// No-op when multiline=false (textareaRef is null).
		const el = textareaRef.current
		if (!el) return
		maxHeightRef.current = el.offsetHeight * 4
	}, [])

	useEffect(() => {
		const el = textareaRef.current
		// No-op when multiline=false (textareaRef is null).
		if (!el) return
		const maxH = maxHeightRef.current
		// offsetHeight is 0 in JSDOM / hidden containers — skip to preserve rows height.
		if (!maxH) return
		el.style.height = 'auto'
		el.style.height = `${Math.min(el.scrollHeight, maxH)}px`
	}, [value])

	return (
		<label style={{ display: 'block' }} htmlFor={id}>
			{label && (
				<span
					style={{
						display: 'block',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-eyebrow)',
						color: 'var(--text-label)',
						marginBottom: 5,
						letterSpacing: 'var(--track-eyebrow)',
					}}
				>
					{label}
					{hint && <span style={{ color: 'var(--ink-6)' }}> — {hint}</span>}
				</span>
			)}
			{multiline ? (
				<textarea
					ref={textareaRef}
					id={id}
					rows={rows}
					value={value}
					placeholder={placeholder}
					aria-label={ariaLabel}
					onChange={onChange}
					onKeyDown={onKeyDown}
					onBlur={onBlur}
					style={{ ...shared, overflowY: 'auto' }}
				/>
			) : (
				<input
					id={id}
					type="text"
					ref={inputRef}
					autoFocus={autoFocus}
					value={value}
					placeholder={placeholder}
					aria-label={ariaLabel}
					onChange={onChange}
					onKeyDown={onKeyDown}
					onBlur={onBlur}
					style={shared}
				/>
			)}
		</label>
	)
}
