import { type CSSProperties, type KeyboardEvent, type Ref } from 'react'

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
	/** Renders a textarea instead of an input. */
	multiline?: boolean
	rows?: number
	id?: string
	autoFocus?: boolean
	inputRef?: Ref<HTMLInputElement>
	onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
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
	multiline = false,
	rows = 2,
	id,
	autoFocus = false,
	inputRef,
	onChange,
	onKeyDown,
}: FieldProps): JSX.Element {
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
				<textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={onChange} onKeyDown={onKeyDown} style={shared} />
			) : (
				<input
					id={id}
					type="text"
					ref={inputRef}
					autoFocus={autoFocus}
					value={value}
					placeholder={placeholder}
					onChange={onChange}
					onKeyDown={onKeyDown}
					style={shared}
				/>
			)}
		</label>
	)
}
