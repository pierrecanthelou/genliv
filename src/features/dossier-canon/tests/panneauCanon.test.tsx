import fs from 'node:fs'
import path from 'node:path'
import { act, render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, BUDGET_MOTS_CANON, type Brain } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { PanneauCanon } from '../components/PanneauCanon'

/**
 * Le formulaire Canon — le premier écran qui écrit réellement le dossier, via
 * `DossierService.update()` (§3 du plan d'itération 1). Cinq propriétés
 * portent tout le reste, chacune éprouvée ici : le rendu initial montre le
 * contenu RÉEL du dossier (jamais un état vide) ; les trois champs de prose
 * committent au blur, un seul appel par champ ; le brouillon n'est JAMAIS
 * resynchronisé (KR-013/113) ; l'ajout/retrait d'un interdit committe
 * IMMÉDIATEMENT ; un refus ne revert JAMAIS le champ, un avertissement ne
 * bloque JAMAIS l'écriture (KR-165/KR-183).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauCanon dossierId={dossierId} />
		</BrainProvider>,
	)
}

/** N mots distincts d'un texte de test — jamais le texte réel d'un champ. */
function texteDeNMots(n: number): string {
	return Array.from({ length: n }, () => 'mot').join(' ')
}

describe('PanneauCanon', () => {
	beforeEach(() => window.localStorage.clear())

	it('rendu initial: les 3 champs de prose portent le contenu reel du dossier, pas un etat vide', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		// Un dossier fraîchement créé porte déjà le marqueur d'amorce dans ses
		// quatre textes de prose (`DossierService.create()` → `construireAmorce`) :
		// comparer à la valeur RÉELLE du dossier plutôt qu'à une constante recopiée
		// prouve à la fois « valeur réelle affichée » et « aucun traitement à part »
		// sans dupliquer le marqueur hors de son unique porteur (`brain/dossier/amorce.ts`).
		expect(screen.getByRole('textbox', { name: /synopsis/i })).toHaveValue(dossier.canon.mj.synopsis_mj)
		expect(screen.getByRole('textbox', { name: /accroche/i })).toHaveValue(dossier.canon.partage.accroche_joueur)
		expect(screen.getByRole('textbox', { name: /^ton/i })).toHaveValue(dossier.canon.ton)
		// Le bloc Objectifs (`ObjectifsCanon`, lot 2 de l'itération 3) est monte comme
		// cinquieme enfant du panneau — sa presence, rien de plus : ses propres
		// comportements sont eprouves par `objectifsCanon.test.tsx`.
		expect(screen.getByText('OBJECTIFS DES CAMPS — interne, jamais injecté au modèle')).toBeInTheDocument()
	})

	it('sauvegarde d un champ au blur persiste et survit a une relecture, update appele une seule fois', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		const premier = renderPanel(brain, dossier.id)
		const champTon = screen.getByRole('textbox', { name: /^ton/i })
		await user.clear(champTon)
		await user.type(champTon, 'Grave, sombre.')
		await user.tab()

		// UN SEUL appel : les frappes de `clear`/`type` ne committent rien, seul le
		// blur (le `tab()` final) déclenche `DossierService.update()`.
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(brain.dossiers.get(dossier.id)?.canon.ton).toBe('Grave, sombre.')

		premier.unmount()
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('textbox', { name: /^ton/i })).toHaveValue('Grave, sombre.')
	})

	it('blur sur un champ ne reecrit pas un autre champ adopte entre-temps (MAJEUR 1, revue de PR)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		// Adoption survenue APRES le montage du panneau : le brouillon local est
		// deja seede sur l'ancienne accroche. Ecrit DERRIERE le service PUIS emet
		// l'evenement (KR-004), meme patron que dossierEditorScreen.test.tsx.
		act(() => {
			brain.persistence.set(dossierKey(dossier.id), {
				...dossier,
				canon: { ...dossier.canon, partage: { accroche_joueur: 'Accroche adoptee du cloud.' } },
				updatedAt: '2026-08-10T09:00:00.000Z',
			})
			brain.events.emit('dossier:updated', { dossierId: dossier.id })
		})

		const champTon = screen.getByRole('textbox', { name: /^ton/i })
		await user.clear(champTon)
		await user.type(champTon, 'Grave, sombre.')
		await user.tab()

		// Le blur sur TON (patch etroit) ne doit PAS ecraser l'accroche adoptee
		// entre-temps avec la copie perimee que le brouillon en portait au montage.
		expect(brain.dossiers.get(dossier.id)?.canon.partage.accroche_joueur).toBe('Accroche adoptee du cloud.')
		expect(brain.dossiers.get(dossier.id)?.canon.ton).toBe('Grave, sombre.')
	})

	it('grep KR-013/113: aucun useEffect de resynchronisation du brouillon', () => {
		const chemin = path.join(__dirname, '..', 'components', 'PanneauCanon.tsx')
		const source = fs.readFileSync(chemin, 'utf8')

		// Le brouillon est seedé UNE FOIS (`useState(() => …)`) : aucun `useEffect`
		// ne doit exister dans ce fichier pour le recopier depuis `dossier.canon`
		// après le montage — ni à l'ouverture, ni sur un refus, ni sur un
		// `dossier:updated` du même dossier.
		expect(source).not.toMatch(/useEffect\(/)
	})

	it('ajouter un interdit de ton l ajoute a la liste persistee, sans attendre un blur', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		expect(brain.dossiers.get(dossier.id)?.canon.interdits_ton).toEqual([])

		await user.click(screen.getByRole('button', { name: '+ Ajouter un interdit…' }))

		expect(brain.dossiers.get(dossier.id)?.canon.interdits_ton).toEqual([''])
		expect(screen.getByRole('textbox', { name: 'Interdit de ton n°1' })).toBeInTheDocument()
	})

	it('supprimer un interdit de ton le retire de la liste persistee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		// Pré-seed un interdit par le chemin d'écriture réel, avant le montage.
		const seed = brain.dossiers.update(dossier.id, (d) => ({
			canon: { ...d.canon, interdits_ton: ["Pas d'anachronismes modernes."] },
			monde: d.monde,
			charpente: d.charpente,
		}))
		expect(seed.statut).toBe('ecrit')
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('textbox', { name: 'Interdit de ton n°1' })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: "Retirer l'interdit n°1" }))

		expect(brain.dossiers.get(dossier.id)?.canon.interdits_ton).toEqual([])
		expect(screen.queryByRole('textbox', { name: 'Interdit de ton n°1' })).toBeNull()
	})

	it('synopsis a 600 mots pile: data-etat absent ou normal', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		const champ = screen.getByRole('textbox', { name: /synopsis/i })
		fireEvent.change(champ, { target: { value: texteDeNMots(BUDGET_MOTS_CANON) } })
		fireEvent.blur(champ)

		const compteur = screen.getByText(`${BUDGET_MOTS_CANON}/${BUDGET_MOTS_CANON} mots`)
		expect(compteur.getAttribute('data-etat')).not.toBe('avertissement')
	})

	it('synopsis a 601 mots: data-etat avertissement, champ persiste quand meme', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		const champ = screen.getByRole('textbox', { name: /synopsis/i })
		const texte = texteDeNMots(BUDGET_MOTS_CANON + 1)
		fireEvent.change(champ, { target: { value: texte } })
		fireEvent.blur(champ)

		const compteur = screen.getByText(`${BUDGET_MOTS_CANON + 1}/${BUDGET_MOTS_CANON} mots`)
		expect(compteur).toHaveAttribute('data-etat', 'avertissement')
		// NON BLOQUANT (KR-165) : le texte est bien persisté malgré l'avertissement.
		expect(brain.dossiers.get(dossier.id)?.canon.mj.synopsis_mj).toBe(texte)
	})

	it('synopsis vide puis blur: refus, aucun revert, bandeau affiche', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const avant = dossier.canon.mj.synopsis_mj
		renderPanel(brain, dossier.id)

		const champ = screen.getByRole('textbox', { name: /synopsis/i })
		fireEvent.change(champ, { target: { value: '' } })
		fireEvent.blur(champ)

		// Rien n'est persisté : le magasin garde l'ancien texte.
		expect(brain.dossiers.get(dossier.id)?.canon.mj.synopsis_mj).toBe(avant)
		// AUCUN REVERT : le champ affiche exactement ce que l'auteur a tapé (vide).
		expect(champ).toHaveValue('')

		const bandeau = screen.getByRole('status')
		expect(bandeau).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")
		// Le message de l'anomalie, résolu par le validateur (`tables.ts`), pas
		// recopié ici : on vérifie juste qu'il est bien rendu par `IssueList`.
		expect(bandeau).toHaveTextContent(/vide/i)
	})

	it('le bandeau de refus sur un champ survit a un commit reussi sur un AUTRE champ (revue de PR, tour 2)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		const champSynopsis = screen.getByRole('textbox', { name: /synopsis/i })
		fireEvent.change(champSynopsis, { target: { value: '' } })
		fireEvent.blur(champSynopsis)
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")

		// Le patch etroit (correctif MAJEUR 1) ne doit PAS faire disparaitre le
		// bandeau : le refus portait sur synopsis_mj, pas sur ton. L'effacer ici
		// re-silencierait un champ toujours non enregistre.
		const champTon = screen.getByRole('textbox', { name: /^ton/i })
		await user.clear(champTon)
		await user.type(champTon, 'Grave, sombre.')
		await user.tab()

		expect(brain.dossiers.get(dossier.id)?.canon.ton).toBe('Grave, sombre.')
		expect(screen.getByRole('status')).toHaveTextContent("CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ")

		// Reecrire un synopsis valide leve le bandeau : le refus qui l'a produit
		// est desormais resolu.
		fireEvent.change(champSynopsis, { target: { value: 'Une verite suffisante.' } })
		fireEvent.blur(champSynopsis)

		expect(screen.queryByRole('status')).toBeNull()
	})
})
