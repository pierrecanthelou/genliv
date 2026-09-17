import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
	useBrain,
	useOpenDossier,
	Card,
	Select,
	SegmentedControl,
	IssueList,
	Badge,
	localiserEntite,
	CHAMPS_PROPOSABLES,
	LIBELLE_DES_CHAMPS,
	type ChampProseChemin,
	type Dossier,
	type DossierIssue,
	type Personnage,
	type PropositionResolue,
	type ReponseCopilote,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote, type EtatDemande } from '../hooks/useDemandeCopilote'
import { LigneProposition } from './LigneProposition'
import {
	CARD1_CORPS,
	CARD1_TITRE,
	CARD2_BADGE,
	CARD2_CORPS,
	CARD2_TITRE,
	CARD3_BADGE,
	CARD3_CORPS,
	CARD3_TITRE,
	EYEBROW_ASSISTANT,
	LABEL_ANNULER,
	LABEL_LANCER,
	LABEL_PERSONNAGE,
	LEGENDE_CHAMP,
	OPTION_AUCUN_PERSONNAGE,
	TEXTE_CHARGEMENT,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_TROP_LONG,
	texteRefusAEcrire,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_CHAMP_MANQUANT,
} from '../textes'

export interface PanneauCopiloteProps {
	dossierId: string
	/** Render-prop de nav (§ 4 du plan) : ce panneau ne connaît que `SectionId`,
	 *  jamais `DestinationNav` (local à `bascule-editeur`). */
	onSelectSection: (section: SectionId) => void
}

/** Ordre du registre (FONCTION, APPARENCE, DESCRIPTION JOUEUR), libellés lus
 *  dans `LIBELLE_DES_CHAMPS`, jamais retapés (test-grep du lot 1). */
const OPTIONS_CHAMP = (Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]).map((chemin) => ({
	value: chemin,
	label: LIBELLE_DES_CHAMPS[chemin].libelle,
}))

/** Les QUATRE textes de § 3.6, discriminés par branche. `'propose'` est
 *  possible sur le TYPE `ReponseCopilote` mais jamais produit ici :
 *  `useDemandeCopilote` ne range en phase `echec` qu'une réponse déjà
 *  discriminée comme non conforme. */
function texteEchec(reponse: ReponseCopilote): string {
	if (reponse.statut === 'illisible') return TEXTE_ILLISIBLE
	if (reponse.statut === 'refuse') {
		return reponse.motif === 'a-ecrire'
			? texteRefusAEcrire(LIBELLE_DES_CHAMPS[reponse.chemin].libelle)
			: TEXTE_REFUS_TROP_LONG
	}
	return TEXTE_INDISPONIBLE
}

/**
 * Le panneau Copilote — injecté par la racine de composition (`App.tsx`,
 * KR-184). Rend `null` si le dossier est absent (même discipline que
 * `PanneauControles`/`PanneauCanon`). `useDemandeCopilote` porte la boucle
 * « demander » ; ce composant porte l'ÉCRITURE (critère 4) et la SÉLECTION —
 * toutes deux ÉTAT D'ÉCRAN calculé au rendu (KR-013/113), jamais un
 * `useEffect` miroir.
 */
export function PanneauCopilote({ dossierId, onSelectSection }: PanneauCopiloteProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const demande = useDemandeCopilote(dossier)

	const [personnageIdChoisi, setPersonnageIdChoisi] = useState<string | null>(null)
	const [champChoisi, setChampChoisi] = useState<ChampProseChemin | undefined>(undefined)
	// Capturé au MOMENT de la décision, jamais par un effet : `EtatDemande.decide`
	// ne porte pas la proposition (§ 4.1) — sans cette capture, le diff décidé
	// disparaîtrait de l'écran (voir l'écart assumé au § 3.7, `LigneProposition`).
	const [decisionAffichee, setDecisionAffichee] = useState<{
		proposition: PropositionResolue
		issue: 'accepte' | 'refuse'
	} | null>(null)
	// Refus D'ÉCRITURE (`validateDossier`) — distinct du refus de CONTEXTE (`echec`).
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)
	// LE « AVANT » EST GELÉ AU LANCEMENT, jamais dérivé du dossier au rendu.
	// `dossierActuel` est un abonnement qui se réveille sur `dossier:updated` : un
	// AVANT recalculé afficherait, à l'instant précis de l'acceptation, le texte
	// qu'on VIENT d'écrire — un diff montrant A contre A sur une cible vide, et le
	// texte de l'auteur disparaissant sans trace sur une cible rédigée. C'est
	// exactement l'état non dessiné qui a fait retirer la coupe de REMPLACEMENT
	// (§ 8 n° 16 du plan). C'est de l'ÉTAT D'ÉCRAN, au même titre que la décision
	// affichée, et il se capte sur le GESTE (Lancer), jamais dans un `useEffect`
	// miroir (KR-013/113).
	const [valeurAvantGelee, setValeurAvantGelee] = useState<string | undefined>(undefined)

	const lancerRef = useRef<HTMLButtonElement>(null)
	const annulerRef = useRef<HTMLButtonElement>(null)
	const phasePrecedenteRef = useRef<EtatDemande['phase']>('repos')

	// Focus IMPÉRATIF, jamais un miroir d'état (KR-013/113) : entrée dans
	// `en-cours` → focus Annuler, sortie de `en-cours` → focus Lancer (§ 3.5).
	useEffect(() => {
		const precedente = phasePrecedenteRef.current
		phasePrecedenteRef.current = demande.etat.phase
		if (demande.etat.phase === 'en-cours') {
			annulerRef.current?.focus()
		} else if (precedente === 'en-cours') {
			lancerRef.current?.focus()
		}
	}, [demande.etat.phase])

	if (dossier === null) return null
	// TypeScript ne propage pas le rétrécissement de la garde ci-dessus à
	// l'intérieur des déclarations de fonction imbriquées plus bas (portée
	// distincte) — capter la valeur non nulle une fois évite un `as` ou un second
	// garde répété dans chaque gestionnaire (même précédent que `PanneauCanon.tsx`).
	const dossierActuel: Dossier = dossier

	const personnages = dossierActuel.monde.personnages
	const aucunPersonnage = personnages.length === 0
	// Premier personnage par défaut dès qu'il en existe un (§ 3.3) — EN LIGNE,
	// jamais semé par un effet.
	const personnageId = personnageIdChoisi ?? personnages[0]?.id ?? ''

	const lancerDesactive = aucunPersonnage || champChoisi === undefined || demande.etat.phase === 'en-cours'
	const titreLancer = aucunPersonnage
		? TITRE_AUCUN_PERSONNAGE
		: champChoisi === undefined
			? TITRE_CHAMP_MANQUANT
			: undefined

	function personnageParId(id: string): Personnage | undefined {
		return dossierActuel.monde.personnages.find((p) => p.id === id)
	}

	function handleLancer(): void {
		if (champChoisi === undefined) return
		setDecisionAffichee(null)
		setRefusEcriture(null)
		// Lu une seule fois, ICI : c'est la valeur que la proposition remplacera, et
		// le dossier n'a pas encore bougé. La cible du `lancer` ci-dessous est le
		// MÊME couple {entiteId, champ}, et `CopiloteService` le renvoie tel quel —
		// la valeur gelée ne peut donc pas se désaligner de la proposition rendue.
		setValeurAvantGelee(personnageParId(personnageId)?.[CHAMPS_PROPOSABLES[champChoisi]])
		demande.lancer({ entiteId: personnageId, champ: champChoisi })
	}

	// La proposition COURANTE — en cours de diff (`proposition`) ou tout juste
	// décidée (`decide`, via `decisionAffichee`). `undefined` sinon.
	const propositionCourante: PropositionResolue | undefined =
		demande.etat.phase === 'proposition'
			? demande.etat.proposition
			: demande.etat.phase === 'decide' && decisionAffichee !== null
				? decisionAffichee.proposition
				: undefined

	function handleAccepter(): void {
		if (propositionCourante === undefined) return
		const cle = CHAMPS_PROPOSABLES[propositionCourante.champ]
		const texte = propositionCourante.texte
		const cibleId = propositionCourante.entiteId
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 4) —
		// TROIS racines nommées, jamais un spread de `dossier`.
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: {
				...d.monde,
				personnages: d.monde.personnages.map((p) => (p.id === cibleId ? { ...p, [cle]: texte } : p)),
			},
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			setDecisionAffichee({ proposition: propositionCourante, issue: 'accepte' })
			demande.accepter()
		} else if (resultat.statut === 'refuse') {
			// Rien n'est persisté ni émis (KR-004) : la proposition RESTE affichée,
			// les anomalies aussi — cas nominal, pas une branche d'erreur (KR-234).
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(): void {
		if (propositionCourante === undefined) return
		setDecisionAffichee({ proposition: propositionCourante, issue: 'refuse' })
		demande.refuser()
	}

	const decision =
		demande.etat.phase === 'decide' ? (demande.etat.issue === 'accepte' ? 'acceptee' : 'rejetee') : undefined

	// REMPLACEMENT ssi la valeur GELÉE AU LANCEMENT est non vide (§ 3.7) — et non
	// la valeur vivante : `variante` doit rester, elle aussi, ce qu'elle était au
	// départ de la demande, sans quoi une cible vide basculerait en REMPLACEMENT à
	// l'acceptation. La moitié « ne contient pas le marqueur d'amorce » est hors de
	// portée d'une feature (`MARQUEUR_A_ECRIRE` non exporté, KR-223) — branche
	// INERTE en pratique (§ 7 du plan, « non vérifiable en l'état »).
	const variante: 'remplissage' | 'remplacement' =
		valeurAvantGelee !== undefined && valeurAvantGelee.trim() !== '' ? 'remplacement' : 'remplissage'

	return (
		<div style={pageStyle}>
			<Card>
				<div style={carteStyle}>
					<Entete titre={CARD1_TITRE} />
					<p style={corpsStyle}>{CARD1_CORPS}</p>
					<Select
						label={LABEL_PERSONNAGE}
						value={personnageId}
						onChange={setPersonnageIdChoisi}
						options={
							aucunPersonnage
								? [{ value: '', label: OPTION_AUCUN_PERSONNAGE }]
								: personnages.map((p, index) => ({ value: p.id, label: localiserEntite('pnj', p, index) }))
						}
					/>
					<div>
						<span style={eyebrowStyle}>{LEGENDE_CHAMP}</span>
						<SegmentedControl
							ariaLabel={LEGENDE_CHAMP}
							value={champChoisi}
							onChange={setChampChoisi}
							options={OPTIONS_CHAMP}
						/>
					</div>
					<div style={ligneLancerStyle}>
						<button
							ref={lancerRef}
							type="button"
							disabled={lancerDesactive}
							title={titreLancer}
							onClick={handleLancer}
							style={lancerDesactive ? lancerDesactiveStyle : lancerActifStyle}
						>
							{LABEL_LANCER}
						</button>
						{demande.etat.phase === 'en-cours' && (
							<div
								role="status"
								style={chargementStyle}
								onKeyDown={(e) => {
									if (e.key === 'Escape') demande.annuler()
								}}
							>
								<span style={corpsStyle}>{TEXTE_CHARGEMENT}</span>
								<button ref={annulerRef} type="button" onClick={demande.annuler} style={annulerStyle}>
									{LABEL_ANNULER}
								</button>
							</div>
						)}
					</div>
					{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.reponse)}</p>}
					{propositionCourante !== undefined && (
						<LigneProposition
							chemin={propositionCourante.champ}
							variante={variante}
							valeurAvant={valeurAvantGelee}
							valeurApres={propositionCourante.texte}
							decision={decision}
							onAccepter={handleAccepter}
							onRejeter={handleRejeter}
							onOuvrirFiche={() => onSelectSection('personnages')}
						/>
					)}
					{refusEcriture !== null && <IssueList issues={refusEcriture} />}
				</div>
			</Card>
			<CardBientot titre={CARD2_TITRE} badge={CARD2_BADGE} corps={CARD2_CORPS} />
			<CardBientot titre={CARD3_TITRE} badge={CARD3_BADGE} corps={CARD3_CORPS} />
		</div>
	)
}

/** En-tête composée LOCALEMENT (§ 3.1 : aucun composant `CardHead` n'existe
 *  dans ce dépôt, vérifié au cadrage — anatomie eyebrow+titre recomposée avec
 *  les jetons du § 3.1, même motif que l'eyebrow partagé de `dossier-fiches`). */
function Entete({ titre }: { titre: string }): JSX.Element {
	return (
		<div>
			<span style={eyebrowStyle}>{EYEBROW_ASSISTANT}</span>
			<p style={titreStyle}>{titre}</p>
		</div>
	)
}

/** Card « Bientôt » (§ 3.4) — aucun sélecteur, aucun bouton Lancer grisé : la
 *  distinction se porte par le texte, jamais par le gris. */
function CardBientot({ titre, badge, corps }: { titre: string; badge: string; corps: string }): JSX.Element {
	return (
		<Card>
			<div style={carteStyle}>
				<div style={enTeteBientotStyle}>
					<Entete titre={titre} />
					<Badge tone="muted">{badge}</Badge>
				</div>
				<p style={corpsStyle}>{corps}</p>
			</div>
		</Card>
	)
}

const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	overflowY: 'auto',
	padding: 'var(--space-12)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-8)',
}

const carteStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const enTeteBientotStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
}

const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 4,
}

const titreStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

const corpsStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

const ligneLancerStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: 'var(--space-4)',
}

// Jetons --space-* restreints à ceux déjà employés par `PanneauControles`
// (§ 3.1 : `--space-1/3/4/8/10/12`) — aucune valeur d'échelle neuve introduite ici.
const boutonBase: CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-3) var(--space-8)',
	borderRadius: 'var(--r-md)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
}

// Un « Lancer » désactivé n'est JAMAIS accent-teinté (§ 3.1, littéral).
const lancerDesactiveStyle: CSSProperties = {
	...boutonBase,
	background: 'var(--surface-sunken)',
	color: 'var(--text-disabled)',
	border: '1px solid var(--border-field)',
	cursor: 'not-allowed',
}

const lancerActifStyle: CSSProperties = {
	...boutonBase,
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	border: 'none',
	cursor: 'pointer',
}

const chargementStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-4)',
}

// Ton NEUTRE, littéral (§ 3.5).
const annulerStyle: CSSProperties = {
	...boutonBase,
	fontWeight: 'var(--fw-regular)',
	color: 'var(--text-body)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
	cursor: 'pointer',
}

const refusSyncStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
}
