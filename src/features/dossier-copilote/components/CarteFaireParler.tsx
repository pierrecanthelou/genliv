import { useRef, useState } from 'react'
import {
	useBrain,
	IssueList,
	Select,
	localiserEntite,
	LIBELLE_DES_CHAMPS,
	PARLER_REPLIQUES,
	type CibleRepliques,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type Personnage,
	type PropositionRepliques,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer, type BarreLancerHandle } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneReplique, type LigneRepliqueHandle } from './LigneReplique'
import {
	CARD4_CORPS,
	CARD4_TITRE,
	EYEBROW_DEJA_ECRIT,
	eyebrowRepliqueProposee,
	LABEL_PERSONNAGE,
	MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES,
	MENTION_ZERO_REPLIQUE,
	MENTION_ZERO_REPLIQUE_AU_LANCER,
	OPTION_AUCUN_PERSONNAGE,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES,
	TEXTE_REFUS_TROP_LONG_REPLIQUES,
	texteRefusAEcrire,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_COPILOTE_NON_CONFIGURE,
	TITRE_REPLIQUE_PLAFOND_LIGNE,
	TITRE_REPLIQUES_AU_PLAFOND,
} from '../textes'
import {
	blocLectureRepliqueStyle,
	eyebrowStyle,
	listeDejaEcritStyle,
	listeDetenteursStyle,
	mentionStyle,
	refusSyncStyle,
	separateurLigneStyle,
} from './styles'

export interface CarteFaireParlerProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'personnage-repliques' as const

/** Les textes de refus/échec DE CE RÔLE. `'aucun-candidat'` est SANS OBJET
 *  pour ce rôle (une seule entité, aucun rang) et tombe donc, comme chez
 *  `CarteCompleterFiche`, dans le même catch-all que `trop-long` : le motif
 *  n'est simplement jamais produit par `assemblerRepliques` (lot 1). */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	if (echec.motif === 'cible-a-ecrire') return TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES
	return TEXTE_REFUS_TROP_LONG_REPLIQUES
}

interface ContexteGele {
	personnageId: string
	dejaEcrites: readonly string[]
}

/**
 * Carte 4 « Écrire des répliques » — quatrième carte du panneau, JAMAIS une
 * option de la carte 1 (§ 8, TL3a-13) : `useDemandeCopilote` est instancié
 * une fois par appel, deux rôles dans une carte feraient deux machines
 * d'état.
 *
 * LE GEL (§ 3.5) : `dejaEcritesGelees` est figé au clic « Lancer »
 * (`contexteGele.dejaEcrites`), jamais re-dérivé du dossier vivant une fois
 * gelé — `dossier` est un abonnement réveillé par `dossier:updated`, donc par
 * l'acceptation elle-même (famille BUG-097/101/108). AVANT le premier lancer
 * de la session, rien n'est encore gelé : le bloc « DÉJÀ ÉCRIT » lit alors la
 * valeur LIVE du personnage sélectionné, ce qui est sans risque puisqu'aucune
 * écriture n'a encore pu se produire.
 *
 * `compteurAccepte`/`accepterDesactive` sont DÉRIVÉS EN LIGNE à chaque rendu
 * (KR-013/113) à partir de `dejaEcritesGelees` (gelé) + `decisions` (état de
 * session) — jamais un state dupliqué.
 *
 * LE FOCUS POST-DÉCISION (BUG-109, 3ᵉ occurrence de la famille) obéit à UN
 * invariant : ne jamais viser une cible que CE MÊME RENDU désactive. Au
 * plafond, « Lancer » se désactive (son `plafondAtteint` dérive du dossier
 * vif, réveillé par l'écriture qu'on vient de commettre) et le « + » de chaque
 * ligne aussi ; seul le « × » reste actif, et c'est lui qu'on vise. Quand plus
 * aucune ligne n'est à décider ET que le plafond est atteint, il n'existe
 * AUCUNE cible survivante : on ne pose alors pas le focus du tout, plutôt que
 * de le poser sur un `disabled` — inopérant en navigateur, vert en jsdom
 * seulement, ce que la mitigation de BUG-106 avait nommément interdit.
 */
export function CarteFaireParler({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteFaireParlerProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CibleRepliques, PropositionRepliques>((cible, signal) =>
		copilote.demander(dossier, cible, signal),
	)

	const [personnageIdChoisi, setPersonnageIdChoisi] = useState<string | null>(null)
	const [contexteGele, setContexteGele] = useState<ContexteGele | null>(null)
	const [decisions, setDecisions] = useState<Record<number, 'acceptee' | 'rejetee'>>({})
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)

	const lignesRef = useRef<Map<number, LigneRepliqueHandle>>(new Map())
	const barreRef = useRef<BarreLancerHandle>(null)

	const personnages = dossier.monde.personnages
	const aucunPersonnage = personnages.length === 0
	const personnageId = personnageIdChoisi ?? personnages[0]?.id ?? ''

	function personnageParId(id: string): Personnage | undefined {
		return dossier.monde.personnages.find((p) => p.id === id)
	}

	const parlerLive = personnageParId(personnageId)?.caractere?.parler ?? []
	// GEL (§ 3.5) : la valeur figée prime dès qu'elle existe, jamais re-dérivée.
	const dejaEcritesGelees = contexteGele?.dejaEcrites ?? parlerLive
	// DÉRIVÉ EN LIGNE (KR-013/113), jamais un state dupliqué.
	const compteurAccepte = dejaEcritesGelees.length + Object.values(decisions).filter((d) => d === 'acceptee').length
	const accepterDesactive = compteurAccepte >= PARLER_REPLIQUES

	// « Lancer » se désactive sur le plafond LIVE — pas gelé : avant le premier
	// lancer, rien n'est encore figé, et pendant une session la désactivation
	// doit refléter les acceptations déjà écrites dans le dossier.
	const plafondAtteint = parlerLive.length >= PARLER_REPLIQUES
	const enCours = demande.etat.phase === 'en-cours'
	const desactive = indisponible || aucunPersonnage || plafondAtteint
	const titreDesactive = indisponible
		? TITRE_COPILOTE_NON_CONFIGURE
		: aucunPersonnage
			? TITRE_AUCUN_PERSONNAGE
			: plafondAtteint
				? TITRE_REPLIQUES_AU_PLAFOND
				: undefined

	const ajouts = demande.etat.phase === 'proposition' ? demande.etat.proposition.ajouts : []

	// CHANGER DE PERSONNAGE ABANDONNE LA PROPOSITION ET LE GEL — même geste que
	// `handleChangerConstat` (CarteTisserIndices, § 3.2) : la proposition en
	// cours appartient à un autre personnage.
	function handleChangerPersonnage(id: string): void {
		setPersonnageIdChoisi(id)
		setContexteGele(null)
		setDecisions({})
		setRefusEcriture(null)
		demande.annuler()
	}

	function handleLancer(): void {
		setContexteGele({ personnageId, dejaEcrites: parlerLive })
		setDecisions({})
		setRefusEcriture(null)
		demande.lancer({ role: ROLE, personnageId })
	}

	// Le focus IMPÉRATIF post-décision (§ 3.5) : la prochaine ligne NON DÉCIDÉE
	// et SOUS LE PLAFOND — une ligne au plafond est SAUTÉE, jamais ciblée
	// (prophylaxie BUG-106 : ne jamais appeler `focusAccepter` sur une ligne que
	// ce même rendu va désactiver). `decisionsApres` est calculé par l'appelant,
	// jamais relu de l'état (`setDecisions` est asynchrone).
	function focoApresDecision(decideIndex: number, decisionsApres: Record<number, 'acceptee' | 'rejetee'>): void {
		const compteurApres =
			dejaEcritesGelees.length + Object.values(decisionsApres).filter((d) => d === 'acceptee').length
		const plafondApres = compteurApres >= PARLER_REPLIQUES
		const suivant = ajouts.findIndex((_, i) => i !== decideIndex && decisionsApres[i] === undefined)
		// INVARIANT : ne JAMAIS viser une cible que CE MÊME RENDU désactive.
		// `plafondAtteint` dérive de `parlerLive`, donc du dossier vif que
		// `dossier:updated` réveille — c'est-à-dire de l'acceptation qu'on vient de
		// commettre. Au plafond, « Lancer » ET le « + » de chaque ligne basculent
		// `disabled` dans le rendu qui suit cette décision. Poser le focus sur un
		// bouton désactivé n'a AUCUN effet en navigateur et ne passe qu'en jsdom :
		// c'est le mode de panne que la mitigation de BUG-106 a interdit
		// nommément, et c'est la 3ᵉ occurrence de la famille BUG-097/101/106.
		if (suivant !== -1) {
			// Le « × » n'est jamais désactivé : au plafond il est la seule cible de
			// cette ligne qui survive au rendu, et la ligne reste rejetable.
			if (plafondApres) lignesRef.current.get(suivant)?.focusRejeter()
			else lignesRef.current.get(suivant)?.focusAccepter()
		} else if (!plafondApres) {
			barreRef.current?.focusLancer()
		}
		// RÉSIDU DÉCLARÉ, atteignable (toutes les lignes décidées ET plafond atteint —
		// p. ex. 3 propositions, 2 acceptées et 1 rejetée) : « Lancer » se désactive
		// dans ce même rendu et plus aucune ligne ne porte de bouton d'action. Il
		// n'existe alors AUCUNE cible que ce rendu ne désactive pas. On ne pose donc
		// PAS le focus — le navigateur le rend à `document.body` — plutôt que de le
		// poser sur un `disabled` et de faire croire à un contrat qui serait vert en
		// jsdom et faux chez l'auteur. Écrit ici, pas masqué : BUG-109.
	}

	function handleAccepter(index: number, texte: string): void {
		if (contexteGele === null) return
		const cibleId = contexteGele.personnageId
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 7) : un
		// AJOUT, jamais un remplacement — `caractere` créé SANS AUCUN CURSEUR si
		// absent (désaccord n° 2, RETENU : six valeurs ne se ratifient pas par un
		// geste qui n'en ratifie qu'une).
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: {
				...d.monde,
				personnages: d.monde.personnages.map((p) =>
					p.id === cibleId
						? { ...p, caractere: { ...p.caractere, parler: [...(p.caractere?.parler ?? []), texte] } }
						: p,
				),
			},
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			const decisionsApres = { ...decisions, [index]: 'acceptee' as const }
			setDecisions(decisionsApres)
			focoApresDecision(index, decisionsApres)
		} else if (resultat.statut === 'refuse') {
			// Cas NOMINAL (KR-234), pas une branche d'erreur : rien n'est persisté,
			// la proposition reste affichée.
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(index: number): void {
		// Même garde que `handleAccepter`, et pour la même raison : `focoApresDecision`
		// lit `dejaEcritesGelees`, qui RETOMBE sur le dossier vif quand le gel est nul.
		// Inatteignable aujourd'hui (une ligne ne s'affiche qu'en phase `proposition`,
		// laquelle implique un `handleLancer` qui a posé le gel), mais cet invariant
		// n'est porté par AUCUN type : c'est une dépendance implicite entre deux
		// `useState`, exactement ce qui a rouvert BUG-101. Le garde la rend explicite.
		if (contexteGele === null) return
		const decisionsApres = { ...decisions, [index]: 'rejetee' as const }
		setDecisions(decisionsApres)
		focoApresDecision(index, decisionsApres)
	}

	return (
		<CarteAssistant titre={CARD4_TITRE} corps={CARD4_CORPS}>
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
					// Le bloc est GELÉ, donc sa mention décrit l'état AU LANCEMENT. Au
					// présent elle deviendrait fausse dès la première acceptation —
					// « n'a encore aucune réplique » à côté d'un badge « Accepté », et à
					// rebours du `title` de « Lancer ». Le passé lève la contradiction
					// sans dégeler le bloc.
					<p style={mentionStyle}>{compteurAccepte === 0 ? MENTION_ZERO_REPLIQUE : MENTION_ZERO_REPLIQUE_AU_LANCER}</p>
				) : (
					<div style={listeDejaEcritStyle}>
						{dejaEcritesGelees.map((texte, i) => (
							<div key={i} style={blocLectureRepliqueStyle}>
								{texte}
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
			<p style={mentionStyle}>{MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES}</p>
			{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.echec)}</p>}
			{demande.etat.phase === 'proposition' && (
				<div style={listeDetenteursStyle}>
					{ajouts.map((texte, i) => (
						<div key={i} style={i > 0 ? separateurLigneStyle : undefined}>
							<span style={eyebrowStyle}>{eyebrowRepliqueProposee(i + 1)}</span>
							<LigneReplique
								ref={(handle) => {
									if (handle) lignesRef.current.set(i, handle)
									else lignesRef.current.delete(i)
								}}
								texte={texte}
								decision={decisions[i]}
								accepterDesactive={accepterDesactive}
								titreAccepterDesactive={TITRE_REPLIQUE_PLAFOND_LIGNE}
								onAccepter={() => handleAccepter(i, texte)}
								onRejeter={() => handleRejeter(i)}
								onOuvrirFiche={() => onSelectSection('personnages')}
							/>
						</div>
					))}
				</div>
			)}
			{refusEcriture !== null && <IssueList issues={refusEcriture} />}
		</CarteAssistant>
	)
}
