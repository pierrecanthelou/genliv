import { Modal } from '../../../brain'

export interface RetirerObjetDialogProps {
	/** La DÉSIGNATION de l'objet, déjà résolue par le parent — les deux mêmes
	 *  branches que `localiserEntite('objet', objet, index)` (dont `designationDe`,
	 *  `FicheObjet.tsx`, en est la moitié droite) : « Le grimoire scellé d'Aldûr »
	 *  entre guillemets, ou le repli « n°3 (sans nom) ». Cette modale ne lit
	 *  jamais l'objet lui-même. */
	nomAffiche: string
	onConfirm: () => void
	onCancel: () => void
}

/**
 * Le corps de la modale — UNE SEULE phrase, dont la désignation de l'objet est
 * la seule partie variable. Rendue en un unique nœud de texte (jamais découpée
 * par un `<strong>`) : c'est ce qui permet de l'asserter telle quelle. Reste
 * vrai à 0 % comme à 100 % de remplissage (§ 8 désaccord 6 du plan d'itération
 * 2) — « tout contenu déjà renseigné » couvre l'objet jamais édité comme celui
 * qui est entièrement écrit, sans jamais affirmer que les deux champs le sont.
 */
function corpsDe(nomAffiche: string): string {
	return `L'objet ${nomAffiche} sera retiré du registre, avec tout contenu déjà renseigné parmi le nom et la description. Cette action est irréversible.`
}

/**
 * Confirmation du geste dangereux « retirer un objet » — précédent EXACT
 * `RetirerPersonnageDialog.tsx` (dossier-fiches it7, § 8 désaccord 2 du plan
 * d'itération 2 de cette feature). `CLAUDE.md` § Dangerous Actions exige un
 * dialogue pour toute action destructive/irréversible.
 *
 * TEXTE FIXE, GÉNÉRIQUE, ET MUET SUR LES RÉFÉRENTS (§ 8 désaccord 2) :
 *  · il n'énumère PAS quels champs sont réellement remplis ;
 *  · il n'énumère JAMAIS ce qui référence cet objet ailleurs dans le dossier,
 *    et ce composant ne reçoit donc ni le dossier ni aucun de ses registres. Le
 *    refus appartient au SSOT et n'arrive qu'APRÈS la tentative, dans le
 *    bandeau de la fiche.
 *
 * Aucun style neuf : `Modal` de `brain/components/` porte Échap, le piège à
 * focus et la restauration du focus au démontage.
 */
export function RetirerObjetDialog({ nomAffiche, onConfirm, onCancel }: RetirerObjetDialogProps): JSX.Element {
	return (
		<Modal
			title="Retirer l'objet"
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
