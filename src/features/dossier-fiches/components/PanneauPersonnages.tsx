import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { localiserEntite, ListRow, Badge } from '../../../brain'
import { FichePersonnage, designationDe, type FichePersonnageHandle } from './FichePersonnage'
import { RetirerPersonnageDialog } from './RetirerPersonnageDialog'
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
 * Le RETRAIT d'un personnage (itération 7) est possédé ici, en trois pièces :
 * l'état d'ouverture de la modale (`enConfirmation`), la CONFIRMATION
 * (`handleConfirmerRetrait`) et le déplacement de focus qui suit un retrait
 * réussi (`intentionFocus`). Le focus est un geste DOM impératif, pas un
 * miroir d'état — usage légitime de `useEffect` (KR-013), même famille que
 * `PanneauLieux.tsx`.
 *
 * CIBLE DU FOCUS (revue de PR, post-livraison it8) : ce panneau ne cherche
 * JAMAIS le bouton de retrait dans le DOM par son `aria-label` — c'est un
 * détail d'implémentation de `FichePersonnage`, pas le sien. Il DEMANDE
 * (`ficheRef.current?.focusRetirer()`, `FichePersonnageHandle`), même motif
 * que `designationDe` : la fiche EXPOSE la capacité, ce panneau l'APPELLE.
 * Pour son PROPRE bouton « + Ajouter un personnage… » (qu'il rend lui-même,
 * dans les deux branches ci-dessous), un `ref` direct suffit — aucune
 * indirection nécessaire sur ce qu'on possède déjà.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauPersonnages({ dossierId }: PanneauPersonnagesProps): JSX.Element | null {
	const ecriture = useEcriturePersonnages(dossierId)
	const { dossier, personnageAffiche, setSelection, handleAjouter } = ecriture
	/** L'identifiant du personnage dont le retrait attend confirmation, jamais un
	 *  booléen : la modale se garde EN LIGNE contre le personnage affiché
	 *  (`enConfirmation === personnageAffiche.id`), donc une sélection devenue
	 *  périmée la ferme sans le moindre `useEffect` de resynchronisation
	 *  (KR-013/113, § 8 désaccord 7). Un second clic sur « Retirer » pendant
	 *  qu'elle est ouverte réécrit le même identifiant — aucun état dupliqué
	 *  possible. */
	const [enConfirmation, setEnConfirmation] = useState<string | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'retirer' | null>(null)
	const ficheRef = useRef<FichePersonnageHandle>(null)
	const boutonAjouterRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (intentionFocus === 'retirer') {
			// `personnageAffiche` reflète déjà la RETOMBÉE post-retrait à ce point
			// (calculé en ligne depuis `dossier`, mis à jour dans le même commit React
			// que ce `useEffect`) : présent → une fiche existe, la sienne se focalise
			// elle-même ; absent → retirer le DERNIER personnage a basculé sur l'état
			// vide (revue de PR it7 — sans ce repli, le focus tombait sur document.body).
			if (personnageAffiche !== undefined) {
				ficheRef.current?.focusRetirer()
			} else {
				boutonAjouterRef.current?.focus()
			}
		}
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus, personnageAffiche])

	if (dossier === null) return null

	/**
	 * L'ORDRE DES DEUX EFFETS EST UN INVARIANT, pas une préférence de style
	 * (§ 8 désaccord 6, résolu) : la fermeture de la modale et le retrait vivent
	 * dans le MÊME gestionnaire synchrone, donc dans le même commit React. C'est
	 * ce qui fait gagner `intentionFocus` contre la restauration de focus native
	 * de `Modal.tsx` — son nettoyage (passif) rend le focus au bouton qui l'a
	 * ouverte, lequel vient d'être démonté avec l'ancienne fiche, puis notre effet
	 * pose le focus sur le bouton de la fiche retombée. Aucun `useEffect`, aucune
	 * promesse, aucun `setTimeout` entre les deux.
	 */
	function handleConfirmerRetrait(): void {
		setEnConfirmation(null)
		const resultat = ecriture.handleRetirer()
		if (resultat.statut === 'ecrit') setIntentionFocus('retirer')
		// Statut ≠ 'ecrit' (refus SSOT) : AUCUN `setIntentionFocus`. Le bouton visé
		// est toujours monté — la fiche n'a pas changé — et `Modal.tsx` lui restaure
		// légitimement le focus au démontage. Le bandeau de refus prend la main.
	}

	if (personnageAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button
						ref={boutonAjouterRef}
						type="button"
						aria-label="+ Ajouter un personnage…"
						onClick={handleAjouter}
						style={boutonPointilleStyle}
					>
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

	const indexAffiche = dossier.monde.personnages.findIndex((p) => p.id === personnageAffiche.id)

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
				<button
					ref={boutonAjouterRef}
					type="button"
					aria-label="+ Ajouter un personnage…"
					onClick={handleAjouter}
					style={boutonPointilleStyle}
				>
					+ Ajouter un personnage…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FichePersonnage
					ref={ficheRef}
					personnage={personnageAffiche}
					index={indexAffiche}
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
					caractere={ecriture}
					onDemanderRetrait={() => setEnConfirmation(personnageAffiche.id)}
				/>
			</div>

			{/* GARDE EN LIGNE, jamais un effet miroir (KR-013/113) : une demande de
			    retrait laissée ouverte sur un personnage qui n'est plus l'affiché se
			    referme d'elle-même au rendu suivant. */}
			{enConfirmation === personnageAffiche.id && (
				<RetirerPersonnageDialog
					nomAffiche={designationDe(personnageAffiche, indexAffiche)}
					onConfirm={handleConfirmerRetrait}
					onCancel={() => setEnConfirmation(null)}
				/>
			)}
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
