import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Badge, HIT_TARGET_MIN, IconButton } from '../../../brain'
import {
	BADGE_ACCEPTE,
	BADGE_REJETE,
	EYEBROW_ENVERS,
	LABEL_ACCEPTER,
	LABEL_REJETER,
	LIEN_OUVRIR_FICHE,
} from '../textes'
import {
	actionsDetenteurStyle,
	blocLectureRepliqueStyle,
	conteneurRepliqueStyle,
	designationDetenteurStyle,
	eyebrowStyle,
	lienDetenteurStyle,
} from './styles'

export interface LigneRelationProps {
	/** `localiserEntite('pnj', cibleId, index)` — calculée par la CARTE, jamais
	 *  recomposée ici (encapsulation, précédent `LigneDetenteur`). Vaut
	 *  `TEXTE_CIBLE_INTROUVABLE` quand la référence ne résout plus (KR-021 :
	 *  exposé, jamais filtré — cette ligne s'affiche quand même). */
	designation: string
	/** `LienResolu.lien`, rendu TEL QUEL — aucun `Field`, aucun `chemin`, aucune
	 *  dépendance à `LIBELLE_DES_CHAMPS` (mur des 4 entrées, veto, 4ᵉ occurrence). */
	lien: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

/** Une INTENTION exposée au parent (§ 3.5), même précédent que
 *  `LigneDetenteurHandle`/`LigneRepliqueHandle` : « mets le focus sur le
 *  bouton Accepter de CETTE ligne » — jamais le `ref` du bouton lui-même.
 *  AUCUN `focusRejeter` : cette ligne ne porte aucun plafond de document
 *  (§ 3.5, § 8 n° 32 du plan d'itération 3c), donc le « + » n'est jamais
 *  désactivé et reste une cible de focus valide. */
export interface LigneRelationHandle {
	focusAccepter: () => void
}

/**
 * La ligne d'une relation proposée — SŒUR de `LigneDetenteur` ET de
 * `LigneReplique`, JAMAIS une variante de l'une ou de l'autre (§ 3.3 du plan
 * d'itération 3c) : PREMIER rôle mixte, elle porte À LA FOIS un jeton
 * (`designation`, résolu par RANG comme chez `LigneDetenteur`) ET de la prose
 * (`lien`, rendue comme chez `LigneReplique`) — ni l'une ni l'autre sœur ne
 * pouvait l'exprimer seule sans qu'on lui ajoute un membre propre à CE
 * consommateur, ce que le veto de 3a/3b interdit nommément (REJETÉ, § 8
 * n° 46/47 : étendre `LigneDetenteur` d'un `lien?` ou `LigneReplique` d'un
 * `designation?` aurait détruit la propriété qui les rend réutilisables).
 *
 * Rendu : eyebrow `ENVERS` (`EYEBROW_ENVERS`) → désignation
 * (`designationDetenteurStyle`, jeton de `LigneDetenteur`) → bloc de lecture
 * du lien (`blocLectureRepliqueStyle`, jeton de `LigneReplique`,
 * `white-space: pre-wrap`) → actions IDENTIQUES aux deux sœurs : `IconButton`
 * `+`/`×` avant décision, `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée seule.
 * « Ouvrir la fiche » ouvre le PORTEUR (section `personnages`), jamais la
 * cible désignée par cette ligne — même contrat que les deux sœurs.
 *
 * ⚠ GLYPHE `×`, JAMAIS `✕` (§ 3.3, vérifié faux par l'orchestrateur) : les
 * trois composants de ligne livrés (`LigneDetenteur`, `LigneProposition`,
 * `LigneReplique`) utilisent `×` pour rejeter une proposition ; `✕` sert
 * ailleurs à fermer un conteneur, un geste différent.
 *
 * AUCUNE prop `accepterDesactive` (§ 3.5, § 8 n° 32) : `relations[]` ne porte
 * aucun plafond de document — la borne à trois contraint la PROPOSITION,
 * jamais le document. Le « + » reste donc un `IconButton` simple, jamais un
 * bouton natif composé localement comme chez `LigneReplique`.
 */
export const LigneRelation = forwardRef<LigneRelationHandle, LigneRelationProps>(function LigneRelation(
	{ designation, lien, decision, onAccepter, onRejeter, onOuvrirFiche }: LigneRelationProps,
	ref,
) {
	const accepterRef = useRef<HTMLButtonElement>(null)

	useImperativeHandle(ref, () => ({ focusAccepter: () => accepterRef.current?.focus() }), [])

	return (
		<div style={conteneurRepliqueStyle}>
			<span style={eyebrowStyle}>{EYEBROW_ENVERS}</span>
			<span style={designationDetenteurStyle}>{designation}</span>
			<div style={blocLectureRepliqueStyle}>{lien}</div>
			{decision === undefined ? (
				<div style={actionsDetenteurStyle}>
					<IconButton ref={accepterRef} label={LABEL_ACCEPTER} tone="accent" size={HIT_TARGET_MIN} onClick={onAccepter}>
						+
					</IconButton>
					<IconButton label={LABEL_REJETER} tone="danger" size={HIT_TARGET_MIN} onClick={onRejeter}>
						×
					</IconButton>
				</div>
			) : (
				<div style={actionsDetenteurStyle}>
					<Badge tone={decision === 'acceptee' ? 'accent' : 'muted'}>
						{decision === 'acceptee' ? BADGE_ACCEPTE : BADGE_REJETE}
					</Badge>
					{decision === 'acceptee' && (
						<button type="button" onClick={onOuvrirFiche} style={lienDetenteurStyle}>
							{LIEN_OUVRIR_FICHE}
						</button>
					)}
				</div>
			)}
		</div>
	)
})
