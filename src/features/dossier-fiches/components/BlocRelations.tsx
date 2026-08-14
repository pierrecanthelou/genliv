import type { ChangeEvent, FocusEvent } from 'react'
import {
	Field,
	Select,
	Stepper,
	Toggle,
	IconButton,
	HIT_TARGET_MIN,
	INTENSITE_MIN,
	INTENSITE_MAX,
	localiserEntite,
	type Personnage,
} from '../../../brain'
import { eyebrowStyle, legendeStyle, listeLignesStyle, ligneStyle, enTeteLigneStyle } from './styles'
import type { BrouillonRelation } from '../hooks/useEcritureRelationsPresence'

const LEGENDE_RELATIONS =
	"Comment ce personnage se sent envers un autre — l'intensité reste au moteur ; c'est CE QUI LES LIE que le modèle joue."
const LEGENDE_INTENSITE = '− hostilité, + attachement'
const HINT_LIEN = "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur"
const PLACEHOLDER_LIEN = "Elle lui doit la vie depuis l'incendie du beffroi, et ne l'a jamais dit à personne."
const HINT_SECRET =
	"seul ce personnage la connaît : elle n'entre jamais dans le contexte du narrateur, ni dans celui d'un autre personnage."
const TEXTE_AJOUTER_RELATION = '+ Ajouter une relation…'
const TEXTE_AUCUN_AUTRE_PERSONNAGE =
	'Aucun autre personnage à qui rattacher une relation — créez-en un second dans cette section.'

export interface BlocRelationsProps {
	/** Le dossier ENTIER, jamais filtré : l'auto-référence est légale (KR-194),
	 *  aucun filtre ne retire le personnage porteur des options. */
	personnages: Personnage[]
	relations: BrouillonRelation[]
	onAjouterRelation: (cibleId: string) => void
	onChangeCibleRelation: (index: number, cibleId: string) => void
	onChangeLienRelation: (index: number, valeur: string) => void
	onBlurLienRelation: (index: number, valeur: string) => void
	onChangeIntensiteRelation: (index: number, valeur: number) => void
	onChangeSecretRelation: (index: number, secret: boolean) => void
	onRetirerRelation: (index: number) => void
}

/**
 * Le bloc 5 de l'accordéon (« Relations »), it5 — geste d'ajout par `Select`
 * dédié (jamais un bouton pointillé, `cible_id` étant requis), ligne bordée
 * (précédent étape de plan d'actions, jamais `ListRow`). `cible_id`/`intensite`/
 * `secret` committent immédiatement sur une relation déjà persistée ; `lien`
 * suit le patron brouillon-par-champ, commit au blur — voir
 * `useEcritureRelationsPresence.ts`.
 */
export function BlocRelations({
	personnages,
	relations,
	onAjouterRelation,
	onChangeCibleRelation,
	onChangeLienRelation,
	onBlurLienRelation,
	onChangeIntensiteRelation,
	onChangeSecretRelation,
	onRetirerRelation,
}: BlocRelationsProps): JSX.Element {
	// Revue de PR (it5) : l'état vide ne doit masquer que l'ABSENCE de relations,
	// jamais des relations DÉJÀ ÉCRITES — un dossier à un seul personnage portant
	// une relation auto-référentielle (KR-194, légale depuis ce lot) rendait ses
	// champs invisibles et inéditables, violant le critère racine #11 (lecture au
	// montage). Précédent exact : __fixtures__/dossier-minimal.json en porte une.
	if (personnages.length < 2 && relations.length === 0) {
		return <p style={legendeStyle}>{TEXTE_AUCUN_AUTRE_PERSONNAGE}</p>
	}

	const optionsCible = personnages.map((personnage, index) => ({
		value: personnage.id,
		label: localiserEntite('pnj', personnage, index),
	}))

	return (
		<>
			<p style={legendeStyle}>{LEGENDE_RELATIONS}</p>
			<div style={listeLignesStyle}>
				{relations.map((relation, index) => (
					<div key={index} style={ligneStyle}>
						<div style={enTeteLigneStyle}>
							<span style={eyebrowStyle}>{`RELATION ${index + 1}`}</span>
							<IconButton
								label={`Retirer la relation n°${index + 1}`}
								tone="danger"
								size={HIT_TARGET_MIN}
								onClick={() => onRetirerRelation(index)}
							>
								✕
							</IconButton>
						</div>
						<Select
							label="PERSONNAGE"
							options={optionsCible}
							value={relation.cible_id}
							onChange={(valeur) => onChangeCibleRelation(index, valeur)}
						/>
						<Field
							label="CE QUI LES LIE"
							hint={HINT_LIEN}
							multiline
							rows={2}
							placeholder={PLACEHOLDER_LIEN}
							value={relation.lien}
							onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
								onChangeLienRelation(index, e.target.value)
							}
							onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
								onBlurLienRelation(index, e.target.value)
							}
						/>
						<div>
							<Stepper
								label="INTENSITÉ"
								value={relation.intensite}
								min={INTENSITE_MIN}
								max={INTENSITE_MAX}
								prefix="+"
								onChange={(valeur) => onChangeIntensiteRelation(index, valeur)}
							/>
							<p style={legendeStyle}>{LEGENDE_INTENSITE}</p>
						</div>
						<div>
							<Toggle
								label="SECRÈTE"
								checked={relation.secret}
								onChange={(secret) => onChangeSecretRelation(index, secret)}
							/>
							<p style={legendeStyle}>{HINT_SECRET}</p>
						</div>
					</div>
				))}
			</div>
			<Select
				ariaLabel="Ajouter une relation"
				options={[{ value: '', label: TEXTE_AJOUTER_RELATION }, ...optionsCible]}
				value=""
				onChange={onAjouterRelation}
			/>
		</>
	)
}
