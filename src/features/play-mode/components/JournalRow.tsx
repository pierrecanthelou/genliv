import type { CSSProperties } from 'react'
import { Badge, type EntreeJournal } from '../../../brain'

/**
 * UNE LIGNE DE JOURNAL — un CONSTAT, jamais une entrée du rejeu (KR-248).
 *
 * `[{origine}]` RENDU TEL QUEL, sans recomposition depuis `COMMANDES` : ce
 * composant REND, il ne recompose jamais (Déméter, T-8). Il n'apparaît que sur
 * l'entrée `moteur` — c'est la DONNÉE qui décide (`origine` absente sur l'entrée
 * `joueur`), jamais le composant (O-2, KR-249).
 *
 * `Badge tone="neutral"`, jamais `good`/`bad` : le rôle n'est pas un résultat de
 * jet — les deux seules couleurs sémantiques sont réussite / échec.
 *
 * `↻ MOTEUR` et non `→ MOTEUR` : le `→` collisionnerait avec la flèche de
 * transition du `texte` — deux flèches de sens différents sur la même ligne.
 *
 * `#{tour}` NU, sans le mot « tour » (§ J1 de `docs/REGLES-PLAY.md`, dette de
 * nommage gelée). Le numéro se RÉPÈTE sur les deux lignes d'un même pas — il
 * numérote le PAS, pas la ligne. Ni masquage, ni `#7a/#7b`.
 */
export interface JournalRowProps {
	readonly entree: EntreeJournal
}

export function JournalRow({ entree }: JournalRowProps): JSX.Element {
	const { tour, role, texte, origine } = entree
	return (
		<li style={ligneJournal}>
			<span style={metaJournal}>#{tour}</span>
			<Badge tone="neutral">{role === 'joueur' ? '↪ JOUEUR' : '↻ MOTEUR'}</Badge>
			{origine !== undefined && <span style={metaJournal}>[{origine}]</span>}
			<span style={role === 'joueur' ? texteJoueur : texteMoteur}>{texte}</span>
		</li>
	)
}

const ligneJournal: CSSProperties = {
	display: 'flex',
	alignItems: 'baseline',
	gap: 'var(--space-3)',
	padding: 'var(--space-3) var(--space-4)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	fontFamily: 'var(--font-mono)',
}
const metaJournal: CSSProperties = { fontSize: 'var(--fs-meta)', color: 'var(--text-faint)', flexShrink: 0 }
const texteJoueur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }
const texteMoteur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-body)' }
