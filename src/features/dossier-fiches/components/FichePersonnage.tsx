import { type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	Card,
	Field,
	IssueList,
	type CampPersonnage,
	type Portee,
	type Personnage,
	type Objectif,
	type Lieu,
	type Entite,
	type DossierIssue,
	type Characteristic,
} from '../../../brain'
import { Accordion, type AccordionSection } from './Accordion'
import { BlocSituation } from './BlocSituation'
import { BlocIdentite } from './BlocIdentite'
import { BlocCaracteristiques } from './BlocCaracteristiques'
import { BlocPlanActions } from './BlocPlanActions'
import { BlocSavoirs } from './BlocSavoirs'
import { BlocRelations } from './BlocRelations'
import { BlocPresence } from './BlocPresence'
import type { BrouillonPersonnage, ChampTexte } from '../hooks/useEcritureIdentite'
import type {
	BrouillonBut,
	ChampBut,
	BrouillonEtape,
	ChampEtapeTexte,
	BrouillonContreMesure,
	ChampContreMesureTexte,
} from '../hooks/useEcriturePlan'
import type { UseEcritureRelationsPresenceResult } from '../hooks/useEcritureRelationsPresence'
import type { UseEcritureSavoirsResult } from '../hooks/useEcritureSavoirs'

const BLOC_1_ID = 'camp-plan-rattachement'
const BLOC_2_ID = 'identite'
const BLOC_3_ID = 'caracteristiques'
const BLOC_4_ID = 'objectif-plan-actions'
const BLOC_5_ID = 'relations'
const BLOC_6_ID = 'presence'
const BLOC_7_ID = 'savoirs'

const PLACEHOLDER_NOM = 'Aldûr le Sage'

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

/** Le SEUL bloc encore vide après it6 (savoirs a quitté cette table à it6, comme
 *  « Caractéristiques » à it3, « Objectif & plan d'actions » à it4 et
 *  « Relations »/« Présence » à it5). Posé HORS séquence : il n'est adjacent à
 *  aucun autre placeholder, une constante nommée plutôt qu'un tableau. */
const BLOC_CARACTERE_EXPLOITABLE = { id: 'caractere-exploitable', titre: 'Caractère exploitable', iteration: 8 }

function placeholderDe(iteration: number): string {
	return `Pas encore renseigné — ce bloc arrive à l'itération ${iteration} de dossier-fiches.`
}

function sectionPlaceholder(bloc: { id: string; titre: string; iteration: number }): AccordionSection {
	return { id: bloc.id, title: bloc.titre, content: <p style={placeholderStyle}>{placeholderDe(bloc.iteration)}</p> }
}

export interface FichePersonnageProps {
	personnage: Personnage
	brouillon: BrouillonPersonnage
	objectifsCanon: Objectif[]
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit jamais
	 *  l'identifiant du personnage en cause, seulement ce qu'il reste à afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	/** Les avertissements du personnage affiché (KR-189), DÉJÀ filtrés par le
	 *  parent — par PRÉFIXE DE CHEMIN, donc D1 et `revelation-sans-porte`
	 *  ensemble. */
	avertissementsAffiches: DossierIssue[]
	onChangeChamp: (champ: ChampTexte, valeur: string) => void
	onBlurChamp: (champ: ChampTexte, valeur: string) => void
	onChangeCamp: (camp: CampPersonnage) => void
	onChangePortee: (portee: Portee) => void
	/** `''` = « Aucun objectif rattaché » — le parent retire la clé plutôt que de
	 *  committer une chaîne vide. */
	onChangeObjectif: (objectifId: string) => void
	/** Geste EXPLICITE qui sème les 8 clés à `CARACTERISTIQUE_MIN` en un commit. */
	onReglerCaracteristiques: () => void
	onChangeCaracteristique: (carac: Characteristic, valeur: number) => void
	butBrouillon: BrouillonBut
	onChangeBut: (champ: ChampBut, valeur: string) => void
	onBlurBut: (champ: ChampBut, valeur: string) => void
	etapes: BrouillonEtape[]
	onChangeEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onBlurEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onChangeDureeEtape: (index: number, valeur: number) => void
	onAjouterEtape: () => void
	onRetirerEtape: (index: number) => void
	contreMesures: BrouillonContreMesure[]
	onChangeContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onBlurContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onAjouterContreMesure: () => void
	onRetirerContreMesure: (index: number) => void
	/** Le dossier ENTIER, jamais filtré : l'auto-référence est légale (KR-194). */
	personnages: Personnage[]
	lieux: Lieu[]
	/** `monde.indices[]` / `monde.objets[]` — les deux registres que le bloc
	 *  Savoirs CONSOMME et ne produit pas (n° 5 / n° 6). */
	indices: Entite[]
	objets: Entite[]
	/** La tranche relations/présence de l'assembleur `useEcriturePersonnages`
	 *  (structurellement compatible avec `UseEcritureRelationsPresenceResult`,
	 *  §5 lot 2 du plan) : ses champs sont câblés un par un vers
	 *  `BlocRelations`/`BlocPresence` (noms `on*`, jamais `handle*`, dans le JSX
	 *  ci-dessous) — regroupés ici pour ne pas recopier ces props individuelles
	 *  sur cette interface (KR-112). */
	relationsPresence: UseEcritureRelationsPresenceResult
	/** Même motif pour la tranche savoirs (21 champs). */
	savoirs: UseEcritureSavoirsResult
}

/**
 * La fiche du personnage sélectionné — liste `ListRow` à gauche
 * (`PanneauPersonnages.tsx`), fiche à droite. Composant PUREMENT DE RENDU :
 * aucun état de DOCUMENT, aucun appel à `DossierService` — brouillon et commit
 * restent la responsabilité du hook `useEcriturePersonnages`. Champ NOM en
 * EN-TÊTE de fiche, HORS accordéon (précédent `FicheLieu`).
 *
 * LES SEPT BLOCS RENSEIGNÉS sont EXTRAITS dans leur propre composant (dette
 * KR-112) : ce fichier ne fait plus que les CÂBLER dans `sections`, DANS L'ORDRE
 * D'AFFICHAGE. Les blocs 1 et 2 ont rejoint les autres à l'itération 6, AVANT
 * que le bloc « Savoirs » n'y soit branché — les y laisser aurait remis ce
 * fichier au-dessus du seuil de scission au moment même où il gagnait un
 * huitième câblage.
 *
 * L'accordéon revient au bloc 1 à chaque changement de personnage par
 * `key={personnage.id}` posé ICI (remontage React, jamais un `useEffect`,
 * KR-013/113) — les refs de focus internes des blocs extraits n'ont donc pas
 * besoin de porter l'identité du personnage.
 *
 * Bandeau de refus (`refus.statut`, jamais `refus.issues`) puis bandeau
 * d'avertissement (rendu seulement si `avertissementsAffiches` est non vide) :
 * derniers enfants de `champsStyle`, position exacte de `FicheLieu.tsx`.
 */
export function FichePersonnage({
	personnage,
	brouillon,
	objectifsCanon,
	refus,
	avertissementsAffiches,
	onChangeChamp,
	onBlurChamp,
	onChangeCamp,
	onChangePortee,
	onChangeObjectif,
	onReglerCaracteristiques,
	onChangeCaracteristique,
	butBrouillon,
	onChangeBut,
	onBlurBut,
	etapes,
	onChangeEtape,
	onBlurEtape,
	onChangeDureeEtape,
	onAjouterEtape,
	onRetirerEtape,
	contreMesures,
	onChangeContreMesure,
	onBlurContreMesure,
	onAjouterContreMesure,
	onRetirerContreMesure,
	personnages,
	lieux,
	indices,
	objets,
	relationsPresence,
	savoirs,
}: FichePersonnageProps): JSX.Element {
	const sections: AccordionSection[] = [
		{
			id: BLOC_1_ID,
			title: 'Camp, plan & rattachement',
			content: (
				<BlocSituation
					personnage={personnage}
					objectifsCanon={objectifsCanon}
					onChangeCamp={onChangeCamp}
					onChangePortee={onChangePortee}
					onChangeObjectif={onChangeObjectif}
				/>
			),
		},
		{
			id: BLOC_2_ID,
			title: 'Identité',
			content: <BlocIdentite brouillon={brouillon} onChangeChamp={onChangeChamp} onBlurChamp={onBlurChamp} />,
		},
		{
			id: BLOC_3_ID,
			title: 'Caractéristiques',
			content: (
				<BlocCaracteristiques
					personnage={personnage}
					onReglerCaracteristiques={onReglerCaracteristiques}
					onChangeCaracteristique={onChangeCaracteristique}
				/>
			),
		},
		{
			id: BLOC_4_ID,
			title: "Objectif & plan d'actions",
			content: (
				<BlocPlanActions
					personnage={personnage}
					butBrouillon={butBrouillon}
					onChangeBut={onChangeBut}
					onBlurBut={onBlurBut}
					etapes={etapes}
					onChangeEtape={onChangeEtape}
					onBlurEtape={onBlurEtape}
					onChangeDureeEtape={onChangeDureeEtape}
					onAjouterEtape={onAjouterEtape}
					onRetirerEtape={onRetirerEtape}
					contreMesures={contreMesures}
					onChangeContreMesure={onChangeContreMesure}
					onBlurContreMesure={onBlurContreMesure}
					onAjouterContreMesure={onAjouterContreMesure}
					onRetirerContreMesure={onRetirerContreMesure}
				/>
			),
		},
		{
			id: BLOC_7_ID,
			title: 'Savoirs',
			content: (
				<BlocSavoirs
					savoirs={savoirs.savoirs}
					indices={indices}
					objets={objets}
					onAjouterSavoir={savoirs.handleAjouterSavoir}
					onChangeIndiceSavoir={savoirs.handleChangeIndiceSavoir}
					onChangeCertitudeSavoir={savoirs.handleChangeCertitudeSavoir}
					onChangeRevelComment={savoirs.handleChangeRevelComment}
					onBlurRevelComment={savoirs.handleBlurRevelComment}
					onRetirerSavoir={savoirs.handleRetirerSavoir}
					onOuvrirPorteConfiance={savoirs.handleOuvrirPorteConfiance}
					onChangeConfiance={savoirs.handleChangeConfiance}
					onFermerPorteConfiance={savoirs.handleFermerPorteConfiance}
					onOuvrirPorteJet={savoirs.handleOuvrirPorteJet}
					onChangeJetCarac={savoirs.handleChangeJetCarac}
					onChangeJetTc={savoirs.handleChangeJetTc}
					onFermerPorteJet={savoirs.handleFermerPorteJet}
					onOuvrirPorteContrepartie={savoirs.handleOuvrirPorteContrepartie}
					onChangeContrepartieObjet={savoirs.handleChangeContrepartieObjet}
					onChangeContrepartieConsomme={savoirs.handleChangeContrepartieConsomme}
					onFermerPorteContrepartie={savoirs.handleFermerPorteContrepartie}
					onOuvrirPorteApresIndice={savoirs.handleOuvrirPorteApresIndice}
					onChangeApresIndice={savoirs.handleChangeApresIndice}
					onFermerPorteApresIndice={savoirs.handleFermerPorteApresIndice}
				/>
			),
		},
		{
			id: BLOC_5_ID,
			title: 'Relations',
			content: (
				<BlocRelations
					personnages={personnages}
					relations={relationsPresence.relations}
					onAjouterRelation={relationsPresence.handleAjouterRelation}
					onChangeCibleRelation={relationsPresence.handleChangeCibleRelation}
					onChangeLienRelation={relationsPresence.handleChangeLienRelation}
					onBlurLienRelation={relationsPresence.handleBlurLienRelation}
					onChangeIntensiteRelation={relationsPresence.handleChangeIntensiteRelation}
					onChangeSecretRelation={relationsPresence.handleChangeSecretRelation}
					onRetirerRelation={relationsPresence.handleRetirerRelation}
				/>
			),
		},
		{
			id: BLOC_6_ID,
			title: 'Présence',
			content: (
				<BlocPresence
					lieux={lieux}
					presence={relationsPresence.presence}
					onAjouterPresence={relationsPresence.handleAjouterPresence}
					onChangeLieuPresence={relationsPresence.handleChangeLieuPresence}
					onChangeQuandPresence={relationsPresence.handleChangeQuandPresence}
					onBlurQuandPresence={relationsPresence.handleBlurQuandPresence}
					onRetirerPresence={relationsPresence.handleRetirerPresence}
				/>
			),
		},
		sectionPlaceholder(BLOC_CARACTERE_EXPLOITABLE),
	]

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU PERSONNAGE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>
				<Accordion key={personnage.id} sections={sections} defaultOpenId={BLOC_1_ID} />

				{refus !== null && (
					<div role="status" style={bandeauRefusStyle}>
						<p style={eyebrowRefusStyle}>{EYEBROW_REFUS}</p>
						{refus.statut === 'absent' ? (
							<p style={texteAbsentStyle}>{TEXTE_ABSENT}</p>
						) : (
							<IssueList issues={refus.issues} />
						)}
					</div>
				)}

				{avertissementsAffiches.length > 0 && (
					<div role="status" style={bandeauRefusStyle}>
						<p style={eyebrowRefusStyle}>{EYEBROW_AVERTISSEMENT}</p>
						<IssueList issues={avertissementsAffiches} />
					</div>
				)}
			</div>
		</Card>
	)
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const placeholderStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

const bandeauRefusStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-6)',
}

const eyebrowRefusStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--bad)',
	letterSpacing: 'var(--track-eyebrow)',
}

const texteAbsentStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}
