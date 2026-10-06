import { type CSSProperties } from 'react'
import type { HeroState } from '../../../player/types'

/**
 * BANDEAU HÉROS — affichage permanent des stats du héros en registre interface.
 * Lecture seule, aucune interaction. Tons neutres (`--text-strong`/`--text-body`),
 * jamais les couleurs sémantiques (`--good`/`--bad` réservées aux jets, it2).
 *
 * Lit `heros.pvMax`/`heros.peMax` tels quels — jamais recalculés côté composant (KR-013).
 * N'affiche jamais les caractéristiques (seul `EcranCreationHeros` les montre).
 * Affiche `pas` (numéro de tour) en permanence et `climatNom` seulement si un climat est actif.
 */

export interface BandeauHerosProps {
	readonly heros: HeroState
	readonly pas: number
	readonly climatNom?: string
	readonly pvLive?: number
	readonly peLive?: number
}

export function BandeauHeros({ heros, pas, climatNom, pvLive, peLive }: BandeauHerosProps): JSX.Element {
	const pvAffiche = pvLive !== undefined ? pvLive : heros.pv
	const peAffiche = peLive !== undefined ? peLive : heros.pe

	return (
		<div style={bandeau}>
			<span style={bloc}>
				<span style={nom}>{heros.name}</span>
			</span>
			<div style={separateur} aria-hidden="true" />
			<span style={bloc}>
				PV <span style={valeur}>{pvAffiche}</span>/<span>{heros.pvMax}</span>
			</span>
			<div style={separateur} aria-hidden="true" />
			<span style={bloc}>
				PE <span style={valeur}>{peAffiche}</span>/<span>{heros.peMax}</span>
			</span>
			<div style={separateur} aria-hidden="true" />
			<span style={bloc}>
				XP <span style={valeur}>{heros.xp}</span>
			</span>
			<div style={separateur} aria-hidden="true" />
			<span style={bloc}>
				PAS <span style={valeur}>#{pas}</span>
			</span>
			{climatNom !== undefined && (
				<>
					<div style={separateur} aria-hidden="true" />
					<span style={bloc}>
						CLIMAT <span>·</span> <span style={valeur}>{climatNom}</span>
					</span>
				</>
			)}
		</div>
	)
}

const bandeau: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)',
	padding: 'var(--space-3) var(--space-7)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	flexWrap: 'wrap',
}

const bloc: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	color: 'var(--text-body)',
}

const nom: CSSProperties = {
	color: 'var(--text-strong)',
	fontWeight: 'var(--fw-semibold)' as unknown as number,
}

const valeur: CSSProperties = {
	color: 'var(--text-strong)',
}

const separateur: CSSProperties = {
	width: 'var(--bw-hair)',
	background: 'var(--border-subtle)',
	alignSelf: 'stretch',
}
