import type { ChangeEvent, FocusEvent } from 'react'
import { Field, Select, IconButton, HIT_TARGET_MIN, localiserEntite, type Lieu } from '../../../brain'
import { eyebrowStyle, legendeStyle, listeLignesStyle, ligneStyle, enTeteLigneStyle } from './styles'
import type { BrouillonPresence } from '../hooks/useEcritureRelationsPresence'

const LEGENDE_PRESENCE = "Où l'on peut trouver ce personnage, et à quel moment."
const HINT_QUAND = "interne — note d'auteur, jamais lue par le modèle"
const PLACEHOLDER_QUAND = 'Au crépuscule, avant que le marché ne ferme.'
const TEXTE_AJOUTER_PRESENCE = '+ Ajouter une présence…'
const TEXTE_AUCUN_LIEU_CANON =
	"Aucun lieu défini dans le canon — ce personnage ne pourra être situé tant qu'aucun n'existe."

export interface BlocPresenceProps {
	lieux: Lieu[]
	presence: BrouillonPresence[]
	onAjouterPresence: (lieuId: string) => void
	onChangeLieuPresence: (index: number, lieuId: string) => void
	onChangeQuandPresence: (index: number, valeur: string) => void
	onBlurQuandPresence: (index: number, valeur: string) => void
	onRetirerPresence: (index: number) => void
}

/**
 * Le bloc 6 de l'accordéon (« Présence »), it5 — même patron d'ajout que
 * « Relations » (`Select` dédié, jamais un bouton pointillé), mais `lieu_id`
 * SEUL étant requis (`quand` optionnel), le geste d'ajout committe DIRECTEMENT
 * — aucune ligne locale n'est nécessaire (voir `useEcritureRelationsPresence.ts`).
 */
export function BlocPresence({
	lieux,
	presence,
	onAjouterPresence,
	onChangeLieuPresence,
	onChangeQuandPresence,
	onBlurQuandPresence,
	onRetirerPresence,
}: BlocPresenceProps): JSX.Element {
	if (lieux.length === 0) {
		return <p style={legendeStyle}>{TEXTE_AUCUN_LIEU_CANON}</p>
	}

	const optionsLieu = lieux.map((lieu, index) => ({ value: lieu.id, label: localiserEntite('lieu', lieu, index) }))

	return (
		<>
			<p style={legendeStyle}>{LEGENDE_PRESENCE}</p>
			<div style={listeLignesStyle}>
				{presence.map((entree, index) => (
					<div key={index} style={ligneStyle}>
						<div style={enTeteLigneStyle}>
							<span style={eyebrowStyle}>{`PRÉSENCE ${index + 1}`}</span>
							<IconButton
								label={`Retirer la présence n°${index + 1}`}
								tone="danger"
								size={HIT_TARGET_MIN}
								onClick={() => onRetirerPresence(index)}
							>
								✕
							</IconButton>
						</div>
						<Select
							label="LIEU"
							options={optionsLieu}
							value={entree.lieu_id}
							onChange={(valeur) => onChangeLieuPresence(index, valeur)}
						/>
						<Field
							label="QUAND"
							hint={HINT_QUAND}
							placeholder={PLACEHOLDER_QUAND}
							value={entree.quand}
							onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
								onChangeQuandPresence(index, e.target.value)
							}
							onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
								onBlurQuandPresence(index, e.target.value)
							}
						/>
					</div>
				))}
			</div>
			<Select
				ariaLabel="Ajouter une présence"
				options={[{ value: '', label: TEXTE_AJOUTER_PRESENCE }, ...optionsLieu]}
				value=""
				onChange={onAjouterPresence}
			/>
		</>
	)
}
