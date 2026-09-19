import { useRef, useState } from 'react'
import {
	useBrain,
	Badge,
	IssueList,
	Select,
	controlerDossier,
	localiserEntite,
	pastilleNiveau,
	CERTITUDE_INITIALE,
	LIBELLE_DES_CHAMPS,
	type CibleIndice,
	type Controle,
	type Dossier,
	type DossierIssue,
	type EchecCopilote,
	type PropositionDetenteurs,
	type SectionId,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'
import { BarreLancer, type BarreLancerHandle } from './BarreLancer'
import { CarteAssistant } from './CarteAssistant'
import { LigneDetenteur, type LigneDetenteurHandle } from './LigneDetenteur'
import {
	CARD2_CORPS_ACTIF,
	CARD2_TITRE,
	LABEL_INDICE,
	MENTION_RELANCE_SANS_MEMOIRE,
	MENTION_SAVOIR_CREE,
	OPTION_AUCUN_INDICE_SIGNALE,
	TEXTE_AUCUN_DETENTEUR_TROUVE,
	TEXTE_ILLISIBLE,
	TEXTE_INDISPONIBLE,
	TEXTE_REFUS_AUCUN_CANDIDAT,
	TEXTE_REFUS_CIBLE_A_ECRIRE,
	TEXTE_REFUS_TROP_LONG_DETENTEURS,
	texteRefusAEcrire,
	TITRE_AUCUN_INDICE_SIGNALE,
	TITRE_INDICE_PLUS_SIGNALE,
	TITRE_AUCUN_PERSONNAGE,
	TITRE_COPILOTE_NON_CONFIGURE,
} from '../textes'
import { ligneContexteStyle, listeDetenteursStyle, mentionStyle, refusSyncStyle, separateurLigneStyle } from './styles'

export interface CarteTisserIndicesProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}

const ROLE = 'indice-detenteurs' as const

/** Un constat `indice-sans-source` dont l'`entityId` est défini — la règle qui
 *  le produit le pose TOUJOURS (`controles.ts`), mais `ConstatControle.entityId`
 *  reste `string | undefined` au type : ce garde ferme la portée plutôt que de
 *  recourir à un `as` après coup (KR-175). */
type ConstatIdentifie = Controle & { entityId: string }

function estIndiceSansSourceIdentifie(c: Controle): c is ConstatIdentifie {
	return c.id === 'indice-sans-source' && c.entityId !== undefined
}

/** Les textes de refus/échec DE CE RÔLE — dispatch complet des QUATRE motifs de
 *  `MotifRefusContexte` (§ 3.2, point 7 du plan it2). */
function texteEchec(echec: EchecCopilote): string {
	if (echec.statut === 'illisible') return TEXTE_ILLISIBLE
	if (echec.statut === 'indisponible') return TEXTE_INDISPONIBLE
	if (echec.motif === 'a-ecrire') return texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
	if (echec.motif === 'cible-a-ecrire') return TEXTE_REFUS_CIBLE_A_ECRIRE
	if (echec.motif === 'aucun-candidat') return TEXTE_REFUS_AUCUN_CANDIDAT
	return TEXTE_REFUS_TROP_LONG_DETENTEURS
}

interface ContexteGele {
	indiceId: string
	constat: ConstatIdentifie
	options: readonly ConstatIdentifie[]
}

/**
 * Carte 2 « Tisser les indices » — activée à cette itération. Même discipline
 * que `CarteCompleterFiche` (état d'écran calculé au rendu, KR-013/113), plus
 * DEUX mécanismes neufs : le GEL (§ 3.6) et le focus post-décision PAR LIGNE
 * (§ 3.5).
 *
 * LE GEL : le constat sélectionné et la liste d'options affichée sont figés au
 * clic « Lancer » (`contexteGele`), jamais re-dérivés au rendu. Motif : accepter
 * un détenteur écrit un `Savoir` sans porte, donc immédiatement ouvert ; si le
 * dossier n'avait qu'un ou deux producteurs, l'indice PEUT quitter la liste des
 * constats `indice-sans-source` PENDANT que l'auteur décide encore une autre
 * ligne de la même proposition (BUG-097, généralisé ici à un second état gelé).
 */
export function CarteTisserIndices({
	dossierId,
	dossier,
	indisponible,
	onSelectSection,
}: CarteTisserIndicesProps): JSX.Element {
	const { copilote, dossiers } = useBrain()
	const demande = useDemandeCopilote<CibleIndice, PropositionDetenteurs>((cible, signal) =>
		copilote.demander(dossier, cible, signal),
	)

	const [constatIdChoisi, setConstatIdChoisi] = useState<string | null>(null)
	const [contexteGele, setContexteGele] = useState<ContexteGele | null>(null)
	const [decisions, setDecisions] = useState<Record<string, 'acceptee' | 'rejetee'>>({})
	const [refusEcriture, setRefusEcriture] = useState<DossierIssue[] | null>(null)

	const lignesRef = useRef<Map<string, LigneDetenteurHandle>>(new Map())
	const barreRef = useRef<BarreLancerHandle>(null)

	const constatsLive = controlerDossier(dossier).controles.filter(estIndiceSansSourceIdentifie)
	const aucunPersonnage = dossier.monde.personnages.length === 0
	const aucunConstat = constatsLive.length === 0
	// LA CIBLE GELÉE PRIME SUR LA SÉLECTION VIVE, et c'est la TROISIÈME valeur que
	// le gel du § 3.6 doit couvrir — les options et la ligne de contexte ne
	// suffisent pas. `constatsLive` vient de `controlerDossier(dossier)`, donc d'un
	// abonnement réveillé par `dossier:updated`, c'est-à-dire par L'ACCEPTATION
	// ELLE-MÊME. Sans cette priorité, accepter un détenteur fait quitter l'indice
	// de `constatsLive` et : à un seul constat, `constatId` devient `''`, valeur
	// qu'aucune `<option>` ne porte, donc `selectedIndex = -1` et le champ INDICE
	// s'affiche VIDE pendant que la proposition reste à l'écran ; à deux constats,
	// il bascule SILENCIEUSEMENT sur le suivant et le Select nomme une autre cible
	// que celle que la carte sert. Rien ne corrompt — `handleAccepter` lit
	// `contexteGele.indiceId` — mais l'écran ment. Famille BUG-097 (it1), où le même
	// abonnement recalculait `valeurAvant` sur l'effet de bord de son propre geste.
	const constatId = contexteGele?.indiceId ?? constatIdChoisi ?? constatsLive[0]?.entityId ?? ''
	// GELÉS s'il existe un `contexteGele` (post-Lancer), LIVE sinon (avant le
	// premier lancer de la session) — jamais re-dérivés une fois gelés.
	const constatAffiche = contexteGele?.constat ?? constatsLive.find((c) => c.entityId === constatId)
	const optionsAffichees = contexteGele?.options ?? constatsLive
	// La cible sélectionnée est-elle ENCORE signalée ? Après une acceptation, la
	// cible gelée peut avoir quitté `constatsLive` : « Lancer » ferait alors un
	// `find` infructueux et rendrait la main SANS AUCUN RETOUR D'ÉCRAN — un CTA
	// primaire actif qui ne fait rien.
	const constatVivant = constatsLive.some((c) => c.entityId === constatId)

	const enCours = demande.etat.phase === 'en-cours'
	const desactive = indisponible || aucunPersonnage || aucunConstat || !constatVivant
	const titreDesactive = indisponible
		? TITRE_COPILOTE_NON_CONFIGURE
		: aucunPersonnage
			? TITRE_AUCUN_PERSONNAGE
			: aucunConstat
				? TITRE_AUCUN_INDICE_SIGNALE
				: !constatVivant
					? TITRE_INDICE_PLUS_SIGNALE
					: undefined

	const personnageIds = demande.etat.phase === 'proposition' ? demande.etat.proposition.personnageIds : []

	// CHANGER DE CIBLE ABANDONNE LA PROPOSITION EN COURS : elle appartient à un
	// autre indice. C'est la contrepartie de la priorité du gel sur `constatId`
	// ci-dessus — sans elle, la cible gelée primerait sur le choix de l'auteur et
	// le `Select` paraîtrait BLOQUÉ. Le dégel est donc un geste explicite de
	// l'auteur, jamais un effet de bord d'une écriture.
	function handleChangerConstat(id: string): void {
		setConstatIdChoisi(id)
		setContexteGele(null)
		setDecisions({})
		setRefusEcriture(null)
		demande.annuler()
	}

	function handleLancer(): void {
		const constat = constatsLive.find((c) => c.entityId === constatId)
		if (constat === undefined) return
		setContexteGele({ indiceId: constat.entityId, constat, options: constatsLive })
		setDecisions({})
		setRefusEcriture(null)
		demande.lancer({ role: ROLE, indiceId: constat.entityId })
	}

	// Le focus IMPÉRATIF post-décision (§ 3.5) : la prochaine ligne NON DÉCIDÉE,
	// sinon retour sur Lancer. `decisionsApres` est calculé par l'appelant plutôt
	// que relu depuis l'état — `setDecisions` est asynchrone, et l'état React
	// n'aurait pas encore la décision qu'on vient de prendre.
	function focoApresDecision(decideId: string, decisionsApres: Record<string, 'acceptee' | 'rejetee'>): void {
		const suivant = personnageIds.find((id) => id !== decideId && decisionsApres[id] === undefined)
		if (suivant !== undefined) lignesRef.current.get(suivant)?.focusAccepter()
		else barreRef.current?.focusLancer()
	}

	function handleAccepter(personnageId: string): void {
		if (contexteGele === null) return
		const indiceId = contexteGele.indiceId
		// L'ÉCRITURE PASSE UNIQUEMENT PAR `DossierService.update` (critère 7) : un
		// `Savoir` à EXACTEMENT deux clés, `certitude` = `CERTITUDE_INITIALE` —
		// même autorité que l'éditeur manuel, jamais choisie par le modèle.
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: {
				...d.monde,
				personnages: d.monde.personnages.map((p) =>
					p.id === personnageId
						? { ...p, savoirs: [...p.savoirs, { indice_id: indiceId, certitude: CERTITUDE_INITIALE }] }
						: p,
				),
			},
			charpente: d.charpente,
		}))
		if (resultat.statut === 'ecrit') {
			setRefusEcriture(null)
			const decisionsApres = { ...decisions, [personnageId]: 'acceptee' as const }
			setDecisions(decisionsApres)
			focoApresDecision(personnageId, decisionsApres)
		} else if (resultat.statut === 'refuse') {
			// Cas NOMINAL (KR-234), pas une branche d'erreur : la référence orpheline
			// « en course » (indice supprimé entre proposition et acceptation) refuse
			// ici — rien n'est persisté, la ligne reste NON DÉCIDÉE.
			setRefusEcriture(resultat.errors)
		}
	}

	function handleRejeter(personnageId: string): void {
		const decisionsApres = { ...decisions, [personnageId]: 'rejetee' as const }
		setDecisions(decisionsApres)
		focoApresDecision(personnageId, decisionsApres)
	}

	return (
		<CarteAssistant titre={CARD2_TITRE} corps={CARD2_CORPS_ACTIF}>
			<p style={mentionStyle}>{MENTION_SAVOIR_CREE}</p>
			<Select
				label={LABEL_INDICE}
				value={constatId}
				onChange={handleChangerConstat}
				options={
					// LES OPTIONS GELÉES (§ 3.6) : `optionsAffichees` reste celle du dernier
					// clic « Lancer », jamais re-dérivée de `aucunConstat` (LIVE) — sinon un
					// détenteur accepté ferait retomber le Select sur « Aucun indice signalé »
					// pendant que la proposition qu'il vient d'accepter reste à l'écran.
					optionsAffichees.length === 0
						? [{ value: '', label: OPTION_AUCUN_INDICE_SIGNALE }]
						: optionsAffichees.map((c) => ({ value: c.entityId, label: c.location }))
				}
			/>
			{constatAffiche !== undefined && (
				<div style={ligneContexteStyle}>
					<Badge tone={pastilleNiveau(constatAffiche.niveau).tone}>{pastilleNiveau(constatAffiche.niveau).texte}</Badge>
					<p style={refusSyncStyle}>{constatAffiche.message}</p>
				</div>
			)}
			<BarreLancer
				ref={barreRef}
				enCours={enCours}
				desactive={desactive}
				titreDesactive={titreDesactive}
				onLancer={handleLancer}
				onAnnuler={demande.annuler}
			/>
			<p style={mentionStyle}>{MENTION_RELANCE_SANS_MEMOIRE}</p>
			{demande.etat.phase === 'echec' && <p style={refusSyncStyle}>⊘ {texteEchec(demande.etat.echec)}</p>}
			{demande.etat.phase === 'proposition' &&
				(personnageIds.length === 0 ? (
					<p style={refusSyncStyle}>{TEXTE_AUCUN_DETENTEUR_TROUVE}</p>
				) : (
					<div style={listeDetenteursStyle}>
						{personnageIds.map((id, i) => {
							const index = dossier.monde.personnages.findIndex((p) => p.id === id)
							const personnage = dossier.monde.personnages[index]
							if (personnage === undefined) return null
							return (
								<div key={id} style={i > 0 ? separateurLigneStyle : undefined}>
									<LigneDetenteur
										ref={(handle) => {
											if (handle) lignesRef.current.set(id, handle)
											else lignesRef.current.delete(id)
										}}
										designation={localiserEntite('pnj', personnage, index)}
										decision={decisions[id]}
										onAccepter={() => handleAccepter(id)}
										onRejeter={() => handleRejeter(id)}
										onOuvrirFiche={() => onSelectSection('personnages')}
									/>
								</div>
							)
						})}
					</div>
				))}
			{refusEcriture !== null && <IssueList issues={refusEcriture} />}
		</CarteAssistant>
	)
}
