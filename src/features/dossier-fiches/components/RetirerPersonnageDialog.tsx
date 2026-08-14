import { Modal } from '../../../brain'

export interface RetirerPersonnageDialogProps {
	/** La DÉSIGNATION du personnage, déjà résolue par le parent sur les deux
	 *  branches de `localiserEntite('pnj', personnage, index)` : « Aldûr le Sage »
	 *  entre guillemets, ou le repli « n°4 (sans nom) ». Cette modale ne lit
	 *  jamais le personnage lui-même. */
	nomAffiche: string
	onConfirm: () => void
	onCancel: () => void
}

/**
 * Le corps de la modale — UNE SEULE phrase, dont la désignation du personnage est
 * la seule partie variable. Rendue en un unique nœud de texte (jamais découpée
 * par un `<strong>`) : c'est ce qui permet de l'asserter telle quelle.
 */
function corpsDe(nomAffiche: string): string {
	return `Le personnage ${nomAffiche} sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`
}

/**
 * Confirmation du geste dangereux « retirer un personnage » (§ 8 désaccord 1 du
 * plan d'itération 7). Le précédent `FicheLieu` retire SANS modale, et c'est
 * cohérent là-bas : le seul cas dangereux d'un lieu est déjà bloqué par le
 * validateur. Ici, ce qui est en jeu n'est pas l'intégrité RÉFÉRENTIELLE mais la
 * perte du contenu PROPRE du personnage — sept blocs remplis contre trois champs
 * de prose pour un lieu.
 *
 * TEXTE FIXE, GÉNÉRIQUE, ET MUET SUR LES RÉFÉRENTS (veto tech-lead/narratif-ia,
 * § 8 désaccord 2 ; texte figé § 3) :
 *  · il n'énumère PAS quels blocs sont réellement remplis (§ 8 désaccord 10) —
 *    « tout contenu déjà renseigné » couvre le personnage à peine amorcé comme
 *    celui qui est écrit en entier ;
 *  · il n'énumère JAMAIS qui référence ce personnage, et ce composant ne reçoit
 *    donc ni le dossier ni la liste des personnages. Le refus appartient au SSOT
 *    et n'arrive qu'APRÈS la tentative, dans le bandeau de la fiche.
 *
 * Aucun style neuf : `Modal` de `brain/components/` porte Échap, le piège à
 * focus et la restauration du focus au démontage.
 */
export function RetirerPersonnageDialog({
	nomAffiche,
	onConfirm,
	onCancel,
}: RetirerPersonnageDialogProps): JSX.Element {
	return (
		<Modal
			title="Retirer le personnage"
			cancelLabel="Annuler"
			confirmLabel="Retirer"
			confirmTone="error"
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>{corpsDe(nomAffiche)}</p>
		</Modal>
	)
}
