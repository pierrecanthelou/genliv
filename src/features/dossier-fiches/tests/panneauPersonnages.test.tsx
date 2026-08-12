import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Personnage, type Objectif } from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * L'écran Personnages — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 1 de `dossier-fiches`). Ce que ces tests éprouvent, distinct des
 * précédents `PanneauLieux`/`ObjectifsCanon` : l'accordéon à 8 emplacements
 * (1 rempli, 7 placeholders, compte exact), DEUX widgets FERMÉS qui committent
 * immédiatement (camp, plan) au lieu d'un brouillon, un `Select` d'objectif
 * dont l'état vide dépend du CANON (pas du personnage lui-même), et l'absence
 * volontaire de tout retrait/bandeau de refus (hors périmètre it1).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauPersonnages dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un personnage de plus par le CHEMIN PUBLIC d'écriture
 * (`dossiers.update()`, précédent `panneauLieux.test.tsx` / `semerLieu`) —
 * jamais un `persistence.set` derrière le service.
 */
function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un objectif de plus dans `canon.objectifs`, même chemin public. */
function semerObjectif(brain: Brain, dossierId: string, objectif: Objectif): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: { ...d.canon, objectifs: [...d.canon.objectifs, objectif] },
		monde: d.monde,
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Le dossier persisté, ou une erreur explicite — jamais un `?.` qui masque un null. */
function lire(brain: Brain, dossierId: string): Dossier {
	const dossier = brain.dossiers.get(dossierId)
	if (dossier === null) throw new Error(`Dossier introuvable : ${dossierId}`)
	return dossier
}

/** La `ListRow` d'un personnage, retrouvée par son SOUS-TITRE (`personnage.id`). */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

const NOM_DU_BLOC_1 = 'Camp, plan & rattachement'
const TEXTE_ITERATION = (n: number) => `ce bloc arrive à l'itération ${n} de dossier-fiches`

describe('PanneauPersonnages', () => {
	beforeEach(() => window.localStorage.clear())

	it('liste vide: gabarit pointille, glyphe, texte exact, bouton d ajout toujours visible', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.monde.personnages).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(
			screen.getByText('Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.'),
		).toBeInTheDocument()
		expect(screen.getByText('❏', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '+ Ajouter un personnage…' })).toBeInTheDocument()
	})

	it('creation: {id, portee:premier, plan_actions:[], savoirs:[]}, camp et nom absents, liste + bloc 1 deplie', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: '+ Ajouter un personnage…' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		const personnages = lire(brain, dossier.id).monde.personnages
		expect(personnages).toHaveLength(1)
		const nouveau = personnages[0]
		expect(nouveau.portee).toBe('premier')
		expect(nouveau.plan_actions).toEqual([])
		expect(nouveau.savoirs).toEqual([])
		expect(nouveau).not.toHaveProperty('camp')
		expect(nouveau).not.toHaveProperty('nom')

		// La ligne apparait, selectionnee, avec le repli sans nom.
		expect(screen.getByRole('button', { name: /Personnage n°1 \(sans nom\)/ })).toHaveAttribute('aria-current', 'true')

		// La fiche s'ouvre avec le bloc 1 deplie.
		expect(screen.getByRole('button', { name: NOM_DU_BLOC_1 })).toHaveAttribute('aria-expanded', 'true')
	})

	it('nom en-tete: Field hors accordeon, persiste au blur, la liste et le titre refletent la nouvelle valeur', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champNom = screen.getByRole('textbox', { name: /nom du personnage/i })
		expect(champNom).toHaveValue('')
		expect(champNom).toHaveAttribute('placeholder', 'Aldûr le Sage')

		fireEvent.change(champNom, { target: { value: 'Aldûr le Sage' } })
		// La frappe seule ne committe rien.
		expect(updateSpy).not.toHaveBeenCalled()
		fireEvent.blur(champNom)

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].nom).toBe('Aldûr le Sage')
		expect(screen.getByRole('button', { name: /Personnage « Aldûr le Sage »/ })).toBeInTheDocument()

		premier.unmount()
		renderPanel(brain, dossier.id)
		expect(screen.getByRole('textbox', { name: /nom du personnage/i })).toHaveValue('Aldûr le Sage')
	})

	it('camp/plan: commit immediat (un seul appel par clic), badge conditionnel sur camp', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const ligne = laLigne('pnj.aldur')
		expect(within(ligne).getByText('Premier plan')).toBeInTheDocument()
		expect(within(ligne).queryByText('Protagoniste')).toBeNull()
		expect(within(ligne).queryByText('Antagoniste')).toBeNull()

		const groupeCamp = screen.getByRole('radiogroup', { name: 'Camp du personnage' })
		await user.click(within(groupeCamp).getByRole('radio', { name: 'Protagoniste' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].camp).toBe('protagoniste')
		expect(within(laLigne('pnj.aldur')).getByText('Protagoniste')).toBeInTheDocument()

		const groupePlan = screen.getByRole('radiogroup', { name: 'Plan du personnage' })
		await user.click(within(groupePlan).getByRole('radio', { name: 'Second plan' }))

		expect(updateSpy).toHaveBeenCalledTimes(2)
		expect(lire(brain, dossier.id).monde.personnages[0].portee).toBe('second')
		const ligneApres = laLigne('pnj.aldur')
		expect(within(ligneApres).getByText('Second plan')).toBeInTheDocument()
		expect(within(ligneApres).queryByText('Premier plan')).toBeNull()
		// Le badge camp reste affiche, inchange par le changement de plan.
		expect(within(ligneApres).getByText('Protagoniste')).toBeInTheDocument()
	})

	it('objectif Select etat vide: message exact si 0 objectif dans le canon, aucun Select rendu', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.canon.objectifs).toHaveLength(0)
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		expect(
			screen.getByText(
				"Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe.",
			),
		).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: /objectif rattaché/i })).toBeNull()
	})

	it('objectif Select avec objectifs: option Aucun + une par objectif, le choix persiste objectif_id (ou retire la cle)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, { id: 'objectif.gouffre', camp: 'protagonistes', nom: 'Percer le Gouffre' })
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const select = screen.getByRole('combobox', { name: /objectif rattaché/i })
		expect(select).toHaveValue('')
		const options = within(select).getAllByRole('option')
		expect(options.map((o) => o.textContent)).toEqual(['Aucun objectif rattaché', 'Objectif « Percer le Gouffre »'])

		await user.selectOptions(select, 'objectif.gouffre')
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].objectif_id).toBe('objectif.gouffre')

		await user.selectOptions(select, '')
		expect(updateSpy).toHaveBeenCalledTimes(2)
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('objectif_id')
	})

	it('7 placeholders: compte exact = 7 (pas 6 ni 8), textes distincts par iteration cible, titres exacts dans l ordre', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		const titresExacts = [
			'Camp, plan & rattachement',
			'Identité',
			'Caractéristiques',
			"Objectif & plan d'actions",
			'Savoirs',
			'Relations',
			'Présence',
			'Caractère exploitable',
		]
		titresExacts.forEach((titre) => {
			expect(screen.getByRole('button', { name: titre })).toBeInTheDocument()
		})

		const placeholders = screen.getAllByText(/Pas encore renseigné — /)
		expect(placeholders).toHaveLength(7)

		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(2)}.`)).toHaveLength(2) // Identité, Caractéristiques
		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(3)}.`)).toHaveLength(1) // Objectif & plan d'actions
		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(4)}.`)).toHaveLength(3) // Savoirs, Relations, Présence
		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(5)}.`)).toHaveLength(1) // Caractère exploitable
	})

	it('un ajout, une edition de nom et un choix de camp laissent canon et charpente traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, { id: 'objectif.gouffre', camp: 'protagonistes', nom: 'Percer le Gouffre' })
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un personnage…' }))
		const apresAjout = lire(brain, dossier.id)
		expect(apresAjout.canon).toEqual(avant.canon)
		expect(apresAjout.charpente).toEqual(avant.charpente)

		const champNom = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom, { target: { value: 'Un nouveau personnage' } })
		fireEvent.blur(champNom)
		const apresNom = lire(brain, dossier.id)
		expect(apresNom.canon).toEqual(avant.canon)
		expect(apresNom.charpente).toEqual(avant.charpente)

		const groupeCamp = screen.getByRole('radiogroup', { name: 'Camp du personnage' })
		await user.click(within(groupeCamp).getByRole('radio', { name: 'Antagoniste' }))
		const apresCamp = lire(brain, dossier.id)
		expect(apresCamp.canon).toEqual(avant.canon)
		expect(apresCamp.charpente).toEqual(avant.charpente)
	})

	it('changer de selection reinitialise l accordeon au bloc 1 (remontage par key, jamais un effet)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.selene', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		// Deplier un autre bloc sur le premier personnage.
		await user.click(screen.getByRole('button', { name: 'Identité' }))
		expect(screen.getByRole('button', { name: 'Identité' })).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByRole('button', { name: NOM_DU_BLOC_1 })).toHaveAttribute('aria-expanded', 'false')

		// Selectionner l autre personnage : le bloc 1 redevient celui ouvert.
		await user.click(laLigne('pnj.selene'))
		expect(screen.getByRole('button', { name: NOM_DU_BLOC_1 })).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByRole('button', { name: 'Identité' })).toHaveAttribute('aria-expanded', 'false')
	})

	/**
	 * BUG-064 — le SENS DE LECTURE, et son INDEXATION. Aucun des 9 tests ci-dessus
	 * n'assertait une valeur VENUE DU DOCUMENT : ceux qui touchent le bloc 1
	 * cliquent avant de vérifier — ils prouvent que l'écriture atteint le
	 * document, jamais que le document revient à l'écran —, et les trois autres
	 * assertent un rendu sans donnée (liste vide, Select sans canon, placeholders).
	 * L'idiome de relecture
	 * existait pourtant dans ce fichier même (le test `nom` démonte et remonte) ;
	 * il n'avait simplement pas été étendu aux TROIS widgets fermés à commit
	 * immédiat, dont l'assertion sur le document donne l'illusion de la preuve.
	 *
	 * Deux propriétés distinctes, et il faut les deux — la seconde est celle que
	 * ce dépôt rate en boucle (KR-197, BUG-056/061/063) :
	 *
	 * 1. LECTURE — chaque champ rendu porte la valeur du document. Éprouvé sur
	 *    des valeurs que le composant NE PEUT PAS produire par défaut : ni le
	 *    plancher du schéma (`PORTEE_INITIALE = 'premier'`), ni le premier
	 *    élément d'un registre RÉEL (d'où DEUX objectifs semés, le rattachement
	 *    portant le second), ni l'option synthétique « Aucun ».
	 * 2. INDEXATION — la fiche suit la ligne SÉLECTIONNÉE, et aucune valeur ne
	 *    fuit d'un personnage vers l'autre. C'est le scénario réellement signalé :
	 *    une liste de six, un clic sur l'un d'eux. Un test mono-personnage ne
	 *    peut structurellement pas le voir — `brouillonNom` figé sur
	 *    `personnages[0]` survivait aux dix tests précédents.
	 */
	it('lecture au montage et apres selection: deux personnages opposes, aucune valeur ne fuit de l un a l autre (BUG-064)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// DEUX objectifs : le rattachement porte le SECOND, sinon une lecture
		// figee sur `objectifsCanon[0]` passerait encore.
		semerObjectif(brain, dossier.id, { id: 'objectif.sceau', camp: 'protagonistes', nom: 'Refermer le Sceau' })
		semerObjectif(brain, dossier.id, { id: 'objectif.gouffre', camp: 'antagonistes', nom: 'Percer le Gouffre' })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
			camp: 'antagoniste',
			objectif_id: 'objectif.gouffre',
		})
		renderPanel(brain, dossier.id)

		const champNom = () => screen.getByRole('textbox', { name: /nom du personnage/i })
		const segment = (nom: string) => screen.getByRole('radio', { name: nom })
		const selectObjectif = () => screen.getByRole('combobox', { name: /objectif rattaché/i })

		// AU MONTAGE, sans aucun clic : c'est le PREMIER personnage qui est
		// affiche, et rien du second n'a fuite jusqu'a lui.
		expect(champNom()).toHaveValue('Aldûr le Sage')
		expect(segment('Premier plan')).toHaveAttribute('aria-checked', 'true')
		expect(segment('Second plan')).toHaveAttribute('aria-checked', 'false')
		expect(segment('Protagoniste')).toHaveAttribute('aria-checked', 'false')
		expect(segment('Antagoniste')).toHaveAttribute('aria-checked', 'false')
		expect(selectObjectif()).toHaveValue('')

		// APRES SELECTION : les quatre champs suivent la ligne selectionnee.
		await user.click(laLigne('pnj.selene'))
		expect(champNom()).toHaveValue('Sélène la Vigie')
		expect(segment('Second plan')).toHaveAttribute('aria-checked', 'true')
		expect(segment('Premier plan')).toHaveAttribute('aria-checked', 'false')
		expect(segment('Antagoniste')).toHaveAttribute('aria-checked', 'true')
		expect(segment('Protagoniste')).toHaveAttribute('aria-checked', 'false')
		expect(selectObjectif()).toHaveValue('objectif.gouffre')

		// Les badges sont le SECOND site de lecture, independant du premier — et
		// chaque ligne porte les siens, pas ceux de sa voisine.
		expect(within(laLigne('pnj.selene')).getByText('Antagoniste')).toBeInTheDocument()
		expect(within(laLigne('pnj.selene')).getByText('Second plan')).toBeInTheDocument()
		expect(within(laLigne('pnj.aldur')).getByText('Premier plan')).toBeInTheDocument()
		expect(within(laLigne('pnj.aldur')).queryByText(/Protagoniste|Antagoniste/)).toBeNull()
	})
})
