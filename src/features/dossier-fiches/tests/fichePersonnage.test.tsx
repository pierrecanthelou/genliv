import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier, type Personnage } from '../../../brain'
import { PanneauPersonnages } from '../components/PanneauPersonnages'

/**
 * Le bloc 3 de l'accordéon (« Caractéristiques »), it3 — deux états exclusifs
 * et son écriture (§3/§5/§6 critères #1-#5 du plan d'itération 3 de
 * `dossier-fiches`). Fichier NEUF, SÉPARÉ de `panneauPersonnages.test.tsx`
 * (§5 du plan) : mêmes petits helpers de montage/seed, DUPLIQUÉS ici à
 * dessein — chaque fichier de test de cette feature reste autonome (même
 * choix que `panneauLieux.test.tsx`/`objectifsCanon.test.tsx`, deux fichiers
 * distincts sans import croisé entre suites de tests).
 *
 * Passe TOUJOURS par la pile complète (`BrainProvider` + `createBrain`),
 * jamais par des props mockées sur `FichePersonnage` : les critères eux-mêmes
 * portent sur l'ÉCRITURE (« un seul update() ») et sur le PV AFFICHÉ après ce
 * commit, deux choses qu'un rendu isolé de `FichePersonnage` avec des
 * callbacks `jest.fn()` ne peut pas prouver — il faudrait alors que le test
 * mette lui-même à jour la prop `personnage`, ce qui ne prouverait plus rien
 * du panneau réel.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauPersonnages dossierId={dossierId} />
		</BrainProvider>,
	)
}

function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
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

const NOM_DU_BLOC_3 = 'Caractéristiques'
const TEXTE_REGLER = '+ Régler les caractéristiques…'

describe('FichePersonnage - bloc Caracteristiques', () => {
	beforeEach(() => window.localStorage.clear())

	it('bloc stats absent : seule la CTA, aucune ecriture au montage', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		// Pose AVANT le rendu (revue QA mode B) : seul un spy actif PENDANT le
		// montage peut observer une ecriture survenue AU montage — pose apres
		// coup, il ne temoignerait que du silence des interactions qui suivent.
		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		renderPanel(brain, dossier.id)

		// Le bloc 3 ne s ouvre pas automatiquement : il faut le deplier pour lire
		// son contenu par role (le contenu ferme est `display:none`).
		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))

		expect(screen.getAllByRole('button', { name: TEXTE_REGLER })).toHaveLength(1)
		expect(screen.queryByRole('button', { name: /^Diminuer /i })).toBeNull()
		expect(screen.queryByRole('button', { name: /^Augmenter /i })).toBeNull()
		expect(screen.queryByText('PV')).toBeNull()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('stats')
		expect(updateSpy).not.toHaveBeenCalled()
	})

	it('le clic sur regler ecrit les 8 cles en un seul commit', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.aldur', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)
		const updateSpy = jest.spyOn(brain.dossiers, 'update')

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))
		await user.click(screen.getByRole('button', { name: TEXTE_REGLER }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(lire(brain, dossier.id).monde.personnages[0].stats).toEqual({
			FO: 1,
			AG: 1,
			DX: 1,
			EN: 1,
			IN: 1,
			IG: 1,
			SE: 1,
			CA: 1,
		})
		// La grille remplace le CTA (§ tableau des rendus du plan).
		expect(screen.queryByRole('button', { name: TEXTE_REGLER })).toBeNull()
		const diminuerForce = screen.getByRole('button', { name: 'Diminuer FORCE (FO)' })
		expect(diminuerForce).toBeInTheDocument()
		// Clavier (§3 du plan) : apres le clic, le focus se pose sur ce premier
		// controle du bloc qui vient d apparaitre.
		expect(diminuerForce).toHaveFocus()
		expect(screen.getByText('3')).toBeInTheDocument()
	})

	it('PV derive exactement de FO+AG+EN, jamais stocke', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.aldur',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			stats: { FO: 7, AG: 9, DX: 3, EN: 6, IN: 2, IG: 4, SE: 5, CA: 8 },
		})
		renderPanel(brain, dossier.id)

		await user.click(screen.getByRole('button', { name: NOM_DU_BLOC_3 }))

		expect(screen.getByText('22')).toBeInTheDocument()
		expect(lire(brain, dossier.id).monde.personnages[0]).not.toHaveProperty('pv')
	})
})
