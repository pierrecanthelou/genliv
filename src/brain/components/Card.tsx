import { type ReactNode } from 'react'

/** Card — the white rounded surface that holds a section of the editor. */
export interface CardProps {
	children: ReactNode
	selected?: boolean
	padding?: number
	/**
	 * `shadow?: boolean` (défaut `true`, n° 11 `moteur-arbitre`, lot `contrat`,
	 * it2, § 8 #11 du plan) — `false` pour une carte qui n'est ni un menu ni une
	 * modale (contrat de design `CarteJet`, lot `feature` d'it2) : ce composant
	 * posait TOUJOURS une ombre, ce que `CLAUDE.md` (« shadows only on
	 * menus/modals ») contredisait sans qu'aucun lint existant ne le voie.
	 * DÉFAUT `true` : ZÉRO régression sur tout appelant existant, aucun ne
	 * passant `shadow` aujourd'hui.
	 */
	shadow?: boolean
}

export function Card({ children, selected = false, padding = 18, shadow = true }: CardProps): JSX.Element {
	return (
		<div
			style={{
				background: 'var(--surface-card)',
				border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border-card)',
				borderRadius: 'var(--r-3xl)',
				boxShadow: selected ? 'var(--ring-selected)' : shadow ? 'var(--shadow-card)' : 'none',
				padding,
			}}
		>
			{children}
		</div>
	)
}
