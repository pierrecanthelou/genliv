import type { CSSProperties } from 'react'
import { Badge } from '../../../brain/components/Badge'
import type { CommentaireRound } from '../hooks/useCommentaireCombat'

export interface JournalLigneRoundProps {
	readonly round: number
	readonly texte: string
	readonly commentaire?: CommentaireRound
}

export function JournalLigneRound({ round, texte, commentaire }: JournalLigneRoundProps): JSX.Element {
	return (
		<div style={ligneLivre}>
			<span style={enteteLivre}>ROUND {round}</span>
			<p style={texteLivre}>{texte}</p>
			{commentaire && commentaire.etat === 'attente' && (
				<div role="status">
					<Badge tone="muted">Commentaire en cours…</Badge>
				</div>
			)}
			{commentaire && commentaire.etat === 'recu' && <p style={recitLivre}>{commentaire.narration}</p>}
		</div>
	)
}

// --- Styles

const ligneLivre: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	paddingBottom: 'var(--space-2)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
}

const enteteLivre: CSSProperties = {
	fontSize: 'var(--fs-eyebrow)',
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-strong)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	fontWeight: 'var(--fw-semibold)',
	textTransform: 'uppercase',
}

const texteLivre: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

const recitLivre: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	lineHeight: 'var(--lh-loose)',
	color: 'var(--text-muted)',
	borderLeft: 'var(--bw-strong) solid var(--border-rule)',
	paddingLeft: 'var(--space-4)',
	overflowWrap: 'anywhere',
}
