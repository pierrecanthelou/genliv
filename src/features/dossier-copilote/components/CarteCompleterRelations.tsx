import { useRef, useState } from 'react'
import {
	useBrain,
	IssueList,
	Select,
	localiserEntite,
	INTENSITE_INITIALE,
	LIBELLE_DES_CHAMPS,
	type CibleRelations,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type Personnage,
	type PropositionRelations,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer, type BarreLancerHandle } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneRelation, type LigneRelationHandle } from './LigneRelation'
import {
	CARD6_CORPS,
	CARD6_TITRE,
	EYEBROW_DEJA_ECRIT,
	EYEBROW_ENVERS,
	eyebrowRelationProposee,
	LABEL_PERSONNAGE,
	MENTION_AUCUNE_RELATION,
	MENTION_AUCUNE_RELATION_AU_LANCER,
	MENTION_RELATION_CREEE,
	OPTION_AUCUN_PERSONNAGE,
	TEXTE_CIBLE_INTROUVABLE,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_PORTEUR_DISPARU,
	TEXTE_REFUS_AUCUN_CANDIDAT_RELATIONS,
	TEXTE_REFUS_CIBLE_A_ECRIRE_RELATIONS,
	TEXTE_REFUS_TROP_LONG_RELATIONS,
	texteRefusAEcrire,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_COPILOTE_NON_CONFIGURE,
} from '../textes'
import {
	blocLectureRepliqueStyle,
	designationDetenteurStyle,
	eyebrowStyle,
	listeDejaEcritStyle,
	listeDetenteursStyle,
	mentionStyle,
	refusSyncStyle,
	separateurLigneStyle,
} from './styles'

export interface CarteCompleterRelationsProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'personnage-relations' as const

/** Les textes de refus/échec DE CE RÔLE — PREMIÈRE carte où les QUATRE motifs
 *  de `MotifRefusContexte` sont atteignables (§ 4.3 du plan, ordre figé
 *  `a-ecrire → cible-a-ecrire → aucun-candidat → trop-long`). */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	if (echec.motif === 'cible-a-ecrire') return TEXTE_REFUS_CIBLE_A_ECRIRE_RELATIONS
	if (echec.motif === 'aucun-candidat') return TEXTE_REFUS_AUCUN_CANDIDAT_RELATIONS
	return TEXTE_REFUS_TROP_LONG_RELATIONS
}

interface RelationLue {
	cibleId: string
	lien: string
}

interface ContexteGele {
	personnageId: string
	dejaEcrites: readonly RelationLue[]
}

/**
 * Carte 6 « Compléter les relations » — sixième carte du panneau, cinquième
 * ACTIVE (§ 3.2 du plan d'itération 3c), placée après `CarteCompleterPlan` et
 * avant le placeholder « Bientôt — itération 4 ».
 *
 * PREMIER RÔLE MIXTE : chaque `LienResolu` porte À LA FOIS un JETON
 * (`cibleId`, désigné par RANG par le modèle, re-résolu par `brain/`) ET de la
 * PROSE (`lien`, rédigée par le modèle). `LigneRelation` en est la sœur
 * assortie — ni `LigneDetenteur` ni `LigneReplique` seule ne pouvait
 * l'exprimer (§ 3.3).
 *
 * ⚠ LA RÉSOLUTION DU NOM DE LA CIBLE SE FAIT AU RENDU
 * (`dossier.monde.personnages.find`), JAMAIS dans `brain/`, jamais envoyée au
 * réseau (§ 3.2). Repli `TEXTE_CIBLE_INTROUVABLE` si la référence ne résout
 * plus — KR-021 : EXPOSÉ, jamais filtré, la ligne s'affiche quand même (à la
 * différence de `CarteTisserIndices`, qui omet la ligne : ce choix diffère
 * délibérément, § 3.2 du plan d'itération 3c).
 *
 * LE GEL (§ 3.5) : `dejaEcritesGelees` (les relations déjà écrites du
 * personnage, PAR COPIE DE VALEURS — `relations[]` n'a pas d'id propre, même
 * geste que 3b) est figé au clic « Lancer », jamais re-dérivé du dossier
 * vivant une fois gelé — `dossier` est un abonnement réveillé par
 * `dossier:updated`, donc par l'acceptation elle-même (famille
 * BUG-097/101/106/109). AVANT le premier lancer de la session, le bloc lit la
 * valeur LIVE, sans risque puisqu'aucune écriture n'a encore pu se produire.
 * La DÉSIGNATION de chaque relation déjà écrite, elle, N'EST PAS gelée : elle
 * se résout AU RENDU comme celle des lignes proposées — un accepter n'affecte
 * jamais le nom d'un AUTRE personnage, donc rien n'y expose BUG-097.
 *
 * AUCUN PLAFOND DE DOCUMENT sur `relations[]` (§ 2, § 3.5, § 8 n° 32) : ni
 * compteur, ni `accepterDesactive` sur `LigneRelation`, et « Lancer » ne se
 * désactive JAMAIS par la boucle de décision. LE FOCUS POST-DÉCISION suit donc
 * le patron le plus simple (`CarteTisserIndices`) : la ligne suivante NON
 * DÉCIDÉE, sinon retour sur « Lancer » — aucune cible n'est jamais désactivée
 * par ce rendu (BUG-109 sans objet ici, faute de plafond).
 *
 * LA GARDE PRÉALABLE DU PORTEUR (critère 7, seconde moitié) : si le
 * `personnageId` GELÉ ne résout plus dans le dossier COURANT au moment de
 * l'acceptation, AUCUN `DossierService.update` ne part, `TEXTE_PORTEUR_DISPARU`
 * s'affiche, et la ligne n'est JAMAIS marquée acceptée — contrairement au trou
 * « porteur disparu » PRÉEXISTANT et NON corrigé dans `CarteFaireParler`/
 * `CarteCompleterPlan` (BUG-114, famille à quatre exemplaires) : cette carte
 * NEUVE le ferme pour elle-même dès sa livraison, sans toucher aux autres.
 *
 * LA RECETTE D'ACCEPTATION (§ 5 du plan, mot pour mot) : `p` vient du `d`
 * COURANT de `dossiers.update`, jamais du bloc gelé ni de la proposition.
 * `relations[]` reçoit EXACTEMENT `{ cible_id, lien, intensite }` — TROIS clés,
 * `secret` ABSENT (KR-221 : optionnel, on ne sème pas ce que l'auteur n'a pas
 * posé) — jamais `{ ...ajout }` étalé, qui porterait `cibleId` au document.
 */
export function CarteCompleterRelations({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteCompleterRelationsProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CibleRelations, PropositionRelations>((cible, signal) =>
		copilote.demander(dossier, cible, signal),
	)

	const [personnageIdChoisi, setPersonnageIdChoisi] = useState<string | null>(null)
	const [contexteGele, setContexteGele] = useState<ContexteGele | null>(null)
	const [decisions, setDecisions] = useState<Record<string, 'acceptee' | 'rejetee'>>({})
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)
	const [porteurDisparu, setPorteurDisparu] = useState(false)

	const lignesRef = useRef<Map<string, LigneRelationHandle>>(new Map())
	const barreRef = useRef<BarreLancerHandle>(null)

	const personnages = dossier.monde.personnages
	const aucunPersonnage = personnages.length === 0
	const personnageId = personnageIdChoisi ?? personnages[0]?.id ?? ''

	function personnageParId(id: string): Personnage | undefined {
		return dossier.monde.personnages.find((p) => p.id === id)
	}

	// La DÉSIGNATION se résout AU RENDU, jamais gelée (§ 3.2) : repli
	// `TEXTE_CIBLE_INTROUVABLE` EXPOSÉ, jamais filtré (KR-021).
	function designationPour(cibleId: string): string {
		const index = dossier.monde.personnages.findIndex((p) => p.id === cibleId)
		if (index === -1) return TEXTE_CIBLE_INTROUVABLE
		return localiserEntite('pnj', dossier.monde.personnages[index], index)
	}

	const relationsLive = personnageParId(personnageId)?.relations ?? []
	// GEL (§ 3.5) : la valeur figée prime dès qu'elle existe, jamais re-dérivée.
	const dejaEcritesGelees: readonly RelationLue[] =
		contexteGele?.dejaEcrites ?? relationsLive.map((r) => ({ cibleId: r.cible_id, lien: r.lien }))
	// DÉRIVÉ EN LIGNE (KR-013/113) : combien de décisions de CETTE session sont
	// des acceptations — sert uniquement à choisir entre les deux mentions
	// présent/passé du bloc « DÉJÀ ÉCRIT » (même motif que BUG-110).
	const compteurAccepte = Object.values(decisions).filter((d) => d === 'acceptee').length

	const enCours = demande.etat.phase === 'en-cours'
	// AUCUN cas « plafond » (§ 3.5) : il n'existe aucune borne de document sur
	// `relations[]`.
	const desactive = indisponible || aucunPersonnage
	const titreDesactive = indisponible
		? TITRE_COPILOTE_NON_CONFIGURE
		: aucunPersonnage
			? TITRE_AUCUN_PERSONNAGE
			: undefined

	const ajouts = demande.etat.phase === 'proposition' ? demande.etat.proposition.ajouts : []

	// CHANGER DE PERSONNAGE ABANDONNE LA PROPOSITION ET LE GEL — même geste que
	// `handleChangerPersonnage` (CarteFaireParler/CarteCompleterPlan).
	function handleChangerPersonnage(id: string): void {
		setPersonnageIdChoisi(id)
		setContexteGele(null)
		setDecisions({})
		setRefusEcriture(null)
		setPorteurDisparu(false)
		demande.annuler()
	}

	function handleLancer(): void {
		setContexteGele({
			personnageId,
			dejaEcrites: relationsLive.map((r) => ({ cibleId: r.cible_id, lien: r.lien })),
		})
		setDecisions({})
		setRefusEcriture(null)
		setPorteurDisparu(false)
		demande.lancer({ role: ROLE, personnageId })
	}

	// Le focus IMPÉRATIF post-décision (§ 3.5) : la prochaine ligne NON
	// DÉCIDÉE, sinon retour sur « Lancer » — AUCUNE cible n'est jamais
	// désactivée par ce rendu (pas de plafond, § 8 n° 32), donc l'invariant
	// BUG-109 (« ne jamais viser une cible que ce même rendu désactive ») est
	// tenu par construction. `decisionsApres` est calculé par l'appelant,
	// jamais relu de l'état (`setDecisions` est asynchrone).
	function focoApresDecision(decideId: string, decisionsApres: Record<string, 'acceptee' | 'rejetee'>): void {
		const suivant = ajouts.find((a) => a.cibleId !== decideId && decisionsApres[a.cibleId] === undefined)
		if (suivant !== undefined) lignesRef.current.get(suivant.cibleId)?.focusAccepter()
		else barreRef.current?.focusLancer()
	}

	function handleAccepter(cibleId: string, lien: string): void {
		if (contexteGele === null) return
		const porteurId = contexteGele.personnageId
		// GARDE PRÉALABLE OBLIGATOIRE (critère 7, seconde moitié) : le porteur
		// GELÉ doit encore résoudre dans le dossier COURANT. Sans cette garde,
		// la recette ci-dessous ferait un `map` no-op silencieux — même trou
		// que BUG-114, préexistant et NON corrigé ailleurs, mais que cette
		// carte NEUVE ferme dès sa livraison.
		if (!dossier.monde.personnages.some((p) => p.id === porteurId)) {
			setPorteurDisparu(true)
			return
		}
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 7) :
		// TROIS clés, `secret` ABSENT (KR-221) — jamais `{ ...ajout }` étalé, qui
		// porterait `cibleId` au document. `p` vient du `d` COURANT de la
		// recette, jamais du bloc gelé ni de la proposition — LA RECETTE
		// D'ACCEPTATION, mot pour mot (§ 5 du plan).
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: {
				...d.monde,
				personnages: d.monde.personnages.map((p) =>
					p.id === porteurId
						? { ...p, relations: [...(p.relations ?? []), { cible_id: cibleId, lien, intensite: INTENSITE_INITIALE }] }
						: p,
				),
			},
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			const decisionsApres = { ...decisions, [cibleId]: 'acceptee' as const }
			setDecisions(decisionsApres)
			focoApresDecision(cibleId, decisionsApres)
		} else if (resultat.statut === 'refuse') {
			// Cas NOMINAL (KR-234), pas une branche d'erreur : rien n'est
			// persisté, la proposition reste affichée.
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(cibleId: string): void {
		// Même garde que `handleAccepter`, et pour la même raison qu'à
		// `CarteFaireParler` (BUG-111) : `focoApresDecision` lit `ajouts`, qui ne
		// sont affichés qu'en phase `proposition`, laquelle implique un
		// `handleLancer` ayant posé le gel — inatteignable aujourd'hui, mais
		// l'invariant n'est porté par AUCUN type.
		if (contexteGele === null) return
		const decisionsApres = { ...decisions, [cibleId]: 'rejetee' as const }
		setDecisions(decisionsApres)
		focoApresDecision(cibleId, decisionsApres)
	}

	return (
		<CarteAssistant titre={CARD6_TITRE} corps={CARD6_CORPS}>
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
					// motif que BUG-110 : au présent elle deviendrait fausse dès la
					// première acceptation.
					<p style={mentionStyle}>
						{compteurAccepte === 0 ? MENTION_AUCUNE_RELATION : MENTION_AUCUNE_RELATION_AU_LANCER}
					</p>
				) : (
					<div style={listeDejaEcritStyle}>
						{dejaEcritesGelees.map((relation, i) => (
							<div key={i}>
								<span style={eyebrowStyle}>{EYEBROW_ENVERS}</span>
								<span style={designationDetenteurStyle}>{designationPour(relation.cibleId)}</span>
								<div style={blocLectureRepliqueStyle}>{relation.lien}</div>
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
			{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.echec)}</p>}
			{demande.etat.phase === 'proposition' && (
				<div style={listeDetenteursStyle}>
					{ajouts.map((ajout, i) => (
						<div key={ajout.cibleId} style={i > 0 ? separateurLigneStyle : undefined}>
							<span style={eyebrowStyle}>{eyebrowRelationProposee(i + 1)}</span>
							<LigneRelation
								ref={(handle) => {
									if (handle) lignesRef.current.set(ajout.cibleId, handle)
									else lignesRef.current.delete(ajout.cibleId)
								}}
								designation={designationPour(ajout.cibleId)}
								lien={ajout.lien}
								decision={decisions[ajout.cibleId]}
								onAccepter={() => handleAccepter(ajout.cibleId, ajout.lien)}
								onRejeter={() => handleRejeter(ajout.cibleId)}
								onOuvrirFiche={() => onSelectSection('personnages')}
							/>
						</div>
					))}
				</div>
			)}
			<p style={mentionStyle}>{MENTION_RELATION_CREEE}</p>
			{porteurDisparu && <p style={refusSyncStyle}>{TEXTE_PORTEUR_DISPARU}</p>}
			{refusEcriture !== null && <IssueList issues={refusEcriture} />}
		</CarteAssistant>
	)
}
