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
 *
 * `[{delta}:{cibles}]` — LES PASTILLES DE `deltas`, itération 3. Elles sont le
 * LECTEUR de `journal[].deltas`, et c'est la condition d'admission du champ
 * elle-même (KR-249, précédent `origine` en itération 2) : sans elles, un champ
 * de session n'aurait qu'un écrivain, et un test n'est pas un chemin de code.
 *
 * TOUTES, DANS L'ORDRE DU TABLEAU, SANS FILTRAGE — `atteindre_jalon` compris,
 * bien que son identifiant redise ce que le `texte` de la ligne énonce déjà :
 * masquer une pastille parce qu'elle paraît redondante ferait du composant un
 * juge de ce qui a eu lieu, alors que la DONNÉE décide. L'ordre est causal, il
 * vient du moteur, et ce module ne le retrie jamais.
 *
 * AUCUNE DISTINCTION VISUELLE entre `'applique'` et `'sans_effet'` : ce n'est pas
 * un résultat de jet, et les deux seules couleurs sémantiques sont réussite /
 * échec. Le style est `metaJournal`, celui de `[origine]` — aucun jeton neuf.
 *
 * LA PASTILLE SE COMPOSE DEPUIS LA DONNÉE : aucun libellé n'est écrit ici, et
 * aucune prose du dossier ne peut y entrer — `delta` est une clé du registre
 * CLOS, `cibles` des identifiants.
 */
export interface JournalRowProps {
	readonly entree: EntreeJournal
}

export function JournalRow({ entree }: JournalRowProps): JSX.Element {
	const { tour, role, texte, origine, deltas } = entree
	return (
		<li style={ligneJournal}>
			<span style={metaJournal}>#{tour}</span>
			<Badge tone="neutral">{role === 'joueur' ? '↪ JOUEUR' : '↻ MOTEUR'}</Badge>
			{origine !== undefined && <span style={metaJournal}>[{origine}]</span>}
			<span style={role === 'joueur' ? texteJoueur : texteMoteur}>{texte}</span>
			{/* `deltas?.` et jamais `deltas.` : le champ est ABSENT sur toute entrée
			    qui n'a demandé aucun effet — `undefined`, jamais `[]` (KR-251). */}
			{deltas?.map((delta, rang) => (
				// La clé est le RANG, et c'est ici le bon choix : cette liste ne porte
				// aucun état local, ne se réordonne jamais (l'entrée de journal est un
				// CONSTAT immuable), et deux effets identiques y sont légitimes — un
				// `delta:cibles` composé ne serait donc pas unique (KR-216 vise les
				// lignes à état local, pas celles-ci).
				<span key={rang} style={metaJournal}>
					[{delta.delta}:{delta.cibles.join(',')}]
				</span>
			))}
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
