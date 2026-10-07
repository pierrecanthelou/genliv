import { useRef, useState, useMemo, type CSSProperties } from 'react'
import {
	ouvrirSession,
	analyserSaisie,
	destinationsPossibles,
	executerCommande,
	fixerHeros,
	jouerPosture,
	cloreCombat,
	fuirRencontre,
	type Dossier,
	type EtatSession,
} from '../../../brain'
import { IconButton } from '../../../brain/components/IconButton'
import { Badge } from '../../../brain/components/Badge'
import { Modal } from '../../../brain/components/Modal'
import { useSessionPersistee } from '../hooks/useSessionPersistee'
import { useTourDeJeu } from '../hooks/useTourDeJeu'
import { OutcomeBlock } from './OutcomeBlock'
import { BandeauHeros } from './BandeauHeros'
import { CadrePartie } from './CadrePartie'
import { CarnetIndices } from './CarnetIndices'
import { EcranCreationHeros } from './EcranCreationHeros'
import { EcranFin } from './EcranFin'
import { EcranMort } from './EcranMort'
import { ConsoleCommandes } from './ConsoleCommandes'
import { PlayerInputBar } from './PlayerInputBar'
import { JournalRow } from './JournalRow'
import { CarteJet } from './CarteJet'
import { CombatEnCours } from './CombatEnCours'
import { EcranRefus } from './EcranRefus'
import { rejouerCombat, bilanDe, ouvrirRencontreSiDue } from '../../../player/engine/rencontre'
import { finAtteinte, type FinAtteinte } from '../../../player/engine/fin'
import type { Posture } from '../../../brain/combat'

const ENTETE_OUVERTURE = 'OUVERTURE — lue au joueur, mot pour mot'
const LIBELLE_JOURNAL = 'Journal'
const TEXTE_REFUS_CONSOLE_EN_COURS = "Une action est déjà en cours — attendez la fin avant d'en tenter une nouvelle."
const TEXTE_JOURNAL_VIDE = "Aucun évènement pour l'instant — vos actions y apparaîtront."

export interface PartieEnCoursProps {
	readonly dossier: Dossier
	readonly dossierId: string
	readonly session: EtatSession
	readonly onNouvellePartie: () => void
}

/**
 * GARDES 4 ET 5 — la graine tirée puis la session ouverte, une fois.
 * Appelée par EcranPartie via AiguillagePartie avec tirerGraine en prop.
 */
export interface PartieDemarreeProps {
	readonly dossier: Dossier
	readonly dossierId: string
	readonly tirerGraine: () => number
	readonly onNouvellePartie: () => void
}

export function PartieDemarree({
	dossier,
	dossierId,
	tirerGraine,
	onNouvellePartie,
}: PartieDemarreeProps): JSX.Element {
	const [graine] = useState(() => tirerGraine())
	const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea: graine }))

	if (!ouverture.ok) {
		return <EcranRefus code={ouverture.refus} titre={dossier.titre} dossierId={dossierId} />
	}

	return (
		<PartieEnCours
			dossier={dossier}
			dossierId={dossierId}
			session={ouverture.session}
			onNouvellePartie={onNouvellePartie}
		/>
	)
}

/**
 * Garde 6 — la partie ouverte : la bannière d'ouverture, la zone journal, la
 * console de commandes, et le champ de saisie libre (it1, `moteur-interprete`).
 *
 * n° 15 `moteur-fins`, it1 — AIGUILLAGE FIN : si finAtteinte rend un résultat,
 * on affiche EcranFin au lieu de la console/journal/saisie libre.
 */
export function PartieEnCours({
	dossier,
	dossierId,
	session: sessionInitiale,
	onNouvellePartie,
}: PartieEnCoursProps): JSX.Element {
	const [session, setSession] = useState(sessionInitiale)
	const [refus, setRefus] = useState<string | null>(null)
	const [carnetOuvert, setCarnetOuvert] = useState(false)
	const [dialogNouvellePartieOuvert, setDialogNouvellePartieOuvert] = useState(false)
	const boutonNouvellePartieRef = useRef<HTMLButtonElement>(null)
	useSessionPersistee(dossierId, session)

	// HOOK `useTourDeJeu` — orchestrateur du champ de saisie libre (it1), avec R3 (lot 2) et R2 (it2).
	const { executeAction, getGestelabel, avis, isLocked, issueNarrateur, pasEnCours, carteJet, lancerLeDe } =
		useTourDeJeu(dossier, session, (nouvelleSession) => {
			setSession(nouvelleSession)
		})

	// Le refus de VERROU s'efface au déverrouillage, calculé EN LIGNE (KR-013/113).
	const refusAffiche = refus === TEXTE_REFUS_CONSOLE_EN_COURS && !isLocked ? null : refus

	// REJEU DU COMBAT — calculé EN LIGNE, jamais un useEffect (KR-013/113).
	const combatRejeu = useMemo(() => {
		if (!session.combat) return null
		const result = rejouerCombat(session)
		return result.ok ? result.etat : null
	}, [session])

	const handleJouerRound = (posture: Posture): EtatSession => {
		const newSession = jouerPosture(session, posture)
		setSession(newSession)
		return newSession
	}

	const handleFuir = () => {
		const newSession = fuirRencontre(session)
		setSession(newSession)
	}

	const handleCloreCombat = () => {
		if (!combatRejeu) return
		const bilan = bilanDe(combatRejeu)
		if (!bilan) return
		const newSession = cloreCombat(session, bilan)
		setSession(newSession)
	}

	const nombreIndices = session.monde.indices_connus.length

	const actionsCarnetJsx = (
		<div style={groupeActionsCarnet}>
			<IconButton label="Carnet d'indices" onClick={() => setCarnetOuvert(true)} size={28}>
				🗝
			</IconButton>
			{nombreIndices > 0 && <Badge tone="neutral">{nombreIndices}</Badge>}
			<IconButton
				ref={boutonNouvellePartieRef}
				label="Nouvelle partie"
				onClick={() => setDialogNouvellePartieOuvert(true)}
				size={28}
			>
				↻
			</IconButton>
		</div>
	)

	const actif = session.horloge.climat_actif
	const climatNom = actif
		? dossier.monde.conditions.climat.find((c) => c.id === actif.id)?.nom || 'Sans nom'
		: undefined

	// GARDE 7 (it1, moteur-arbitre) — EN LIGNE, jamais un useEffect : session.heros
	// est soit présent soit absent, jamais un flag séparé à synchroniser (KR-013).
	if (session.heros === undefined) {
		return (
			<CadrePartie titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
				<EcranCreationHeros
					graine={session.graine_alea}
					onValider={(heros) => setSession(fixerHeros(session, heros))}
				/>
			</CadrePartie>
		)
	}

	// n° 15 `moteur-fins`, it1 — AIGUILLAGE FIN : si une fin est atteinte, afficher EcranFin.
	const fin: FinAtteinte | undefined = finAtteinte(dossier, session)

	if (fin) {
		const finDossier = dossier.charpente.fins.find((f) => f.id === fin.fin_id)
		const nomFin = finDossier?.nom ?? ''

		return (
			<CadrePartie titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
				<EcranFin fin={fin} nom={nomFin} onNouvellePartie={onNouvellePartie} />
			</CadrePartie>
		)
	}

	// n° 15 `moteur-fins`, it3 — MORT DU HÉROS : retour anticipé sans actionsEntete.
	// Fin et mort sont exclusives par construction (KR-303 : le combat bloque finAtteinte).
	if (combatRejeu?.outcome === 'hero-mort') {
		return (
			<CadrePartie
				titre={dossier.titre}
				sortie={{ name: 'dossier', dossierId }}
				bandeau={
					<BandeauHeros
						heros={session.heros}
						pas={session.horloge.tour}
						climatNom={climatNom}
						pvLive={Math.max(0, combatRejeu.heroPv)}
						peLive={combatRejeu.heroPe}
					/>
				}
			>
				<EcranMort nom={session.heros.name} log={combatRejeu.log} onNouvellePartie={onNouvellePartie} />
			</CadrePartie>
		)
	}

	/**
	 * LE CÂBLAGE DU CANAL CONSOLE (lot 2 : verrou étendu) : les deux fonctions pures
	 * que `brain/dossier/commandes.ts` possède (§ 5 du plan) :
	 * la console ne valide rien, elle soumet la chaîne BRUTE. `analyserSaisie` puis
	 * `executerCommande` sont les deux SEULS décideurs (T-14, KR-013).
	 */
	function handleSoumettreConsole(saisie: string): void {
		// Verrou étendu (lot 2, KR-265) — refuser les soumissions console pendant que
		// la chaîne R1→exécution→R3 est en vol
		if (pasEnCours()) {
			setRefus(TEXTE_REFUS_CONSOLE_EN_COURS)
			return
		}

		const analyse = analyserSaisie(saisie)
		if (!analyse.ok) {
			setRefus(analyse.message)
			return
		}

		const resultat = executerCommande(dossier, session, analyse.commande)
		if (!resultat.ok) {
			setRefus(resultat.message)
			return
		}

		const sessionApresRencontre = ouvrirRencontreSiDue(dossier, resultat.session)
		setSession(sessionApresRencontre)
		setRefus(null)
	}

	return (
		<>
			<CadrePartie
				titre={dossier.titre}
				sortie={{ name: 'dossier', dossierId }}
				bandeau={
					<BandeauHeros
						heros={session.heros}
						pas={session.horloge.tour}
						climatNom={climatNom}
						pvLive={combatRejeu?.heroPv}
						peLive={combatRejeu?.heroPe}
					/>
				}
				actionsEntete={actionsCarnetJsx}
			>
				<div style={colonneLecture}>
					{combatRejeu ? (
						<CombatEnCours
							dossier={dossier}
							session={session}
							etat={combatRejeu}
							onJouer={handleJouerRound}
							onFuir={handleFuir}
							onClore={handleCloreCombat}
						/>
					) : session.combat ? (
						<OutcomeBlock entete="ERREUR DE COMBAT">
							Le monstre référencé est introuvable — le combat ne peut pas être rejoué.
						</OutcomeBlock>
					) : (
						<>
							{/* LE SEUL NŒUD DE REGISTRE JOUEUR DE TOUT L'ÉCRAN. `lieu_courant` est un
							    IDENTIFIANT : il n'apparaît nulle part ici — le registre
							    développeur-débogueur vit dans le Journal et la Console (§ 3.F). */}
							<OutcomeBlock entete={ENTETE_OUVERTURE}>{dossier.charpente.depart.texte_ouverture_joueur}</OutcomeBlock>
							<section aria-label={LIBELLE_JOURNAL}>
								<span style={libelleZone}>JOURNAL</span>
								{session.journal.length === 0 ? (
									<div style={etatVide}>
										<span style={glypheVide} aria-hidden="true">
											⬚
										</span>
										<p style={texteVide}>{TEXTE_JOURNAL_VIDE}</p>
									</div>
								) : (
									<ul style={listeJournal}>
										{session.journal.map((entree, index) => (
											<JournalRow key={index} entree={entree} />
										))}
									</ul>
								)}
							</section>
							{/* CARTE DU JET (it2) — montée conditionnellement si une épreuve est proposée. */}
							{carteJet && <CarteJet carteJet={carteJet} onLancer={lancerLeDe} />}

							{/* DEUX CANAUX : console ET champ libre (it1), tous deux affichés (it2).
							    Console refusée pendant le pas (verrou R1→exécution→R3, KR-265). */}
							<ConsoleCommandes
								key={session.horloge.tour}
								onSoumettre={handleSoumettreConsole}
								refus={refusAffiche}
								destinations={destinationsPossibles(dossier, session)}
							/>
							<PlayerInputBar
								executeAction={executeAction}
								getGestelabel={getGestelabel}
								avis={avis}
								isLocked={isLocked}
								issueNarrateur={issueNarrateur}
								session={session}
								dossier={dossier}
							/>
						</>
					)}
				</div>
			</CadrePartie>
			{carnetOuvert && <CarnetIndices session={session} onClose={() => setCarnetOuvert(false)} />}
			{dialogNouvellePartieOuvert && (
				<Modal
					title="Abandonner la partie en cours"
					focusCancel={true}
					onCancel={() => {
						setDialogNouvellePartieOuvert(false)
						boutonNouvellePartieRef.current?.focus()
					}}
					cancelLabel="Annuler"
					confirmLabel="Nouvelle partie"
					confirmTone="error"
					onConfirm={() => {
						setDialogNouvellePartieOuvert(false)
						onNouvellePartie()
					}}
				>
					<p style={texteVide}>La progression de cette partie sera effacée. Le dossier n&apos;est pas modifié.</p>
				</Modal>
			)}
		</>
	)
}

const colonneLecture: CSSProperties = {
	maxWidth: 640,
	margin: '0 auto',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-9)',
}

const libelleZone: CSSProperties = {
	display: 'block',
	marginBottom: 'var(--space-4)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	color: 'var(--text-label)',
}

const etatVide: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
}

const glypheVide: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }

const texteVide: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }

const listeJournal: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }

const groupeActionsCarnet: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}
