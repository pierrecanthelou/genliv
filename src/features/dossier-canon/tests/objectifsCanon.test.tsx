import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Objectif } from '../../../brain'
import { ObjectifsCanon } from '../components/ObjectifsCanon'
import { PanneauCanon } from '../components/PanneauCanon'

/**
 * La liste des objectifs du canon (§5 du plan d'itération 3, lot 2). Ce qui la
 * distingue des panneaux Canon/Départ et que ces tests éprouvent : DEUX régimes
 * d'édition dans la MÊME carte (`camp` sans brouillon, comme `lieu_id` en it2 ;
 * `nom`/`…_texte` en brouillon indexé par `objectif.id`, comme le canon en it1) ;
 * AUCUN état de refus (structurellement inatteignable depuis cette UI) ; et un
 * avertissement DÉRIVÉ (`useMemo` sur `dossier`), visible aussi bien au montage
 * d'un dossier déjà non conforme qu'après une édition de session (KR-183).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<ObjectifsCanon dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un objectif par le CHEMIN PUBLIC d'écriture (`dossiers.update()`, précédent
 * `panneauDepart.test.tsx` / `resolved_decisions` d'it2) — jamais un
 * `persistence.set` derrière le service : c'est le seul chemin qui fait passer la
 * fixture par le validateur, condition du test « avertissement au montage ».
 */
function semerObjectif(brain: Brain, dossierId: string, objectif: Objectif): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: { ...d.canon, objectifs: [...d.canon.objectifs, objectif] },
		monde: d.monde,
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Le dossier persiste, ou une erreur explicite — jamais un `?.` qui masque un null. */
function lire(brain: Brain, dossierId: string): Dossier {
	const dossier = brain.dossiers.get(dossierId)
	if (dossier === null) throw new Error(`Dossier introuvable : ${dossierId}`)
	return dossier
}

function leCamp(): HTMLElement {
	return screen.getByRole('combobox', { name: /camp/i })
}

const OBJECTIF_VIDE: Objectif = {
	id: 'objectif.gouffre',
	camp: 'protagonistes',
	nom: '',
	reussi_si_texte: '',
	echoue_si_texte: '',
}

describe('ObjectifsCanon', () => {
	beforeEach(() => window.localStorage.clear())

	it('ajouter un objectif cree une carte camp protagonistes, persistee immediatement, relue a la reouverture', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		expect(dossier.canon.objectifs).toEqual([])
		const premier = renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un objectif…' }))

		const objectifs = lire(brain, dossier.id).canon.objectifs
		expect(objectifs).toHaveLength(1)
		expect(objectifs[0].camp).toBe('protagonistes')
		expect(objectifs[0].nom).toBe('')
		expect(objectifs[0].reussi_si_texte).toBe('')
		expect(objectifs[0].echoue_si_texte).toBe('')
		expect(leCamp()).toHaveValue('protagonistes')
		expect(screen.getByRole('textbox', { name: /nom de l.objectif/i })).toHaveValue('')

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(lire(brain, dossier.id).canon.objectifs).toHaveLength(1)
		expect(leCamp()).toHaveValue('protagonistes')
	})

	it('changer le camp committe immediatement au onChange, sans blur, aucun brouillon', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.selectOptions(leCamp(), 'antagonistes')

		// UN SEUL appel, declenche par le `change` — aucun blur necessaire.
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).canon.objectifs[0].camp).toBe('antagonistes')
		expect(leCamp()).toHaveValue('antagonistes')

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(leCamp()).toHaveValue('antagonistes')
	})

	it('le brouillon nom/reussite/echec est isole par objectif.id, deux objectifs edites en meme temps ne se melangent pas', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, { ...OBJECTIF_VIDE, id: 'objectif.un' })
		semerObjectif(brain, dossier.id, { ...OBJECTIF_VIDE, id: 'objectif.deux' })
		const premier = renderPanel(brain, dossier.id)

		const champsNom = screen.getAllByRole('textbox', { name: /nom de l.objectif/i })
		expect(champsNom).toHaveLength(2)

		fireEvent.change(champsNom[0], { target: { value: 'Objectif un' } })
		fireEvent.change(champsNom[1], { target: { value: 'Objectif deux' } })

		// Avant tout blur : chaque zone affiche sa propre saisie, sans melange.
		expect(champsNom[0]).toHaveValue('Objectif un')
		expect(champsNom[1]).toHaveValue('Objectif deux')

		fireEvent.blur(champsNom[0])
		fireEvent.blur(champsNom[1])

		const objectifs = lire(brain, dossier.id).canon.objectifs
		expect(objectifs.find((o) => o.id === 'objectif.un')?.nom).toBe('Objectif un')
		expect(objectifs.find((o) => o.id === 'objectif.deux')?.nom).toBe('Objectif deux')

		// Meme idiome que le critere #1 : la persistance ne se prouve pas seulement
		// en relisant `brain.dossiers.get()`, mais en demontant/remontant le panneau
		// et en relisant la valeur DANS LE DOM.
		premier.unmount()
		renderPanel(brain, dossier.id)

		const champsNomApres = screen.getAllByRole('textbox', { name: /nom de l.objectif/i })
		expect(champsNomApres).toHaveLength(2)
		expect(champsNomApres[0]).toHaveValue('Objectif un')
		expect(champsNomApres[1]).toHaveValue('Objectif deux')
	})

	it('retirer un objectif le supprime immediatement, sans dialogue de confirmation', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		renderPanel(brain, dossier.id)
		expect(lire(brain, dossier.id).canon.objectifs).toHaveLength(1)

		await user.click(screen.getByRole('button', { name: "Retirer l'objectif n°1" }))

		expect(lire(brain, dossier.id).canon.objectifs).toHaveLength(0)
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(screen.queryByRole('textbox', { name: /nom de l.objectif/i })).toBeNull()
	})

	it('un objectif deja non conforme (texte sans expr jumeau) affiche l avertissement des le montage, sans edition', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, {
			...OBJECTIF_VIDE,
			reussi_si_texte: 'Le heros a atteint le fond du Gouffre scelle.',
		})

		renderPanel(brain, dossier.id)

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent('ENREGISTRÉ, AVEC AVERTISSEMENT')
		expect(bandeau).toHaveTextContent(/reussi_si_texte/)
	})

	it('l avertissement apparait apres une saisie de …_texte suivie d un blur, sans rechargement', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		renderPanel(brain, dossier.id)

		expect(screen.queryByRole('status')).toBeNull()

		const champReussite = screen.getByRole('textbox', { name: /condition de réussite/i })
		fireEvent.change(champReussite, { target: { value: 'Le héros a atteint le fond du Gouffre scellé.' } })
		fireEvent.blur(champReussite)

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent('ENREGISTRÉ, AVEC AVERTISSEMENT')
	})

	it('objectif sans aucun …_texte renseigne: aucune region d avertissement rendue', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		renderPanel(brain, dossier.id)

		expect(screen.queryByRole('status')).toBeNull()
	})

	it('coexistence du refus Canon et de l avertissement Objectifs: deux regions status distinctes (getAllByRole)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, {
			...OBJECTIF_VIDE,
			reussi_si_texte: 'Le héros a atteint le fond du Gouffre scellé.',
		})
		render(
			<BrainProvider brain={brain}>
				<PanneauCanon dossierId={dossier.id} />
			</BrainProvider>,
		)

		// Provoque le refus du panneau Canon : synopsis vide au blur.
		const champSynopsis = screen.getByRole('textbox', { name: /synopsis/i })
		fireEvent.change(champSynopsis, { target: { value: '' } })
		fireEvent.blur(champSynopsis)

		const statuts = screen.getAllByRole('status')
		expect(statuts).toHaveLength(2)
		expect(statuts.some((el) => el.textContent?.includes("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"))).toBe(true)
		expect(statuts.some((el) => el.textContent?.includes('ENREGISTRÉ, AVEC AVERTISSEMENT'))).toBe(true)
	})

	it('un ajout sur canon.objectifs laisse monde et charpente traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// `get()` rend un clone NEUF a chaque appel : cet instantane ne peut pas etre
		// mute par l'ecriture qui suit, la comparaison est donc reelle.
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un objectif…' }))

		const apres = lire(brain, dossier.id)
		expect(apres.monde).toEqual(avant.monde)
		expect(apres.charpente).toEqual(avant.charpente)
		expect(apres.canon.objectifs).toHaveLength(1)
	})

	it('un retrait sur canon.objectifs laisse monde et charpente traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		// Instantane pris APRES le seed : seul le retrait qui suit doit etre juge.
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: "Retirer l'objectif n°1" }))

		const apres = lire(brain, dossier.id)
		expect(apres.monde).toEqual(avant.monde)
		expect(apres.charpente).toEqual(avant.charpente)
		expect(apres.canon.objectifs).toHaveLength(0)
	})

	it('une edition de champ (blur) sur canon.objectifs laisse monde et charpente traverser intacts', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerObjectif(brain, dossier.id, OBJECTIF_VIDE)
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		const champNom = screen.getByRole('textbox', { name: /nom de l.objectif/i })
		fireEvent.change(champNom, { target: { value: 'Objectif modifie' } })
		fireEvent.blur(champNom)

		const apres = lire(brain, dossier.id)
		expect(apres.monde).toEqual(avant.monde)
		expect(apres.charpente).toEqual(avant.charpente)
		expect(apres.canon.objectifs[0].nom).toBe('Objectif modifie')
	})
})
