import { useState, type CSSProperties } from 'react'
import {
	useBrain,
	controlerDossier,
	ouvrirSession,
	analyserSaisie,
	destinationsPossibles,
	executerCommande,
	type Dossier,
	type EtatSession,
} from '../../../brain'
import { useSessionPersistee } from '../hooks/useSessionPersistee'
import { OutcomeBlock } from './OutcomeBlock'
import { CadrePartie } from './CadrePartie'
import { EcranRefus } from './EcranRefus'
import { ConsoleCommandes } from './ConsoleCommandes'
import { JournalRow } from './JournalRow'

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
 * Garde 6 — la partie ouverte : la bannière d'ouverture, la zone journal et la
 * console de commandes.
 *
 * `session` TIENT UNE VALEUR INITIALE (`useState(sessionInitiale)`), jamais un
 * miroir : aucun `useEffect(() => setSession(...))` ne resynchronise quoi que ce
 * soit (KR-013/113) — l'état avance UNIQUEMENT par `handleSoumettre`, en réponse
 * directe à une soumission de la console.
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
	useSessionPersistee(dossierId, session)

	/**
	 * LE CÂBLAGE ENTIER, bâti sur les deux fonctions pures que `brain/dossier/commandes.ts`
	 * possède (§ 5 du plan) :
	 * la console ne valide rien, elle soumet la chaîne BRUTE. `analyserSaisie` puis
	 * `executerCommande` sont les deux SEULS décideurs (T-14, KR-013).
	 */
	function handleSoumettre(saisie: string): void {
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

		setSession(resultat.session)
		setRefus(null)
	}

	return (
		<CadrePartie titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
			<div style={colonneLecture}>
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
				{/* `key` sur le PAS : une commande ACCEPTÉE fait avancer `horloge.tour` et
				    remonte la console (champ vidé, focus repris) ; un REFUS ne consomme
				    aucun pas, la console garde son instance — donc la saisie fautive et le
				    focus survivent SANS code dédié (voir la docstring de `ConsoleCommandes`). */}
				<ConsoleCommandes
					key={session.horloge.tour}
					onSoumettre={handleSoumettre}
					refus={refus}
					destinations={destinationsPossibles(dossier, session)}
				/>
			</div>
		</CadrePartie>
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
