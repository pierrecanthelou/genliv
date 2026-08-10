import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	localiserEntite,
	BUDGET_MOTS_CANON,
	type Brain,
	type Dossier,
	type Entite,
} from '../../../brain'
import { PanneauDepart } from '../components/PanneauDepart'

/**
 * Le formulaire Départ — le point d'entrée de l'aventure, écrit par le même
 * `DossierService.update()` que le canon (§3 du plan d'itération 2). Ce qui le
 * distingue du panneau Canon et que ces tests éprouvent : `lieu_id` n'a AUCUN
 * brouillon (un `Select` n'a pas de blur) et committe au `change` ; le texte
 * d'ouverture garde l'idiome brouillon + blur ; aucun chemin d'avertissement
 * n'existe pour cette section (aucun de ses deux champs n'est dans
 * `BUDGETS_DE_MOTS`) ; et rien ici ne crée ni ne supprime un lieu.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauDepart dossierId={dossierId} />
		</BrainProvider>,
	)
}

/**
 * Sème un lieu de plus par le CHEMIN PUBLIC d'écriture (`dossiers.update()`,
 * §8 désaccord 8 du plan) — jamais un `persistence.set` derrière le service :
 * c'est le chemin que l'auteur empruntera quand la feature Lieux existera, et
 * il fait passer la fixture par le validateur.
 */
function semerLieu(brain: Brain, dossierId: string, lieu: Entite): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, lieux: [...d.monde.lieux, lieu] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refusé par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

/** Le dossier persisté, ou une erreur explicite — jamais un `?.` qui masque un null. */
function lire(brain: Brain, dossierId: string): Dossier {
	const dossier = brain.dossiers.get(dossierId)
	if (dossier === null) throw new Error(`Dossier introuvable : ${dossierId}`)
	return dossier
}

function leSelect(): HTMLElement {
	return screen.getByRole('combobox', { name: /lieu de départ/i })
}

function leTexteOuverture(): HTMLElement {
	return screen.getByRole('textbox', { name: /texte d.ouverture/i })
}

const VAL_CENDRE: Entite = { id: 'lieu.val-cendre', nom: 'Val-Cendre' }
const FOYER_DU_GUET: Entite = { id: 'lieu.foyer-du-guet', nom: 'Foyer du Guet' }

describe('PanneauDepart', () => {
	beforeEach(() => window.localStorage.clear())

	it('le Select liste les lieux du dossier dans l ordre du tableau, jamais un lieu en dur', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const seme = semerLieu(brain, dossier.id, VAL_CENDRE)
		renderPanel(brain, dossier.id)

		// La fixture porte bien DEUX lieux — sans ce garde, l'égalité ci-dessous
		// serait vraie sur une liste à une seule entrée, donc vide de sens.
		expect(seme.monde.lieux).toHaveLength(2)

		const options = within(leSelect()).getAllByRole('option')
		// Confrontées au dossier RÉEL, pas à des identifiants recopiés : l'ordre est
		// celui de `monde.lieux`, jamais un tri d'affichage (qui désynchroniserait
		// l'index du repli de `localiserEntite`).
		expect(options.map((option) => (option as HTMLOptionElement).value)).toEqual(
			seme.monde.lieux.map((lieu) => lieu.id),
		)
		expect(leSelect()).toHaveValue(seme.charpente.depart.lieu_id)
	})

	it('un lieu sans nom est libelle par le repli de localiserEntite, jamais vide ni undefined', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Le lieu semé avec tout dossier neuf n'a PAS de `nom` (champ de destination
		// auteur) : c'est exactement le cas que le repli existe pour rendre lisible.
		const seme = semerLieu(brain, dossier.id, VAL_CENDRE)
		expect(seme.monde.lieux[0].nom).toBeUndefined()
		renderPanel(brain, dossier.id)

		const options = within(leSelect()).getAllByRole('option')

		expect(options[0].textContent).toBe(localiserEntite('lieu', seme.monde.lieux[0], 0))
		expect(options[0].textContent).not.toBe('')
		expect(options[0].textContent).not.toMatch(/undefined/)
		// Le lieu NOMMÉ passe par la même fonction : une seule règle d'affichage.
		expect(options[1].textContent).toBe(localiserEntite('lieu', seme.monde.lieux[1], 1))
	})

	it('changer de lieu committe immediatement, sans blur, et la reouverture relit la valeur persistee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, VAL_CENDRE)
		semerLieu(brain, dossier.id, FOYER_DU_GUET)
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.selectOptions(leSelect(), VAL_CENDRE.id)

		// UN SEUL appel, déclenché par le `change` : aucun blur n'est nécessaire, et
		// le magasin porte déjà la valeur.
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).charpente.depart.lieu_id).toBe(VAL_CENDRE.id)
		expect(leSelect()).toHaveValue(VAL_CENDRE.id)

		// Un second changement ÉCRASE le premier — et l'écran ne diverge pas du
		// dossier, puisqu'il n'y a aucun brouillon local à réconcilier.
		await user.selectOptions(leSelect(), FOYER_DU_GUET.id)

		expect(updateSpy).toHaveBeenCalledTimes(2)
		expect(lire(brain, dossier.id).charpente.depart.lieu_id).toBe(FOYER_DU_GUET.id)
		expect(leSelect()).toHaveValue(FOYER_DU_GUET.id)

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(leSelect()).toHaveValue(FOYER_DU_GUET.id)
	})

	it('le texte d ouverture est persiste au blur et survit a une relecture, update appele une seule fois', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const premier = renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const champ = leTexteOuverture()
		await user.clear(champ)
		await user.type(champ, 'La salle se tait.')
		await user.tab()

		// Les frappes ne committent rien : seul le blur écrit.
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).charpente.depart.texte_ouverture_joueur).toBe('La salle se tait.')

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(leTexteOuverture()).toHaveValue('La salle se tait.')
	})

	it('vider le texte d ouverture: refus, aucun revert, bandeau affiche, et le lieu reste hors du refus', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const seme = semerLieu(brain, dossier.id, VAL_CENDRE)
		const avant = seme.charpente.depart.texte_ouverture_joueur
		renderPanel(brain, dossier.id)

		const champ = leTexteOuverture()
		fireEvent.change(champ, { target: { value: '' } })
		fireEvent.blur(champ)

		// Rien n'est persisté, et le champ affiche exactement ce que l'auteur a tapé.
		expect(lire(brain, dossier.id).charpente.depart.texte_ouverture_joueur).toBe(avant)
		expect(champ).toHaveValue('')

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
		// Le message rédigé par le validateur, pas recopié ici : il NOMME le champ en
		// cause, ce qui prouve du même coup que le refus ne vient pas du lieu.
		expect(bandeau).toHaveTextContent(/texte_ouverture_joueur/)
		expect(bandeau).toHaveTextContent(/vide/i)

		// `lieu_id` n'entre dans AUCUN `Refus.champs` : un commit RÉUSSI sur le lieu
		// n'a aucun champ commun avec le refus, donc il ne le lève pas — le texte tapé
		// n'est toujours pas enregistré, et le bandeau continue de le dire.
		await user.selectOptions(leSelect(), VAL_CENDRE.id)

		expect(lire(brain, dossier.id).charpente.depart.lieu_id).toBe(VAL_CENDRE.id)
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
		// Et le Select n'ouvre jamais SON propre chemin de refus : un seul bandeau,
		// celui du texte.
		expect(screen.getAllByRole('status')).toHaveLength(1)

		// Réécrire une ouverture valide lève le bandeau : le refus est résolu.
		fireEvent.change(champ, { target: { value: 'Une ouverture suffisante.' } })
		fireEvent.blur(champ)

		expect(screen.queryByRole('status')).toBeNull()
		expect(lire(brain, dossier.id).charpente.depart.texte_ouverture_joueur).toBe('Une ouverture suffisante.')
	})

	it('aucun compteur ni avertissement sur Depart, que le texte soit court ou tres long', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const { container } = renderPanel(brain, dossier.id)
		const champ = leTexteOuverture()

		fireEvent.change(champ, { target: { value: 'Court.' } })
		fireEvent.blur(champ)

		expect(container.querySelector('[data-etat]')).toBeNull()
		expect(screen.queryByText(/\d+\/\d+ mots/)).toBeNull()
		expect(screen.queryByRole('status')).toBeNull()

		// Deux fois le budget du CANON — la seule borne de mots du schéma, et elle ne
		// porte pas sur `charpente.depart` : aucun avertissement n'est possible ici,
		// et le texte est persisté sans réserve.
		const tresLong = Array.from({ length: BUDGET_MOTS_CANON * 2 }, () => 'mot').join(' ')
		fireEvent.change(champ, { target: { value: tresLong } })
		fireEvent.blur(champ)

		expect(lire(brain, dossier.id).charpente.depart.texte_ouverture_joueur).toBe(tresLong)
		expect(container.querySelector('[data-etat]')).toBeNull()
		expect(container.querySelector('[data-etat="avertissement"]')).toBeNull()
		expect(screen.queryByText(/\d+\/\d+ mots/)).toBeNull()
		expect(screen.queryByRole('status')).toBeNull()
	})

	it('aucune affordance de creation ou de suppression de lieu dans ce panneau', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, VAL_CENDRE)
		renderPanel(brain, dossier.id)

		// Créer un lieu appartient à la feature Lieux (n° 4) : ce panneau CHOISIT
		// parmi les lieux existants, il n'en fabrique aucun.
		expect(screen.queryByRole('button', { name: /ajouter/i })).toBeNull()
		expect(screen.queryByRole('button', { name: /nouveau lieu/i })).toBeNull()
		expect(screen.queryByText(/\+ ajouter/i)).toBeNull()
		expect(screen.queryByText(/nouveau lieu/i)).toBeNull()
		expect(screen.queryAllByRole('button')).toHaveLength(0)
		// Discriminant : le contrôle de choix, lui, est bien là et opérable.
		expect(leSelect()).toBeEnabled()
	})

	it('un dossier a un seul lieu montre la legende qui nomme l attente, sans griser le controle', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Dossier fraîchement créé : `DossierService.create()` ne sème QU'UN lieu.
		expect(dossier.monde.lieux).toHaveLength(1)
		const premier = renderPanel(brain, dossier.id)

		expect(within(leSelect()).getAllByRole('option')).toHaveLength(1)
		expect(leSelect()).toBeEnabled()
		expect(leSelect()).not.toHaveAttribute('aria-invalid')
		expect(
			screen.getByText("Seul lieu existant — Lieux (à venir) permettra d'en ajouter d'autres."),
		).toBeInTheDocument()

		// La légende disparaît dès le deuxième lieu.
		premier.unmount()
		semerLieu(brain, dossier.id, VAL_CENDRE)
		renderPanel(brain, dossier.id)

		expect(within(leSelect()).getAllByRole('option')).toHaveLength(2)
		expect(screen.queryByText(/seul lieu existant/i)).toBeNull()
	})

	it('un commit sur charpente.depart laisse monde et canon traverser intacts', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerLieu(brain, dossier.id, VAL_CENDRE)
		// `get()` rend un clone NEUF à chaque appel : cet instantané ne peut pas être
		// muté par l'écriture qui suit, la comparaison est donc réelle.
		const avant = lire(brain, dossier.id)
		renderPanel(brain, dossier.id)

		const champ = leTexteOuverture()
		fireEvent.change(champ, { target: { value: 'Une ouverture reecrite.' } })
		fireEvent.blur(champ)

		const apresTexte = lire(brain, dossier.id)
		expect(apresTexte.monde).toEqual(avant.monde)
		expect(apresTexte.canon).toEqual(avant.canon)
		expect(apresTexte.charpente.jalons).toEqual(avant.charpente.jalons)
		expect(apresTexte.charpente.fins).toEqual(avant.charpente.fins)
		expect(apresTexte.charpente.depart.texte_ouverture_joueur).toBe('Une ouverture reecrite.')

		await user.selectOptions(leSelect(), VAL_CENDRE.id)

		const apresLieu = lire(brain, dossier.id)
		expect(apresLieu.monde).toEqual(avant.monde)
		expect(apresLieu.canon).toEqual(avant.canon)
		expect(apresLieu.charpente.depart.lieu_id).toBe(VAL_CENDRE.id)
		// Le champ jumeau n'est pas réécrit par le commit du lieu (patch étroit).
		expect(apresLieu.charpente.depart.texte_ouverture_joueur).toBe('Une ouverture reecrite.')
	})
})
