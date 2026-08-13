import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	CARACTERISTIQUE_MIN,
	CHARACTERISTIC_MAX,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	STATS_INITIALES,
	type Brain,
	type Dossier,
	type Personnage,
	type Objectif,
	type Characteristic,
} from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * L'écran Personnages — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 1 de `dossier-fiches`). Ce que ces tests éprouvent, distinct des
 * précédents `PanneauLieux`/`ObjectifsCanon` : l'accordéon à 8 emplacements
 * (2 remplis dont le bloc « Identité » depuis it2, 6 placeholders, compte
 * exact), DEUX widgets FERMÉS qui committent immédiatement (camp, plan) au
 * lieu d'un brouillon, un `Select` d'objectif dont l'état vide dépend du
 * CANON (pas du personnage lui-même), et le bandeau de refus indexé par
 * personnage (it2, KR-197).
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

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."

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

	it('quatre placeholders recales: compte exact = 4 (pas 3 ni 5), textes distincts par iteration cible, titres exacts dans l ordre', () => {
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

		// « Caractéristiques » a quitte la table des placeholders a it3, « Objectif
		// & plan d'actions » a it4 : sans but/plan_actions renseignes, ce bloc porte
		// desormais son propre contenu (CE QU'IL VEUT, + Ajouter une etape...), plus
		// un placeholder generique « Pas encore renseigné — ».
		const placeholders = screen.getAllByText(/Pas encore renseigné — /)
		expect(placeholders).toHaveLength(4)

		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(5)}.`)).toHaveLength(3) // Savoirs, Relations, Présence
		expect(screen.getAllByText(`Pas encore renseigné — ${TEXTE_ITERATION(6)}.`)).toHaveLength(1) // Caractère exploitable
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
	 * IDENTITÉ (it2, critère #1 du plan) — les trois `Field` du bloc 2
	 * persistent au blur, exactement comme `nom` (idiome hérité d'it1), et un
	 * champ laissé vide n'écrit AUCUNE clé (même idiome que `objectif_id`).
	 */
	it('identite: les trois proses persistent au blur', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		// Le bloc 2 ne s ouvre pas automatiquement : il faut le deplier.
		await user.click(screen.getByRole('button', { name: 'Identité' }))

		const champFonction = screen.getByRole('textbox', { name: /^FONCTION/ })
		const champApparence = screen.getByRole('textbox', { name: /^APPARENCE/ })
		const champDescriptionJoueur = screen.getByRole('textbox', { name: /^DESCRIPTION JOUEUR/ })

		expect(champFonction).toHaveAttribute('placeholder', 'Ermite retiré du monde, gardien de la mémoire de Val-Cendre.')
		expect(champDescriptionJoueur).toHaveValue('')

		fireEvent.change(champFonction, {
			target: { value: 'Ermite retiré du monde, gardien de la mémoire de Val-Cendre.' },
		})
		fireEvent.blur(champFonction)
		fireEvent.change(champApparence, {
			target: { value: "Un vieil homme voûté à la barbe blanche tressée de perles d'os." },
		})
		fireEvent.blur(champApparence)
		// `description_joueur` reste vide : aucune clé ne doit etre ecrite pour lui.

		expect(updateSpy).toHaveBeenCalledTimes(2)
		const personnage = lire(brain, dossier.id).monde.personnages[0]
		expect(personnage.fonction).toBe('Ermite retiré du monde, gardien de la mémoire de Val-Cendre.')
		expect(personnage.apparence).toBe("Un vieil homme voûté à la barbe blanche tressée de perles d'os.")
		expect(personnage).not.toHaveProperty('description_joueur')

		// Vider un champ deja rempli retire sa cle plutot que d y committer ''.
		fireEvent.change(champFonction, { target: { value: '' } })
		fireEvent.blur(champFonction)
		expect(updateSpy).toHaveBeenCalledTimes(3)
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('fonction')
	})

	/**
	 * BUG-064 — le SENS DE LECTURE, et son INDEXATION, ÉTENDU à it2 aux trois
	 * proses d'identité (fonction/apparence/description_joueur) — les valeurs
	 * de ce bloc restent lues DANS un bloc FERMÉ par défaut (la fiche ne
	 * l'ouvre pas), et `getByDisplayValue` n'est PAS filtré par visibilité CSS
	 * (contrairement à `getByRole`), donc reste le bon instrument ici pour
	 * lire « au montage, sans interaction ».
	 *
	 * Deux propriétés distinctes, et il faut les deux — la seconde est celle
	 * que ce dépôt rate en boucle (KR-197, BUG-056/061/063) :
	 *
	 * 1. LECTURE — chaque champ rendu porte la valeur du document. Éprouvé sur
	 *    des valeurs que le composant NE PEUT PAS produire par défaut : ni le
	 *    plancher du schéma (`PORTEE_INITIALE = 'premier'`), ni le premier
	 *    élément d'un registre RÉEL (d'où DEUX objectifs semés, le rattachement
	 *    portant le second), ni l'option synthétique « Aucun », ni une prose
	 *    d'identité (le composant n'a aucun défaut à leur opposer).
	 * 2. INDEXATION — la fiche suit la ligne SÉLECTIONNÉE, et aucune valeur ne
	 *    fuit d'un personnage vers l'autre. Un test mono-personnage ne peut
	 *    structurellement pas le voir.
	 */
	it('lecture au montage sur DEUX personnages, sans interaction (BUG-064)', async () => {
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
			fonction: 'Ermite retiré du monde, gardien de la mémoire de Val-Cendre.',
			apparence: "Un vieil homme voûté à la barbe blanche tressée de perles d'os.",
			description_joueur: 'On le dit sage, et un peu fou.',
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			nom: 'Sélène la Vigie',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
			camp: 'antagoniste',
			objectif_id: 'objectif.gouffre',
			fonction: 'Guetteuse du beffroi, elle compte les silhouettes qui approchent de nuit.',
			apparence: 'Une jeune femme maigre, la cape rapiécée, un sifflet de corne autour du cou.',
			description_joueur: "On dit qu'elle voit dans le noir mieux qu'un chat.",
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
		expect(screen.getByDisplayValue('Ermite retiré du monde, gardien de la mémoire de Val-Cendre.')).toBeInTheDocument()
		expect(
			screen.getByDisplayValue("Un vieil homme voûté à la barbe blanche tressée de perles d'os."),
		).toBeInTheDocument()
		expect(screen.getByDisplayValue('On le dit sage, et un peu fou.')).toBeInTheDocument()
		expect(
			screen.queryByDisplayValue('Guetteuse du beffroi, elle compte les silhouettes qui approchent de nuit.'),
		).toBeNull()

		// APRES SELECTION : les sept champs suivent la ligne selectionnee.
		await user.click(laLigne('pnj.selene'))
		expect(champNom()).toHaveValue('Sélène la Vigie')
		expect(segment('Second plan')).toHaveAttribute('aria-checked', 'true')
		expect(segment('Premier plan')).toHaveAttribute('aria-checked', 'false')
		expect(segment('Antagoniste')).toHaveAttribute('aria-checked', 'true')
		expect(segment('Protagoniste')).toHaveAttribute('aria-checked', 'false')
		expect(selectObjectif()).toHaveValue('objectif.gouffre')
		expect(
			screen.getByDisplayValue('Guetteuse du beffroi, elle compte les silhouettes qui approchent de nuit.'),
		).toBeInTheDocument()
		expect(
			screen.getByDisplayValue('Une jeune femme maigre, la cape rapiécée, un sifflet de corne autour du cou.'),
		).toBeInTheDocument()
		expect(screen.getByDisplayValue("On dit qu'elle voit dans le noir mieux qu'un chat.")).toBeInTheDocument()
		expect(screen.queryByDisplayValue('Ermite retiré du monde, gardien de la mémoire de Val-Cendre.')).toBeNull()

		// Les badges sont le SECOND site de lecture, independant du premier — et
		// chaque ligne porte les siens, pas ceux de sa voisine.
		expect(within(laLigne('pnj.selene')).getByText('Antagoniste')).toBeInTheDocument()
		expect(within(laLigne('pnj.selene')).getByText('Second plan')).toBeInTheDocument()
		expect(within(laLigne('pnj.aldur')).getByText('Premier plan')).toBeInTheDocument()
		expect(within(laLigne('pnj.aldur')).queryByText(/Protagoniste|Antagoniste/)).toBeNull()
	})

	/**
	 * KR-197 (4e occurrence) — SONDE OBLIGATOIRE (§7 du plan d'itération 2) :
	 * muter `personnageAffiche.id` en `personnages[0].id` dans un des
	 * gestionnaires exposés par `useEcriturePersonnages` (ex. `handleBlurChamp`
	 * — extrait de `PanneauPersonnages` à it4, KR-112) DOIT faire rougir CE test
	 * précis. Exécutée à la main, restaurée ensuite — voir le compte rendu du lot.
	 */
	it('ecriture sur DEUX personnages, aucune fuite d indexation', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
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
		})
		renderPanel(brain, dossier.id)

		// Le SECOND personnage est selectionne.
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: 'Identité' }))

		const champFonction = screen.getByRole('textbox', { name: /^FONCTION/ })
		fireEvent.change(champFonction, { target: { value: 'Guetteuse du beffroi.' } })
		fireEvent.blur(champFonction)

		const personnages = lire(brain, dossier.id).monde.personnages
		const aldur = personnages.find((p) => p.id === 'pnj.aldur')
		const selene = personnages.find((p) => p.id === 'pnj.selene')
		if (aldur === undefined || selene === undefined) throw new Error('Personnage introuvable apres ecriture')

		expect(selene.fonction).toBe('Guetteuse du beffroi.')
		expect(aldur).not.toHaveProperty('fonction')
	})

	/**
	 * KR-183 — un dossier supprimé ailleurs pendant l'édition ne doit jamais
	 * rester un no-op muet : `commit()` rend `{statut:'absent'}` et le bandeau
	 * l'annonce. SANS MOCK du service (interdit dans ce lot, §7 du plan) : un
	 * second `createBrain()` sur le MÊME stockage (`window.localStorage`
	 * partagé) supprime le dossier, le premier brain — encore monté — le
	 * découvre au premier `commit()` suivant.
	 */
	it('dossier supprime pendant l edition: bandeau, pas de silence', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
		})
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		const champNom = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom, { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom)

		// Deux regions `role="status"` peuvent coexister a l ecran selon le
		// bloc en cause (regle RTL du depot) — ici une seule, mais `getAllByRole`
		// reste l instrument prescrit.
		const bandeaux = screen.getAllByRole('status')
		expect(bandeaux.length).toBeGreaterThan(0)
		expect(screen.getByText(EYEBROW_REFUS)).toBeInTheDocument()
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()
	})

	/**
	 * KR-197 (4e occurrence) — l'INDEXATION D'AFFICHAGE, isolée de
	 * l'invalidation : un refus provoqué sur un personnage ne doit jamais se
	 * montrer sous la fiche d'un AUTRE, y compris après un simple changement
	 * de SÉLECTION (aucune écriture). Chemin d'atteinte du refus : le seul
	 * réel, `{statut:'absent'}` via un second `createBrain()` sur le MÊME
	 * `window.localStorage` — AUCUN mock du service. Une fois le dossier
	 * supprimé, TOUT commit ultérieur rend `'absent'` : ce test n'a donc besoin
	 * que d'une seule écriture ratée (sur le premier personnage) et de
	 * changements de SÉLECTION ensuite, qui ne committent rien.
	 */
	it('bandeau de refus: un refus sur un personnage ne s affiche pas sous un autre', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
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
		})
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		// Refus sur ALDUR, le personnage affiche par defaut (premier seme).
		const champNom = () => screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom(), { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom())
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()

		// Selectionner l AUTRE personnage (aucune ecriture) : le bandeau ne le suit pas.
		fireEvent.click(laLigne('pnj.selene'))
		expect(screen.queryByText(TEXTE_ABSENT)).toBeNull()

		// Revenir sur aldur : le bandeau y est toujours.
		fireEvent.click(laLigne('pnj.aldur'))
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()
	})

	/**
	 * KR-197 (4e occurrence) — l'INDEXATION D'INVALIDATION, isolée de
	 * l'affichage : un commit RÉUSSI sur un AUTRE personnage ne doit jamais
	 * effacer un refus non résolu ; seul un commit réussi sur le personnage EN
	 * CAUSE l'efface.
	 *
	 * MONTAGE : `{statut:'absent'}` rend TOUT commit ultérieur absent tant que
	 * le dossier reste supprimé — impossible d'y obtenir une écriture
	 * RÉUSSIE sur un second personnage sans restaurer le dossier entre les
	 * deux écritures. La restauration passe par le SEUL chemin public
	 * symétrique du retrait (`DossierService.importDossier`, jamais un
	 * `persistence.set` derrière le service) : le document exact d'avant
	 * suppression est ré-importé sous le MÊME identifiant (libéré par le
	 * retrait), via un second `createBrain()` — toujours aucun mock.
	 */
	it('bandeau de refus: une ecriture reussie sur un autre personnage n efface pas le refus', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
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
		})
		// Capture AVANT suppression : le document tel qu il faudra le restaurer,
		// par le chemin public d import/export.
		const avant = JSON.stringify(lire(brain, dossier.id))
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		// Refus sur ALDUR (personnage affiche par defaut).
		const champNom = () => screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom(), { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom())
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()

		// Restaure le dossier EXACTEMENT tel qu avant (chemin public : import),
		// pour qu une ecriture ulterieure puisse a nouveau REUSSIR.
		const restauration = autreBrain.dossiers.importDossier(avant)
		expect(restauration.statut).toBe('valid')

		// Ecriture REUSSIE sur l AUTRE personnage : selectionner selene, editer son nom.
		fireEvent.click(laLigne('pnj.selene'))
		fireEvent.change(champNom(), { target: { value: 'Un autre nom' } })
		fireEvent.blur(champNom())
		expect(lire(brain, dossier.id).monde.personnages.find((p) => p.id === 'pnj.selene')?.nom).toBe('Un autre nom')

		// Le refus sur aldur SURVIT a ce succes ailleurs : revenir sur sa ligne,
		// le bandeau y est toujours.
		fireEvent.click(laLigne('pnj.aldur'))
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()

		// Une ecriture reussie sur le personnage EN CAUSE, elle, l efface bien.
		fireEvent.change(champNom(), { target: { value: 'Aldur corrige' } })
		fireEvent.blur(champNom())
		expect(screen.queryByText(TEXTE_ABSENT)).toBeNull()
	})

	/**
	 * Revue de PR (it2) — un ajout RATE ne doit jamais evincer un refus deja
	 * affiche : `handleAjouter` indexait autrefois le refus sur l identifiant
	 * TOUT JUSTE FRAPPE, qui n entre dans le document QUE si l ecriture
	 * reussit -- un ajout refuse rendait donc le bandeau existant inaffichable
	 * (aucune ligne ne porte cet id) tout en l evincant silencieusement.
	 * Meme montage que les deux tests precedents : `{statut:'absent'}` via un
	 * second `createBrain()` sur le MEME stockage, AUCUN mock du service.
	 */
	it('bandeau de refus: un refus sur un personnage survit a un ajout qui echoue', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
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
		})
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		// Refus sur ALDUR (personnage affiche par defaut).
		const champNom = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom, { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom)
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()

		// L ajout echoue aussi (meme dossier absent) : le bandeau ne doit ni
		// disparaitre, ni un personnage etre ajoute pour autant. Le dossier
		// ayant disparu du stockage partage, `lire()` ne peut plus le relire --
		// la preuve passe par la liste RENDUE (toujours DEUX lignes, aucune
		// troisieme, le sous-titre etant l identifiant du personnage).
		fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un personnage…' }))
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()
		expect(screen.getAllByText(/^pnj\./)).toHaveLength(2)
	})

	/**
	 * Revue de PR — RÉGRESSION introduite par le correctif précédent (symptôme
	 * de BUG-063) : indexer l'ajout raté sur le personnage AFFICHÉ (pour que
	 * le refus survive) a un effet de bord non voulu quand l'ajout RÉUSSIT —
	 * la garde d'invalidation de `commit()` voit alors le MÊME identifiant que
	 * le refus déjà en cause et l'efface, alors qu'un ajout ne résout rien sur
	 * un AUTRE personnage. `resout: false` sur le chemin de création ferme
	 * cette régression. Montage : refus `{statut:'absent'}` puis dossier
	 * RESTAURÉ (chemin public `importDossier`, même document exporté juste
	 * avant suppression) pour que l'ajout suivant puisse réellement RÉUSSIR —
	 * aucun mock du service.
	 */
	it('bandeau de refus: un ajout reussi ne resout pas un refus non resolu', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			nom: 'Aldûr le Sage',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
		})
		const avant = JSON.stringify(lire(brain, dossier.id))
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		// Refus sur ALDUR (personnage affiche par defaut).
		const champNom = screen.getByRole('textbox', { name: /nom du personnage/i })
		fireEvent.change(champNom, { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom)
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()

		// Restaure le dossier : l ajout suivant va REUSSIR.
		const restauration = autreBrain.dossiers.importDossier(avant)
		expect(restauration.statut).toBe('valid')

		// L ajout REUSSIT desormais (indexe sur Aldur pour l affichage) : il ne
		// doit PAS resoudre le refus non resolu sur Aldur.
		fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un personnage…' }))
		expect(lire(brain, dossier.id).monde.personnages).toHaveLength(2)

		// La selection a change (le nouveau personnage devient affiche) : le
		// FILTRE D AFFICHAGE masque donc le bandeau ICI, quel que soit l etat
		// reel de `refus` -- revenir sur la ligne d Aldur re-verifie l etat REEL.
		fireEvent.click(laLigne('pnj.aldur'))
		expect(screen.getByText(TEXTE_ABSENT)).toBeInTheDocument()
	})

	/**
	 * BLOC CARACTÉRISTIQUES (it3, §6 critère #3 du plan) — le `clamp` de
	 * `Stepper` (`min`/`max` déjà câblés à `CARACTERISTIQUE_MIN`/
	 * `CHARACTERISTIC_MAX`) rend toute valeur hors `[1,12]` INATTEIGNABLE :
	 * ni affichée, ni écrite. 8 clics « Diminuer » depuis le plancher, puis 20
	 * clics « Augmenter » (20 > 12 − 1) pour dépasser largement la borne haute.
	 */
	it('Force se clampe aux deux bornes 1 et 12', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: 'Caractéristiques' }))
		await user.click(screen.getByRole('button', { name: '+ Régler les caractéristiques…' }))

		const diminuer = () => screen.getByRole('button', { name: 'Diminuer FORCE (FO)' })
		const augmenter = () => screen.getByRole('button', { name: 'Augmenter FORCE (FO)' })
		const controlesFO = () => diminuer().parentElement as HTMLElement

		for (let i = 0; i < 8; i += 1) {
			await user.click(diminuer())
		}
		expect(within(controlesFO()).getByText(String(CARACTERISTIQUE_MIN))).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.personnages[0].stats).toEqual(STATS_INITIALES)

		for (let i = 0; i < 20; i += 1) {
			await user.click(augmenter())
		}
		expect(within(controlesFO()).getByText(String(CHARACTERISTIC_MAX))).toBeInTheDocument()
		const reglagesFinaux = lire(brain, dossier.id).monde.personnages[0].stats
		expect(reglagesFinaux).toEqual({ ...STATS_INITIALES, FO: CHARACTERISTIC_MAX })
	})

	/**
	 * BUG-064, ÉTENDU au bloc Caractéristiques (it3, §6 critère #5 du plan) —
	 * mêmes deux propriétés que le test d'identité plus haut : LECTURE (chaque
	 * Stepper + le PV portent la valeur du document) et INDEXATION (la fiche
	 * suit la ligne sélectionnée, rien ne fuit d'un personnage vers l'autre).
	 * `FO≠1`/`PV≠3` sur LES DEUX personnages : indiscernable d'un défaut de
	 * widget sinon (BUG-064). Le bloc 3 ne s'ouvre pas automatiquement, et
	 * l'accordéon revient au bloc 1 à chaque changement de sélection (remontage
	 * par `key`) : il faut le rouvrir après avoir sélectionné le second
	 * personnage.
	 *
	 * REVUE QA MODE B — les HUIT Stepper, pas seulement FO/AG/CA : FO et AG
	 * sont recoupées par le PV (qui pin de fait EN par soustraction), mais DX,
	 * IN, IG, SE n'étaient éprouvées nulle part avant ce correctif, ni sur A ni
	 * sur B. `verifieLesHuitCaracs` boucle sur `CHARACTERISTIC_VALUES` (jamais
	 * huit littéraux) pour que l'assertion couvre exactement le même ensemble
	 * que celui rendu par `FichePersonnage.tsx`.
	 */
	it('lecture au montage sur DEUX personnages, sans interaction', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const statsAldur: Record<Characteristic, number> = { FO: 7, AG: 9, DX: 8, EN: 6, IN: 10, IG: 4, SE: 5, CA: 11 } // PV = 22
		const statsSelene: Record<Characteristic, number> = { FO: 5, AG: 6, DX: 9, EN: 6, IN: 3, IG: 7, SE: 8, CA: 2 } // PV = 17
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			stats: statsAldur,
		})
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.selene',
			portee: 'second',
			plan_actions: [],
			savoirs: [],
			stats: statsSelene,
		})
		renderPanel(brain, dossier.id)

		const valeurAffichee = (carac: Characteristic): string | null => {
			const label = `${CHARACTERISTICS[carac].label.toUpperCase()} (${carac})`
			const bouton = screen.getByRole('button', { name: `Diminuer ${label}` })
			return within(bouton.parentElement as HTMLElement).getByText(/^\d+$/).textContent
		}

		const verifieLesHuitCaracs = (attendu: Record<Characteristic, number>) => {
			CHARACTERISTIC_VALUES.forEach((carac) => {
				expect(valeurAffichee(carac)).toBe(String(attendu[carac]))
			})
		}

		// AU MONTAGE, sans aucun clic de selection : c est le PREMIER personnage
		// (aldur) qui est affiche.
		await user.click(screen.getByRole('button', { name: 'Caractéristiques' }))
		verifieLesHuitCaracs(statsAldur)
		expect(screen.getByText('22')).toBeInTheDocument()
		expect(screen.queryByText('17')).toBeNull()

		// APRES SELECTION de selene : les 8 Stepper et le PV suivent SA fiche,
		// aucun residu d aldur (l accordeon est revenu au bloc 1, il faut le
		// rouvrir).
		await user.click(laLigne('pnj.selene'))
		await user.click(screen.getByRole('button', { name: 'Caractéristiques' }))
		verifieLesHuitCaracs(statsSelene)
		expect(screen.getByText('17')).toBeInTheDocument()
		expect(screen.queryByText('22')).toBeNull()
	})
})
