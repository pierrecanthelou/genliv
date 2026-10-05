import { useState, useMemo, type CSSProperties } from 'react'
import {
	useBrain,
	controlerDossier,
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
import { useSessionPersistee } from '../hooks/useSessionPersistee'
import { useTourDeJeu } from '../hooks/useTourDeJeu'
import { OutcomeBlock } from './OutcomeBlock'
import { BandeauHeros } from './BandeauHeros'
import { CadrePartie } from './CadrePartie'
import { CarnetIndices } from './CarnetIndices'
import { EcranCreationHeros } from './EcranCreationHeros'
import { EcranRefus } from './EcranRefus'
import { ConsoleCommandes } from './ConsoleCommandes'
import { PlayerInputBar } from './PlayerInputBar'
import { JournalRow } from './JournalRow'
import { CarteJet } from './CarteJet'
import { CombatEnCours } from './CombatEnCours'
import { rejouerCombat, bilanDe, ouvrirRencontreSiDue } from '../../../player/engine/rencontre'
import type { Posture } from '../../../brain/combat'

/**
 * LE SHELL DE PARTIE — la route `partie`, montée par la racine de composition.
 *
 * ANATOMIE REPRISE DE `PlayerModal.tsx` (même répertoire), JAMAIS IMPORTÉE, et la
 * différence est le point : `PlayerModal` est une MODALE (`role="dialog"`,
 * `aria-modal`, superposée à l'éditeur) ; ceci est une ROUTE, donc une PAGE —
 * `<main>`, ni `role="dialog"`, ni `aria-modal`, ni ombre (les ombres sont
 * réservées aux menus et aux modales). La règle « le focus revient au déclencheur
 * à la fermeture » ne s'applique pas : ce n'est pas une fermeture, c'est une
 * navigation, et la route démonte le déclencheur. Aucun focus impératif au
 * montage, aucun piège à focus : ce n'est pas une omission.
 *
 * ORDRE DES GARDES, NORMATIF (§ 5 du plan d'itération 1) :
 *  1. le dossier est GELÉ à l'ouverture ;
 *  2. absent → refus `dossier_introuvable` ;
 *  3. non jouable → refus `dossier_non_jouable` (KR-239) ;
 *  4. graine tirée puis session ouverte, une fois ;
 *  5. ouverture refusée → refus `ouverture_a_ecrire` ;
 *  6. sinon : header, bannière d'ouverture, zone journal, console (itération 2).
 *
 * Les gardes 4 et 5 vivent dans des composants internes parce que les règles des
 * hooks interdisent d'appeler `useState` après un `return` conditionnel — même
 * découpage que `PlayerModal` / `PlayerModalInner`.
 *
 * SCINDÉ à l'itération 2 (KR-112, 388 lignes mesurées, à 12 du signal) : `CadrePartie`
 * part dans `CadrePartie.tsx`, les trois refus dans `EcranRefus.tsx` — un
 * composant par fichier. Ce module garde le shell, ses trois gardes, et
 * `PartieEnCours`, qui gagne le câblage de la console de commandes.
 */

const ENTETE_OUVERTURE = 'OUVERTURE — lue au joueur, mot pour mot'
const LIBELLE_JOURNAL = 'Journal'
const TEXTE_REFUS_CONSOLE_EN_COURS = "Une action est déjà en cours — attendez la fin avant d'en tenter une nouvelle."

/**
 * Au FUTUR, et c'est voulu : vrai en it1 où l'auteur ne peut encore rien faire,
 * vrai en it2 où la console lui donnera un verbe. Un texte transitoire pour it1
 * serait réécrit dans un mois. Forme maison `Aucun X — <invitation>.`
 */
const TEXTE_JOURNAL_VIDE = "Aucun évènement pour l'instant — vos actions y apparaîtront."

/**
 * LA SEULE ENTROPIE DE LA FEATURE, et elle est NOMMÉE : un `Math.random()`
 * anonyme en ligne serait intirable par un test (§ 8, D-16 — précédent du `rng`
 * non semé de `combat.ts:107`). `ouvrirSession` n'en tire aucune : sa graine est
 * REQUISE et INJECTÉE, faute de quoi la promesse de rejeu de la n° 11 ne
 * tiendrait pour aucune session née ici.
 */
const GRAINE_MAX = 2 ** 32
export function tirerGraine(): number {
	return Math.floor(Math.random() * GRAINE_MAX)
}

export interface EcranPartieProps {
	dossierId: string
}

export function EcranPartie({ dossierId }: EcranPartieProps): JSX.Element {
	const { dossiers } = useBrain()
	// GARDE 1 — LE DOSSIER EST GELÉ À L'OUVERTURE (arbitrage n° 7). Surtout PAS
	// `useOpenDossier`, qui s'abonne à `dossier:updated` : le voisin
	// `DossierEditorScreen` fait l'inverse, et il a raison de le faire, mais une
	// partie qui adopterait une édition en cours de route rouvrirait la porte
	// KR-239 après l'avoir passée (§ 8, D-20).
	const [dossier] = useState(() => dossiers.get(dossierId))

	// GARDE 2 — `DossierService.get` rend `null` (jamais `undefined`) pour un
	// dossier absent ou devenu illisible.
	if (dossier === null) {
		return <EcranRefus code="dossier_introuvable" titre={null} dossierId={dossierId} />
	}

	// GARDE 3 — EN LIGNE, à chaque rendu, jamais un `useMemo` ni un miroir
	// (KR-013/113). LA PORTE EST ICI, pas seulement au CTA : la route `partie` est
	// un chemin d'accès DIRECT, et tout chemin qui ouvre une session sans repasser
	// par `jouable` rouvre le faux positif que l'évaluateur d'it3 hériterait
	// (KR-239). C'est la FEATURE qui lit `controlerDossier` — jamais `src/player/`,
	// jamais `brain/dossier/` : le linter de l'éditeur n'entre pas dans le bundle
	// extractible (§ 8, D-21).
	const { jouable } = controlerDossier(dossier)
	if (!jouable) {
		return <EcranRefus code="dossier_non_jouable" titre={dossier.titre} dossierId={dossierId} />
	}

	return <PartieDemarree dossier={dossier} dossierId={dossierId} />
}

/** Gardes 4 et 5 — la graine puis l'ouverture, tirées UNE FOIS pour le montage. */
function PartieDemarree({ dossier, dossierId }: { dossier: Dossier; dossierId: string }): JSX.Element {
	const [graine] = useState(() => tirerGraine())
	const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea: graine }))

	if (!ouverture.ok) {
		return <EcranRefus code={ouverture.refus} titre={dossier.titre} dossierId={dossierId} />
	}

	return <PartieEnCours dossier={dossier} dossierId={dossierId} session={ouverture.session} />
}

/**
 * Garde 6 — la partie ouverte : la bannière d'ouverture, la zone journal, la
 * console de commandes, et le champ de saisie libre (it1, `moteur-interprete`).
 *
 * `session` TIENT UNE VALEUR INITIALE (`useState(sessionInitiale)`), jamais un
 * miroir : aucun `useEffect(() => setSession(...))` ne resynchronise quoi que ce
 * soit (KR-013/113) — l'état avance UNIQUEMENT par les deux submiteurs (console
 * ou champ libre), en réponse directe à une soumission de l'utilisateur.
 *
 * DEUX CANAUX INDÉPENDANTS (it1), AVEC EXCLUSION MUTUELLE DEPUIS LOT 2 (it2) — console
 * refusée par un verrou étendu R1→exécution→R3 (KR-265) :
 *  · `ConsoleCommandes` — analyse syntaxique stricte (verbe + direction), écrit
 *    directement `session` du parent via `handleSoumettreConsole` ; refusée si verrou actif.
 *  · `PlayerInputBar` (neuf en it1) — saisie libre, via `useTourDeJeu`, qui lit CE
 *    `session` À CHAQUE RENDU (jamais une copie) : c'est ce qui rend les deux
 *    canaux cohérents l'un avec l'autre quand les deux sont actifs (KR-013).
 *
 * `useSessionPersistee` reçoit la session courante à chaque mutation — aucune
 * déflexion entre console/champ libre, même persistance.
 */
function PartieEnCours({
	dossier,
	dossierId,
	session: sessionInitiale,
}: {
	dossier: Dossier
	dossierId: string
	session: EtatSession
}): JSX.Element {
	const [session, setSession] = useState(sessionInitiale)
	const [refus, setRefus] = useState<string | null>(null)
	const [carnetOuvert, setCarnetOuvert] = useState(false)
	useSessionPersistee(dossierId, session)

	// HOOK `useTourDeJeu` — orchestrateur du champ de saisie libre (it1), avec R3 (lot 2) et R2 (it2).
	const { executeAction, getGestelabel, avis, isLocked, issueNarrateur, pasEnCours, carteJet, lancerLeDe } =
		useTourDeJeu(dossier, session, (nouvelleSession) => {
			setSession(nouvelleSession)
		})

	// LOT 2 — Le refus de VERROU s'efface au déverrouillage, calculé EN LIGNE (KR-013/113,
	// jamais un useEffect qui mirerait `isLocked` dans un second `setState` — un effet ainsi
	// posé efface INDISCRIMINÉMENT tout refus, y compris une erreur de syntaxe ou une
	// destination inconnue posée pendant que le verrou est déjà relâché, BUG-133). Les
	// refus de syntaxe/destination, posés par `handleSoumettreConsole` hors verrou, restent
	// affichés jusqu'à la prochaine soumission — seul CE texte précis est un artefact du
	// verrou et n'a plus de sens une fois celui-ci relâché.
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

	// Composant interne — Actions du carnet (bouton 🗝 + badge compteur)
	function ActionsCarnet(): JSX.Element {
		const nombreIndices = session.monde.indices_connus.length
		return (
			<div style={groupeActionsCarnet}>
				<IconButton label="Carnet d'indices" onClick={() => setCarnetOuvert(true)} size={28}>
					🗝
				</IconButton>
				{nombreIndices > 0 && <Badge tone="neutral">{nombreIndices}</Badge>}
			</div>
		)
	}

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

	/**
	 * LE CÂBLAGE DU CANAL CONSOLE (lot 2 : verrou étendu) : les deux fonctions pures
	 * que `brain/dossier/commandes.ts` possède (§ 5 du plan) :
	 * la console ne valide rien, elle soumet la chaîne BRUTE. `analyserSaisie` puis
	 * `executerCommande` sont les deux SEULS décideurs (T-14, KR-013).
	 *
	 * LOT 2 : REFUS PENDANT LE VERROU R1→exécution→R3. Un pas en cours (R1 ou R3 en vol)
	 * refuse la console de façon visible (via `refus`) — jamais une perte silencieuse
	 * (KR-265).
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
				bandeau={<BandeauHeros heros={session.heros} pvLive={combatRejeu?.heroPv} peLive={combatRejeu?.heroPe} />}
				actionsEntete={<ActionsCarnet />}
			>
				<div style={colonneLecture}>
					{/* COMBAT EN COURS — remplace la console et le journal pendant le combat. */}
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
										{/* L'INDEX EST LA CLÉ STABLE, et c'est le journal qui le rend vrai : il est
									    APPEND-ONLY — jamais réordonné, jamais filtré, jamais inséré au milieu.
									    Surtout PAS `${entree.tour}-${entree.role}` : `§ J1` de `REGLES-PLAY.md`,
									    écrit par cette même tranche, dit qu'une conséquence enchaînée par le
									    moteur n'ajoute AUCUN pas — deux entrées `moteur` du même pas arrivent
									    donc dès it3 (jalons), et cette clé s'y dupliquerait. Un champ `seq`
									    persisté serait un dérivable stocké (KR-013). */}
										{session.journal.map((entree, index) => (
											<JournalRow key={index} entree={entree} />
										))}
									</ul>
								)}
							</section>
							{/* CARTE DU JET (it2) — montée conditionnellement si une épreuve est proposée,
						    jamais si R2 absent, sans_epreuve, ou erreur (KR-013). */}
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
		</>
	)
}

// `640` est la seule mesure de ligne brute de cet écran (colonne de lecture),
// sans jeton au système — précédent `PanneauControles.tsx:77`.
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
