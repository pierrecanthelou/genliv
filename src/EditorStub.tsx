import { useBrain, useRoute, NodeBadge, Card } from './brain'

const SOMMAIRE_PLACEHOLDER = "Écrivez ici le texte d'introduction…"

/**
 * Placeholder editor landing — the create flow navigates here. Renders the
 * book's seeded tree (Sommaire root + isolated Mort leaf) so the walking
 * skeleton is observable end-to-end. To be replaced by the `tree-canvas`
 * feature, which owns the real graph view.
 */
export function EditorStub(): JSX.Element {
	const { books, router } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = bookId !== null ? books.getBook(bookId) : null

	if (book === null) {
		return (
			<main style={{ padding: 'var(--space-12)' }}>
				<p style={{ color: 'var(--text-muted)' }}>Livre introuvable.</p>
				<button type="button" onClick={() => router.navigate({ name: 'home' })}>
					← Accueil
				</button>
			</main>
		)
	}

	return (
		<main style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-10) var(--space-9)' }}>
			<button
				type="button"
				onClick={() => router.navigate({ name: 'home' })}
				style={{
					border: '1px solid var(--border-field)',
					borderRadius: 'var(--r-md)',
					background: 'var(--surface-card)',
					color: 'var(--text-muted)',
					padding: '8px 12px',
					minHeight: 44,
					cursor: 'pointer',
					marginBottom: 'var(--space-7)',
				}}
			>
				← Accueil
			</button>

			<h1
				style={{
					fontSize: 'var(--fs-h2)',
					fontWeight: 'var(--fw-bold)',
					letterSpacing: 'var(--track-tight)',
					color: 'var(--text-strong)',
					margin: '0 0 var(--space-7)',
				}}
			>
				{book.title}
			</h1>

			<div style={{ display: 'grid', gap: 'var(--space-6)' }}>
				{book.nodes.map((node) => (
					<Card key={node.id}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
							<NodeBadge kind={node.kind} />
							{node.locked && (
								<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', color: 'var(--text-faint)' }}>
									VERROUILLÉ
								</span>
							)}
						</div>
						{node.kind === 'sommaire' && node.text === '' ? (
							<p style={{ color: 'var(--text-disabled)', fontStyle: 'italic', margin: 0 }}>{SOMMAIRE_PLACEHOLDER}</p>
						) : (
							node.text !== '' && <p style={{ color: 'var(--text-body)', margin: 0 }}>{node.text}</p>
						)}
					</Card>
				))}
			</div>
		</main>
	)
}
