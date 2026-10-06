import fs from 'fs'
import path from 'path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	controlerDossier,
	BrainProvider,
	dossierSessionKey,
	type Brain,
	type Dossier,
	type EntreeJournal,
	type EtatSession,
} from '../../../brain'
import { EcranPartie } from '../components/EcranPartie'
import { JournalRow } from '../components/JournalRow'
import { terminerCreationHeros } from './creerHerosDeTest'

/**
 * UN JALON ATTEINT EN COURS DE PARTIE, VU DE L'ÉCRAN — critère 3 du plan
 * d'itération 3 de `moteur-dossier`.
 *
 * C'est le SEUL témoin de l'itération qui exerce un jalon devenant vrai PENDANT
 * la partie : les témoins de `brain/` ne prouvent que la décision. Le scénario
 * emprunte l'arête neuve de `dossier-reference.json`
 * (`lieu.tour-effondree` → `lieu.vigie-du-nord`), sans laquelle
 * `lieu.vigie-du-nord` — cible du seul `declencheur_expr` de la fixture — reste
 * inatteignable depuis le départ.
 *
 * LA FIXTURE RÉELLE, JAMAIS UN LITTÉRAL DE DOSSIER (KR-156) : elle est lue sur
 * le disque et importée par le chemin public, comme `panneauJalonsFins.test.tsx`.
 *
 * CE QUE CE FICHIER NE FAIT PAS : il ne rend compte d'AUCUNE règle de résolution
 * (point fixe, idempotence, ordre des jalons) — cela vit dans
 * `brain/dossier/evaluate.test.ts`. Ici, on regarde un écran.
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

/** L'étape et la cible du scénario — deux identifiants de la fixture, pas des noms. */
const ETAPE = 'lieu.tour-effondree'
const CIBLE = 'lieu.vigie-du-nord'
const JALON = 'jalon.premiere-vigie'
const INDICE = 'indice.pas-dans-la-cendre'

/**
 * LA PRÉCONDITION DE LA PORTE `jouable` (KR-239) — MESURÉE, pas supposée.
 *
 * ⚠ DEPUIS LE LOT CONTRAT DE LA n° 12 (`moteur-acteurs`, it1), `dossier-reference.json`
 * NE PORTE PLUS le contrôle bloquant `depart-desert` : Harek gagne une `presence` au
 * Foyer du Guet (le lieu de départ), prérequis de sa propre démo, et le dossier TEL
 * QUEL satisfait déjà `jouable` sans seed. Cette fonction reste utile pour placer un
 * SECOND personnage connu (le premier que rien ne place, aujourd'hui Mira) au même
 * lieu, PAR LE CHEMIN PUBLIC D'ÉCRITURE et par spread (KR-156) : ni le fichier du
 * disque ni l'arête neuve ne sont touchés, et le scénario du critère 3 reste mot
 * pour mot celui du plan.
 */
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

/**
 * Neutralise les événements de combat du dossier — ce fichier teste les JALONS,
 * pas le combat. Sans cette neutralisation, `ouvrirRencontreSiDue` ouvre un
 * combat au premier `ALLER` vers `lieu.tour-effondree` et la console disparaît.
 */
function sansRencontreDeCombat(brain: Brain, dossier: Dossier): Dossier {
	const ecriture = brain.dossiers.update(dossier.id, (d) => ({
		canon: d.canon,
		monde: {
			...d.monde,
			evenements: d.monde.evenements.map((e) => (e.monstre_ref ? { ...e, monstre_ref: undefined } : e)),
		},
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Neutralisation refusee : ${ecriture.statut}`)
	return ecriture.dossier
}

async function monterPartieSurLaReference(
	user: ReturnType<typeof userEvent.setup>,
): Promise<{ brain: Brain; dossier: Dossier }> {
	const brain = createBrain()
	const inspection = brain.dossiers.importDossier(texteReference())
	if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
	let dossier = avecUnHabitantAuDepart(brain, inspection.dossier)
	dossier = sansRencontreDeCombat(brain, dossier)
	render(
		<BrainProvider brain={brain}>
			<EcranPartie dossierId={dossier.id} />
		</BrainProvider>,
	)
	await terminerCreationHeros(user)
	return { brain, dossier }
}

function sessionPersistee(brain: Brain, dossierId: string): EtatSession {
	return brain.persistence.get<EtatSession>(dossierSessionKey(dossierId)) as EtatSession
}

/** Les deux pas du scénario : le second fait basculer `lieu_visite(CIBLE)` à vrai. */
async function monterALaVigie(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await user.type(screen.getByLabelText('CONSOLE'), `ALLER ${ETAPE}{Enter}`)
	await user.type(screen.getByLabelText('CONSOLE'), `ALLER ${CIBLE}{Enter}`)
}

function lignesDuJournal(): HTMLElement[] {
	return within(screen.getByRole('region', { name: 'Journal' })).getAllByRole('listitem')
}

/**
 * Les pastilles d'une ligne — tout nœud dont le texte est ENTRE CROCHETS. La
 * forme est celle de `[origine]` comme celle de `[delta:cibles]` : c'est
 * volontaire, la ligne de jalon ne portant PAS d'`origine`, ce qu'on y lit est
 * exactement la liste des deltas, dans l'ordre du DOM.
 */
function pastillesDe(ligne: HTMLElement): string[] {
	return Array.from(ligne.querySelectorAll('span'))
		.map((noeud) => noeud.textContent ?? '')
		.filter((texte) => texte.startsWith('[') && texte.endsWith(']'))
}

/** Échappe un fragment de prose pour qu'il se cherche À LA LETTRE. */
function echapperRegex(texte: string): string {
	return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * LES FRAGMENTS INTERDITS, DÉRIVÉS DE LA PROSE DU DOSSIER — jamais un littéral
 * recopié ici, qui divergerait de la fixture sans que rien ne rougisse.
 *
 * Un fragment = TROIS MOTS CONSÉCUTIFS. Le gabarit du journal (identifiants
 * `espace.slug`, `>`, `:`, `→`) n'en produit aucun : une prose ne peut y entrer
 * qu'en étant récitée, fût-ce tronquée.
 */
const MOTS_PAR_FRAGMENT = 3

function fragmentsDeProse(prose: string): string[] {
	const mots = prose.split(/\s+/).filter((mot) => mot.length > 0)
	const fragments: string[] = []
	for (let debut = 0; debut + MOTS_PAR_FRAGMENT <= mots.length; debut += 1) {
		fragments.push(mots.slice(debut, debut + MOTS_PAR_FRAGMENT).join(' '))
	}
	return fragments
}

/** Les DEUX proses de CHAQUE jalon, balayées depuis le dossier (KR-199). */
function prosesDesJalons(dossier: Dossier): string[] {
	return dossier.charpente.jalons.flatMap((jalon) => [jalon.enonce_texte, jalon.declencheur_texte])
}

describe('un jalon atteint en cours de partie, au journal', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	/**
	 * LA PORTE EST OUVERTE, ET ON LE CONSTATE (KR-239) : sans cette ligne, un
	 * retour du bloquant `depart-desert` ferait échouer les deux témoins suivants
	 * sur une plainte de requête RTL — un symptôme muet à trois rebonds de sa cause.
	 */
	it('le dossier de reference est deja jouable (n 12, Harek au depart), et le seed ne le defait pas', () => {
		// ⚠ RÉÉCRIT AU LOT CONTRAT DE LA n° 12 — voir la docstring de
		// `avecUnHabitantAuDepart` ci-dessus.
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		expect(controlerDossier(inspection.dossier).jouable).toBe(true)
		expect(controlerDossier(avecUnHabitantAuDepart(brain, inspection.dossier)).jouable).toBe(true)
	})

	it('ecrit la ligne du jalon au meme tour que la commande, suivie de ses deux pastilles dans l ordre causal', async () => {
		const user = userEvent.setup()
		const { brain, dossier } = await monterPartieSurLaReference(user)

		await monterALaVigie(user)

		// L'ÉTAT — six entrées, dont les quatre du second pas : la demande, son effet, le jalon, et la
		// ligne du tick `etape_bloquee` (n° 14 it3 : la `duree: 2` de l'étape de départ de Corvin tombe
		// au pas 2), qui SUIT le jalon.
		const session = sessionPersistee(brain, dossier.id)
		expect(session.journal).toHaveLength(6)
		const entreeJalon = session.journal[4]
		expect(entreeJalon.role).toBe('moteur')
		expect(entreeJalon.texte).toBe(`jalons_atteints : ${JALON}`)
		// MÊME TOUR QUE LA SECONDE COMMANDE : une conséquence enchaînée n'ajoute pas un pas.
		expect(entreeJalon.tour).toBe(session.journal[2].tour)
		// AUCUNE `origine` : un jalon franchi n'est pas une commande qu'un joueur tape.
		expect(entreeJalon.origine).toBeUndefined()
		expect(entreeJalon.deltas).toEqual([
			{ delta: 'atteindre_jalon', cibles: [JALON], effet: 'applique' },
			{ delta: 'reveler_indice', cibles: [INDICE], effet: 'applique' },
		])

		// L'ÉCRAN — les six lignes, dont les quatre du second pas.
		const lignes = lignesDuJournal()
		expect(lignes).toHaveLength(6)

		const ligneDemande = lignes[2]
		const ligneDeplacement = lignes[3]
		const ligneJalon = lignes[4]
		const ligneBlocage = lignes[5]

		expect(within(ligneDemande).getByText(`> ALLER ${CIBLE}`)).toBeInTheDocument()
		expect(within(ligneDeplacement).getByText(`lieu_courant : ${ETAPE} → ${CIBLE}`)).toBeInTheDocument()
		expect(within(ligneJalon).getByText(`jalons_atteints : ${JALON}`)).toBeInTheDocument()

		// LE BADGE RESTE `↻ MOTEUR` — la ligne de jalon n'est pas un troisième rôle.
		expect(within(ligneJalon).getByText('↻ MOTEUR')).toBeInTheDocument()
		// LE NUMÉRO DE PAS SE RÉPÈTE SUR LES TROIS LIGNES DU MÊME TOUR.
		for (const ligne of [ligneDemande, ligneDeplacement, ligneJalon]) {
			expect(within(ligne).getByText(`#${entreeJalon.tour}`)).toBeInTheDocument()
		}

		// LES PASTILLES — toutes, DANS L'ORDRE DU TABLEAU, sans filtrage.
		// `toEqual` sur la liste entière est ce qui sépare : retirer la pastille
		// redondante `atteindre_jalon` ou trier `deltas` fait rougir CETTE ligne.
		expect(pastillesDe(ligneJalon)).toEqual([`[atteindre_jalon:${JALON}]`, `[reveler_indice:${INDICE}]`])
		// La ligne de déplacement ne porte QUE sa cause : aucun delta ne s'y égare.
		expect(pastillesDe(ligneDeplacement)).toEqual(['[aller]'])
		// Et la ligne de jalon ne porte AUCUNE cause.
		expect(within(ligneJalon).queryByText('[aller]')).not.toBeInTheDocument()
		// LA LIGNE DU TICK (it3) se rend comme une ligne `↻ MOTEUR` sans cause ni pastille : ni
		// `origine`, ni `deltas`.
		expect(within(ligneBlocage).getByText('etape_bloquee : pnj.corvin-le-marchand 1')).toBeInTheDocument()
		expect(within(ligneBlocage).getByText('↻ MOTEUR')).toBeInTheDocument()
		expect(pastillesDe(ligneBlocage)).toEqual([])
	})

	/**
	 * L'ORDRE ET L'ABSENCE DE TRI, MESURÉS — et il faut une entrée FABRIQUÉE pour
	 * les mesurer. Sur le dossier de référence, l'ordre causal
	 * (`atteindre_jalon` puis l'`effet[]`) COÏNCIDE avec l'ordre alphabétique des
	 * quatre clés du registre : un tri ascendant y survivrait vert, et le témoin
	 * du scénario ne prouverait donc pas ce que son nom promet (KR-199).
	 * L'entrée ci-dessous rompt la coïncidence, et elle est la seule à pouvoir
	 * porter un `'sans_effet'` — le dossier de référence n'en produit aucun.
	 *
	 * Un composant qui rend une donnée la REÇOIT en props, et son test la FABRIQUE
	 * (précédent KR-223) : ici, aucun dossier, aucune session, aucun écran.
	 */
	it('rend les pastilles dans l ordre recu, sans trier, sans filtrer, et sans distinguer sans_effet', () => {
		const entree: EntreeJournal = {
			tour: 7,
			role: 'moteur',
			texte: 'jalons_atteints : jalon.temoin',
			deltas: [
				{ delta: 'reveler_indice', cibles: ['indice.temoin'], effet: 'applique' },
				{ delta: 'donner_objet', cibles: ['objet.temoin'], effet: 'sans_effet' },
			],
		}
		render(
			<ul>
				<JournalRow entree={entree} />
			</ul>,
		)

		const ligne = screen.getByRole('listitem')
		// L'ORDRE REÇU, qui n'est PAS l'ordre alphabétique : tout tri fait rougir ici.
		expect(pastillesDe(ligne)).toEqual(['[reveler_indice:indice.temoin]', '[donner_objet:objet.temoin]'])

		// AUCUNE DISTINCTION VISUELLE entre `'applique'` et `'sans_effet'` : les deux
		// pastilles portent le MÊME style, à l'attribut près. On COMPARE les deux
		// nœuds entre eux, sans jamais asserter un jeton — `toHaveStyle` sur une
		// `var(--x)` est vert sur n'importe quoi en jsdom (BUG-084).
		const noeuds = Array.from(ligne.querySelectorAll('span')).filter((noeud) =>
			(noeud.textContent ?? '').startsWith('['),
		)
		expect(noeuds).toHaveLength(2)
		expect(noeuds[0].getAttribute('style')).toBe(noeuds[1].getAttribute('style'))
	})

	/** Une entrée SANS `deltas` — le champ est absent, jamais `[]` (KR-251). */
	it('ne rend aucune pastille quand l entree ne porte pas de deltas', () => {
		const entree: EntreeJournal = { tour: 1, role: 'joueur', texte: '> ALLER lieu.temoin' }
		render(
			<ul>
				<JournalRow entree={entree} />
			</ul>,
		)

		expect(pastillesDe(screen.getByRole('listitem'))).toEqual([])
	})

	it('aucune ligne du journal ne recite enonce_texte ni declencheur_texte', async () => {
		const user = userEvent.setup()
		const { dossier } = await monterPartieSurLaReference(user)

		await monterALaVigie(user)

		const proses = prosesDesJalons(dossier)
		expect(proses.length).toBeGreaterThan(0)

		// LA SONDE D'ABORD (KR-235) : un instrument non mesuré n'est pas un
		// instrument. Chaque fragment doit trouver la prose dont il est tiré, sur
		// un nœud fabriqué ici — sans quoi l'assertion suivante serait verte par
		// construction, comme l'ancre de mot de BUG-120.
		for (const prose of proses) {
			const canari = document.createElement('li')
			canari.textContent = prose
			const fragments = fragmentsDeProse(prose)
			expect(fragments.length).toBeGreaterThan(0)
			for (const fragment of fragments) {
				expect(canari.outerHTML).toMatch(new RegExp(echapperRegex(fragment), 'i'))
			}
		}

		// PAR LIGNE, SUR `outerHTML`, ET INSENSIBLE À LA CASSE — la forme est
		// imposée (KR-255, BUG-120) : sur le `textContent` du conteneur, le DOM
		// concatène sans séparateur et l'assertion cesse de mesurer quoi que ce
		// soit ; sur `textContent` seul, une prose passée en `title` ou en
		// `aria-label` resterait invisible.
		const lignes = lignesDuJournal()
		// Six lignes : les cinq d'avant, et la ligne du tick `etape_bloquee` de Corvin (n° 14 it3).
		expect(lignes).toHaveLength(6)
		for (const ligne of lignes) {
			for (const prose of proses) {
				for (const fragment of fragmentsDeProse(prose)) {
					expect(ligne.outerHTML).not.toMatch(new RegExp(echapperRegex(fragment), 'i'))
				}
			}
		}
	})
})
