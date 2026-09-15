import fs from 'node:fs'
import path from 'node:path'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	useBrain,
	frapperIdentifiant,
	SECTIONS,
	type Brain,
	type Dossier,
} from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { DossierEditorScreen, type DossierEditorScreenProps } from '../components/DossierEditorScreen'

/**
 * Sonde locale pour la section Canon — jamais le vrai `PanneauCanon`
 * (`dossier-canon`) : un test de `bascule-editeur` n'a pas plus le droit
 * d'importer une feature sœur que le code source (KR-184, `no-restricted-imports`).
 * Elle ne prouve que le MÉCANISME du slot d'injection `panneaux` (§3 du plan
 * d'itération 1 de dossier-canon) — le contenu réel de `PanneauCanon` est
 * éprouvé par `dossier-canon/tests/panneauCanon.test.tsx`.
 */
const SONDE_CANON = 'Sonde du panneau Canon (test bascule-editeur)'
function SondePanneauCanon(): JSX.Element {
	return <textarea aria-label="Synopsis MJ" value={SONDE_CANON} readOnly />
}

/**
 * Même sonde, pour la section Départ (`dossier-canon` it2) : le MÉCANISME du slot
 * `panneaux` sur une SECONDE section — que la table n'était pas câblée sur la
 * seule première. Le contenu réel de `PanneauDepart` (Select sans brouillon,
 * texte d'ouverture au blur) est éprouvé par
 * `dossier-canon/tests/panneauDepart.test.tsx`.
 */
const SONDE_DEPART = 'Sonde du panneau Départ (test bascule-editeur)'
function SondePanneauDepart(): JSX.Element {
	return <textarea aria-label="Texte d ouverture" value={SONDE_DEPART} readOnly />
}

/**
 * Même sonde, pour la section Lieux (`dossier-canon` it4) : le MÉCANISME du
 * slot `panneaux` sur une TROISIÈME section. Le contenu réel de `PanneauLieux`
 * (liste + fiche, ajout/édition/retrait) est éprouvé par
 * `dossier-canon/tests/panneauLieux.test.tsx`.
 */
const SONDE_LIEUX = 'Sonde du panneau Lieux (test bascule-editeur)'
function SondePanneauLieux(): JSX.Element {
	return <textarea aria-label="Nom du lieu" value={SONDE_LIEUX} readOnly />
}

/**
 * Même sonde, pour la section Personnages (`dossier-fiches` it1) : le
 * MÉCANISME du slot `panneaux` sur une QUATRIÈME section — jamais le vrai
 * `PanneauPersonnages` (`dossier-fiches`), qu'un test de `bascule-editeur` n'a
 * pas plus le droit d'importer que le code source (KR-184, KR-187). Le
 * contenu réel de `PanneauPersonnages` (liste + fiche, accordéon à 8
 * emplacements) est éprouvé par
 * `dossier-fiches/tests/panneauPersonnages.test.tsx`.
 */
const SONDE_PERSONNAGES = 'Sonde du panneau Personnages (test bascule-editeur)'
function SondePanneauPersonnages(): JSX.Element {
	return <textarea aria-label="Nom du personnage" value={SONDE_PERSONNAGES} readOnly />
}

/**
 * Sonde d'ÉCRITURE pour la section Lieux — distincte de `SondePanneauLieux`
 * (lecture seule) ci-dessus. Le vrai `PanneauLieux` ne peut pas être importé
 * dans ce fichier : `no-restricted-imports` (KR-184, `.eslintrc.cjs`) interdit
 * tout import inter-features et ne fait AUCUNE exception pour `tests/**` sur
 * cette règle précise (contrairement à la règle de stockage brut) — un test de
 * `bascule-editeur` n'a donc pas plus le droit d'importer `dossier-canon` que
 * le code source. Cette sonde rejoue le SEUL geste que
 * `PanneauLieux.handleAjouter` effectue réellement : le même `dossiers.update()`
 * (via `useBrain()`), avec la même forme de patch (`canon`/`charpente`
 * traversent intacts, seul `monde.lieux` change) et le même
 * `frapperIdentifiant('lieu')` — tous deux des contrats `brain/`, donc
 * légitimement importables ici. Elle ferme le critère #7 du plan d'itération 4
 * de `dossier-canon` (compteur nav) sans dupliquer ce que
 * `dossier-canon/tests/panneauLieux.test.tsx` prouve déjà côté rendu réel du
 * bouton (focus, brouillon, retrait, refus).
 */
function SondePanneauLieuxEcriture({ dossierId }: { dossierId: string }): JSX.Element {
	const { dossiers } = useBrain()
	function handleAjouter(): void {
		const id = frapperIdentifiant('lieu')
		dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, lieux: [...d.monde.lieux, { id }] },
			charpente: d.charpente,
		}))
	}
	return (
		<button type="button" onClick={handleAjouter}>
			+ Ajouter un lieu…
		</button>
	)
}

function renderScreen(brain: Brain, dossierId: string, panneaux?: DossierEditorScreenProps['panneaux']) {
	render(
		<BrainProvider brain={brain}>
			<DossierEditorScreen dossierId={dossierId} panneaux={panneaux} />
		</BrainProvider>,
	)
}

/** La table du §3 du plan d'itération 3 — recopiée ICI pour confronter le rendu. */
const TITRES = [
	'Canon',
	'Départ',
	'Personnages',
	'Lieux',
	'Objets',
	'Indices',
	'Quêtes',
	'Événements',
	'Conditions',
	'Jalons & fins',
]
const FEATURE_NUMS = [3, 3, 4, 3, 5, 6, 6, 6, 6, 6]
const GLYPHES = ['✎', '✎', '❏', '❏', '❏', '❏', '❏', '❏', '⊘', '⊘']
/**
 * Les DIX BADGES exacts sur un dossier fraîchement issu de `DossierService.create()`
 * — écrits À LA MAIN depuis le contrat de design (§ 3 du plan d'itération 2 de
 * `dossier-controles`), jamais dérivés de l'ancien `COMPTES_DOSSIER_NEUF` par un
 * `map` qui rejouerait la règle d'élision : un test qui recalcule la règle de
 * production ne prouve rien (§ 7 du plan). Canon et Départ élident leur tiret
 * derrière le mot du niveau — les quatre proses semées par l'amorce (KR-217)
 * rendent Départ BLOQUANT et Canon ALERTE dès la création. Les huit autres
 * sections sont calmes et gardent leur compte INCHANGÉ — dont Lieux, qui porte
 * déjà `lieu.amorce` (KR-178), donc « 1 fiche », pas « 0 fiche ».
 */
const BADGES_DOSSIER_NEUF = [
	'ALERTE',
	'BLOQUANT',
	'0 fiche',
	'1 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 jalon · 0 fin',
]

function texteEtatVide(index: number): string {
	return `${TITRES[index]} — l'écran d'édition arrive avec la feature n°${FEATURE_NUMS[index]}.`
}

describe('DossierEditorScreen', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('rendu de base: titre, retour, Apercu du jeu desactive, etat vide de la premiere section', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create("La Caverne d'Aldûr")
		renderScreen(brain, dossier.id, { canon: <SondePanneauCanon /> })

		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Mes dossiers' })).toBeInTheDocument()

		const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })
		expect(apercu).toBeDisabled()
		expect(apercu).toHaveAttribute(
			'title',
			'Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)',
		)
		expect(apercu).toHaveAttribute('title', expect.stringContaining('feature n° 9'))

		// Ni compteur de noeuds ni « + Noeud » : un dossier n'a pas de noeuds.
		expect(screen.queryByRole('button', { name: /nœud/i })).toBeNull()
		expect(screen.queryByText(/nœud/i)).toBeNull()

		// Defaut documente : la premiere section du registre (Canon) est selectionnee,
		// et affiche desormais le panneau REEL injecte via `panneaux` (slot d'injection,
		// §3 du plan d'iteration 1 de dossier-canon) au lieu de l'etat vide generique.
		expect(screen.getByRole('textbox', { name: /synopsis/i })).toHaveValue(SONDE_CANON)
		expect(screen.queryByText(texteEtatVide(0))).toBeNull()
	})

	it('dossierId inconnu: Dossier introuvable et retour a l accueil', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		renderScreen(brain, 'inconnu')

		expect(screen.getByText('Dossier introuvable.')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: '← Mes dossiers' }))

		expect(brain.router.current()).toEqual({ name: 'home' })
	})

	describe('nav des dix sections', () => {
		it('rend les 10 ListRow dans l ordre exact de SECTIONS, chaque trailing = badge de section (compte + niveau)', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')
			expect(lignes).toHaveLength(10)

			lignes.forEach((ligne, index) => {
				expect(within(ligne).getByText(TITRES[index])).toBeInTheDocument()
				expect(within(ligne).getByText(BADGES_DOSSIER_NEUF[index])).toBeInTheDocument()
			})
		})

		/**
		 * Critère #5 du plan d'itération 2 de `dossier-controles` : une section
		 * SAINE ne porte JAMAIS un des trois mots de niveau — assertion NÉGATIVE
		 * sur le TEXTE, jamais sur une teinte (l'instrument est cassé, § 2/§ 7 du
		 * plan). Canon (index 0) et Départ (index 1) portent un mot par
		 * construction sur un dossier neuf (l'amorce semée, KR-217) ; les HUIT
		 * autres sections n'en portent aucun.
		 */
		it('une section saine ne porte aucun mot de niveau', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignesCalmes = within(nav).getAllByRole('button').slice(2)

			// SUR LE `textContent`, jamais `queryByText` : ce dernier est une
			// correspondance EXACTE sur le texte entier du nœud, donc aveugle à la
			// forme FUSIONNÉE que cette itération vient de créer — une ligne calme
			// qui rendrait « 0 fiche · BLOQUANT » laisserait `queryByText('BLOQUANT')`
			// à `null` et ce test VERT, alors que son nom promet le contraire
			// (KR-199). Le trou était bouché incidemment par le test frère, égalité
			// stricte sur `textContent` ; une garde ne s'appuie pas sur sa voisine.
			for (const ligne of lignesCalmes) {
				expect(ligne.textContent).not.toMatch(/BLOQUANT|ALERTE|INFO/)
			}
		})

		/**
		 * Critère #4 du plan (KR-218) : UN SEUL badge par ligne — égalité STRICTE
		 * sur `textContent`, jamais `toHaveTextContent` (une inclusion ne
		 * rougirait pas si un second nœud de badge s'ajoutait à côté du titre,
		 * BUG-083). Le sous-titre technique (`section.cle`) est lu depuis
		 * `SECTIONS`, jamais recopié dans une seconde table qui pourrait dériver
		 * de `sections.ts`.
		 */
		it('un seul badge par ligne: egalite sur le textContent, jamais une inclusion (BUG-083)', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')

			lignes.forEach((ligne, index) => {
				expect(ligne.textContent).toBe(`${TITRES[index]}${SECTIONS[index].cle}${BADGES_DOSSIER_NEUF[index]}`)
			})
		})

		it('KR-013: SectionNav ne recalcule aucun compteur localement', () => {
			const chemin = path.join(__dirname, '..', 'components', 'SectionNav.tsx')
			const source = fs.readFileSync(chemin, 'utf8')

			expect(source).not.toMatch(/\.length\b/)
			expect(source).not.toMatch(/\.filter\(/)
			expect(source).not.toMatch(/\.reduce\(/)
		})

		/**
		 * RÉÉCRITURE de « aucun badge de completion colore: SectionNav n utilise
		 * jamais tone="good"/"bad"/"accent" » (critère #8 du plan d'itération 2 de
		 * `dossier-controles`).
		 *
		 * ⚠ CE PARAGRAPHE A ÉTÉ CORRIGÉ (BUG-084). Le raffinage avait écrit ici que
		 * l'ancien test « serait resté VERT sans amendement », et en avait fait une
		 * sixième occurrence de KR-199 : c'est FAUX, et personne ne l'avait mesuré.
		 * L'ancienne sonde portait une assertion POSITIVE — `toMatch(/tone="muted"/)`
		 * — qui ne pouvait pas survivre au remplacement de tout littéral par
		 * `tone={badge.tone}` : elle AURAIT ROUGI. La réécriture reste juste, mais
		 * pour un autre motif : l'ancienne sonde aurait échoué en accusant la
		 * MAUVAISE CAUSE (« le badge muted a disparu » au lieu de « la vue décide
		 * d'une teinte »), et un ouvrier l'aurait « réparée » en rétablissant un
		 * littéral — c'est-à-dire en rendant vrai précisément ce qu'elle interdit.
		 *
		 * CE QU'IL GARDAIT : aucun badge de complétion coloré en dur
		 * (`good`/`bad`/`accent`). CE QU'IL GARDE DÉSORMAIS, en plus et plus
		 * fort : aucune teinte NI aucun mot de niveau écrits en dur dans la vue,
		 * sous AUCUNE forme — ni une table locale (`BadgeTone` ne doit apparaître
		 * nulle part dans ce fichier) — et l'appel à `badgeSection`, seule source
		 * admise de la décision, est EXIGÉ.
		 */
		it('SectionNav ne decide jamais d une teinte: badgeSection est la seule source du mot et du ton', () => {
			const chemin = path.join(__dirname, '..', 'components', 'SectionNav.tsx')
			const source = fs.readFileSync(chemin, 'utf8')

			// Aucune teinte littérale — `tone={badge.tone}` reste le seul chemin.
			expect(source).not.toMatch(/tone=["'][a-z]+["']/)
			// Aucune table locale de teintes : `BadgeTone` n'apparaît nulle part ici.
			expect(source).not.toMatch(/BadgeTone/)
			// Aucun des trois mots de niveau, littéral.
			expect(source).not.toMatch(/BLOQUANT/)
			expect(source).not.toMatch(/ALERTE/)
			expect(source).not.toMatch(/\bINFO\b/)
			// La décision vient de `badgeSection`, et de la seule.
			expect(source).toMatch(/badgeSection\(/)
		})

		/**
		 * Critère #6 du plan (« niveau : contrat (hook) + composant ») : la moitié
		 * CONTRAT est déjà prouvée par `hooks.dossier.test.tsx` (lot 1) sur
		 * `useOpenDossier` isolé. Ce test-ci prouve la moitié COMPOSANT — que
		 * `DossierEditorScreen` PROPAGE réellement ce rafraîchissement jusqu'au
		 * `trailing` d'une `ListRow` — sans jamais appeler `rerender()` : le seul
		 * ressort du nouveau rendu est l'événement du bus, exactement comme une
		 * adoption cloud le ferait derrière le dos de l'auteur.
		 */
		it('dossier:updated apres montage: le trailing de Personnages se met a jour sans remontage', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const ligneAvant = within(nav).getAllByRole('button')[2]
			expect(ligneAvant).toHaveTextContent('Personnages')
			expect(within(ligneAvant).getByText('0 fiche')).toBeInTheDocument()

			// Écrit DERRIÈRE le service PUIS émet l'événement (KR-004) — le même patron
			// que l'adoption cloud dans `hooks.dossier.test.tsx` et
			// `book-library/tests/dossierLibrary.test.tsx`. Un seul personnage ajouté à
			// une copie du dossier RÉEL (spread, pas un dossier littéral inline — KR-156) ;
			// tous les autres champs, y compris `charpente.depart`, restent ceux que
			// `DossierService.create()` a validés.
			//
			// `presence` ET `caractere.parler` sont RENSEIGNÉS, et c'est le LITTÉRAL qui
			// a été complété, jamais l'assertion : depuis l'itération 3 de
			// `dossier-controles`, un personnage sans présence tire une ALERTE sur la
			// section Personnages et `badgeSection` rendrait « 1 fiche · ALERTE » en UN
			// SEUL nœud (KR-218), que `getByText('1 fiche')` ne trouverait plus. Réécrire
			// l'assertion accrocherait CE test au jeu de règles d'une AUTRE feature, et
			// il rougirait à chaque règle future. Le lieu de présence est lu sur le
			// dossier réel, jamais écrit en dur : c'est `DossierService.create()` qui
			// décide quel lieu il sème (KR-178).
			const dossierPeuple: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: [
						{
							id: 'pnj.aldur-le-sage',
							portee: 'premier',
							plan_actions: [],
							savoirs: [],
							presence: [{ lieu_id: dossier.charpente.depart.lieu_id }],
							caractere: { parler: ['Je ne dirai rien avant la nuit.'] },
						},
					],
				},
				updatedAt: '2026-08-10T09:00:00.000Z',
			}
			act(() => {
				brain.persistence.set(dossierKey(dossier.id), dossierPeuple)
				brain.events.emit('dossier:updated', { dossierId: dossier.id })
			})

			// Pas de rerender() manuel : on relit le DOM déjà en place, mis à jour par
			// le seul effet de l'événement sur `useOpenDossier`.
			const ligneApres = within(nav).getAllByRole('button')[2]
			expect(within(ligneApres).getByText('1 fiche')).toBeInTheDocument()
			expect(within(ligneApres).queryByText('0 fiche')).toBeNull()
		})

		/**
		 * Critère #7 du plan d'itération 2 de `dossier-controles` — le CÂBLAGE
		 * RÉEL sur un vrai dossier, complémentaire du critère #6 (`sectionNav.test.tsx`,
		 * entrée fabriquée) : Canon et Départ partagent le MÊME compte (`—`) mais
		 * portent deux badges différents, ce qui tue l'hypothèse « le badge colore
		 * les sections sans compte » sans aucune fabrication. Même patron que le
		 * test ci-dessus (écrit DERRIÈRE le service PUIS émis, KR-004) : la
		 * réécriture du champ bloquant fait disparaître `BLOQUANT` de Départ, qui
		 * GARDE son tiret, pendant que Canon — dont aucun des trois textes n'a
		 * changé — reste `ALERTE`.
		 */
		it('le badge suit une reecriture sans remontage: BLOQUANT disparait de Depart qui garde son tiret, Canon reste ALERTE', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const ligneCanonAvant = within(nav).getAllByRole('button')[0]
			const ligneDepartAvant = within(nav).getAllByRole('button')[1]
			expect(within(ligneCanonAvant).getByText('ALERTE')).toBeInTheDocument()
			expect(within(ligneDepartAvant).getByText('BLOQUANT')).toBeInTheDocument()

			const dossierReecrit: Dossier = {
				...dossier,
				charpente: {
					...dossier.charpente,
					depart: { ...dossier.charpente.depart, texte_ouverture_joueur: 'Le vent siffle sur la lande grise.' },
				},
				updatedAt: '2026-08-10T09:00:00.000Z',
			}
			act(() => {
				brain.persistence.set(dossierKey(dossier.id), dossierReecrit)
				brain.events.emit('dossier:updated', { dossierId: dossier.id })
			})

			const ligneCanonApres = within(nav).getAllByRole('button')[0]
			const ligneDepartApres = within(nav).getAllByRole('button')[1]
			expect(within(ligneDepartApres).queryByText('BLOQUANT')).toBeNull()
			expect(within(ligneDepartApres).getByText('—')).toBeInTheDocument()
			expect(within(ligneCanonApres).getByText('ALERTE')).toBeInTheDocument()
		})

		/**
		 * Critère #7 du plan d'itération 4 de `dossier-canon` (« quand un lieu
		 * est ajouté ou retiré avec succès, le compteur de la nav
		 * [SECTIONS[3].compte(), déjà câblé sur monde.lieux.length] se met à
		 * jour sans qu'aucune vue de cette feature ne recalcule elle-même une
		 * longueur ») — relevé NON VÉRIFIÉ en revue QA : le test ci-dessus
		 * prouve le mécanisme pour Personnages par une écriture directe de
		 * test, jamais rejoué pour Lieux ni depuis un geste UTILISATEUR (clic).
		 * `SondePanneauLieuxEcriture` appelle le MÊME `dossiers.update()` que
		 * `PanneauLieux.handleAjouter` (même patch étroit, même
		 * `frapperIdentifiant('lieu')`) — aucun compteur mocké, seul le vrai
		 * `dossier:updated` émis PAR LE SERVICE fait avancer le trailing.
		 */
		it('ajout d un lieu via le bouton reel: le trailing de Lieux passe de 1 fiche a 2 fiches sans recalcul de vue', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id, { lieux: <SondePanneauLieuxEcriture dossierId={dossier.id} /> })

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const ligneLieux = within(nav).getAllByRole('button')[3]
			expect(ligneLieux).toHaveTextContent('Lieux')
			// Dossier neuf : `monde.lieux` porte deja `lieu.amorce` (KR-178).
			expect(within(ligneLieux).getByText('1 fiche')).toBeInTheDocument()

			await user.click(ligneLieux)
			expect(ligneLieux).toHaveAttribute('aria-current', 'true')

			await user.click(screen.getByRole('button', { name: '+ Ajouter un lieu…' }))

			expect(within(ligneLieux).getByText('2 fiches')).toBeInTheDocument()
			expect(within(ligneLieux).queryByText('1 fiche')).toBeNull()
		})
	})

	describe('selection d une section: etat vide au mot pres', () => {
		TITRES.forEach((titre, index) => {
			it(`section ${index} (${titre}): texte et glyphe exacts`, async () => {
				const user = userEvent.setup()
				const brain = createBrain()
				const dossier = brain.dossiers.create('Un dossier')
				renderScreen(brain, dossier.id, {
					canon: <SondePanneauCanon />,
					depart: <SondePanneauDepart />,
					personnages: <SondePanneauPersonnages />,
					lieux: <SondePanneauLieux />,
				})

				const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
				const ligne = within(nav).getAllByRole('button')[index]
				await user.click(ligne)

				expect(ligne).toHaveAttribute('aria-current', 'true')
				if (index === 0) {
					// Canon (n° 3, dossier-canon it1) : le panneau injecte remplace l'etat vide.
					expect(screen.getByRole('textbox', { name: /synopsis/i })).toHaveValue(SONDE_CANON)
					expect(screen.queryByText(texteEtatVide(0))).toBeNull()
				} else if (index === 1) {
					// Depart (n° 3, dossier-canon it2) : meme mecanique, seconde section.
					// L'etat vide generique de cette section n'est plus rendu (KR-187).
					expect(screen.getByRole('textbox', { name: /texte d ouverture/i })).toHaveValue(SONDE_DEPART)
					expect(screen.queryByText(texteEtatVide(1))).toBeNull()
				} else if (index === 2) {
					// Personnages (n° 4, dossier-fiches it1) : meme mecanique, quatrieme
					// section. L'etat vide generique de cette section n'est plus rendu (KR-187).
					expect(screen.getByRole('textbox', { name: /nom du personnage/i })).toHaveValue(SONDE_PERSONNAGES)
					expect(screen.queryByText(texteEtatVide(2))).toBeNull()
				} else if (index === 3) {
					// Lieux (n° 3, dossier-canon it4) : meme mecanique, troisieme section.
					// L'etat vide generique de cette section n'est plus rendu (KR-187).
					expect(screen.getByRole('textbox', { name: /nom du lieu/i })).toHaveValue(SONDE_LIEUX)
					expect(screen.queryByText(texteEtatVide(3))).toBeNull()
				} else {
					expect(screen.getByText(texteEtatVide(index))).toBeInTheDocument()
					expect(screen.getByText(GLYPHES[index], { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
				}
			})
		})
	})

	describe('clavier', () => {
		it('Tab parcourt les 10 lignes dans l ordre, Shift+Tab revient en arriere', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')

			await user.tab() // "Mes dossiers" — "Aperçu du jeu" est désactivé, donc hors de l'ordre de tabulation.
			for (const ligne of lignes) {
				await user.tab()
				expect(ligne).toHaveFocus()
			}

			await user.tab({ shift: true })
			expect(lignes[8]).toHaveFocus()
			await user.tab({ shift: true })
			expect(lignes[7]).toHaveFocus()
		})

		it('Entree/Espace sur une ligne focalisee la selectionne comme un clic', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')

			lignes[2].focus()
			await user.keyboard('{Enter}')
			expect(lignes[2]).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(texteEtatVide(2))).toBeInTheDocument()

			lignes[5].focus()
			await user.keyboard(' ')
			expect(lignes[5]).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(texteEtatVide(5))).toBeInTheDocument()
		})
	})

	/**
	 * Critère #7 du plan d'itération 1 de `dossier-controles` : un SECOND
	 * landmark, frère de « Sections du dossier », rendu SEULEMENT si un panneau
	 * Contrôles est injecté (critère #8 : sans injection, la nav des dix
	 * sections reste inchangée — voir `rend les 10 ListRow…` ci-dessus, non
	 * modifié). Sonde LOCALE, jamais le vrai `PanneauControles`
	 * (`dossier-controles`) : un test de `bascule-editeur` n'a pas plus le
	 * droit de l'importer que le code source (KR-184).
	 */
	describe('entree Controles (dossier-controles iteration 1)', () => {
		const SONDE_CONTROLES = 'Sonde du panneau Controles (test bascule-editeur)'
		function SondePanneauControles(): JSX.Element {
			return <p>{SONDE_CONTROLES}</p>
		}

		it('l entree Controles apparait quand un panneau est injecte', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			render(
				<BrainProvider brain={brain}>
					<DossierEditorScreen dossierId={dossier.id} panneauControles={<SondePanneauControles />} />
				</BrainProvider>,
			)

			const navControles = screen.getByRole('navigation', { name: 'Contrôles' })
			const ligne = within(navControles).getByRole('button', { name: 'Contrôles' })
			// Aucun badge de compte sur la ligne, et l assertion porte sur la TOTALITE
			// du texte rendu : `toHaveTextContent` seul teste une SOUS-chaine et ne
			// rougirait pas si un `trailing` etait ajoute demain a cote du titre
			// (KR-199 — un test dont le nom couvre plus que ses assertions).
			expect(ligne.textContent).toBe('Contrôles')

			// Pas encore active : le panneau ne s affiche pas avant l activation.
			expect(screen.queryByText(SONDE_CONTROLES)).toBeNull()

			await user.click(ligne)
			expect(ligne).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(SONDE_CONTROLES)).toBeInTheDocument()

			// BUG-082 — UNE SEULE ligne courante a l ecran. La premiere livraison
			// portait DEUX etats (`selectedId` + `destination`) et laissait la
			// derniere section surlignee en meme temps que « Controles » : deux
			// lignes `aria-current` simultanees, qu aucun test ne voyait rougir.
			const courantes = screen.getAllByRole('button').filter((bouton) => bouton.getAttribute('aria-current') === 'true')
			expect(courantes).toEqual([ligne])

			// Retour sur une section, puis activation CLAVIER (Tab implicite via
			// focus + Entree, meme mecanique que le bloc "clavier" ci-dessus).
			const navSections = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignesSections = within(navSections).getAllByRole('button')
			expect(lignesSections).toHaveLength(10)
			await user.click(lignesSections[0])
			expect(screen.queryByText(SONDE_CONTROLES)).toBeNull()

			ligne.focus()
			await user.keyboard('{Enter}')
			expect(ligne).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(SONDE_CONTROLES)).toBeInTheDocument()

			// SECTIONS.length === 10 reste vrai : la nav des dix sections est intacte.
			expect(within(navSections).getAllByRole('button')).toHaveLength(10)
		})

		it('sans panneau Controles injecte, le second landmark n existe pas', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			render(
				<BrainProvider brain={brain}>
					<DossierEditorScreen dossierId={dossier.id} />
				</BrainProvider>,
			)

			expect(screen.queryByRole('navigation', { name: 'Contrôles' })).toBeNull()
		})
	})
})

describe('racine de composition', () => {
	it('garde KR-071 retiree: App.tsx ne contient plus book:deleted ni isEditingBook', () => {
		const cheminAppTsx = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(cheminAppTsx, 'utf8')

		expect(source).not.toContain('book:deleted')
		expect(source).not.toContain('isEditingBook')
	})

	/**
	 * Complément à la sonde locale ci-dessus (mineur m1, revue de PR tech-lead) :
	 * la sonde prouve le MÉCANISME du slot `panneaux`, mais aucun test ne
	 * constatait le câblage RÉEL de la section `canon` vers `PanneauCanon` dans
	 * `App.tsx` — dont dépend toute la valeur utilisateur de cette itération.
	 * Test-grep, pas un rendu : `App.tsx` n'a pas de suite de tests dans ce
	 * dépôt et un import de `dossier-canon` ici serait légitime (racine de
	 * composition), mais un rendu complet sort du périmètre de ce fichier.
	 */
	it('App.tsx cable PanneauCanon, PanneauDepart et PanneauLieux sur les slots canon, depart et lieux', () => {
		const cheminAppTsx = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(cheminAppTsx, 'utf8')

		expect(source).toContain('PanneauCanon')
		expect(source).toMatch(/panneaux=\{\{\s*canon:\s*<PanneauCanon/)
		// Le slot `depart` gagne son panneau reel (dossier-canon it2) : sans cette
		// ligne, la sonde ci-dessus prouverait un mecanisme que rien n'utilise.
		expect(source).toContain('PanneauDepart')
		expect(source).toMatch(/panneaux=\{\{[\s\S]*?depart:\s*<PanneauDepart/)
		// Le slot `personnages` gagne son panneau reel (dossier-fiches it1), meme garde.
		expect(source).toContain('PanneauPersonnages')
		expect(source).toMatch(/panneaux=\{\{[\s\S]*?personnages:\s*<PanneauPersonnages/)
		// Le slot `lieux` gagne son panneau reel (dossier-canon it4), meme garde.
		expect(source).toContain('PanneauLieux')
		expect(source).toMatch(/panneaux=\{\{[\s\S]*?lieux:\s*<PanneauLieux/)
	})
})
