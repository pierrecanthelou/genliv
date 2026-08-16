import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, localiserEntite, type Brain, type Dossier, type Objet } from '../../../brain'
import { PanneauObjets } from '../components/PanneauObjets'

/**
 * L'écran Objets — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 1). Ce qui le distingue de ses précédents directs
 * (`PanneauLieux.tsx`, `PanneauPersonnages.tsx`) et que ces tests éprouvent :
 * `monde.objets` DÉMARRE VIDE à la création d'un dossier (comme
 * `monde.personnages`, contrairement à `monde.lieux`), et le RÉORDONNANCEMENT
 * par deux `IconButton` Monter/Descendre, composés ENTIÈREMENT par ce fichier
 * (`ListRow.tsx` inchangé), prouvé au clic ET au clavier (critère #4, KR-197).
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

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauObjets dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un objet de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 * précédent `panneauLieux.test.tsx`/`semerLieu`) — jamais un `persistence.set`
 * derrière le service : c'est le chemin que le validateur voit réellement.
 */
function semerObjet(brain: Brain, dossierId: string, objet: Objet): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, objets: [...d.monde.objets, objet] },
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

/**
 * La `ListRow` d'un objet, retrouvée par son SOUS-TITRE (`objet.id`, unique et
 * technique) — jamais par le titre, qui dépend du `nom` (optionnel).
 */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** Les lignes de la liste, jamais les boutons Monter/Descendre/+Ajouter. */
function lesLignes(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Objet'))
}

describe('PanneauObjets', () => {
	beforeEach(() => window.localStorage.clear())

	it('rendu initial: 3 objets de la reference dans la liste', () => {
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const { dossier } = inspection
		expect(dossier.monde.objets).toHaveLength(3)
		renderPanel(brain, dossier.id)

		// Libellés lus depuis le FICHIER fixture réel, jamais recopiés : chaque
		// ligne attendue est dérivée du `nom` réellement présent dans le document,
		// via la même fonction que la production (`localiserEntite`).
		dossier.monde.objets.forEach((objet, index) => {
			expect(screen.getByText(localiserEntite('objet', objet, index))).toBeInTheDocument()
		})
		expect(lesLignes()).toHaveLength(3)
	})

	it('ajouter un objet: apparait dans la liste, focus sur Nom', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// `monde.objets` DÉMARRE VIDE (contrairement a `monde.lieux`) : l etat reel
		// d un dossier neuf, pas un cas defensif.
		expect(dossier.monde.objets).toHaveLength(0)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un objet…' }))

		const objets = lire(brain, dossier.id).monde.objets
		expect(objets).toHaveLength(1)
		const nouveau = objets[0]
		expect(nouveau.nom).toBeUndefined()

		expect(lesLignes()).toHaveLength(1)
		expect(screen.getByText('Objet n°1 (sans nom)')).toBeInTheDocument()

		const champNom = screen.getByRole('textbox', { name: /nom de l.objet/i })
		expect(champNom).toHaveValue('')
		expect(champNom).toHaveFocus()
	})

	it('lecture au montage, deux objets distincts, sans interaction (KR-199/BUG-064)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, {
			id: 'objet.sceau-de-cendre',
			nom: 'Le sceau de cendre',
			description_joueur: 'Un disque de cire grise, fendu en son milieu.',
		})
		semerObjet(brain, dossier.id, {
			id: 'objet.lanterne-de-corvin',
			nom: 'La lanterne de Corvin',
			description_joueur: 'Une lanterne de fer-blanc bosselée, à la vitre fumée.',
		})
		renderPanel(brain, dossier.id)

		// Le PREMIER objet est affiché par défaut (aucune sélection explicite) :
		// ses valeurs sont celles du document, SANS AUCUNE INTERACTION.
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Le sceau de cendre')
		expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(
			'Un disque de cire grise, fendu en son milieu.',
		)

		// Sélectionner le SECOND objet (clic sur sa ligne) SANS AUCUNE FRAPPE : ses
		// valeurs affichées doivent être celles DU DOCUMENT pour CET objet, pas
		// celles du premier ni un brouillon vide.
		fireEvent.click(laLigne('objet.lanterne-de-corvin'))
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('La lanterne de Corvin')
		expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(
			'Une lanterne de fer-blanc bosselée, à la vitre fumée.',
		)
	})

	it('editer nom et description au blur, persistee, et relue apres remontage', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.amulette' })
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champNom = screen.getByRole('textbox', { name: /nom de l.objet/i })
		const champDescription = screen.getByRole('textbox', { name: /description/i })

		fireEvent.change(champNom, { target: { value: 'Une amulette scellée' } })
		fireEvent.blur(champNom)
		fireEvent.change(champDescription, {
			target: { value: 'Un médaillon de plomb noirci, dont le fermoir refuse de céder.' },
		})
		fireEvent.blur(champDescription)

		expect(updateSpy).toHaveBeenCalledTimes(2)
		const objet = lire(brain, dossier.id).monde.objets[0]
		expect(objet.nom).toBe('Une amulette scellée')
		expect(objet.description_joueur).toBe('Un médaillon de plomb noirci, dont le fermoir refuse de céder.')

		premier.unmount()
		renderPanel(brain, dossier.id)
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Une amulette scellée')
		expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(
			'Un médaillon de plomb noirci, dont le fermoir refuse de céder.',
		)
	})

	it('Monter au clic: ordre permute, meme objet reste affiche', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.alpha', nom: 'Alpha' })
		semerObjet(brain, dossier.id, { id: 'objet.beta', nom: 'Beta' })
		renderPanel(brain, dossier.id)

		// Sélection EXPLICITE de Beta (index 1) avant le réordonnancement — sans
		// cela la sélection par défaut retomberait sur l'index 0, ce que le
		// critère #4 interdit précisément de confondre avec « le même objet ».
		await user.click(laLigne('objet.beta'))
		expect(laLigne('objet.beta')).toHaveAttribute('aria-current', 'true')
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Beta')

		await user.click(screen.getByRole('button', { name: "Monter l'objet « Beta »" }))

		expect(lire(brain, dossier.id).monde.objets.map((o) => o.id)).toEqual(['objet.beta', 'objet.alpha'])
		// La fiche affichée reste celle de Beta (identifiant), pas « ce qui est
		// maintenant à l'index où Beta était » ni « ce qui est à l'index 0 ».
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Beta')
		expect(laLigne('objet.beta')).toHaveAttribute('aria-current', 'true')
	})

	it('Monter au clavier: Tab jusqu au bouton puis Entree produit le meme effet', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.alpha', nom: 'Alpha' })
		semerObjet(brain, dossier.id, { id: 'objet.beta', nom: 'Beta' })
		renderPanel(brain, dossier.id)

		// Clic de sélection sur Beta : pose le focus sur SA ListRow. Le bouton
		// Monter de Beta est le PROCHAIN élément focalisable (frère direct dans le
		// <li>, aucun Descendre pour le dernier objet) — Tab l'atteint en un pas,
		// chemin clavier distinct du clic testé ci-dessus.
		await user.click(laLigne('objet.beta'))
		await user.tab()
		const boutonMonter = screen.getByRole('button', { name: "Monter l'objet « Beta »" })
		expect(boutonMonter).toHaveFocus()

		await user.keyboard('{Enter}')

		expect(lire(brain, dossier.id).monde.objets.map((o) => o.id)).toEqual(['objet.beta', 'objet.alpha'])
		expect(screen.getByRole('textbox', { name: /nom de l.objet/i })).toHaveValue('Beta')
	})

	it('bornes: Monter absent sur le premier objet, Descendre absent sur le dernier, jamais disabled', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.alpha', nom: 'Alpha' })
		semerObjet(brain, dossier.id, { id: 'objet.beta', nom: 'Beta' })
		semerObjet(brain, dossier.id, { id: 'objet.gamma', nom: 'Gamma' })
		renderPanel(brain, dossier.id)

		// Premier objet (Alpha) : pas de Monter, un Descendre.
		expect(screen.queryByRole('button', { name: "Monter l'objet « Alpha »" })).toBeNull()
		expect(screen.getByRole('button', { name: "Descendre l'objet « Alpha »" })).toBeInTheDocument()

		// Objet du milieu (Beta) : les DEUX.
		expect(screen.getByRole('button', { name: "Monter l'objet « Beta »" })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: "Descendre l'objet « Beta »" })).toBeInTheDocument()

		// Dernier objet (Gamma) : un Monter, pas de Descendre.
		expect(screen.getByRole('button', { name: "Monter l'objet « Gamma »" })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: "Descendre l'objet « Gamma »" })).toBeNull()

		// Omis, jamais rendu desactive : aucun bouton de la liste ne porte
		// `disabled` (IconButton n'a d'ailleurs pas cette prop, §8 desaccord 9).
		screen.getAllByRole('button').forEach((bouton) => expect(bouton).not.toBeDisabled())
	})

	/**
	 * KR-013/113 — grep de contrat : la sélection et le brouillon sont calculés
	 * EN LIGNE (`objets.find(...) ?? objets[0]`), aucun `useEffect` ne recopie
	 * `dossier.monde.objets` dans un état local après le montage. UN SEUL
	 * `useEffect` existe dans ce fichier : le déplacement de focus impératif
	 * après un ajout (`intentionFocus`) — usage légitime (KR-013), qui ne lit
	 * ni ne recopie `dossier.monde.objets`, `brouillons`, ni `selection`.
	 */
	it('grep KR-013/113: aucun useEffect de resynchronisation du brouillon', () => {
		const source = fs.readFileSync(path.join(__dirname, '..', 'components', 'PanneauObjets.tsx'), 'utf8')
		const occurrences = source.match(/useEffect\(/g) ?? []
		expect(occurrences).toHaveLength(1)

		const corps = source.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[/)
		if (corps === null) throw new Error('useEffect introuvable')
		expect(corps[1]).toContain('intentionFocus')
		expect(corps[1]).not.toContain('setBrouillons')
		expect(corps[1]).not.toContain('setSelection')
		expect(corps[1]).not.toContain('dossier.monde.objets')
	})

	it('un ajout, une edition et un reorder sur monde.objets laissent canon et charpente traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjet(brain, dossier.id, { id: 'objet.alpha', nom: 'Alpha' })
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un objet…' }))
		const apresAjout = lire(brain, dossier.id)
		expect(apresAjout.canon).toEqual(avant.canon)
		expect(apresAjout.charpente).toEqual(avant.charpente)

		const champNom = screen.getByRole('textbox', { name: /nom de l.objet/i })
		fireEvent.change(champNom, { target: { value: 'Un nouvel objet' } })
		fireEvent.blur(champNom)
		const apresEdition = lire(brain, dossier.id)
		expect(apresEdition.canon).toEqual(avant.canon)
		expect(apresEdition.charpente).toEqual(avant.charpente)

		await user.click(screen.getByRole('button', { name: "Monter l'objet « Un nouvel objet »" }))
		const apresReorder = lire(brain, dossier.id)
		expect(apresReorder.canon).toEqual(avant.canon)
		expect(apresReorder.charpente).toEqual(avant.charpente)
	})
})
