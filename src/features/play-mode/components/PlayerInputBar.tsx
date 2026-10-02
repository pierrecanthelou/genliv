import { type CSSProperties, type FormEvent, useState } from 'react'
import { Field } from '../../../brain'
import type { AvisInterprete, Dossier, EchecCopilote, EtatSession } from '../../../brain'
import type { IssueNarrateur } from '../hooks/useTourDeJeu'
import { OutcomeBlock } from './OutcomeBlock'

/**
 * LE CHAMP DE SAISIE LIBRE JOUEUR — it1 (`moteur-interprete`, lot 1), lot 2 it2
 * (orchestration R3, affichage récit/suggestions, correction fermeture périmée).
 *
 * ANATOMIE : `<form>` + `Field` (registre NON mono, à la différence de `ConsoleCommandes`)
 * + `<button type="submit">` au patron exact de celui-ci (mêmes tokens, couleur neutre
 * en `disabled`).
 *
 * PROPS DU HOOK `useTourDeJeu` :
 *  · `executeAction(saisie)` — orchestrateur, appelé sur soumission du formulaire,
 *    retourne `true` si un pas a été consommé (BUG-132 correction : on se vide si retour true).
 *  · `getGestelabel(id)` — mapping CommandeId → label, pour afficher les gestes
 *    possibles quand avis.type === 'non_reconnu'.
 *  · `avis` — état de réponse de R1, nul avant la 1ère soumission, puis AvisInterprete ou EchecCopilote.
 *  · `isLocked` — verrou de tour, true pendant la chaîne R1→exécution→R3.
 *  · `issueNarrateur` — état de R3, null avant réponse, puis IssueNarrateur (lot 2).
 *  · `session` — session courante (pour accéder à attente.question en clarification,
 *    et pour lire le récit du pas courant dans le journal).
 *  · `dossier` — pour projeter `EntreeJournal.interlocuteur` (un id, moteur) vers le
 *    `nom` (auteur) du PNJ qui parle, en entête du bloc — n°12 `moteur-acteurs`, it1.
 *    JAMAIS injecté à aucun rôle IA (KR-284) ; c'est un affichage pur, le joueur
 *    connaît déjà ce nom (il vient de le taper).
 *
 * ZÉRO IMPORT DE `ConsoleCommandes` ET RÉCIPROQUEMENT — garde mécanisée (`PlayerInputBar.test.tsx`).
 */

export interface PlayerInputBarProps {
	readonly executeAction: (saisie: string) => Promise<boolean>
	readonly getGestelabel: (id: string) => string
	readonly avis: AvisInterprete | EchecCopilote | null
	readonly isLocked: boolean
	readonly issueNarrateur: IssueNarrateur | null
	readonly session: EtatSession
	readonly dossier: Dossier
}

const LIBELLE_CHAMP = 'QUE FAITES-VOUS ?'
const PLACEHOLDER_CHAMP = 'Décrivez ce que vous tentez…'
const LIBELLE_BOUTON_REPOS = 'TENTER'
const LIBELLE_BOUTON_VERROU = '…'
const MAXLONGUEUR_SAISIE = 300

const ENTETE_PRECISION = 'PRÉCISEZ'
const ENTETE_NON_RECONNU = 'NON RECONNU'
const ENTETE_RECIT = 'RÉCIT'
const GABARIT_NON_RECONNU = (labels: readonly string[]): string =>
	`Action non reconnue. Actions possibles ici : ${labels.join(', ')}.`

const TEXTE_REFORMULER = 'Reformulez votre action.'
const TEXTE_REFUS_MOTEUR = "Cette action n'a pas pu s'exécuter."
const TEXTE_INDISPONIBLE = 'Le service est momentanément indisponible.'
const TEXTE_RECIT_INDISPONIBLE = "Le récit n'a pas pu être généré."

export function PlayerInputBar({
	executeAction,
	getGestelabel,
	avis,
	isLocked,
	issueNarrateur,
	session,
	dossier,
}: PlayerInputBarProps): JSX.Element {
	const [saisie, setSaisie] = useState('')

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setSaisie(e.target.value)
	}

	// Point d'entrée unique pour la soumission du champ — réutilisable par Chip.onSelect en it3
	// (correction BUG-132 : le champ se vide selon le retour de executeAction, jamais selon l'avis
	// du rendu précédent).
	async function soumettre(texte: string): Promise<void> {
		const pasConsomme = await executeAction(texte)
		if (pasConsomme) {
			setSaisie('')
		}
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault()
		await soumettre(saisie)
	}

	// Dériver le récit affiché depuis la session (jamais d'un état du hook)
	// — l'entrée du tour courant qui porte `origine` et `recit`.
	const entreeRecente = session.journal.find(
		(e) => e.tour === session.horloge.tour && e.origine !== undefined && e.recit !== undefined,
	)
	const recitDuTourCourant = entreeRecente?.recit ?? null

	// Entête du bloc : le nom du PNJ si ce pas est une réplique d'acteur
	// (origine === 'parler'), sinon RÉCIT (R3) — n°12 `moteur-acteurs` it1.
	// Projection pure depuis le dossier, jamais injectée à l'IA (KR-284).
	const enteteRecit =
		entreeRecente?.origine === 'parler' && entreeRecente.interlocuteur !== undefined
			? (dossier.monde.personnages.find((p) => p.id === entreeRecente.interlocuteur)?.nom ?? ENTETE_RECIT)
			: ENTETE_RECIT

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

			{/* OutcomeBlock pour NON RECONNU — avec gabarit dérivé des gestes possibles */}
			{avis !== null && 'type' in avis && avis.type === 'non_reconnu' && (
				<OutcomeBlock entete={ENTETE_NON_RECONNU}>
					{GABARIT_NON_RECONNU(avis.gestes_possibles.map(getGestelabel))}
				</OutcomeBlock>
			)}

			{/* OutcomeBlock pour RÉCIT (lot 2, R3 succès) OU pour une réplique de PNJ
			    (n°12 it1, origine 'parler') — affiché si une entrée du tour courant
			    porte un récit valide ; l'entête distingue les deux (nom du PNJ vs RÉCIT). */}
			{recitDuTourCourant && (
				<>
					<OutcomeBlock entete={enteteRecit}>{recitDuTourCourant}</OutcomeBlock>
					{/* Liste de suggestions (lot 2, R3 succès) — inline, non-interactive,
					    aucune bordure ni styling interactif. Rien si liste vide.
					    Affichées ssi tour === tour courant (évite affichage périmé au tour suivant). */}
					{issueNarrateur?.statut === 'raconte' &&
						issueNarrateur.tour === session.horloge.tour &&
						issueNarrateur.suggestions.length > 0 && (
							<ul style={suggestionsListStyle}>
								{issueNarrateur.suggestions.map((suggestion, idx) => (
									<li key={idx} style={suggestionItemStyle}>
										{suggestion}
									</li>
								))}
							</ul>
						)}
				</>
			)}

			{/* Bannière pour dégradation R3 (lot 2, R3 indisponible/trop-long/etc.)
			    — affiché ssi issueNarrateur.tour === session.horloge.tour et statut === 'degrade' */}
			{issueNarrateur?.statut === 'degrade' && issueNarrateur.tour === session.horloge.tour && (
				<p role="status" style={bannierInterface}>
					<span aria-hidden="true">⊘ </span>
					{TEXTE_RECIT_INDISPONIBLE}
				</p>
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

// Styles pour la liste de suggestions (lot 2, R3) — strictement non-interactive
// (contrat de design § 3)
const suggestionsListStyle: CSSProperties = {
	margin: 'var(--space-3) 0 0 0',
	padding: 0,
	listStyle: 'none',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-1)',
}

const suggestionItemStyle: CSSProperties = {
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-sm)',
	color: 'var(--text-strong)',
	// AUCUNE bordure, AUCUN border-radius, AUCUN background, AUCUN cursor,
	// AUCUN :hover — rien qui évoque un contrôle cliquable (contrat de design).
}
