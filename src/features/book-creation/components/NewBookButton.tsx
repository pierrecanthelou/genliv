/**
 * « + Nouveau livre » affordance — the dashed accent card from the
 * wireframe (1.5px dashed accent, accent « + », r-md). Owned here for the
 * walking skeleton; later hosted by book-library.
 */
export interface NewBookButtonProps {
	onClick: () => void
}

export function NewBookButton({ onClick }: NewBookButtonProps): JSX.Element {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 'var(--space-3)',
				minHeight: 'var(--hit-target)',
				padding: '14px 20px',
				border: '1.5px dashed var(--accent)',
				borderRadius: 'var(--r-md)',
				background: 'var(--accent-bg)',
				color: 'var(--accent)',
				fontFamily: 'var(--font-ui)',
				fontSize: 'var(--fs-body)',
				fontWeight: 'var(--fw-semibold)',
				cursor: 'pointer',
			}}
		>
			<span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
			Nouveau livre
		</button>
	)
}
