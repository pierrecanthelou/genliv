import { type CSSProperties, type FormEvent, useState } from 'react'
import { Field } from '../../../brain'
import type { AvisInterprete, EchecCopilote, EtatSession } from '../../../brain'
import { OutcomeBlock } from './OutcomeBlock'

/**
 * LE CHAMP DE SAISIE LIBRE JOUEUR — nouvelle tranche it1 (`moteur-interprete`, lot 2).
 *
 * ANATOMIE : `<form>` + `Field` (registre NON mono, à la différence de `ConsoleCommandes`)
 * + `<button type="submit">` au patron exact de celui-ci (mêmes tokens, couleur neutre
 * en `disabled`).
 *
 * PROPS DU HOOK `useTourDeJeu` :
 *  · `executeAction(saisie)` — orchestrateur, appelé sur soumission du formulaire.
 *    Gère l'appel au copilote, le verrou de tour, et la persistence.
 *  · `getGestelabel(id)` — mapping CommandeId → label, pour afficher les gestes
 *    possibles quand avis.type === 'non_reconnu'.
 *  · `avis` — état de réponse, nul avant la 1ère soumission, puis AvisInterprete ou EchecCopilote.
 *  · `isLocked` — verrou de tour, true pendant l'appel réseau.
 *  · `session` — session courante (pour accéder à attente.question en clarification).
 *
 * ZÉRO IMPORT DE `ConsoleCommandes` ET RÉCIPROQUEMENT — garde mécanisée (`PlayerInputBar.test.tsx`).
 */

export interface PlayerInputBarProps {
	readonly executeAction: (saisie: string) => Promise<void>
	readonly getGestelabel: (id: string) => string
	readonly avis: AvisInterprete | EchecCopilote | null
	readonly isLocked: boolean
	readonly session: EtatSession
}

const LIBELLE_CHAMP = 'QUE FAITES-VOUS ?'
const PLACEHOLDER_CHAMP = 'Décrivez ce que vous tentez…'
const LIBELLE_BOUTON_REPOS = 'TENTER'
const LIBELLE_BOUTON_VERROU = '…'
const MAXLONGUEUR_SAISIE = 300

const ENTETE_PRECISION = 'PRÉCISEZ'
const ENTETE_NON_RECONNU = 'NON RECONNU'
const GABARIT_NON_RECONNU = (labels: readonly string[]): string =>
	`Action non reconnue. Actions possibles ici : ${labels.join(', ')}.`
const TEXTE_IMPASSE = 'Aucune action ne semble possible ici.'

const TEXTE_REFORMULER = 'Reformulez votre action.'
const TEXTE_REFUS_MOTEUR = "Cette action n'a pas pu s'exécuter."
const TEXTE_INDISPONIBLE = 'Le service est momentanément indisponible.'

export function PlayerInputBar({
	executeAction,
	getGestelabel,
	avis,
	isLocked,
	session,
}: PlayerInputBarProps): JSX.Element {
	const [saisie, setSaisie] = useState('')

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setSaisie(e.target.value)
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault()
		await executeAction(saisie)
		// Note : le vidage du champ arrive via le remontage sur clé (comme ConsoleCommandes),
		// ou doit être géré par le hook. Pour it1, on laisse le state du composant tel quel
		// et on le vide manuellement quand avis.type === 'aucun'.
		if (avis !== null && 'type' in avis && avis.type === 'aucun') {
			setSaisie('')
		}
	}

	return (
		<>
			{/* LA ZONE DE SAISIE — le formulaire. */}
			<form onSubmit={handleSubmit}>
				<Field
					id="player-input-action"
					label={LIBELLE_CHAMP}
					placeholder={PLACEHOLDER_CHAMP}
					value={saisie}
					onChange={handleChange}
					disabled={isLocked}
					maxLength={MAXLONGUEUR_SAISIE}
					autoFocus
				/>
				<button type="submit" disabled={isLocked} style={isLocked ? boutonVerrou : boutonTenter}>
					{isLocked ? LIBELLE_BOUTON_VERROU : LIBELLE_BOUTON_REPOS}
				</button>
			</form>

			{/* LES BLOCS DE RÉPONSE AFFICHÉS SELON L'AVIS — jamais deux à la fois. */}

			{/* OutcomeBlock pour PRÉCISEZ (clarification) — toujours avec la question de la session */}
			{avis !== null && 'type' in avis && avis.type === 'clarification' && session.attente !== undefined && (
				<OutcomeBlock entete={ENTETE_PRECISION}>{session.attente.question}</OutcomeBlock>
			)}

			{/* OutcomeBlock pour NON RECONNU — avec gabarit dérivé ou impasse */}
			{avis !== null && 'type' in avis && avis.type === 'non_reconnu' && (
				<OutcomeBlock entete={ENTETE_NON_RECONNU}>
					{avis.gestes_possibles && avis.gestes_possibles.length > 0
						? GABARIT_NON_RECONNU(avis.gestes_possibles.map(getGestelabel))
						: TEXTE_IMPASSE}
				</OutcomeBlock>
			)}

			{/* Bannière pour REFORMULER — pas OutcomeBlock */}
			{avis !== null && 'type' in avis && avis.type === 'reformuler' && (
				<p role="status" style={bannierInterface}>
					<span aria-hidden="true">⊘ </span>
					{TEXTE_REFORMULER}
				</p>
			)}

			{/* Bannière pour REFUS MOTEUR — pas OutcomeBlock */}
			{avis !== null && 'type' in avis && avis.type === 'refus_moteur' && (
				<p role="status" style={bannierInterface}>
					<span aria-hidden="true">⊘ </span>
					{TEXTE_REFUS_MOTEUR}
				</p>
			)}

			{/* Bannière pour EchecCopilote — quand avis.statut !== 'propose' */}
			{avis !== null && 'statut' in avis && (
				<p role="status" style={bannierInterface}>
					<span aria-hidden="true">⊘ </span>
					{TEXTE_INDISPONIBLE}
				</p>
			)}
		</>
	)
}

// Styles — patron répliqué de ConsoleCommandes
const boutonTenter: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--accent)',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	marginTop: 'var(--space-2)',
}

const boutonVerrou: CSSProperties = {
	...boutonTenter,
	cursor: 'not-allowed',
	opacity: 0.5,
}

const bannierInterface: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
