import { useEffect, useRef, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import { Field, Stepper, IconButton, HIT_TARGET_MIN, DUREE_MIN, type Personnage } from '../../../brain'
import { boutonPointilleStyle, eyebrowStyle, legendeStyle, separateurStyle } from './styles'
import type {
	BrouillonBut,
	ChampBut,
	BrouillonEtape,
	ChampEtapeTexte,
	BrouillonContreMesure,
	ChampContreMesureTexte,
} from '../hooks/useEcriturePersonnages'

const LEGENDE_PLAN_ACTIONS =
	"Suite d'étapes vers l'objectif — chacune avec son intention, son déclencheur et une porte de sortie si le joueur bloque le personnage."
const LEGENDE_CONTRE_MESURES = 'Réservé aux antagonistes — actions armées en réaction à ce que le joueur déclenche.'

const HINT_BUT_LIBELLE = "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur"
const HINT_BUT_POURQUOI = "interne — motivation, si elle mérite d'être dite"
const HINT_BUT_ECHEANCE = "interne — note d'auteur, jamais lue par le modèle"
const PLACEHOLDER_BUT_LIBELLE = 'Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne.'
const PLACEHOLDER_BUT_POURQUOI = "Il porte la faute d'avoir laissé le sceau se briser, cinquante ans plus tôt."
const PLACEHOLDER_BUT_ECHEANCE = 'Avant la pleine lune prochaine.'

const HINT_ETAPE_ACTION = 'interne — jamais lu par le joueur — ce que le personnage joue à cette étape'
const HINT_ETAPE_DECLENCHEUR = 'interne — ce qui fait passer le personnage à cette étape'
const HINT_ETAPE_DUREE =
	"interne — nombre de pas d'horloge de session avant l'échéance de l'étape ; le mot est nommé par la feature n°9"
const HINT_ETAPE_SI_BLOQUE =
	"interne — ce que joue le personnage si le moteur constate l'étape bloquée (durée écoulée sans déclencheur suivant)"
const PLACEHOLDER_ETAPE_ACTION = 'Retourne au sanctuaire à la nuit tombée pour consulter les archives.'
const PLACEHOLDER_ETAPE_DECLENCHEUR = 'Le joueur mentionne le sceau brisé devant lui.'
const PLACEHOLDER_ETAPE_SI_BLOQUE =
	"Il change d'approche : au lieu du sanctuaire, il tente sa chance auprès du forgeron."

const HINT_CONTRE_MESURE_ACTION = 'interne — jamais lu par le joueur'
const HINT_CONTRE_MESURE_DECLENCHEUR = 'interne — la condition qui arme cette contre-mesure'

const TEXTE_AJOUTER_ETAPE = '+ Ajouter une étape…'
const TEXTE_AJOUTER_CONTRE_MESURE = '+ Ajouter une contre-mesure…'
const TEXTE_POSER_DUREE = '+ Poser une durée…'

export interface BlocPlanActionsProps {
	personnage: Personnage
	butBrouillon: BrouillonBut
	onChangeBut: (champ: ChampBut, valeur: string) => void
	onBlurBut: (champ: ChampBut, valeur: string) => void
	etapes: BrouillonEtape[]
	onChangeEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onBlurEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onChangeDureeEtape: (index: number, valeur: number) => void
	onAjouterEtape: () => void
	onRetirerEtape: (index: number) => void
	contreMesures: BrouillonContreMesure[]
	onChangeContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onBlurContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onAjouterContreMesure: () => void
	onRetirerContreMesure: (index: number) => void
}

/**
 * Le bloc 4 de l'accordéon (« Objectif & plan d'actions », it4) — trois
 * sous-sections : A. « OBJECTIF PERSONNEL » (`but`, brouillon par champ,
 * commit au blur — `libelle` requis dans son bloc, jamais écrit vide) ; B.
 * « PLAN D'ACTIONS » (`plan_actions[]`, lignes `<div>` bordées — jamais
 * `ListRow`, sa racine `<button>` ne peut pas porter de champs interactifs) ;
 * C. « CONTRE-MESURES », section INTERNE gated `camp === 'antagoniste'` —
 * ABSENCE TOTALE du DOM sinon (KR-196), lecture dérivée depuis `personnage`,
 * jamais un `useEffect`.
 *
 * Ajout d'étape/de contre-mesure : ligne locale (brouillon), `action` vide
 * n'entre jamais au document, commit au premier blur non vide — voir
 * `useEcriturePersonnages`. `etapes`/`contreMesures` portent déjà, en dernière
 * position, la rangée encore locale s'il y en a une : `etapeEnAjout`/
 * `contreMesureEnAjout` la détectent en comparant la longueur reçue à celle du
 * document.
 *
 * `duree` (moteur) : AUCUN repli de LECTURE — `?? DUREE_MIN` fabriquerait une
 * valeur que l'auteur n'a jamais posée (même doctrine que le repli STATS_INITIALES,
 * réservé à l'écriture). `duree === undefined` rend l'affordance pointillée
 * « + Poser une durée… », qui committe `DUREE_MIN` ; le `Stepper` ne monte
 * qu'une fois la valeur posée (précédent : `BlocCaracteristiques`, bloc entier
 * plutôt qu'un seul champ, même principe).
 *
 * FOCUS après un clic « + Ajouter… » : ce composant est rendu comme le
 * `content` d'une section de l'`Accordion` parent, lui-même remonté par
 * `key={personnage.id}` — il est donc monté à neuf à chaque changement de
 * personnage, et les deux refs booléens de focus n'ont pas besoin de porter
 * l'identité du personnage (même raisonnement que `BlocCaracteristiques`).
 */
export function BlocPlanActions({
	personnage,
	butBrouillon,
	onChangeBut,
	onBlurBut,
	etapes,
	onChangeEtape,
	onBlurEtape,
	onChangeDureeEtape,
	onAjouterEtape,
	onRetirerEtape,
	contreMesures,
	onChangeContreMesure,
	onBlurContreMesure,
	onAjouterContreMesure,
	onRetirerContreMesure,
}: BlocPlanActionsProps): JSX.Element {
	const focusEtapeRef = useRef(false)
	const nouvelleEtapeRef = useRef<HTMLDivElement>(null)
	const focusContreMesureRef = useRef(false)
	const nouvelleContreMesureRef = useRef<HTMLDivElement>(null)

	const etapeEnAjout = etapes.length > personnage.plan_actions.length
	const contreMesuresPersistees = personnage.contre_mesures ?? []
	const contreMesureEnAjout = contreMesures.length > contreMesuresPersistees.length

	useEffect(() => {
		if (focusEtapeRef.current && etapeEnAjout) {
			focusEtapeRef.current = false
			nouvelleEtapeRef.current?.querySelector('textarea')?.focus()
		}
	}, [etapeEnAjout])

	useEffect(() => {
		if (focusContreMesureRef.current && contreMesureEnAjout) {
			focusContreMesureRef.current = false
			nouvelleContreMesureRef.current?.querySelector('textarea')?.focus()
		}
	}, [contreMesureEnAjout])

	function handleClicAjouterEtape(): void {
		focusEtapeRef.current = true
		onAjouterEtape()
	}

	function handleClicAjouterContreMesure(): void {
		focusContreMesureRef.current = true
		onAjouterContreMesure()
	}

	return (
		<>
			<div>
				<span style={eyebrowStyle}>OBJECTIF PERSONNEL</span>
				<div style={sousSectionStyle}>
					<Field
						label="CE QU'IL VEUT"
						hint={HINT_BUT_LIBELLE}
						multiline
						rows={2}
						placeholder={PLACEHOLDER_BUT_LIBELLE}
						value={butBrouillon.libelle}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeBut('libelle', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurBut('libelle', e.target.value)}
					/>
					<Field
						label="POURQUOI"
						hint={HINT_BUT_POURQUOI}
						multiline
						rows={2}
						placeholder={PLACEHOLDER_BUT_POURQUOI}
						value={butBrouillon.pourquoi}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeBut('pourquoi', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurBut('pourquoi', e.target.value)}
					/>
					<Field
						label="ÉCHÉANCE"
						hint={HINT_BUT_ECHEANCE}
						placeholder={PLACEHOLDER_BUT_ECHEANCE}
						value={butBrouillon.echeance}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeBut('echeance', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurBut('echeance', e.target.value)}
					/>
				</div>
			</div>

			<div>
				<span style={eyebrowStyle}>{"PLAN D'ACTIONS"}</span>
				<p style={legendeStyle}>{LEGENDE_PLAN_ACTIONS}</p>
				<div style={listeLignesStyle}>
					{etapes.map((etape, index) => (
						<div
							key={index}
							style={ligneStyle}
							ref={index === etapes.length - 1 && etapeEnAjout ? nouvelleEtapeRef : undefined}
						>
							<div style={enTeteLigneStyle}>
								<span style={eyebrowStyle}>{`ÉTAPE ${index + 1}`}</span>
								<IconButton
									label={`Retirer l'étape n°${index + 1}`}
									tone="danger"
									size={HIT_TARGET_MIN}
									onClick={() => onRetirerEtape(index)}
								>
									✕
								</IconButton>
							</div>
							<Field
								label="INTENTION"
								hint={HINT_ETAPE_ACTION}
								multiline
								rows={2}
								placeholder={PLACEHOLDER_ETAPE_ACTION}
								value={etape.action}
								onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onChangeEtape(index, 'action', e.target.value)
								}
								onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onBlurEtape(index, 'action', e.target.value)
								}
							/>
							<Field
								label="DÉCLENCHEUR"
								hint={HINT_ETAPE_DECLENCHEUR}
								multiline
								rows={2}
								placeholder={PLACEHOLDER_ETAPE_DECLENCHEUR}
								value={etape.declencheur_texte}
								onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onChangeEtape(index, 'declencheur_texte', e.target.value)
								}
								onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onBlurEtape(index, 'declencheur_texte', e.target.value)
								}
							/>
							<div>
								{etape.duree === undefined ? (
									<button
										type="button"
										onClick={() => onChangeDureeEtape(index, DUREE_MIN)}
										style={boutonPointilleStyle}
									>
										{TEXTE_POSER_DUREE}
									</button>
								) : (
									<Stepper
										label="DURÉE"
										value={etape.duree}
										min={DUREE_MIN}
										onChange={(valeur) => onChangeDureeEtape(index, valeur)}
									/>
								)}
								<p style={legendeStyle}>{HINT_ETAPE_DUREE}</p>
							</div>
							<Field
								label="SI LE JOUEUR BLOQUE"
								hint={HINT_ETAPE_SI_BLOQUE}
								multiline
								rows={2}
								placeholder={PLACEHOLDER_ETAPE_SI_BLOQUE}
								value={etape.si_bloque}
								onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onChangeEtape(index, 'si_bloque', e.target.value)
								}
								onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
									onBlurEtape(index, 'si_bloque', e.target.value)
								}
							/>
						</div>
					))}
				</div>
				<button type="button" onClick={handleClicAjouterEtape} style={boutonPointilleStyle}>
					{TEXTE_AJOUTER_ETAPE}
				</button>
			</div>

			{personnage.camp === 'antagoniste' && (
				<div style={separateurStyle}>
					<span style={eyebrowStyle}>CONTRE-MESURES</span>
					<p style={legendeStyle}>{LEGENDE_CONTRE_MESURES}</p>
					<div style={listeLignesStyle}>
						{contreMesures.map((cm, index) => (
							<div
								key={index}
								style={ligneStyle}
								ref={index === contreMesures.length - 1 && contreMesureEnAjout ? nouvelleContreMesureRef : undefined}
							>
								<div style={enTeteLigneStyle}>
									<span style={eyebrowStyle}>{`CONTRE-MESURE ${index + 1}`}</span>
									<IconButton
										label={`Retirer la contre-mesure n°${index + 1}`}
										tone="danger"
										size={HIT_TARGET_MIN}
										onClick={() => onRetirerContreMesure(index)}
									>
										✕
									</IconButton>
								</div>
								<Field
									label="INTENTION"
									hint={HINT_CONTRE_MESURE_ACTION}
									multiline
									rows={2}
									value={cm.action}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										onChangeContreMesure(index, 'action', e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										onBlurContreMesure(index, 'action', e.target.value)
									}
								/>
								<Field
									label="DÉCLENCHEUR"
									hint={HINT_CONTRE_MESURE_DECLENCHEUR}
									multiline
									rows={2}
									value={cm.declencheur_texte}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										onChangeContreMesure(index, 'declencheur_texte', e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										onBlurContreMesure(index, 'declencheur_texte', e.target.value)
									}
								/>
							</div>
						))}
					</div>
					<button type="button" onClick={handleClicAjouterContreMesure} style={boutonPointilleStyle}>
						{TEXTE_AJOUTER_CONTRE_MESURE}
					</button>
				</div>
			)}
		</>
	)
}

const sousSectionStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
	marginTop: 'var(--space-2)',
}

const listeLignesStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-3)',
}

const ligneStyle: CSSProperties = {
	border: '1px solid var(--border-divider)',
	background: 'var(--surface-sunken)',
	borderRadius: 'var(--r-md)',
	padding: 'var(--space-4)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const enTeteLigneStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
}
