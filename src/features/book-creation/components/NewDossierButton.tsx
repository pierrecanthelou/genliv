/**
 * « + Nouveau dossier » affordance — the dashed accent card from the
 * wireframe (1.5px dashed accent, accent « + », r-md). Same visual as the
 * retired NewBookButton (book-creation it0/it1); text repointed onto the
 * Dossier vocabulary (bascule-editeur it2).
 */
export interface NewDossierButtonProps {
	onClick: () => void
}

export function NewDossierButton({ onClick }: NewDossierButtonProps): JSX.Element {
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
			Nouveau dossier
		</button>
	)
}
