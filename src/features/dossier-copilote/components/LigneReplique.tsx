import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Badge, HIT_TARGET_MIN, IconButton } from '../../../brain'
import { BADGE_ACCEPTE, BADGE_REJETE, LABEL_ACCEPTER, LABEL_REJETER, LIEN_OUVRIR_FICHE } from '../textes'
import {
	accepterRepliqueDesactiveStyle,
	actionsDetenteurStyle,
	blocLectureRepliqueStyle,
	conteneurRepliqueStyle,
	lienDetenteurStyle,
} from './styles'

export interface LigneRepliqueProps {
	/** Le texte candidat, rendu TEL QUEL — aucun `Field`, aucun `chemin`, aucune
	 *  dépendance à `LIBELLE_DES_CHAMPS` (mur des 4 entrées, veto, 3ᵉ occurrence). */
	texte: string
	decision?: 'acceptee' | 'rejetee'
	/** Plafond atteint compte tenu des répliques GELÉES + des acceptations DE CETTE
	 *  SESSION — jamais lu du dossier vivant (§ 3.5). La ligne reste REJETABLE. */
	accepterDesactive?: boolean
	titreAccepterDesactive?: string
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

/** Une INTENTION exposée au parent (§ 3.5), même précédent que
 *  `LigneDetenteurHandle` : « mets le focus sur le bouton Accepter de CETTE
 *  ligne » — jamais le `ref` du bouton lui-même.
 *
 *  `focusRejeter` existe pour UNE raison, et elle est structurelle : au plafond,
 *  le « + » de cette ligne est `disabled` et « Lancer » l'est aussi DANS LE MÊME
 *  RENDU (son `plafondAtteint` dérive du dossier vif, réveillé par l'écriture qui
 *  vient d'avoir lieu). Le « × », lui, n'est JAMAIS désactivé : c'est la seule
 *  cible de focus qui SURVIT à ce rendu. Poser le focus sur un bouton `disabled`
 *  n'a aucun effet en navigateur et ne passe qu'en jsdom — c'est le mode de panne
 *  que la mitigation de BUG-106 a nommément interdit. */
export interface LigneRepliqueHandle {
	focusAccepter: () => void
	focusRejeter: () => void
}

/**
 * La ligne d'une réplique proposée — SŒUR de `LigneDetenteur`, JAMAIS une
 * variante de `LigneProposition` (§ 3.3 du plan d'itération 3a) : ce
 * composant ne porte NI `Field` NI `chemin` NI dépendance à
 * `LIBELLE_DES_CHAMPS` — le texte candidat est de la prose libre, jamais un
 * champ nommé du document. Corollaire du veto TL3a-3, 3ᵉ occurrence : ce
 * composant ne porte pas non plus `label="RÉPLIQUE"` — l'eyebrow
 * `eyebrowRepliqueProposee(n)` est rendu par la CARTE, jamais ici, pour
 * rester invisible à `libelles.test.ts` (qui balaie `label="…"`, pas du texte
 * rendu).
 *
 * Bloc de lecture : un `<div>` aux jetons du § 3.1, `white-space: pre-wrap` —
 * jamais un `Field`. Actions identiques à `LigneDetenteur` : `IconButton`
 * `+`/`×` avant décision ; `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée seule.
 *
 * Le « + » DÉSACTIVÉ AU PLAFOND est un bouton natif composé LOCALEMENT :
 * `IconButton` n'a pas de prop `disabled` (précédent `dossier-objets`) et ce
 * composant n'est pas le lot qui la lui ajoute (KR-109 — une primitive
 * partagée ne se modifie pas pour un seul appelant). Le « × » reste TOUJOURS
 * la primitive active : la ligne reste rejetable même au plafond.
 */
export const LigneReplique = forwardRef<LigneRepliqueHandle, LigneRepliqueProps>(function LigneReplique(
	{
		texte,
		decision,
		accepterDesactive,
		titreAccepterDesactive,
		onAccepter,
		onRejeter,
		onOuvrirFiche,
	}: LigneRepliqueProps,
	ref,
) {
	const accepterRef = useRef<HTMLButtonElement>(null)
	const rejeterRef = useRef<HTMLButtonElement>(null)

	useImperativeHandle(
		ref,
		() => ({
			focusAccepter: () => accepterRef.current?.focus(),
			focusRejeter: () => rejeterRef.current?.focus(),
		}),
		[],
	)

	return (
		<div style={conteneurRepliqueStyle}>
			<div style={blocLectureRepliqueStyle}>{texte}</div>
			{decision === undefined ? (
				<div style={actionsDetenteurStyle}>
					{accepterDesactive === true ? (
						<button
							type="button"
							disabled
							title={titreAccepterDesactive}
							aria-label={LABEL_ACCEPTER}
							style={accepterRepliqueDesactiveStyle}
						>
							+
						</button>
					) : (
						<IconButton
							ref={accepterRef}
							label={LABEL_ACCEPTER}
							tone="accent"
							size={HIT_TARGET_MIN}
							onClick={onAccepter}
						>
							+
						</IconButton>
					)}
					<IconButton ref={rejeterRef} label={LABEL_REJETER} tone="danger" size={HIT_TARGET_MIN} onClick={onRejeter}>
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
