import type { ChangeEvent, CSSProperties, FocusEvent } from 'react'
import {
	Card,
	Field,
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
import { Accordion, type AccordionSection } from './Accordion'

/** Libellés français du camp — côté FEATURE (précédent `ObjectifsCanon.tsx`,
 *  `LIBELLES_CAMPS`) : un seul registre, réutilisé ici par le `SegmentedControl`
 *  du bloc 1 ET par le badge de `ListRow` dans `PanneauPersonnages.tsx`, pour
 *  qu'un seul texte porte « Protagoniste »/« Antagoniste ». */
export const LIBELLES_CAMP: Record<CampPersonnage, string> = {
	protagoniste: 'Protagoniste',
	antagoniste: 'Antagoniste',
}
const OPTIONS_CAMP = CAMPS_PERSONNAGE.map((camp) => ({ value: camp, label: LIBELLES_CAMP[camp] }))

/** Même règle pour la portée — un seul registre pour le `SegmentedControl` du
 *  bloc 1 et le badge de plan, toujours présent, de `PanneauPersonnages.tsx`. */
export const LIBELLES_PORTEE: Record<Portee, string> = {
	premier: 'Premier plan',
	second: 'Second plan',
}
const OPTIONS_PORTEE = PORTEES.map((portee) => ({ value: portee, label: LIBELLES_PORTEE[portee] }))

const BLOC_1_ID = 'camp-plan-rattachement'

const PLACEHOLDER_NOM = 'Aldûr le Sage'

const TEXTE_AUCUN_OBJECTIF_CANON =
	"Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe."

const OPTION_AUCUN_OBJECTIF = { value: '', label: 'Aucun objectif rattaché' }

/** Les 7 blocs vides d'it1 — titre exact + itération cible du placeholder,
 *  table DÉCLARATIVE (§3 du plan) plutôt que 7 littéraux JSX recopiés. */
const BLOCS_VIDES: readonly { id: string; titre: string; iteration: number }[] = [
	{ id: 'identite', titre: 'Identité', iteration: 2 },
	{ id: 'caracteristiques', titre: 'Caractéristiques', iteration: 2 },
	{ id: 'objectif-plan-actions', titre: "Objectif & plan d'actions", iteration: 3 },
	{ id: 'savoirs', titre: 'Savoirs', iteration: 4 },
	{ id: 'relations', titre: 'Relations', iteration: 4 },
	{ id: 'presence', titre: 'Présence', iteration: 4 },
	{ id: 'caractere-exploitable', titre: 'Caractère exploitable', iteration: 5 },
]

function placeholderDe(iteration: number): string {
	return `Pas encore renseigné — ce bloc arrive à l'itération ${iteration} de dossier-fiches.`
}

export interface FichePersonnageProps {
	personnage: Personnage
	brouillonNom: string
	objectifsCanon: Objectif[]
	onChangeNom: (valeur: string) => void
	onBlurNom: (valeur: string) => void
	onChangeCamp: (camp: CampPersonnage) => void
	onChangePortee: (portee: Portee) => void
	/** `''` = « Aucun objectif rattaché » — au parent de retirer la clé plutôt
	 *  que de committer une chaîne vide (§ compte rendu du lot contrat, note 1). */
	onChangeObjectif: (objectifId: string) => void
}

/**
 * La fiche du personnage sélectionné — liste `ListRow` à gauche
 * (`PanneauPersonnages.tsx`), fiche à droite. Composant PUREMENT DE RENDU :
 * aucun état, aucun appel à `DossierService` — brouillon et commit restent la
 * responsabilité du parent, seul propriétaire de `dossierId`.
 *
 * Champ NOM en EN-TÊTE de fiche, HORS accordéon (précédent `FicheLieu`,
 * « NOM DU LIEU » comme premier `Field`, au-dessus de toute structure
 * interne) : brouillon local + commit au blur, porté par le parent.
 *
 * L'accordéon revient au bloc 1 à chaque changement de personnage par
 * `key={personnage.id}` posé ICI, sur `<Accordion>` — remontage React, jamais
 * un `useEffect` (KR-013/113).
 */
export function FichePersonnage({
	personnage,
	brouillonNom,
	objectifsCanon,
	onChangeNom,
	onBlurNom,
	onChangeCamp,
	onChangePortee,
	onChangeObjectif,
}: FichePersonnageProps): JSX.Element {
	const sections: AccordionSection[] = [
		{
			id: BLOC_1_ID,
			title: 'Camp, plan & rattachement',
			content: (
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
			),
		},
		...BLOCS_VIDES.map(
			(bloc): AccordionSection => ({
				id: bloc.id,
				title: bloc.titre,
				content: <p style={placeholderStyle}>{placeholderDe(bloc.iteration)}</p>,
			}),
		),
	]

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU PERSONNAGE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillonNom}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeNom(e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurNom(e.target.value)}
				/>
				<Accordion key={personnage.id} sections={sections} defaultOpenId={BLOC_1_ID} />
			</div>
		</Card>
	)
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const legendeStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const placeholderStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
