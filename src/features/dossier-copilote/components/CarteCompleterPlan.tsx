import { useRef, useState } from 'react'
import {
	useBrain,
	IssueList,
	Select,
	localiserEntite,
	LIBELLE_DES_CHAMPS,
	type CiblePlan,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type Personnage,
	type PropositionPlan,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer, type BarreLancerHandle } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneReplique } from './LigneReplique'
import {
	CARD5_CORPS,
	CARD5_TITRE,
	EYEBROW_DEJA_ECRIT,
	eyebrowEtape,
	EYEBROW_PROCHAINE_ETAPE,
	LABEL_PERSONNAGE,
	MENTION_AUCUNE_ETAPE,
	MENTION_AUCUNE_ETAPE_AU_LANCER,
	MENTION_RELANCE_PLAN,
	OPTION_AUCUN_PERSONNAGE,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN,
	TEXTE_REFUS_TROP_LONG_PLAN,
	texteRefusAEcrire,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_COPILOTE_NON_CONFIGURE,
} from '../textes'
import { blocLectureRepliqueStyle, eyebrowStyle, listeDejaEcritStyle, mentionStyle, refusSyncStyle } from './styles'

export interface CarteCompleterPlanProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'personnage-plan' as const

/** Les textes de refus/échec DE CE RÔLE. `'aucun-candidat'` est SANS OBJET
 *  pour ce rôle (une seule entité, aucun rang) et tombe donc, comme chez
 *  `CarteFaireParler`, dans le même catch-all que `trop-long` : le motif n'est
 *  simplement jamais produit par `assemblerPlan` (lot 1). */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	if (echec.motif === 'cible-a-ecrire') return TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN
	return TEXTE_REFUS_TROP_LONG_PLAN
}

interface ContexteGele {
	personnageId: string
	dejaEcrites: readonly string[]
}

/**
 * Carte 5 « Compléter le plan d'actions » — cinquième carte du panneau,
 * quatrième ACTIVE (§ 3.2 du plan d'itération 3b), placée après
 * `CarteFaireParler` et avant le placeholder « Bientôt — itération 4 ».
 *
 * DEUX TRAITS NEUFS, et c'est tout ce qui différencie ce rôle des trois
 * précédents : (1) `etape` est POSÉ PAR LE CODE, au moment de l'écriture, sur
 * la liste VIVE — le modèle ne le voit jamais et n'en rend aucun (doctrine
 * it2, précédent `CERTITUDE_INITIALE`) ; (2) le contexte INJECTE le champ
 * cible (`plan_actions[].action`, amendement § 4 bis du plan) — le bloc
 * « DÉJÀ ÉCRIT » n'est donc pas ici une simple mémoire d'écran, c'est la
 * PRÉMISSE que le modèle a vue.
 *
 * LA RECETTE D'ACCEPTATION (§ 5, critères 7/8) : `p` vient du `d` COURANT de
 * `dossiers.update`, jamais du bloc gelé ni de la proposition — entre la
 * demande et l'acceptation le plan peut avoir bougé, et un numéro calculé à
 * la proposition serait périmé EN SILENCE (aucune règle d'unicité n'est
 * arbitrée). `plan_actions[]` ne reçoit que `{ etape, action }` (KR-221).
 *
 * LE GEL (§ 3.5) : `dejaEcritesGelees` est figé au clic « Lancer », jamais
 * re-dérivé du dossier vivant une fois gelé — `dossier` est un abonnement
 * réveillé par `dossier:updated`, donc par l'acceptation elle-même (famille
 * BUG-097/101/106/109). AVANT le premier lancer de la session, rien n'est
 * encore gelé : le bloc lit alors la valeur LIVE du plan du personnage
 * sélectionné, sans risque puisqu'aucune écriture n'a encore pu se produire.
 *
 * AUCUN PLAFOND DE DOCUMENT sur `plan_actions[]` (§ 2, § 8 n° 25) : ni
 * compteur, ni `accepterDesactive`, et « Lancer » ne se désactive JAMAIS par
 * la boucle de décision — seulement par `indisponible`/`aucunPersonnage`,
 * vrai AVANT que la boucle ne commence. LE FOCUS POST-DÉCISION EST DONC À
 * UNE SEULE BRANCHE (§ 3.5/3.6) : il n'y a qu'une proposition par lancer, et
 * il n'existe aucune cible que ce même rendu pourrait désactiver — contraste
 * avec `CarteFaireParler`, dont le focus saute toute ligne devenue non
 * acceptable au plafond (BUG-109). Le focus revient donc TOUJOURS à
 * « Lancer », sans jamais consulter de handle de ligne.
 */
export function CarteCompleterPlan({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteCompleterPlanProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CiblePlan, PropositionPlan>((cible, signal) =>
		copilote.demander(dossier, cible, signal),
	)

	const [personnageIdChoisi, setPersonnageIdChoisi] = useState<string | null>(null)
	const [contexteGele, setContexteGele] = useState<ContexteGele | null>(null)
	const [decision, setDecision] = useState<'acceptee' | 'rejetee' | undefined>(undefined)
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)

	const barreRef = useRef<BarreLancerHandle>(null)

	const personnages = dossier.monde.personnages
	const aucunPersonnage = personnages.length === 0
	const personnageId = personnageIdChoisi ?? personnages[0]?.id ?? ''

	function personnageParId(id: string): Personnage | undefined {
		return dossier.monde.personnages.find((p) => p.id === id)
	}

	const planLive = personnageParId(personnageId)?.plan_actions ?? []
	// GEL (§ 3.5) : la valeur figée prime dès qu'elle existe, jamais re-dérivée.
	const dejaEcritesGelees = contexteGele?.dejaEcrites ?? planLive.map((e) => e.action)

	const enCours = demande.etat.phase === 'en-cours'
	// AUCUN cas « plafond » (§ 3.2 point 3) : il n'existe aucune borne de
	// document sur `plan_actions[]`.
	const desactive = indisponible || aucunPersonnage
	const titreDesactive = indisponible
		? TITRE_COPILOTE_NON_CONFIGURE
		: aucunPersonnage
			? TITRE_AUCUN_PERSONNAGE
			: undefined

	// CHANGER DE PERSONNAGE ABANDONNE LA PROPOSITION ET LE GEL — même geste que
	// `handleChangerPersonnage` (CarteFaireParler, § 3.2 point final).
	function handleChangerPersonnage(id: string): void {
		setPersonnageIdChoisi(id)
		setContexteGele(null)
		setDecision(undefined)
		setRefusEcriture(null)
		demande.annuler()
	}

	function handleLancer(): void {
		setContexteGele({ personnageId, dejaEcrites: planLive.map((e) => e.action) })
		setDecision(undefined)
		setRefusEcriture(null)
		demande.lancer({ role: ROLE, acteurId: personnageId })
	}

	function handleAccepter(texte: string): void {
		if (contexteGele === null) return
		const cibleId = contexteGele.personnageId
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 7) :
		// `p` vient du `d` COURANT de la recette, jamais du bloc gelé ni de la
		// proposition — LA RECETTE D'ACCEPTATION, mot pour mot (§ 5 du plan).
		// Deux clés, rien d'autre (KR-221).
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: {
				...d.monde,
				personnages: d.monde.personnages.map((p) =>
					p.id === cibleId
						? { ...p, plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }] }
						: p,
				),
			},
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			setDecision('acceptee')
			// UNE SEULE BRANCHE (§ 3.5) : « Lancer » n'est jamais désactivé par la
			// décision, donc c'est toujours lui la cible du focus post-décision.
			barreRef.current?.focusLancer()
		} else if (resultat.statut === 'refuse') {
			// Cas NOMINAL (KR-234) : rien n'est persisté, la proposition et la
			// décision restent affichées (§ 3.2 point 7).
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(): void {
		if (contexteGele === null) return
		setDecision('rejetee')
		barreRef.current?.focusLancer()
	}

	const propositionAction = demande.etat.phase === 'proposition' ? demande.etat.proposition.action : null

	return (
		<CarteAssistant titre={CARD5_TITRE} corps={CARD5_CORPS}>
			<Select
				label={LABEL_PERSONNAGE}
				value={personnageId}
				onChange={handleChangerPersonnage}
				options={
					aucunPersonnage
						? [{ value: '', label: OPTION_AUCUN_PERSONNAGE }]
						: personnages.map((p, index) => ({ value: p.id, label: localiserEntite('pnj', p, index) }))
				}
			/>
			<div>
				<span style={eyebrowStyle}>{EYEBROW_DEJA_ECRIT}</span>
				{dejaEcritesGelees.length === 0 ? (
					// Le bloc est GELÉ, donc sa mention décrit l'état AU LANCEMENT — même
					// motif que BUG-110 (précédent `CarteFaireParler`) : au présent elle
					// deviendrait fausse dès l'acceptation de la première étape.
					<p style={mentionStyle}>{decision === 'acceptee' ? MENTION_AUCUNE_ETAPE_AU_LANCER : MENTION_AUCUNE_ETAPE}</p>
				) : (
					<div style={listeDejaEcritStyle}>
						{dejaEcritesGelees.map((texte, i) => (
							<div key={i}>
								<span style={eyebrowStyle}>{eyebrowEtape(i + 1)}</span>
								<div style={blocLectureRepliqueStyle}>{texte}</div>
							</div>
						))}
					</div>
				)}
			</div>
			<BarreLancer
				ref={barreRef}
				enCours={enCours}
				desactive={desactive}
				titreDesactive={titreDesactive}
				onLancer={handleLancer}
				onAnnuler={demande.annuler}
			/>
			<p style={mentionStyle}>{MENTION_RELANCE_PLAN}</p>
			{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.echec)}</p>}
			{propositionAction !== null && (
				<div>
					<span style={eyebrowStyle}>{EYEBROW_PROCHAINE_ETAPE}</span>
					<LigneReplique
						texte={propositionAction}
						decision={decision}
						onAccepter={() => handleAccepter(propositionAction)}
						onRejeter={handleRejeter}
						onOuvrirFiche={() => onSelectSection('personnages')}
					/>
				</div>
			)}
			{refusEcriture !== null && <IssueList issues={refusEcriture} />}
		</CarteAssistant>
	)
}
