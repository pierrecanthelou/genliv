import { useRef, useState } from 'react'
import {
	useBrain,
	IssueList,
	frapperIdentifiant,
	PORTEE_INITIALE,
	LIBELLE_DES_CHAMPS,
	type CibleDistribution,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type Personnage,
	type PropositionDistribution,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer, type BarreLancerHandle } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneFichePersonnage, type LigneFichePersonnageHandle } from './LigneFichePersonnage'
import {
	CARD3_CORPS,
	CARD3_TITRE,
	eyebrowPersonnagePropose,
	MENTION_PERSONNAGE_SANS_NOM,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_TROP_LONG_DISTRIBUTION,
	texteRefusAEcrire,
	TITRE_COPILOTE_NON_CONFIGURE,
} from '../textes'
import { listeDetenteursStyle, mentionStyle, refusSyncStyle, separateurLigneStyle } from './styles'

export interface CarteEclaterSynopsisProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'monde-distribution' as const

/** Les textes de refus/échec DE CE RÔLE. ⚠ `'cible-a-ecrire'` et
 *  `'aucun-candidat'` sont INATTEIGNABLES ici — ce rôle n'a pas d'entité
 *  cible, et un monde de personnages vide en est le cas NOMINAL (§ 4.3 du
 *  plan) — le catch-all leur sert un texte commun avec `'trop-long'`, même
 *  patron que `CarteCompleterFiche` sur ses propres motifs inatteignables. */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	return TEXTE_REFUS_TROP_LONG_DISTRIBUTION
}

/**
 * Carte 3 « Éclater le synopsis » — activée à l'itération 4, LE SEUL
 * ASSISTANT QUI CRÉE : les cinq précédents écrivent dans une entité qui
 * existe déjà, celui-ci frappe un personnage neuf à chaque acceptation.
 *
 * ⚠ PAS DE `Select` DE CIBLAGE (§ 3.2 du plan) : cette carte ne désigne aucune
 * entité existante, sa source est `canon.*` — la cible réseau est à CHARGE
 * VIDE (`CibleDistribution { role }`, aucun autre champ).
 *
 * ⚠ CLÉ REACT ET CLÉ DE `decisions` : LA POSITION, jamais un identifiant — il
 * n'en existe aucun avant l'acceptation. Stable parce que `ajouts` est figé
 * pour la durée de la proposition (`demande.etat`, jamais re-dérivé).
 *
 * ⚠ L'IDENTIFIANT EST FRAPPÉ DANS `handleAccepter`, JAMAIS AVANT — ni au
 * rendu, ni dans un `useMemo` de précalcul : `FicheBrouillon` n'est pas
 * assignable à `Personnage` (invariant de compilation), mais `tsc` ne tient
 * que la FORME du brouillon, jamais le MOMENT où l'identifiant est frappé —
 * c'est pourquoi le site d'appel est l'objet d'un espion dédié côté test
 * (§ 8, désaccord n° 7 du plan).
 *
 * LA RECETTE D'ACCEPTATION (§ 5 du plan, mot pour mot) : SIX clés écrites,
 * `{ ...brouillon }` INTERDIT — un spread superficiel porterait `but` PAR
 * RÉFÉRENCE, partagé entre l'état d'écran et le document. `nom` est ABSENT,
 * jamais semé (KR-221, KR-195) : personne ne nomme le brouillon, et c'est la
 * PARITÉ avec la création manuelle d'un personnage.
 */
export function CarteEclaterSynopsis({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteEclaterSynopsisProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CibleDistribution, PropositionDistribution>((cible, signal) =>
		copilote.demander(dossier, cible, signal),
	)

	const [decisions, setDecisions] = useState<Record<number, 'acceptee' | 'rejetee'>>({})
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)

	const lignesRef = useRef<Map<number, LigneFichePersonnageHandle>>(new Map())
	const barreRef = useRef<BarreLancerHandle>(null)

	const enCours = demande.etat.phase === 'en-cours'
	// AUCUNE désactivation « aucun personnage » : ce rôle n'a pas d'entité
	// cible, et un monde vide est son cas NOMINAL (§ 4.3 du plan).
	const desactive = indisponible
	const titreDesactive = indisponible ? TITRE_COPILOTE_NON_CONFIGURE : undefined

	const ajouts = demande.etat.phase === 'proposition' ? demande.etat.proposition.ajouts : []

	function handleLancer(): void {
		setDecisions({})
		setRefusEcriture(null)
		demande.lancer({ role: ROLE })
	}

	// Le focus IMPÉRATIF post-décision (§ 3.5) : la prochaine ligne NON
	// DÉCIDÉE, sinon retour sur « Lancer » — aucune cible n'est jamais
	// désactivée par ce rendu (pas de plafond, § 8 n° 6), donc BUG-109 est
	// sans objet ici. `decisionsApres` est calculé par l'appelant, jamais relu
	// de l'état (`setDecisions` est asynchrone).
	function focoApresDecision(decideIndex: number, decisionsApres: Record<number, 'acceptee' | 'rejetee'>): void {
		const suivant = ajouts.findIndex((_, i) => i !== decideIndex && decisionsApres[i] === undefined)
		if (suivant !== -1) lignesRef.current.get(suivant)?.focusAccepter()
		else barreRef.current?.focusLancer()
	}

	function handleAccepter(index: number): void {
		const brouillon = ajouts[index]
		if (brouillon === undefined) return
		// LA RECETTE D'ACCEPTATION, mot pour mot (§ 5 du plan) : SIX clés,
		// `frapperIdentifiant` appelé ICI et nulle part ailleurs.
		const nouveau: Personnage = {
			id: frapperIdentifiant('pnj'),
			portee: PORTEE_INITIALE,
			plan_actions: [],
			savoirs: [],
			fonction: brouillon.fonction,
			but: { libelle: brouillon.but.libelle },
		}
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 7) :
		// jamais `{ ...brouillon }` étalé (aggraverait le motif par imbrication,
		// `but` serait partagé PAR RÉFÉRENCE avec l'état d'écran).
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, personnages: [...d.monde.personnages, nouveau] },
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			const decisionsApres = { ...decisions, [index]: 'acceptee' as const }
			setDecisions(decisionsApres)
			focoApresDecision(index, decisionsApres)
		} else if (resultat.statut === 'refuse') {
			// Cas NOMINAL (KR-234), pas une branche d'erreur : rien n'est
			// persisté, la proposition reste affichée.
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(index: number): void {
		const decisionsApres = { ...decisions, [index]: 'rejetee' as const }
		setDecisions(decisionsApres)
		focoApresDecision(index, decisionsApres)
	}

	return (
		<CarteAssistant titre={CARD3_TITRE} corps={CARD3_CORPS}>
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
						<div key={i} style={i > 0 ? separateurLigneStyle : undefined}>
							<LigneFichePersonnage
								ref={(handle) => {
									if (handle) lignesRef.current.set(i, handle)
									else lignesRef.current.delete(i)
								}}
								eyebrow={eyebrowPersonnagePropose(i + 1)}
								champs={[
									{ label: LIBELLE_DES_CHAMPS['monde.personnages[].fonction'].libelle, valeur: ajout.fonction },
									{ label: LIBELLE_DES_CHAMPS['monde.personnages[].but.libelle'].libelle, valeur: ajout.but.libelle },
								]}
								decision={decisions[i]}
								onAccepter={() => handleAccepter(i)}
								onRejeter={() => handleRejeter(i)}
								onOuvrirFiche={() => onSelectSection('personnages')}
							/>
						</div>
					))}
				</div>
			)}
			{/* MENTION PERMANENTE (§ 3.2 du plan) : jamais conditionnelle à une
			    acceptation — l'auteur doit le savoir AVANT d'accepter. */}
			<p style={mentionStyle}>{MENTION_PERSONNAGE_SANS_NOM}</p>
			{refusEcriture !== null && <IssueList issues={refusEcriture} />}
		</CarteAssistant>
	)
}
