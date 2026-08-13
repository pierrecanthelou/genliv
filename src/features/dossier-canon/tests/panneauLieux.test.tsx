import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Lieu } from '../../../brain'
import { PanneauLieux } from '../components/PanneauLieux'

/**
 * L'écran Lieux — liste `ListRow` à gauche, fiche à droite (§3 du plan
 * d'itération 4). Ce qui le distingue des panneaux Canon/Départ/Objectifs et
 * que ces tests éprouvent : DEUX écritures possibles (ajout, retrait) en plus
 * de l'édition de champ, retrait IMMÉDIAT sans `Modal` (désaccord #1), UN
 * SEUL cas de refus — retirer le lieu de `charpente.depart.lieu_id` —, et le
 * focus qui SUIT la sélection après un ajout (champ Nom) ou un retrait réussi
 * (bouton retirer de la fiche nouvellement affichée).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauLieux dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un lieu de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 * précédent `panneauDepart.test.tsx`) — jamais un `persistence.set` derrière
 * le service : c'est le chemin que le validateur voit réellement.
 */
function semerLieu(brain: Brain, dossierId: string, lieu: Lieu): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, lieux: [...d.monde.lieux, lieu] },
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
 * La `ListRow` d'un lieu, retrouvée par son SOUS-TITRE (`lieu.id`, unique et
 * technique) — jamais par le titre, qui dépend du `nom` (optionnel, pas
 * toujours discriminant entre deux lieux « sans nom »).
 */
function laLigne(id: string): HTMLElement {
	return screen.getByRole('button', { name: new RegExp(id) })
}

/** Les lignes de la liste, jamais le bouton d'ajout ni celui de retrait. */
function lesLignes(): HTMLElement[] {
	return screen.getAllByRole('button').filter((bouton) => bouton.textContent?.startsWith('Lieu'))
}

describe('PanneauLieux', () => {
	beforeEach(() => window.localStorage.clear())

	it('ajouter un lieu cree une ligne, la selectionne, pose le focus sur Nom, persiste et se relit a la reouverture', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Dossier fraichement cree : DossierService.create() seme un unique lieu
		// (lieu.amorce, KR-178), deja la selection par defaut au montage.
		expect(dossier.monde.lieux).toHaveLength(1)
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: '+ Ajouter un lieu…' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		const lieux = lire(brain, dossier.id).monde.lieux
		expect(lieux).toHaveLength(2)
		const nouveau = lieux[1]
		expect(nouveau.id).not.toBe('lieu.amorce')
		expect(nouveau.nom).toBeUndefined()

		expect(lesLignes()).toHaveLength(2)
		expect(laLigne(nouveau.id)).toHaveAttribute('aria-current', 'true')

		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		expect(champNom).toHaveValue('')
		expect(champNom).toHaveFocus()

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(lire(brain, dossier.id).monde.lieux).toHaveLength(2)
		expect(lesLignes()).toHaveLength(2)
	})

	it('editer les 4 champs commite au blur, un seul appel par champ, et une reouverture relit les valeurs persistees', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		const champDescription = screen.getByRole('textbox', { name: /description/i })
		const champAmbiance = screen.getByRole('textbox', { name: /ambiance/i })
		const champDangers = screen.getByRole('textbox', { name: /dangers/i })

		fireEvent.change(champNom, { target: { value: 'Val-Cendre' } })
		fireEvent.blur(champNom)
		fireEvent.change(champDescription, { target: { value: 'Une bourgade cendrée au pied du Gouffre.' } })
		fireEvent.blur(champDescription)
		fireEvent.change(champAmbiance, { target: { value: 'Le vent siffle entre les ruines.' } })
		fireEvent.blur(champAmbiance)
		fireEvent.change(champDangers, { target: { value: 'Des loups rôdent la nuit venue.' } })
		fireEvent.blur(champDangers)

		// Les frappes ne committent rien : seuls les 4 blurs ecrivent.
		expect(updateSpy).toHaveBeenCalledTimes(4)
		const lieu = lire(brain, dossier.id).monde.lieux[0]
		expect(lieu.nom).toBe('Val-Cendre')
		expect(lieu.description).toBe('Une bourgade cendrée au pied du Gouffre.')
		expect(lieu.ambiance).toBe('Le vent siffle entre les ruines.')
		expect(lieu.dangers).toBe('Des loups rôdent la nuit venue.')

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('textbox', { name: /nom du lieu/i })).toHaveValue('Val-Cendre')
		expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(
			'Une bourgade cendrée au pied du Gouffre.',
		)
		expect(screen.getByRole('textbox', { name: /ambiance/i })).toHaveValue('Le vent siffle entre les ruines.')
		expect(screen.getByRole('textbox', { name: /dangers/i })).toHaveValue('Des loups rôdent la nuit venue.')
	})

	it('retirer un lieu non reference le supprime immediatement sans dialogue, la liste passe de N a N-1, la selection retombe et le focus suit', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const seme = semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		expect(seme.monde.lieux).toHaveLength(2)
		renderPanel(brain, dossier.id)

		await user.click(laLigne('lieu.val-cendre'))
		expect(laLigne('lieu.val-cendre')).toHaveAttribute('aria-current', 'true')

		await user.click(screen.getByRole('button', { name: 'Retirer le lieu « Val-Cendre »' }))

		expect(screen.queryByRole('dialog')).toBeNull()
		expect(lire(brain, dossier.id).monde.lieux).toHaveLength(1)
		expect(lesLignes()).toHaveLength(1)
		expect(screen.queryByText(/val-cendre/i)).toBeNull()

		// La selection retombe sur le lieu precedent (index 0, l'amorce) et le
		// focus suit sur SON bouton retirer, dans la fiche nouvellement affichee.
		expect(laLigne('lieu.amorce')).toHaveAttribute('aria-current', 'true')
		expect(screen.getByRole('button', { name: 'Retirer le lieu n°1' })).toHaveFocus()
	})

	it('retirer le lieu de charpente.depart est refuse : liste inchangee, bandeau visible, aucun retrait optimiste', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Un second lieu NON reference, pour que le refus ne se confonde pas avec
		// le cas (structurellement different) d'un dossier a un seul lieu.
		semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		renderPanel(brain, dossier.id)

		// lieu.amorce est deja la selection par defaut (premier du tableau), et
		// c'est le lieu que charpente.depart.lieu_id reference.
		expect(lire(brain, dossier.id).charpente.depart.lieu_id).toBe('lieu.amorce')
		await user.click(screen.getByRole('button', { name: 'Retirer le lieu n°1' }))

		expect(lire(brain, dossier.id).monde.lieux).toHaveLength(2)
		expect(lesLignes()).toHaveLength(2)
		expect(laLigne('lieu.amorce')).toBeInTheDocument()

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
		expect(bandeau).toHaveTextContent(/point de départ/i)
		expect(bandeau).toHaveTextContent(/lieu\.amorce/)

		// La fiche affichee reste celle du lieu dont le retrait a ete refuse.
		expect(screen.getByRole('textbox', { name: /nom du lieu/i })).toBeInTheDocument()
	})

	it('le bandeau de refus ne suit pas une autre fiche apres un changement de selection (BUG-061)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		renderPanel(brain, dossier.id)

		// lieu.amorce (selection par defaut) est reference par charpente.depart :
		// son retrait est refuse, le bandeau s'affiche sous SA fiche.
		await user.click(screen.getByRole('button', { name: 'Retirer le lieu n°1' }))
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")

		// Selectionner un AUTRE lieu ne committe rien : le refus reste attache a
		// lieu.amorce, donc aucun bandeau ne doit apparaitre sous cette fiche-ci.
		await user.click(laLigne('lieu.val-cendre'))
		expect(laLigne('lieu.val-cendre')).toHaveAttribute('aria-current', 'true')
		expect(screen.queryByRole('status')).toBeNull()

		// Revenir sur lieu.amorce le refait apparaitre : l'etat est bien conserve
		// par lieu, pas efface globalement au premier changement de selection.
		await user.click(laLigne('lieu.amorce'))
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
	})

	it('un commit reussi sur un AUTRE lieu ne fait pas disparaitre le refus non resolu (BUG-061, meme famille que BUG-056)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		renderPanel(brain, dossier.id)

		// Refus sur lieu.amorce (reference par charpente.depart).
		await user.click(screen.getByRole('button', { name: 'Retirer le lieu n°1' }))
		expect(screen.getByRole('status')).toBeInTheDocument()

		// Une ecriture reussie sur un AUTRE lieu (val-cendre) ne doit pas effacer
		// le refus non resolu de lieu.amorce, meme si aucun bandeau n'est visible
		// pendant l'edition de val-cendre (le filtrage d'affichage le masque).
		await user.click(laLigne('lieu.val-cendre'))
		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		fireEvent.change(champNom, { target: { value: 'Val-Cendre modifie' } })
		fireEvent.blur(champNom)
		expect(lire(brain, dossier.id).monde.lieux.find((l) => l.id === 'lieu.val-cendre')?.nom).toBe('Val-Cendre modifie')

		// Retour sur lieu.amorce : le refus est toujours la, pas efface par le
		// succes sur un lieu different.
		await user.click(laLigne('lieu.amorce'))
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")

		// A l'inverse, un succes sur CE MEME lieu (lieu.amorce) leve le bandeau -
		// symetrique de la garde ci-dessus, jamais un refus coince pour toujours.
		const champNomAmorce = screen.getByRole('textbox', { name: /nom du lieu/i })
		fireEvent.change(champNomAmorce, { target: { value: 'Val-Cendre (amorce)' } })
		fireEvent.blur(champNomAmorce)
		expect(screen.queryByRole('status')).toBeNull()
	})

	it('un ajout, une edition et un retrait sur monde.lieux laissent canon et charpente traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		// `get()` rend un clone NEUF a chaque appel : cet instantane ne peut pas
		// etre mute par les ecritures qui suivent, la comparaison est donc reelle.
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: '+ Ajouter un lieu…' }))
		const apresAjout = lire(brain, dossier.id)
		expect(apresAjout.canon).toEqual(avant.canon)
		expect(apresAjout.charpente).toEqual(avant.charpente)

		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		fireEvent.change(champNom, { target: { value: 'Un nouveau lieu' } })
		fireEvent.blur(champNom)
		const apresEdition = lire(brain, dossier.id)
		expect(apresEdition.canon).toEqual(avant.canon)
		expect(apresEdition.charpente).toEqual(avant.charpente)

		await user.click(laLigne('lieu.val-cendre'))
		await user.click(screen.getByRole('button', { name: 'Retirer le lieu « Val-Cendre »' }))
		const apresRetrait = lire(brain, dossier.id)
		expect(apresRetrait.canon).toEqual(avant.canon)
		expect(apresRetrait.charpente).toEqual(avant.charpente)
	})

	/**
	 * Revue de PR (dossier-fiches it2, élargissement) — `commit()` ne traitait
	 * QUE `'refuse'` explicitement ; `'absent'` (dossier supprimé ailleurs
	 * pendant l'édition) tombait dans la branche succès et EFFAÇAIT tout refus
	 * en silence au lieu de le signaler. SANS MOCK du service : un second
	 * `createBrain()` sur le MÊME stockage (`window.localStorage` partagé)
	 * supprime le dossier, le premier brain — encore monté — le découvre au
	 * premier `commit()` suivant.
	 */
	it('dossier supprime pendant l edition: bandeau, jamais efface silencieusement par la branche succes', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		fireEvent.change(champNom, { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom)

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
		expect(bandeau).toHaveTextContent("Ce dossier n'existe plus")
	})

	/**
	 * Revue de PR — même défaut que `PanneauPersonnages.handleAjouter`
	 * (dossier-fiches it2) : `commit()` indexait l'ajout raté sur l'identifiant
	 * TOUT JUSTE FRAPPÉ, qui n'entre jamais dans le document si l'écriture
	 * échoue — un ajout refusé évinçait donc en silence un refus déjà affiché
	 * sur un autre lieu. Même montage que le test précédent : `{statut:'absent'}`
	 * via un second `createBrain()`, AUCUN mock du service.
	 */
	it('bandeau de refus: un refus sur un lieu survit a un ajout qui echoue', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		const autreBrain = createBrain()
		expect(autreBrain.dossiers.remove(dossier.id)).toBe(true)

		// Refus sur lieu.amorce (lieu affiche par defaut).
		const champNom = screen.getByRole('textbox', { name: /nom du lieu/i })
		fireEvent.change(champNom, { target: { value: 'Un nom quelconque' } })
		fireEvent.blur(champNom)
		expect(screen.getByRole('status')).toHaveTextContent("Ce dossier n'existe plus")

		// L ajout echoue aussi (meme dossier absent) : le bandeau ne doit ni
		// disparaitre, ni un lieu etre ajoute pour autant.
		fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un lieu…' }))
		expect(screen.getByRole('status')).toHaveTextContent("Ce dossier n'existe plus")
		expect(lesLignes()).toHaveLength(1)
	})

	/**
	 * Revue de PR — RÉGRESSION introduite par le correctif précédent (symptôme
	 * de BUG-063) : indexer l'ajout raté sur le lieu AFFICHÉ (pour que le refus
	 * survive à un ajout qui ÉCHOUE) a un effet de bord non voulu quand l'ajout
	 * RÉUSSIT — la garde d'invalidation de `commit()` voit alors le MÊME
	 * identifiant que le refus déjà en cause et l'efface, alors qu'un ajout ne
	 * résout rien sur un AUTRE lieu. `resout: false` sur le chemin de création
	 * ferme cette régression. Séquence directement montable (retrait refusé
	 * par le SSOT, `charpente.depart.lieu_id`) — aucun besoin de simuler un
	 * dossier absent ici, l'ajout doit réellement RÉUSSIR pour prouver le défaut.
	 */
	it('bandeau de refus: un ajout reussi ne resout pas un refus non resolu', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Un second lieu NON reference, pour que lieu.amorce reste la selection.
		semerLieu(brain, dossier.id, { id: 'lieu.val-cendre', nom: 'Val-Cendre' })
		renderPanel(brain, dossier.id)

		// Refus sur lieu.amorce (reference par charpente.depart).
		await user.click(screen.getByRole('button', { name: 'Retirer le lieu n°1' }))
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")

		// L ajout REUSSIT desormais (indexe sur lieu.amorce, l entite affichee) :
		// il ne doit PAS resoudre le refus non resolu sur lieu.amorce.
		await user.click(screen.getByRole('button', { name: '+ Ajouter un lieu…' }))
		expect(lire(brain, dossier.id).monde.lieux).toHaveLength(3)

		// La selection a change (le nouveau lieu, focus Nom) -- revenir sur
		// lieu.amorce re-verifie l etat REEL du refus.
		await user.click(laLigne('lieu.amorce'))
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
	})
})
