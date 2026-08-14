import {
	Select,
	SegmentedControl,
	localiserEntite,
	CAMPS_PERSONNAGE,
	PORTEES,
	type CampPersonnage,
	type Portee,
	type Personnage,
	type Objectif,
} from '../../../brain'
import { eyebrowStyle, legendeStyle } from './styles'

/** Libellés français du camp — côté FEATURE, réutilisés par le `SegmentedControl`
 *  de ce bloc et le badge de `ListRow` de `PanneauPersonnages.tsx`. */
export const LIBELLES_CAMP: Record<CampPersonnage, string> = {
	protagoniste: 'Protagoniste',
	antagoniste: 'Antagoniste',
}
const OPTIONS_CAMP = CAMPS_PERSONNAGE.map((camp) => ({ value: camp, label: LIBELLES_CAMP[camp] }))

/** Même règle pour la portée. */
export const LIBELLES_PORTEE: Record<Portee, string> = {
	premier: 'Premier plan',
	second: 'Second plan',
}
const OPTIONS_PORTEE = PORTEES.map((portee) => ({ value: portee, label: LIBELLES_PORTEE[portee] }))

const TEXTE_AUCUN_OBJECTIF_CANON =
	"Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe."

const OPTION_AUCUN_OBJECTIF = { value: '', label: 'Aucun objectif rattaché' }

export interface BlocSituationProps {
	personnage: Personnage
	objectifsCanon: Objectif[]
	onChangeCamp: (camp: CampPersonnage) => void
	onChangePortee: (portee: Portee) => void
	/** `''` = « Aucun objectif rattaché » — le parent retire la clé plutôt que de
	 *  committer une chaîne vide. */
	onChangeObjectif: (objectifId: string) => void
}

/**
 * Le bloc 1 de l'accordéon (« Camp, plan & rattachement »), it1 — EXTRAIT de
 * `FichePersonnage.tsx` à l'itération 6, avec `BlocIdentite` et pour la même
 * raison : ce fichier-là passait 400 lignes (KR-112) AVANT que le bloc Savoirs
 * n'y soit câblé. Aucun changement de comportement, aucun texte modifié — les
 * deux `SegmentedControl` committent immédiatement, le `Select` d'objectif rend
 * son état vide quand le CANON n'en porte aucun (pas le personnage).
 *
 * `LIBELLES_CAMP`/`LIBELLES_PORTEE` DÉMÉNAGENT ICI avec le bloc qui les rend :
 * `PanneauPersonnages.tsx` les lit pour ses badges de `ListRow` et les importe
 * désormais de ce fichier. Aucun cycle — ce module n'importe pas le panneau.
 */
export function BlocSituation({
	personnage,
	objectifsCanon,
	onChangeCamp,
	onChangePortee,
	onChangeObjectif,
}: BlocSituationProps): JSX.Element {
	return (
		<>
			<div>
				<span style={eyebrowStyle}>CAMP</span>
				<SegmentedControl<CampPersonnage>
					options={OPTIONS_CAMP}
					value={personnage.camp}
					onChange={onChangeCamp}
					ariaLabel="Camp du personnage"
				/>
			</div>
			<div>
				<span style={eyebrowStyle}>PLAN</span>
				<SegmentedControl<Portee>
					options={OPTIONS_PORTEE}
					value={personnage.portee}
					onChange={onChangePortee}
					ariaLabel="Plan du personnage"
				/>
			</div>
			{objectifsCanon.length === 0 ? (
				<div>
					<span style={eyebrowStyle}>OBJECTIF RATTACHÉ</span>
					<p style={legendeStyle}>{TEXTE_AUCUN_OBJECTIF_CANON}</p>
				</div>
			) : (
				<Select
					label="OBJECTIF RATTACHÉ"
					options={[
						OPTION_AUCUN_OBJECTIF,
						...objectifsCanon.map((objectif, index) => ({
							value: objectif.id,
							label: localiserEntite('objectif', objectif, index),
						})),
					]}
					value={personnage.objectif_id ?? ''}
					onChange={onChangeObjectif}
				/>
			)}
		</>
	)
}
