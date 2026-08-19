import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Evenement, type Entite } from '../../../brain'
import { PanneauEvenements } from '../components/PanneauEvenements'

/**
 * L'écran Événements — `SegmentedControl` FILTRE (`lie_a_histoire`, pas une
 * bascule entre deux collections) + liste `ListRow` à gauche + fiche à droite
 * (§3 du plan d'itération 4 de `dossier-registres`). Précédents directs :
 * `PanneauJalonsFins.tsx` (it2) pour la coquille à `SegmentedControl`,
 * `PanneauQuetes.tsx` (it3) pour l'anatomie liste/fiche et le réordonnancement.
 * Ce qui est PROPRE à cette itération et que ces tests éprouvent en plus : le
 * FILTRE d'une seule collection, le MONSTRE (idiome « porte » sans
 * `avecOrpheline`, libellé dérivé, jamais une clé `nature`), et le JETON DE
 * REMONTAGE des résolutions.
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
			<PanneauEvenements dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** Sème un événement ENTIER par le CHEMIN PUBLIC d'écriture
 *  (`dossiers.update()`, précédent `panneauQuetes.test.tsx`/`semerQuete`) —
 *  jamais un `persistence.set` derrière le service. */
function semerEvenement(brain: Brain, dossierId: string, evenement: Evenement): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, evenements: [...d.monde.evenements, evenement] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Sème un objet — nécessaire comme cible d'un effet `donner_objet`/`retirer_objet`. */
function semerObjet(brain: Brain, dossierId: string, objet: Entite): Dossier {
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

/** Les lignes d'événements, jamais les boutons Monter/Descendre/+Ajouter. */
function lesLignesEvenements(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Événement'))
}

async function allerSurOnglet(
	user: ReturnType<typeof userEvent.setup>,
	libelle: 'LIÉS À LA TRAME' | 'LIBRES',
): Promise<void> {
	await user.click(screen.getByRole('radio', { name: libelle }))
}

describe('PanneauEvenements', () => {
	beforeEach(() => window.localStorage.clear())

	it('discriminance des deux onglets: chaque evenement visible dans son seul onglet, absence croisee (critere #3, KR-197/199/202)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerEvenement(brain, dossier.id, {
			id: 'evenement.lie',
			nom: 'Lie',
			lie_a_histoire: true,
			resolutions: [],
		})
		dossier = semerEvenement(brain, dossier.id, {
			id: 'evenement.libre',
			nom: 'Libre',
			lie_a_histoire: false,
			resolutions: [],
		})
		renderPanel(brain, dossier.id)

		// Onglet LIÉS À LA TRAME (par defaut) : seul « Lie » est visible, et le
		// compteur est DÉRIVÉ du seul sous-ensemble filtré (jamais le total).
		expect(screen.getByRole('radio', { name: 'LIÉS À LA TRAME' })).toHaveAttribute('aria-checked', 'true')
		expect(screen.getByText('Événement « Lie »')).toBeInTheDocument()
		expect(screen.queryByText('Événement « Libre »')).toBeNull()
		expect(lesLignesEvenements()).toHaveLength(1)
		expect(screen.getByText('1 événement(s) lié(s) à la trame')).toBeInTheDocument()

		await allerSurOnglet(user, 'LIBRES')

		expect(screen.getByText('Événement « Libre »')).toBeInTheDocument()
		expect(screen.queryByText('Événement « Lie »')).toBeNull()
		expect(lesLignesEvenements()).toHaveLength(1)
		expect(screen.getByText('1 événement(s) libre(s)')).toBeInTheDocument()
	})

	it('ajout immediat: lie_a_histoire pose selon le filtre actif, jamais undefined (critere #4)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.monde.evenements).toHaveLength(0)
		renderPanel(brain, dossier.id)

		expect(
			screen.getByText('Aucun événement lié à la trame — cliquez « + Ajouter un événement… » pour commencer.'),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter un événement…' }))

		const apresLies = lire(brain, dossier.id).monde.evenements
		expect(apresLies).toHaveLength(1)
		expect(apresLies[0].lie_a_histoire).toBe(true)
		expect(apresLies[0].resolutions).toEqual([])
		expect(lesLignesEvenements()).toHaveLength(1)
		expect(screen.getByRole('textbox', { name: /nom de l'événement/i })).toHaveFocus()

		await allerSurOnglet(user, 'LIBRES')
		expect(
			screen.getByText('Aucun événement libre — cliquez « + Ajouter un événement… » pour commencer.'),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter un événement…' }))

		const apresLibres = lire(brain, dossier.id).monde.evenements
		expect(apresLibres).toHaveLength(2)
		const nouveauLibre = apresLibres.find((ev) => !apresLies.some((avant) => avant.id === ev.id))
		expect(nouveauLibre?.lie_a_histoire).toBe(false)
		expect(lesLignesEvenements()).toHaveLength(1)
	})

	it('libelle monstre derive: Select MONSTRE renseigne affiche Monstre : {nom}, document sans cle nature (critere #2)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerEvenement(brain, dossier.id, { id: 'evenement.a', nom: 'A', lie_a_histoire: true, resolutions: [] })
		renderPanel(brain, dossier.id)

		expect(screen.queryByText(/^Monstre :/)).toBeNull()
		const comboboxAbsent = screen.getByRole('combobox', { name: 'MONSTRE' })
		expect(comboboxAbsent).toHaveValue('')

		await user.selectOptions(comboboxAbsent, 'bestiaire.gobelin')

		expect(lire(brain, dossier.id).monde.evenements[0].monstre_ref).toBe('bestiaire.gobelin')
		expect(screen.getByText('Monstre : Gobelin')).toBeInTheDocument()
		const comboboxResolu = screen.getByRole('combobox', { name: 'MONSTRE' })
		expect(comboboxResolu).toHaveValue('bestiaire.gobelin')

		// AUCUNE clé `nature` dans le document ecrit (§8-1, REJET unanime).
		expect('nature' in lire(brain, dossier.id).monde.evenements[0]).toBe(false)
	})

	it('retrait du monstre: monstre_ref repasse a undefined, Select repropose le placeholder (critere #7)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const dossier = inspection.dossier
		renderPanel(brain, dossier.id)

		// `evenement.embuscade-a-la-tour` (lie_a_histoire:true, monstre_ref
		// bestiaire.squelette) est le seul evenement lie de la reference.
		expect(screen.getByText('Monstre : Squelette')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Retirer le monstre' }))

		expect(lire(brain, dossier.id).monde.evenements[0].monstre_ref).toBeUndefined()
		expect(screen.queryByText(/^Monstre :/)).toBeNull()
		expect(screen.getByRole('combobox', { name: 'MONSTRE' })).toHaveValue('')
		expect(screen.queryByRole('button', { name: 'Retirer le monstre' })).toBeNull()
	})

	it('brouillon differe de resolution, contraste avec la creation immediate de l evenement (critere #5, KR-214)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		// La creation de l'EVENEMENT lui-meme reste IMMEDIATE (contraste).
		await user.click(screen.getByRole('button', { name: '+ Ajouter un événement…' }))
		expect(lire(brain, dossier.id).monde.evenements).toHaveLength(1)
		expect(lire(brain, dossier.id).monde.evenements[0].resolutions).toEqual([])

		expect(
			screen.getByText('Aucune résolution — cliquez « + Ajouter une résolution… » pour commencer.'),
		).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '+ Ajouter une résolution…' }))

		// Rien n'est ecrit avant un blur non vide (brouillon DIFFERE).
		expect(lire(brain, dossier.id).monde.evenements[0].resolutions).toEqual([])
		const champResultat = screen.getByRole('textbox', { name: /^RÉSULTAT/ })
		expect(champResultat).toHaveValue('')
		expect(screen.queryByText('Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer.')).toBeNull()

		fireEvent.blur(champResultat)
		expect(lire(brain, dossier.id).monde.evenements[0].resolutions).toEqual([])

		fireEvent.change(champResultat, { target: { value: 'Le loup blesse bat en retraite.' } })
		fireEvent.blur(champResultat)

		const resolutions = lire(brain, dossier.id).monde.evenements[0].resolutions
		expect(resolutions).toEqual([{ resultat: 'Le loup blesse bat en retraite.', consequence: [] }])
		// L'EditeurEffets n'apparait qu'APRES le commit de la resolution.
		expect(screen.getByText('Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer.')).toBeInTheDocument()
	})

	it('jeton de remontage: aucun brouillon d effet ne migre vers la resolution qui prend la place de celle retiree (critere #6)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerObjet(brain, dossier.id, { id: 'objet.torche', nom: 'Une torche' })
		dossier = semerEvenement(brain, dossier.id, {
			id: 'evenement.a',
			nom: 'A',
			lie_a_histoire: true,
			resolutions: [
				{ resultat: 'Resolution un.', consequence: [] },
				{ resultat: 'Resolution deux.', consequence: [] },
				{ resultat: 'Resolution trois.', consequence: [] },
			],
		})
		renderPanel(brain, dossier.id)

		expect(screen.getAllByRole('button', { name: '+ Ajouter un effet…' })).toHaveLength(3)
		expect(screen.queryAllByRole('combobox', { name: 'CIBLE' })).toHaveLength(0)

		// Ouvre un brouillon d'effet SUR LA RESOLUTION N°2 (rang 1) seulement.
		await user.click(screen.getAllByRole('button', { name: '+ Ajouter un effet…' })[1])
		expect(screen.getAllByRole('combobox', { name: 'CIBLE' })).toHaveLength(1)

		// Retire la resolution VOISINE (n°1, rang 0) : la resolution n°2 glisse a
		// la position 0, la n°3 glisse a la position 1.
		await user.click(screen.getAllByRole('button', { name: 'Retirer cette résolution' })[0])

		const resolutionsApres = lire(brain, dossier.id).monde.evenements[0].resolutions
		expect(resolutionsApres).toEqual([
			{ resultat: 'Resolution deux.', consequence: [] },
			{ resultat: 'Resolution trois.', consequence: [] },
		])
		// AUCUN brouillon d'effet ne doit avoir migre vers la ligne qui prend la
		// place de celle retiree : les DEUX instances restantes repartent a zero.
		expect(screen.queryAllByRole('combobox', { name: 'CIBLE' })).toHaveLength(0)
		expect(screen.getAllByText('Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer.')).toHaveLength(2)
	})

	it('selection par identifiant: repli sur la premiere ligne visible quand la fiche affichee sort du filtre (contrainte dure n1, plan section 5 lot 2)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		let dossier = brain.dossiers.create('Un dossier')
		dossier = semerEvenement(brain, dossier.id, { id: 'evenement.a', nom: 'A', lie_a_histoire: true, resolutions: [] })
		dossier = semerEvenement(brain, dossier.id, { id: 'evenement.b', nom: 'B', lie_a_histoire: false, resolutions: [] })
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('textbox', { name: /nom de l'événement/i })).toHaveValue('A')

		await allerSurOnglet(user, 'LIBRES')

		// « A » n'est plus dans le sous-ensemble filtre : repli sur « B »,
		// jamais un index fantome ni une fiche vide.
		expect(screen.getByRole('textbox', { name: /nom de l'événement/i })).toHaveValue('B')

		await allerSurOnglet(user, 'LIÉS À LA TRAME')

		// La selection de « A » n'a jamais ete perdue.
		expect(screen.getByRole('textbox', { name: /nom de l'événement/i })).toHaveValue('A')
	})

	/**
	 * KR-187 — test-grep de non-régression : cette feature possède désormais
	 * QUATRE sections (Indices, index 6 ; Quêtes, index 7 ; Événements, index 8 ;
	 * Jalons & fins, index 10). Les 9 AUTRES sections du dossier (canon,
	 * charpente.depart, personnages, lieux, objets, indices, quêtes,
	 * charpente.jalons/fins, conditions) doivent rester INTACTES après tout
	 * geste posé sur `monde.evenements` — ajout, édition, réordonnancement,
	 * monstre, résolution, effet. Dossier de RÉFÉRENCE (pas un dossier neuf) :
	 * les 9 autres sections y sont réellement PEUPLÉES.
	 */
	it('isolation des 9 autres sections: elles restent intactes apres ajout, edition, reorder, monstre, resolution et effet', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const avant = inspection.dossier
		renderPanel(brain, avant.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un événement…' }))
		const champNom = screen.getByRole('textbox', { name: /nom de l'événement/i })
		fireEvent.change(champNom, { target: { value: 'Un nouvel evenement' } })
		fireEvent.blur(champNom)

		await user.click(screen.getByRole('button', { name: /^Monter l'événement/ }))

		// Selectionne l'evenement de la reference pour y exercer monstre/resolution/effet.
		await user.click(screen.getByRole('button', { name: new RegExp('evenement\\.embuscade-a-la-tour') }))
		await user.selectOptions(screen.getByRole('combobox', { name: 'MONSTRE' }), 'bestiaire.gobelin')

		await user.click(screen.getByRole('button', { name: '+ Ajouter une résolution…' }))
		const champsResultat = screen.getAllByRole('textbox', { name: /^RÉSULTAT/ })
		const champResultat = champsResultat[champsResultat.length - 1]
		fireEvent.change(champResultat, { target: { value: 'Une resolution de plus.' } })
		fireEvent.blur(champResultat)

		await user.click(screen.getAllByRole('button', { name: '+ Ajouter un effet…' })[0])
		const combosCible = screen.getAllByRole('combobox', { name: 'CIBLE' })
		await user.selectOptions(combosCible[combosCible.length - 1], 'objet.sceau-de-cendre')

		const apres = lire(brain, avant.id)
		expect(apres.canon).toEqual(avant.canon)
		expect(apres.charpente.depart).toEqual(avant.charpente.depart)
		expect(apres.charpente.jalons).toEqual(avant.charpente.jalons)
		expect(apres.charpente.fins).toEqual(avant.charpente.fins)
		expect(apres.monde.personnages).toEqual(avant.monde.personnages)
		expect(apres.monde.lieux).toEqual(avant.monde.lieux)
		expect(apres.monde.objets).toEqual(avant.monde.objets)
		expect(apres.monde.indices).toEqual(avant.monde.indices)
		expect(apres.monde.quetes).toEqual(avant.monde.quetes)
		expect(apres.monde.conditions).toEqual(avant.monde.conditions)

		// La section Événements, elle, a bien change (sinon ce test ne prouverait rien).
		expect(apres.monde.evenements).not.toEqual(avant.monde.evenements)

		// Le Monter a permute par INDEX REEL, pas par index filtre (contrainte dure n3,
		// plan section 5 lot 2) : le nouvel evenement (filtre lies) a echange sa place
		// avec 'embuscade-a-la-tour' EN SAUTANT 'rumeur-sans-origine' (filtre libres,
		// non affiche sous l'onglet actif). Une permutation par index filtre brut
		// donnerait un ordre different (rumeur, embuscade, nouveau) et laisserait ce
		// test vert malgre le bug (KR-199) sans cette assertion d'ordre precise.
		const nouveau = apres.monde.evenements.find((ev) => ev.nom === 'Un nouvel evenement')
		expect(nouveau).toBeDefined()
		expect(apres.monde.evenements.map((ev) => ev.id)).toEqual([
			nouveau?.id,
			'evenement.rumeur-sans-origine',
			'evenement.embuscade-a-la-tour',
		])

		const evenementEdite = apres.monde.evenements.find((ev) => ev.id === 'evenement.embuscade-a-la-tour')
		expect(evenementEdite?.monstre_ref).toBe('bestiaire.gobelin')
		expect(evenementEdite?.resolutions).toHaveLength(3)
	})
})
