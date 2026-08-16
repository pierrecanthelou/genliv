import { useEffect, useRef, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	Field,
	Stepper,
	IconButton,
	HIT_TARGET_MIN,
	CURSEURS,
	CURSEUR_VALUES,
	CURSEUR_MIN,
	CURSEUR_MAX,
	PARLER_REPLIQUES,
	type Personnage,
	type CurseurId,
} from '../../../brain'
import {
	boutonPointilleStyle,
	eyebrowStyle,
	legendeStyle,
	separateurStyle,
	listeLignesStyle,
	ligneStyle,
} from './styles'
import type { BrouillonCaractere } from '../hooks/useEcritureCaractere'

const TEXTE_REGLER_CURSEURS = '+ Régler le caractère…'
const LEGENDE_CURSEURS =
	"Curseurs de caractère — jamais lus par le narrateur ; l'affinité entre parenthèses colore la voix, elle ne modifie aucun jet."

const LEGENDE_PARLER = "Jusqu'à deux répliques type — donnent le ton, jamais citées mot pour mot par le modèle."
const LEGENDE_PARLER_PLAFOND = 'Deux répliques, pas plus — de quoi calibrer une voix sans la scripter davantage.'
const TEXTE_AJOUTER_REPLIQUE = '+ Ajouter une réplique…'
const HINT_REPLIQUE = "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur"
const PLACEHOLDER_REPLIQUE = '« Ne traînez pas dehors après la cloche — la garde ne pose pas de questions. »'

// Même hint sur les deux champs (§3 du plan, « hint identique »/« même hint ») — repris
// mot pour mot de `HINT_FONCTION` (`BlocIdentite.tsx`) : les deux prosent sont, comme
// elle, `ia`, jamais lues telles quelles par le joueur.
const HINT_LIGNES_ROUGES = 'interne — jamais lu par le joueur'
const PLACEHOLDER_JAMAIS = 'Il ne trahira jamais un secret confié sous serment, même sous la torture.'
const PLACEHOLDER_CEDE_SI = 'Face à une preuve que son fils est vivant, il cède immédiatement — le reste, jamais.'

export interface BlocCaractereProps {
	personnage: Personnage
	onReglerCurseurs: () => void
	onChangeCurseur: (curseur: CurseurId, valeur: number) => void
	parler: string[]
	onAjouterReplique: () => void
	onChangeReplique: (index: number, valeur: string) => void
	onBlurReplique: (index: number, valeur: string) => void
	onRetirerReplique: (index: number) => void
	brouillon: BrouillonCaractere
	onChangeJamais: (valeur: string) => void
	onBlurJamais: (valeur: string) => void
	onChangeCedeSi: (valeur: string) => void
	onBlurCedeSi: (valeur: string) => void
}

/**
 * Le bloc 8 et DERNIER de l'accordéon (« Caractère exploitable », it8) — trois
 * sous-sections fixes séparées par `separateurStyle` (§3 du plan d'itération 8) :
 * A. « CURSEURS DE CARACTÈRE », gating optionnel-en-bloc/TOTAL-quand-présent
 * (précédent exact `BlocCaracteristiques.tsx`) ; B. « MANIÈRE DE PARLER »,
 * toujours visible, lignes répétées plafonnées à `PARLER_REPLIQUES` (précédent
 * `BlocPlanActions`/étapes, mais des CHAÎNES, pas des objets) ; C. « LIGNES
 * ROUGES », toujours visible, deux `Field` brouillon-par-champ (précédent
 * `BlocIdentite`).
 *
 * FOCUS après « + Régler le caractère… » : même idiome que `BlocCaracteristiques`
 * (`useRef` booléen + `useEffect`, section remontée par `key={personnage.id}` dans
 * `FichePersonnage.tsx`, donc pas besoin de porter l'identité du personnage).
 * FOCUS après « + Ajouter une réplique… » : même idiome que
 * `BlocPlanActions`/étapes, sur l'`<input>` du `Field` non multiline qui vient
 * d'apparaître.
 *
 * CLAVIER (§3 du plan) — au sein d'une ligne de réplique, l'ordre de tabulation
 * est le CHAMP puis SON retrait : l'eyebrow « RÉPLIQUE {n} » (non focalisable)
 * reste en tête pour la lecture, mais l'`IconButton` de retrait est placé APRÈS
 * le `Field` dans le DOM plutôt que dans un `enTeteLigneStyle` en tête de ligne
 * (précédent des blocs 4/5/6) — ce dernier motif aurait placé le retrait AVANT
 * le champ dans l'ordre de tabulation, contraire à la clause.
 */
export function BlocCaractere({
	personnage,
	onReglerCurseurs,
	onChangeCurseur,
	parler,
	onAjouterReplique,
	onChangeReplique,
	onBlurReplique,
	onRetirerReplique,
	brouillon,
	onChangeJamais,
	onBlurJamais,
	onChangeCedeSi,
	onBlurCedeSi,
}: BlocCaractereProps): JSX.Element {
	const curseurs = personnage.caractere?.curseurs

	const grilleRef = useRef<HTMLDivElement>(null)
	const focusApresReglageRef = useRef(false)

	useEffect(() => {
		if (focusApresReglageRef.current) {
			focusApresReglageRef.current = false
			grilleRef.current?.querySelector('button')?.focus()
		}
	}, [curseurs])

	function handleClicRegler(): void {
		focusApresReglageRef.current = true
		onReglerCurseurs()
	}

	const repliqueEnAjout = parler.length > (personnage.caractere?.parler ?? []).length
	const focusRepliqueRef = useRef(false)
	const nouvelleRepliqueRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (focusRepliqueRef.current && repliqueEnAjout) {
			focusRepliqueRef.current = false
			nouvelleRepliqueRef.current?.querySelector('input')?.focus()
		}
	}, [repliqueEnAjout])

	function handleClicAjouterReplique(): void {
		focusRepliqueRef.current = true
		onAjouterReplique()
	}

	return (
		<>
			<div>
				<span style={eyebrowStyle}>CURSEURS DE CARACTÈRE</span>
				{curseurs === undefined ? (
					<button type="button" onClick={handleClicRegler} style={boutonPointilleStyle}>
						{TEXTE_REGLER_CURSEURS}
					</button>
				) : (
					<>
						<p style={legendeStyle}>{LEGENDE_CURSEURS}</p>
						<div style={grilleStyle} ref={grilleRef}>
							{CURSEUR_VALUES.map((curseur) => (
								<Stepper
									key={curseur}
									label={`${CURSEURS[curseur].label.toUpperCase()} (${CURSEURS[curseur].affinite})`}
									value={curseurs[curseur]}
									min={CURSEUR_MIN}
									max={CURSEUR_MAX}
									onChange={(valeur) => onChangeCurseur(curseur, valeur)}
								/>
							))}
						</div>
					</>
				)}
			</div>

			<div style={separateurStyle}>
				<span style={eyebrowStyle}>MANIÈRE DE PARLER</span>
				<p style={legendeStyle}>{LEGENDE_PARLER}</p>
				<div style={listeLignesStyle}>
					{parler.map((replique, index) => (
						<div
							key={index}
							style={ligneStyle}
							ref={index === parler.length - 1 && repliqueEnAjout ? nouvelleRepliqueRef : undefined}
						>
							<span style={eyebrowStyle}>{`RÉPLIQUE ${index + 1}`}</span>
							<Field
								label="RÉPLIQUE"
								hint={HINT_REPLIQUE}
								placeholder={PLACEHOLDER_REPLIQUE}
								value={replique}
								onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onChangeReplique(index, e.target.value)
								}
								onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onBlurReplique(index, e.target.value)
								}
							/>
							<div style={piedLigneStyle}>
								<IconButton
									label={`Retirer la réplique n°${index + 1}`}
									tone="danger"
									size={HIT_TARGET_MIN}
									onClick={() => onRetirerReplique(index)}
								>
									✕
								</IconButton>
							</div>
						</div>
					))}
				</div>
				{parler.length < PARLER_REPLIQUES ? (
					<button type="button" onClick={handleClicAjouterReplique} style={boutonPointilleStyle}>
						{TEXTE_AJOUTER_REPLIQUE}
					</button>
				) : (
					<p style={legendeStyle}>{LEGENDE_PARLER_PLAFOND}</p>
				)}
			</div>

			<div style={separateurStyle}>
				<span style={eyebrowStyle}>LIGNES ROUGES</span>
				<div style={sousSectionStyle}>
					<Field
						label="CE QU'IL NE FERA JAMAIS"
						hint={HINT_LIGNES_ROUGES}
						multiline
						rows={2}
						placeholder={PLACEHOLDER_JAMAIS}
						value={brouillon.jamais}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeJamais(e.target.value)}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurJamais(e.target.value)}
					/>
					<Field
						label="CE QUI LE FAIT CÉDER"
						hint={HINT_LIGNES_ROUGES}
						multiline
						rows={2}
						placeholder={PLACEHOLDER_CEDE_SI}
						value={brouillon.cede_si}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeCedeSi(e.target.value)}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurCedeSi(e.target.value)}
					/>
				</div>
			</div>
		</>
	)
}

const grilleStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: 'var(--space-8)',
}

const sousSectionStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
	marginTop: 'var(--space-2)',
}

const piedLigneStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'flex-end',
}
