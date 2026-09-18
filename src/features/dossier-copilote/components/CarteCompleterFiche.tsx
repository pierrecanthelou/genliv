import { useState } from 'react'
import {
	useBrain,
	IssueList,
	Select,
	SegmentedControl,
	localiserEntite,
	CHAMPS_PROPOSABLES,
	LIBELLE_DES_CHAMPS,
	type ChampProseChemin,
	type CibleCopilote,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type Personnage,
	type PropositionResolue,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneProposition } from './LigneProposition'
import {
	CARD1_CORPS,
	CARD1_TITRE,
	LABEL_PERSONNAGE,
	LEGENDE_CHAMP,
	OPTION_AUCUN_PERSONNAGE,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_TROP_LONG,
	texteRefusAEcrire,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_CHAMP_MANQUANT,
	TITRE_COPILOTE_NON_CONFIGURE,
} from '../textes'
import { eyebrowStyle, refusSyncStyle } from './styles'

export interface CarteCompleterFicheProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'personnage-prose' as const

/** Ordre du registre (FONCTION, APPARENCE, DESCRIPTION JOUEUR), libellés lus
 *  dans `LIBELLE_DES_CHAMPS`, jamais retapés (test-grep du lot 1 de l'it1). */
const OPTIONS_CHAMP = (Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]).map((chemin) => ({
	value: chemin,
	label: LIBELLE_DES_CHAMPS[chemin].libelle,
}))

/** Les textes de refus/échec DE CE RÔLE. `TEXTE_REFUS_TROP_LONG` est
 *  spécifique à la prose (« la fiche de ce personnage ») — la carte 2 a le
 *  sien, `TEXTE_REFUS_TROP_LONG_DETENTEURS` (§ 3.3, point 2 du plan it2). */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	return TEXTE_REFUS_TROP_LONG
}

/**
 * Carte 1 « Compléter une fiche » — porte l'ÉCRITURE (critère 4/7) et la
 * SÉLECTION, toutes deux ÉTAT D'ÉCRAN calculé au rendu (KR-013/113), jamais un
 * `useEffect` miroir. Extraite de `PanneauCopilote.tsx` à l'itération 2
 * (KR-112) — comportement inchangé, plus le refus `indisponible` (priorité
 * (a), désormais consommé, `open_question` n° 5).
 */
export function CarteCompleterFiche({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteCompleterFicheProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CibleCopilote, PropositionResolue>((cible, signal) =>
		copilote.demander(ROLE, dossier, cible, signal),
	)

	const [personnageIdChoisi, setPersonnageIdChoisi] = useState<string | null>(null)
	const [champChoisi, setChampChoisi] = useState<ChampProseChemin | undefined>(undefined)
	// Capturée au MOMENT de la décision, jamais par un effet : la phase
	// `'decide'` est sortie du hook (§ 4.8 du plan it2) — la décision vit ICI.
	const [decisionAffichee, setDecisionAffichee] = useState<{
		proposition: PropositionResolue
		issue: 'accepte' | 'refuse'
	} | null>(null)
	// Refus D'ÉCRITURE (`validateDossier`) — distinct du refus de CONTEXTE (`echec`).
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)
	// LE « AVANT » EST GELÉ AU LANCEMENT, jamais dérivé du dossier au rendu
	// (BUG-097) : `dossier` est un abonnement qui se réveille sur
	// `dossier:updated`, y compris sur l'effet de bord de l'acceptation elle-même.
	const [valeurAvantGelee, setValeurAvantGelee] = useState<string | undefined>(undefined)

	const personnages = dossier.monde.personnages
	const aucunPersonnage = personnages.length === 0
	// Premier personnage par défaut dès qu'il en existe un — EN LIGNE, jamais semé
	// par un effet.
	const personnageId = personnageIdChoisi ?? personnages[0]?.id ?? ''

	const enCours = demande.etat.phase === 'en-cours'
	const desactive = indisponible || aucunPersonnage || champChoisi === undefined
	const titreDesactive = indisponible
		? TITRE_COPILOTE_NON_CONFIGURE
		: aucunPersonnage
			? TITRE_AUCUN_PERSONNAGE
			: champChoisi === undefined
				? TITRE_CHAMP_MANQUANT
				: undefined

	function personnageParId(id: string): Personnage | undefined {
		return dossier.monde.personnages.find((p) => p.id === id)
	}

	function handleLancer(): void {
		if (champChoisi === undefined) return
		setDecisionAffichee(null)
		setRefusEcriture(null)
		// Lu une seule fois, ICI : c'est la valeur que la proposition remplacera, et
		// le dossier n'a pas encore bougé.
		setValeurAvantGelee(personnageParId(personnageId)?.[CHAMPS_PROPOSABLES[champChoisi]])
		demande.lancer({ entiteId: personnageId, champ: champChoisi })
	}

	const propositionCourante: PropositionResolue | undefined =
		demande.etat.phase === 'proposition' ? demande.etat.proposition : undefined

	function handleAccepter(): void {
		if (propositionCourante === undefined) return
		const cle = CHAMPS_PROPOSABLES[propositionCourante.champ]
		const texte = propositionCourante.texte
		const cibleId = propositionCourante.entiteId
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 4/7) —
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
		} else if (resultat.statut === 'refuse') {
			// Rien n'est persisté ni émis (KR-004) : la proposition RESTE affichée,
			// les anomalies aussi — cas nominal, pas une branche d'erreur (KR-234).
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(): void {
		if (propositionCourante === undefined) return
		setDecisionAffichee({ proposition: propositionCourante, issue: 'refuse' })
	}

	const decision =
		decisionAffichee !== null ? (decisionAffichee.issue === 'accepte' ? 'acceptee' : 'rejetee') : undefined

	const variante: 'remplissage' | 'remplacement' =
		valeurAvantGelee !== undefined && valeurAvantGelee.trim() !== '' ? 'remplacement' : 'remplissage'

	return (
		<CarteAssistant titre={CARD1_TITRE} corps={CARD1_CORPS}>
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
			<BarreLancer
				enCours={enCours}
				desactive={desactive}
				titreDesactive={titreDesactive}
				onLancer={handleLancer}
				onAnnuler={demande.annuler}
			/>
			{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.echec)}</p>}
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
		</CarteAssistant>
	)
}
