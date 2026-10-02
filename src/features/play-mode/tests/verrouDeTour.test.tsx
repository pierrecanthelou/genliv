import fs from 'fs'
import path from 'path'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	controlerDossier,
	BrainProvider,
	type Brain,
	type Dossier,
	type ReponseNarrateur,
	type ReponseInterprete,
	type SortieNarrateur,
} from '../../../brain'
import { EcranPartie } from '../components/EcranPartie'
import { terminerCreationHeros } from './creerHerosDeTest'

/**
 * LE VERROU DE TOUR AU NIVEAU DE L'ÉCRAN RÉEL (lot 2, KR-265 ÉTENDU) —
 * `moteur-interprete` it2, plan § 7, désaccord tech-lead M1 (revue de PR).
 *
 * CE QUE `useTourDeJeu.test.ts` NE PROUVE PAS : que `EcranPartie` (le câblage
 * réel, `handleSoumettreConsole` → `pasEnCours()`, `EcranPartie.tsx:184-187`)
 * refuse VRAIMENT une soumission console pendant que R1→exécution→R3 est en
 * vol. Un test du hook seul laisserait cette garde supprimable sans qu'aucun
 * test ne rougisse — exactement le défaut relevé en revue (M1).
 *
 * `brain.copilote` est REMPLACÉ après `createBrain()` (précédent
 * `CopiloteService.ts:240` : les suites de la feature bouchonnent par
 * `brain.copilote = { estDisponible, demander }` — un remplacement du
 * CONTRAT, jamais un détail d'implémentation interne). Le dossier est le VRAI
 * dossier de référence (KR-156), comme `jalonAuJournal.test.tsx`.
 *
 * LA COMMANDE CONSOLE UTILISÉE PENDANT LE VERROU EST UNE DESTINATION RÉELLE
 * (`lieu.tour-effondree`, accessible depuis le départ) — PAS une destination
 * inconnue : `agir` ne change jamais `lieu_courant`, donc elle reste valide
 * tout au long du scénario. Une commande qui échouerait de toute façon
 * (destination inconnue) ne discriminerait RIEN : « le journal n'a pas
 * grandi » serait vrai que le verrou existe ou non (N2, revue de PR).
 */

const CHEMIN_REFERENCE = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'brain',
	'dossier',
	'__fixtures__',
	'dossier-reference.json',
)

function texteReference(): string {
	return fs.readFileSync(CHEMIN_REFERENCE, 'utf8')
}

/** Même seed que `jalonAuJournal.test.tsx` — la porte `jouable` (KR-239) exige
 *  un personnage présent au lieu de départ. ⚠ DEPUIS LE LOT CONTRAT DE LA n° 12
 *  (`moteur-acteurs`, it1), `dossier-reference.json` SATISFAIT DÉJÀ cette porte
 *  SANS seed — Harek gagne une `presence` au Foyer du Guet (le lieu de départ),
 *  prérequis de sa propre démo. Cette fonction reste utile : elle place un
 *  SECOND personnage connu (le premier SANS presence, aujourd'hui Mira) pour
 *  les scénarios qui en ont besoin, mais elle n'est plus la condition SEULE de
 *  `jouable` sur ce dossier — voir le test juste en dessous, réécrit en
 *  conséquence (mesuré, pas supposé). */
function avecUnHabitantAuDepart(brain: Brain, dossier: Dossier): Dossier {
	const depart = dossier.charpente.depart.lieu_id
	const rang = dossier.monde.personnages.findIndex((personnage) => (personnage.presence ?? []).length === 0)
	if (rang === -1) throw new Error('Aucun personnage sans presence a placer au depart')
	const ecriture = brain.dossiers.update(dossier.id, (d) => ({
		canon: d.canon,
		monde: {
			...d.monde,
			personnages: d.monde.personnages.map((personnage, index) =>
				index === rang ? { ...personnage, presence: [{ lieu_id: depart }] } : personnage,
			),
		},
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Trois résolveurs retenus à la main — l'ordre est celui des TROIS appels
 *  attendus : R1 (interprete), R2 (arbitre avec agir+héros), puis R3 (narrateur).
 *  (Lot 2 it2 : `agir` déclenche l'arbitre si un héros est présent.) */
async function monterPartieAvecCopiloteControle(user: ReturnType<typeof userEvent.setup>): Promise<{
	brain: Brain
	dossier: Dossier
	demanderMock: jest.Mock
	resolveurs: Array<(reponse: ReponseInterprete | ReponseNarrateur) => void>
}> {
	const brain = createBrain()
	const inspection = brain.dossiers.importDossier(texteReference())
	if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
	const dossier = avecUnHabitantAuDepart(brain, inspection.dossier)

	const resolveurs: Array<(reponse: ReponseInterprete | ReponseNarrateur) => void> = []
	const demanderMock = jest.fn(
		() =>
			new Promise((resolve) => {
				resolveurs.push(resolve as (reponse: ReponseInterprete | ReponseNarrateur) => void)
			}),
	)
	// SUBSTITUTION DU SERVICE, PAS DE `fetch` : voir docstring de tête.
	brain.copilote = { estDisponible: () => true, demander: demanderMock } as unknown as Brain['copilote']

	render(
		<BrainProvider brain={brain}>
			<EcranPartie dossierId={dossier.id} />
		</BrainProvider>,
	)
	await terminerCreationHeros(user)

	return { brain, dossier, demanderMock, resolveurs }
}

function lignesDuJournal(): HTMLElement[] {
	return within(screen.getByRole('region', { name: 'Journal' })).queryAllByRole('listitem')
}

describe('Verrou de tour au niveau ecran (KR-265 etendu, lot 2 it2)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('le dossier de reference est deja jouable (n 12, Harek au depart), et le seed ne le defait pas', () => {
		// ⚠ RÉÉCRIT AU LOT CONTRAT DE LA n° 12 (`moteur-acteurs`, it1) — MESURÉ, pas
		// supposé : Harek porte désormais une `presence` au Foyer du Guet (le lieu de
		// départ), donc `depart-desert` ne bloque plus le dossier TEL QUEL. La porte du
		// shell ne refuse déjà plus avant tout seed.
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		expect(controlerDossier(inspection.dossier).jouable).toBe(true)
		// Discriminant : le seed d'un SECOND habitant (Mira) ne le défait pas.
		expect(controlerDossier(avecUnHabitantAuDepart(brain, inspection.dossier)).jouable).toBe(true)
	})

	/** Reelle, accessible depuis le depart, et JAMAIS deplacee par `agir` (qui ne
	 *  change pas `lieu_courant`) : seule une destination qui REUSSIRAIT si le
	 *  verrou n'existait pas peut prouver que « journal inchange » vient du
	 *  verrou, et non de la commande elle-meme (N2, revue de PR). */
	const CIBLE_REELLE = 'lieu.tour-effondree'

	it('une commande console REELLE soumise pendant R1 PUIS pendant R3 est refusee, visible, sans perte, jusquau recit affiche', async () => {
		const user = userEvent.setup()
		const { demanderMock, resolveurs } = await monterPartieAvecCopiloteControle(user)

		const champLibre = screen.getByLabelText('QUE FAITES-VOUS ?')

		// ── Lance le pas libre : R1 part (appel #1), en vol ──
		await user.type(champLibre, 'je regarde autour de moi')
		await user.click(screen.getByRole('button', { name: /TENTER|…/ }))
		expect(demanderMock).toHaveBeenCalledTimes(1)

		const journalAvant = lignesDuJournal().length

		// ── PENDANT R1 : une commande console REELLE est refusee, visible, journal inchange ──
		// (si le verrou n'existait pas, cette commande REUSSIRAIT et avancerait le journal)
		await user.type(screen.getByLabelText('CONSOLE'), `ALLER ${CIBLE_REELLE}{Enter}`)
		expect(screen.getByRole('status', { name: '' })).toBeInTheDocument()
		expect(screen.getByText(/action est déjà en cours/i)).toBeInTheDocument()
		expect(lignesDuJournal()).toHaveLength(journalAvant)

		// ── Resout R1 : commande `agir` acceptee (arite 0, toujours valide, ne bouge pas lieu_courant) ──
		// Cela déclenche R2 (arbitre) car agir+héros, puis on attend sa réponse
		await act(async () => {
			resolveurs[0]({
				statut: 'propose',
				proposition: { lecture: 'commande', commande: { commande: 'agir', cibles: [] } },
			} as ReponseInterprete)
		})
		// Maintenant R1 est résolu et R2 a été appelé. Résoudre R2 avec sans_epreuve
		// (ce test n'a pas besoin de tester la carte, juste le verrou)
		await act(async () => {
			resolveurs[1]({
				statut: 'propose',
				proposition: { sans_epreuve: true },
			} as unknown as ReponseInterprete | ReponseNarrateur)
		})
		expect(demanderMock).toHaveBeenCalledTimes(3) // R1 + R2 + R3

		const journalApresAgir = lignesDuJournal().length
		expect(journalApresAgir).toBeGreaterThan(journalAvant) // agir a bien ecrit ses deux entrees

		// ── PENDANT R3 : `ConsoleCommandes` a `key={session.horloge.tour}` — `agir` a fait
		// avancer l'horloge, le composant a donc ETE REMONTE. Le noeud precedent est detache :
		// re-interroger le DOM est OBLIGATOIRE, pas un detail de style.
		const consoleApresRemontage = screen.getByLabelText('CONSOLE')
		await user.type(consoleApresRemontage, `ALLER ${CIBLE_REELLE}{Enter}`)
		expect(screen.getByText(/action est déjà en cours/i)).toBeInTheDocument()
		expect(lignesDuJournal()).toHaveLength(journalApresAgir) // toujours reelle, toujours refusee, toujours sans effet

		// ── Resout R3 : le verrou se relache, le recit s'affiche, le refus (de verrou) s'efface ──
		await act(async () => {
			resolveurs[2]({
				statut: 'propose',
				proposition: {
					recit: 'Vous scrutez les environs, sans rien y trouver de neuf.',
					suggestions: [],
					faits_etablis: [],
				} satisfies SortieNarrateur,
			})
		})

		expect(screen.getByText('RÉCIT')).toBeInTheDocument()
		expect(screen.getByText('Vous scrutez les environs, sans rien y trouver de neuf.')).toBeInTheDocument()
		// Le refus de VERROU s'est efface avec le deverrouillage (calcul en ligne, KR-013/113).
		expect(screen.queryByText(/action est déjà en cours/i)).not.toBeInTheDocument()
		// Le journal N'A TOUJOURS PAS grandi de la commande console (jamais rejouee en silence,
		// jamais un accepte tardif apres coup) : la seule croissance vient d'`agir`.
		expect(lignesDuJournal()).toHaveLength(journalApresAgir)
	})

	it('un refus de SYNTAXE console (hors verrou) reste visible — le calcul en ligne ne lefface pas (BUG-133)', async () => {
		const user = userEvent.setup()
		await monterPartieAvecCopiloteControle(user)

		// Aucun verrou actif : soumettre une commande INVALIDE (verbe inconnu) doit poser
		// un refus qui RESTE affiche — la regression de N1 l'effacait au rendu suivant,
		// quel que soit son origine, des lors que isLocked valait false.
		await user.type(screen.getByLabelText('CONSOLE'), 'BOUGER nulle_part{Enter}')

		expect(screen.getByRole('status', { name: '' })).toBeInTheDocument()
		expect(screen.queryByText(/action est déjà en cours/i)).not.toBeInTheDocument()
	})
})
