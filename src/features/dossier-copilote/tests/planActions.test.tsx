import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	validateDossier,
	BrainProvider,
	type Brain,
	type Dossier,
	type EchecCopilote,
	type Personnage,
	type ReponsePlan,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD5_TITRE } from '../textes'

/**
 * LA CARTE 5 « Compléter le plan d'actions » — activée à l'itération 3b.
 * Couvre : `etape` POSÉ PAR LE CODE sur la liste VIVE de la recette, jamais
 * relu de la proposition (critère 7) ; `plan_actions[]` qui ne reçoit QUE
 * `{ etape, action }` (KR-221) ; le GEL du bloc « DÉJÀ ÉCRIT » (régression
 * BUG-097) ; l'écriture par `DossierService.update`, ordre
 * persistance-puis-événement (KR-004) ; la contrepartie du gel au changement
 * de personnage (précédent BUG-108) ; le focus post-décision à UNE SEULE
 * BRANCHE — « Lancer » n'est jamais désactivé par la boucle de décision,
 * contrairement à `CarteFaireParler` (BUG-109) ; l'absence de numéro sur la
 * PROPOSITION (§ 3.4 du plan) ; les cinq textes d'état discriminés
 * (KR-197/199).
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx`, `acceptation.test.tsx`,
 * `detenteurs.test.tsx` et `repliques.test.tsx` (précédent constant de cette
 * feature, § 5 du plan) — mêmes petits helpers, DUPLIQUÉS ici à dessein.
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauCopilote dossierId={dossierId} onSelectSection={() => {}} />
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

function bouchonnerCopilote(brain: Brain, demander: jest.Mock, estDisponible = () => true): void {
	brain.copilote = { estDisponible, demander }
}

function regionCarte5() {
	return screen.getByRole('region', { name: CARD5_TITRE })
}

function reponsePropose(acteurId: string, action: string): ReponsePlan {
	return { statut: 'propose', proposition: { acteurId, action } }
}

beforeEach(() => window.localStorage.clear())

describe('planActions - etape posee par le CODE, 1 a k+N sans doublon', () => {
	it('deux acceptations successives sur un plan de deux etapes preexistantes numerotent 1 2 3 4', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			savoirs: [],
			plan_actions: [
				{ etape: 1, action: 'Preexistante un.' },
				{ etape: 2, action: 'Preexistante deux.' },
			],
		})
		const demander = jest
			.fn()
			.mockResolvedValueOnce(reponsePropose('pnj.a', 'Nouvelle etape A.'))
			.mockResolvedValueOnce(reponsePropose('pnj.a', 'Nouvelle etape B.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())

		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())

		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())

		const planActions = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.plan_actions
		// ASSERTION DE RESULTAT (§ 5 du plan) : les etapes valent 1..k+N,
		// strictement croissantes et sans doublon — jamais une formule recopiee.
		expect(planActions?.map((e) => e.etape)).toEqual([1, 2, 3, 4])
		expect(new Set(planActions?.map((e) => e.etape)).size).toBe(4)
		expect(planActions?.map((e) => e.action)).toEqual([
			'Preexistante un.',
			'Preexistante deux.',
			'Nouvelle etape A.',
			'Nouvelle etape B.',
		])
	})

	it('une etape ajoutee ENTRE le lancer et l acceptation : etape est pris sur la liste VIVE, pas sur le gel', async () => {
		// POURQUOI CE TEMOIN EXISTE, et pourquoi le test ci-dessus ne suffisait pas.
		// La QA en mode B a pose le mutant que le plan exigeait de voir rouge --
		// `etape: contexteGele.dejaEcrites.length + 1` au lieu de
		// `p.plan_actions.length + 1` -- et LES TREIZE TESTS SONT RESTES VERTS.
		// Motif : chaque acceptation y est precedee d'un `Lancer` qui RE-GELE sur
		// l'etat courant, donc le gel et la liste vive COINCIDENT TOUJOURS au moment
		// de l'ecriture. L'assertion de resultat << 1..k+N >> etait donc vraie des
		// DEUX cotes du mutant : elle gardait le CALCUL, jamais LA SOURCE.
		//
		// C'est exactement ce que le plan appelle << perime, et perime EN SILENCE >> :
		// entre la demande et l'acceptation, LE PLAN BOUGE. Le seul scenario ou les
		// deux sources divergent est une ecriture EXTERNE dans cet intervalle -- c'est
		// celui que la recette (<< `p` vient du `d` de la recette >>) existe pour
		// proteger, et c'est donc celui qu'il faut instrumenter.
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			savoirs: [],
			plan_actions: [{ etape: 1, action: 'Preexistante un.' }],
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Proposee apres coup.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())

		// Le gel se fait ICI, sur UNE etape.
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		// ECRITURE EXTERNE : l'auteur ajoute une etape a la main pendant que la
		// proposition est a l'ecran. Le gel dit 1, le document en porte 2.
		act(() => {
			brain.dossiers.update(dossier.id, (d) => ({
				canon: d.canon,
				monde: {
					...d.monde,
					personnages: d.monde.personnages.map((p) =>
						p.id === 'pnj.a'
							? { ...p, plan_actions: [...p.plan_actions, { etape: 2, action: 'Ajoutee a la main.' }] }
							: p,
					),
				},
				charpente: d.charpente,
			}))
		})

		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())

		const planActions = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.plan_actions
		// LISTE VIVE : 2 etapes au moment de l'ecriture => la neuve est la 3.
		// DEPUIS LE GEL, elle vaudrait 2 -- DOUBLON avec l'etape ajoutee a la main,
		// et rien dans le SSOT ne le refuserait (aucune regle d'unicite arbitree,
		// `tables.ts:398`). C'est LA source qui est epinglee ici, pas le calcul.
		expect(planActions?.map((e) => e.etape)).toEqual([1, 2, 3])
		expect(new Set(planActions?.map((e) => e.etape)).size).toBe(3)
		expect(planActions?.map((e) => e.action)).toEqual([
			'Preexistante un.',
			'Ajoutee a la main.',
			'Proposee apres coup.',
		])
	})
})

describe('planActions - plan_actions ne recoit QUE etape et action (KR-221)', () => {
	it('la nouvelle entree ne porte que les deux cles etape et action', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))

		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())
		const ajoutee = brain.dossiers
			.get(dossier.id)
			?.monde.personnages.find((p) => p.id === 'pnj.a')
			?.plan_actions.at(-1)
		expect(Object.keys(ajoutee ?? {})).toEqual(['etape', 'action'])
	})
})

describe('planActions - le gel du bloc DEJA ECRIT (regression BUG-097)', () => {
	it('le bloc reste fige sur la valeur du lancement, meme apres une acceptation qui ecrit dans le dossier', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			savoirs: [],
			plan_actions: [{ etape: 1, action: 'Ancienne etape.' }],
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		// Le conteneur du bloc DEJA ECRIT, scope par son eyebrow -- la ligne de
		// proposition rendra ELLE AUSSI "Etape neuve." une fois acceptee.
		const dejaEcrit = (): HTMLElement => carte5.getByText('DÉJÀ ÉCRIT').closest('div') as HTMLElement
		expect(within(dejaEcrit()).getByText('Ancienne etape.')).toBeInTheDocument()

		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())

		expect(brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.plan_actions).toEqual([
			{ etape: 1, action: 'Ancienne etape.' },
			{ etape: 2, action: 'Etape neuve.' },
		])
		// LE BLOC DEJA ECRIT RESTE FIGE : "Etape neuve." existe bien A L'ECRAN (dans
		// la ligne de proposition acceptee), mais PAS ICI.
		expect(within(dejaEcrit()).getByText('Ancienne etape.')).toBeInTheDocument()
		expect(within(dejaEcrit()).queryByText('Etape neuve.')).toBeNull()
	})
})

describe('planActions - ecriture par update, ordre persistance puis evenement', () => {
	it('un seul appel a update, set avant emit', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(await carte5.findByText('Accepté')).toBeInTheDocument()
	})

	it('ecriture refusee par validateDossier : rien n est persiste, la proposition reste affichee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		// Aucun mecanisme du depot ne fait echouer `validateDossier` sur une
		// etape ajoutee a `plan_actions[]` (aucune borne de cardinalite au
		// schema) : ce refus est bouchonne DIRECTEMENT sur `DossierService.update`,
		// meme patron que `repliques.test.tsx`.
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')
		jest.spyOn(brain.dossiers, 'update').mockReturnValueOnce({
			statut: 'refuse',
			errors: [
				{
					code: 'champ-requis-vide',
					severity: 'error',
					message: 'Anomalie de test — refus simule.',
					location: 'Personnage « pnj.a »',
					entityId: 'pnj.a',
					path: 'monde.personnages[0].plan_actions',
				},
			],
			warnings: [],
		})

		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))

		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(carte5.getByText('Anomalie de test — refus simule.')).toBeInTheDocument()
		expect(carte5.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(carte5.getByRole('button', { name: 'Rejeter la proposition' })).toBeInTheDocument()
	})
})

describe('planActions - bout-en-bout (critere 8)', () => {
	it('personnage sans etape, lancer puis accepter : plan_actions en porte une, le dossier reste accepte', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Premiere etape.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte5.getByText('Accepté')).toBeInTheDocument())

		const dossierEcrit = brain.dossiers.get(dossier.id)
		const planActions = dossierEcrit?.monde.personnages.find((p) => p.id === 'pnj.a')?.plan_actions
		expect(planActions).toEqual([{ etape: 1, action: 'Premiere etape.' }])
		expect(validateDossier(dossierEcrit).errors).toEqual([])
	})
})

describe('planActions - changer de personnage abandonne proposition et gel (precedent BUG-108)', () => {
	it('la proposition disparait, le Select nomme la nouvelle cible, Lancer redevient actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			savoirs: [],
			plan_actions: [{ etape: 1, action: 'Etape de A.' }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		const sel = (): HTMLSelectElement => carte5.getByRole('combobox') as HTMLSelectElement
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.change(sel(), { target: { value: 'pnj.b' } })

		expect(sel().value).toBe('pnj.b')
		expect(carte5.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		// Le bloc DEJA ECRIT degele et bascule sur la cible neuve, sans reglage.
		expect(
			carte5.getByText(
				"Ce personnage n'a encore aucune étape dans son plan d'actions — la première proposée s'ajoute en tête.",
			),
		).toBeInTheDocument()
		expect(carte5.getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})

describe('planActions - focus post-decision (UNE SEULE BRANCHE, jamais desactive)', () => {
	it('apres acceptation, le focus revient sur Lancer, qui reste actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte5.getByRole('button', { name: 'Accepter la proposition' }))

		const lancer = await carte5.findByRole('button', { name: 'Lancer' })
		// AUCUN plafond de document (§ 8, n° 25) : contrairement a `CarteFaireParler`
		// (BUG-109), l acceptation ne desactive jamais << Lancer >>.
		expect(lancer).toBeEnabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})

	it('apres rejet, le focus revient sur Lancer, qui reste actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Une etape neuve.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Rejeter la proposition' })

		fireEvent.click(carte5.getByRole('button', { name: 'Rejeter la proposition' }))

		const lancer = await carte5.findByRole('button', { name: 'Lancer' })
		expect(lancer).toBeEnabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})
})

describe('planActions - aucun numero sur la PROPOSITION', () => {
	it("l'eyebrow de la proposition ne porte aucun chiffre, contrairement au bloc DEJA ECRIT", async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			savoirs: [],
			plan_actions: [{ etape: 1, action: 'Etape existante.' }],
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', 'Etape proposee.'))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		await carte5.findByRole('button', { name: 'Accepter la proposition' })

		expect(carte5.getByText('PROCHAINE ÉTAPE')).toBeInTheDocument()
		// Un seul eyebrow numerote a l'ecran : celui du bloc DEJA ECRIT (k=1). Si
		// la proposition en portait un, ce compte vaudrait deux.
		expect(carte5.queryAllByText(/^ÉTAPE \d+$/)).toHaveLength(1)
	})
})

describe('planActions - un seul appel en vol (double clic Lancer)', () => {
	it('deux clics synchrones ne produisent qu un seul appel a demander', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponsePlan>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte5()).getByRole('button', { name: 'Lancer' })

		act(() => {
			fireEvent.click(lancer)
			fireEvent.click(lancer)
		})

		expect(demander).toHaveBeenCalledTimes(1)
	})
})

describe('planActions - Annuler pendant l appel', () => {
	it('Annuler ferme la region status sans ecrire de decision', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponsePlan>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte5 = within(regionCarte5())
		fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))
		expect(carte5.getByRole('status')).toBeInTheDocument()

		fireEvent.click(carte5.getByRole('button', { name: 'Annuler' }))

		expect(carte5.queryByRole('status')).toBeNull()
		expect(carte5.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		expect(carte5.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('planActions - cinq textes d etat, deux a deux distincts (KR-197/199)', () => {
	function preparer(demander: jest.Mock): void {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)
	}

	const CAS: Array<{ reponse: EchecCopilote; texteAttendu: string }> = [
		{
			reponse: { statut: 'indisponible', raison: 'injoignable' },
			texteAttendu: 'Le copilote est indisponible… Réessayez dans un instant.',
		},
		{
			reponse: { statut: 'illisible', motif: 'vide' },
			texteAttendu: "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer.",
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' },
			texteAttendu: "Il manque « TON » pour proposer ce texte — complétez d'abord ce champ.",
		},
		{
			reponse: { statut: 'refuse', motif: 'cible-a-ecrire' },
			texteAttendu: "Ce personnage n'a pas encore d'objectif écrit — complétez d'abord son but, dans Personnages.",
		},
		{
			reponse: { statut: 'refuse', motif: 'trop-long' },
			texteAttendu:
				"Le contexte est trop long pour proposer une étape — raccourcissez d'abord la fiche de ce personnage.",
		},
	]

	it('chaque motif rend le texte EXACT qui lui correspond, et les cinq sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			preparer(demander)
			const carte5 = within(regionCarte5())
			fireEvent.click(carte5.getByRole('button', { name: 'Lancer' }))

			const noeud = await carte5.findByText(`⊘ ${cas.texteAttendu}`)
			expect(noeud.textContent).toBe(`⊘ ${cas.texteAttendu}`)
			textesRendus.push(noeud.textContent ?? '')

			document.body.innerHTML = ''
		}

		expect(new Set(textesRendus).size).toBe(5)
	})
})
