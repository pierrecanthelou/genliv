import type { CSSProperties } from 'react'
import { Badge, Field, IconButton, HIT_TARGET_MIN, LIBELLE_DES_CHAMPS, type CheminLibelle } from '../../../brain'
import { BADGE_ACCEPTE, BADGE_REJETE, LABEL_ACCEPTER, LABEL_REJETER, LEGENDE_AVANT, LIEN_OUVRIR_FICHE } from '../textes'

export interface LignePropositionProps {
	chemin: CheminLibelle
	/**
	 * Dérivée PAR L'APPELANT (§ 3.7 du plan) : `remplacement` ssi la valeur
	 * actuelle du champ cible est non vide ET ne contient pas le marqueur
	 * d'amorce. Ce composant ne recalcule RIEN — `MARQUEUR_A_ECRIRE` n'est pas
	 * exporté vers les features et ne doit pas l'être (KR-223) : une feature ne
	 * peut pas écrire ce glyphe, donc elle ne peut pas non plus le chercher.
	 */
	variante: 'remplissage' | 'remplacement'
	/** GELÉE PAR L'APPELANT au lancement de la demande, jamais relue au rendu :
	 *  c'est la valeur que la proposition remplace, et elle doit rester lisible
	 *  APRÈS l'acceptation — un « AVANT » dérivé du dossier vivant porterait le
	 *  texte tout juste écrit et rendrait le diff trivialement vrai. */
	valeurAvant?: string
	valeurApres: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

/**
 * La ligne de diff du copilote — composant LOCAL à la feature (§ 3.7 du plan,
 * jamais promu à `brain/components/` : un seul consommateur, `PanneauCopilote.tsx`).
 *
 * REMPLISSAGE (cible vide ou marquée) : un seul `Field`, lecture seule à l'it1
 * (`onChange={() => {}}`, édition différée — `open_question`). REMPLACEMENT
 * (cible déjà rédigée) : le MÊME `Field`, précédé d'un bloc AVANT statique —
 * jetons délibérément différents du `Field` (§ 8, désaccord n° 44) : ce n'est
 * pas un doublon, c'est un autre objet visuel, « ceci n'est pas actif ».
 *
 * Après décision : la paire d'`IconButton` cède la place à un `Badge` — accent
 * pour Accepté, muted pour Rejeté (jamais good/bad, réservés à réussite/échec
 * de jet). Le lien « → Ouvrir la fiche » n'apparaît que sur la ligne acceptée,
 * et n'appelle jamais que `onOuvrirFiche` — c'est `PanneauCopilote.tsx` qui
 * connaît `onSelectSection('personnages')`, ce composant ne connaît aucune
 * nav.
 *
 * ÉCART ASSUMÉ AU § 3.7 : le plan disait « après décision : LIGNE COMPACTE +
 * Badge ». C'est le `Field` COMPLET qui est gardé, AVANT compris, et c'est un
 * choix, pas un oubli. Motif : l'acceptation est le seul geste irréversible de
 * cet écran, et la ligne compacte effacerait le diff à l'instant précis où il
 * devient la seule trace de ce qui a été remplacé — le texte de l'auteur
 * disparaîtrait de l'écran au moment où il disparaît du dossier. C'est le même
 * « état non dessiné » qui a fait retirer la coupe de REMPLACEMENT (§ 8 n° 16).
 * Ce qui se compacte est donc la BARRE D'ACTIONS seule (deux `IconButton` → un
 * `Badge`), jamais le diff. Corollaire : le bloc AVANT n'est délibérément PAS
 * conditionné à `decision` — il est lisible avant comme après, parce que
 * `valeurAvant` est GELÉE au lancement par l'appelant et ne suit pas le dossier.
 */
export function LigneProposition({
	chemin,
	variante,
	valeurAvant,
	valeurApres,
	decision,
	onAccepter,
	onRejeter,
	onOuvrirFiche,
}: LignePropositionProps): JSX.Element {
	const { libelle, hint } = LIBELLE_DES_CHAMPS[chemin]

	return (
		<div style={conteneurStyle}>
			{variante === 'remplacement' && valeurAvant !== undefined && (
				<div>
					<span style={legendeAvantStyle}>{LEGENDE_AVANT}</span>
					<div style={blocAvantStyle}>{valeurAvant}</div>
				</div>
			)}
			<Field
				label={libelle}
				hint={hint}
				value={valeurApres}
				multiline
				rows={3}
				// it1 : lecture seule, édition différée (open_question)
				onChange={() => {}}
			/>
			{decision === undefined ? (
				<div style={actionsStyle}>
					<IconButton label={LABEL_ACCEPTER} tone="accent" size={HIT_TARGET_MIN} onClick={onAccepter}>
						+
					</IconButton>
					<IconButton label={LABEL_REJETER} tone="danger" size={HIT_TARGET_MIN} onClick={onRejeter}>
						×
					</IconButton>
				</div>
			) : (
				<div style={actionsStyle}>
					<Badge tone={decision === 'acceptee' ? 'accent' : 'muted'}>
						{decision === 'acceptee' ? BADGE_ACCEPTE : BADGE_REJETE}
					</Badge>
					{decision === 'acceptee' && (
						<button type="button" onClick={onOuvrirFiche} style={lienStyle}>
							{LIEN_OUVRIR_FICHE}
						</button>
					)}
				</div>
			)}
		</div>
	)
}

const conteneurStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const legendeAvantStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-muted)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const blocAvantStyle: CSSProperties = {
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-inset)',
	padding: '7px 10px',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	whiteSpace: 'pre-wrap',
}

const actionsStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	gap: 'var(--space-3)',
}

// Navigation SECONDAIRE (§ 3.7) : `--text-body`, jamais accent.
const lienStyle: CSSProperties = {
	alignSelf: 'flex-end',
	border: 'none',
	background: 'none',
	padding: 0,
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	cursor: 'pointer',
}
