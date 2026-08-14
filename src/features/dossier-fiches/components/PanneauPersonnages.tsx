import type { CSSProperties } from 'react'
import { localiserEntite, ListRow, Badge } from '../../../brain'
import { FichePersonnage } from './FichePersonnage'
// `LIBELLES_CAMP`/`LIBELLES_PORTEE` ont suivi le bloc 1 dans `BlocSituation.tsx`
// à la décharge d'it6 (KR-112) : ce sont les mêmes valeurs, au même usage
// (les deux badges de `ListRow`), seul le module change.
import { LIBELLES_CAMP, LIBELLES_PORTEE } from './BlocSituation'
import { boutonPointilleStyle } from './styles'
import { useEcriturePersonnages } from '../hooks/useEcriturePersonnages'

export interface PanneauPersonnagesProps {
	dossierId: string
}

const EYEBROW_SECTION = 'PERSONNAGES'
const TEXTE_VIDE = 'Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.'

/**
 * Le panneau Personnages — la liste des acteurs du monde (`monde.personnages[]`),
 * écrite par le même `DossierService.update()` que Canon/Départ/Objectifs/Lieux.
 * Motif `PanneauLieux` (§3 du plan) : colonne liste `ListRow` à gauche, fiche à
 * droite (`FichePersonnage.tsx`).
 *
 * Composant DE RENDU depuis l'itération 4 (dette KR-112 datée par it3,
 * désaccord n° 17 du plan) : sélection, brouillons, écriture et les DEUX
 * indexations KR-197 (affichage/invalidation) vivent désormais dans
 * `hooks/useEcriturePersonnages.ts`, seul propriétaire de `dossierId`. Ce
 * fichier ne fait plus que le RENDU — la liste et la fiche.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauPersonnages({ dossierId }: PanneauPersonnagesProps): JSX.Element | null {
	const ecriture = useEcriturePersonnages(dossierId)
	const { dossier, personnageAffiche, setSelection, handleAjouter } = ecriture

	if (dossier === null) return null

	if (personnageAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonPointilleStyle}>
						+ Ajouter un personnage…
					</button>
				</div>
				<div style={colonneFicheStyle}>
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE}</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<div style={listeStyle}>
					{dossier.monde.personnages.map((personnage, index) => (
						<ListRow
							key={personnage.id}
							title={localiserEntite('pnj', personnage, index)}
							subtitle={personnage.id}
							selected={personnage.id === personnageAffiche.id}
							onSelect={() => setSelection(personnage.id)}
							trailing={
								<span style={badgesStyle}>
									<Badge tone="neutral">{LIBELLES_PORTEE[personnage.portee]}</Badge>
									{personnage.camp !== undefined && <Badge tone="neutral">{LIBELLES_CAMP[personnage.camp]}</Badge>}
								</span>
							}
						/>
					))}
				</div>
				<button type="button" onClick={handleAjouter} style={boutonPointilleStyle}>
					+ Ajouter un personnage…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FichePersonnage
					personnage={personnageAffiche}
					brouillon={ecriture.brouillon}
					objectifsCanon={dossier.canon.objectifs}
					refus={ecriture.refusAffiche}
					avertissementsAffiches={ecriture.avertissementsAffiches}
					onChangeChamp={ecriture.handleChangeChamp}
					onBlurChamp={ecriture.handleBlurChamp}
					onChangeCamp={ecriture.handleChangeCamp}
					onChangePortee={ecriture.handleChangePortee}
					onChangeObjectif={ecriture.handleChangeObjectif}
					onReglerCaracteristiques={ecriture.handleReglerCaracteristiques}
					onChangeCaracteristique={ecriture.handleChangeCaracteristique}
					butBrouillon={ecriture.butBrouillon}
					onChangeBut={ecriture.handleChangeBut}
					onBlurBut={ecriture.handleBlurBut}
					etapes={ecriture.etapes}
					onChangeEtape={ecriture.handleChangeEtape}
					onBlurEtape={ecriture.handleBlurEtape}
					onChangeDureeEtape={ecriture.handleChangeDureeEtape}
					onAjouterEtape={ecriture.handleAjouterEtape}
					onRetirerEtape={ecriture.handleRetirerEtape}
					contreMesures={ecriture.contreMesures}
					onChangeContreMesure={ecriture.handleChangeContreMesure}
					onBlurContreMesure={ecriture.handleBlurContreMesure}
					onAjouterContreMesure={ecriture.handleAjouterContreMesure}
					onRetirerContreMesure={ecriture.handleRetirerContreMesure}
					personnages={dossier.monde.personnages}
					lieux={dossier.monde.lieux}
					indices={dossier.monde.indices}
					objets={dossier.monde.objets}
					relationsPresence={ecriture}
					savoirs={ecriture}
				/>
			</div>
		</div>
	)
}

const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	display: 'flex',
	gap: 'var(--space-8)',
	padding: 'var(--space-8)',
	overflowY: 'auto',
}

const colonneListeStyle: CSSProperties = {
	width: 320,
	flexShrink: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const colonneFicheStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
}

const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-2)',
}

const listeStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const badgesStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

const emptyStateStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--surface-inset)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: 'auto',
}

const emptyGlyphStyle: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyTextStyle: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
