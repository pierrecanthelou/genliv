import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	validateDossier,
	BrainProvider,
	INTENSITE_INITIALE,
	type Brain,
	type Dossier,
	type EchecCopilote,
	type Personnage,
	type ReponseRelations,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD6_TITRE } from '../textes'

/**
 * LA CARTE 6 « Compléter les relations » — activée à l'itération 3c, PREMIER
 * rôle mixte (jeton + prose). Couvre : la RECETTE D'ACCEPTATION exacte —
 * `{ cible_id, lien, intensite }`, `secret` ABSENT (KR-221), `INTENSITE_INITIALE`
 * IMPORTÉE (critère 7) ; la GARDE PRÉALABLE du porteur disparu, propre à cette
 * carte (critère 7, seconde moitié) ; le bout-en-bout à deux acceptations et
 * l'auto-relation déjà écrite qui reste INTACTE (critère 8, KR-194) ; la
 * référence rompue EXPOSÉE plutôt que filtrée (KR-021) ; les QUATRE motifs de
 * refus de contexte, TOUS atteignables ici (première carte dans ce cas).
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx`, `acceptation.test.tsx`,
 * `detenteurs.test.tsx`, `repliques.test.tsx` et `planActions.test.tsx`
 * (précédent constant de cette feature, § 5 du plan) — mêmes petits helpers,
 * DUPLIQUÉS ici à dessein.
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

function retirerPersonnage(brain: Brain, dossierId: string, personnageId: string): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: d.monde.personnages.filter((p) => p.id !== personnageId) },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Retrait refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function bouchonnerCopilote(brain: Brain, demander: jest.Mock, estDisponible = () => true): void {
	brain.copilote = { estDisponible, demander }
}

function regionCarte6() {
	return screen.getByRole('region', { name: CARD6_TITRE })
}

function reponsePropose(
	personnageId: string,
	ajouts: ReadonlyArray<{ cibleId: string; lien: string }>,
): ReponseRelations {
	return { statut: 'propose', proposition: { personnageId, ajouts } }
}

beforeEach(() => window.localStorage.clear())

describe('relations - la recette ecrit exactement { cible_id, lien, intensite } (critere 7, KR-221)', () => {
	it('intensite vaut INTENSITE_INITIALE (0), secret est absent, aucune autre cle', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son creancier' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte6.getByText('Accepté')).toBeInTheDocument())

		const relation = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.relations?.[0]
		expect(relation).toBeDefined()
		// jamais `toBeFalsy` (0 est truthy-fragile, precedent QA-8 du plan).
		expect(relation?.intensite).toBe(0)
		expect(relation?.intensite).toBe(INTENSITE_INITIALE)
		expect('secret' in (relation ?? {})).toBe(false)
		expect(Object.keys(relation ?? {})).toEqual(['cible_id', 'lien', 'intensite'])
		expect(relation?.cible_id).toBe('pnj.b')
		expect(relation?.lien).toBe('son creancier')
	})
})

describe('relations - garde prealable du porteur disparu (critere 7, seconde moitie)', () => {
	it('porteur retire du dossier depuis le lancement : aucun update, texte dedie, ligne jamais marquee acceptee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son creancier' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		// LA COURSE : le porteur GELE (pnj.a) disparait du dossier ENTRE la
		// proposition et l'acceptation. `act` est OBLIGATOIRE : le retrait emet
		// `dossier:updated`, donc reveille l'abonnement du panneau.
		act(() => {
			retirerPersonnage(brain, dossier.id, 'pnj.a')
		})

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))

		// AUCUN update ne part du tout — pas meme un update refuse (garde
		// PREALABLE, avant tout appel a `DossierService.update`).
		expect(updateSpy).not.toHaveBeenCalled()
		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(
			carte6.getByText("Ce personnage a été retiré du dossier depuis le lancement — relancez l'assistant."),
		).toBeInTheDocument()
		// La ligne n'est JAMAIS marquee acceptee : le bouton Accepter est toujours la.
		expect(carte6.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(carte6.queryByText('Accepté')).toBeNull()
	})
})

describe('relations - bout-en-bout, deux acceptations (critere 8)', () => {
	it('personnage sans relation, lancer puis accepter deux propositions : relations en porte deux, le dossier reste accepte', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(
			reponsePropose('pnj.a', [
				{ cibleId: 'pnj.b', lien: 'son frere' },
				{ cibleId: 'pnj.c', lien: 'son creancier' },
			]),
		)
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findAllByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte6.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte6.getAllByText('Accepté')).toHaveLength(1))
		fireEvent.click(carte6.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte6.getAllByText('Accepté')).toHaveLength(2))

		const dossierEcrit = brain.dossiers.get(dossier.id)
		const relations = dossierEcrit?.monde.personnages.find((p) => p.id === 'pnj.a')?.relations
		expect(relations).toEqual([
			{ cible_id: 'pnj.b', lien: 'son frere', intensite: 0 },
			{ cible_id: 'pnj.c', lien: 'son creancier', intensite: 0 },
		])
		expect(validateDossier(dossierEcrit).errors).toEqual([])
	})
})

describe('relations - auto-relation deja ecrite a la main reste INTACTE (critere 8, KR-194)', () => {
	it('une relation auto-referentielle preexistante n est ni modifiee ni retiree par une acceptation', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.a', lien: 'son propre reflet, qu il ne reconnait plus', intensite: -2 }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son creancier' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte6.getByText('Accepté')).toBeInTheDocument())

		const relations = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.relations
		expect(relations).toEqual([
			{ cible_id: 'pnj.a', lien: 'son propre reflet, qu il ne reconnait plus', intensite: -2 },
			{ cible_id: 'pnj.b', lien: 'son creancier', intensite: 0 },
		])
	})
})

describe('relations - reference rompue EXPOSEE, jamais filtree (KR-021)', () => {
	it('cible introuvable : la ligne s affiche quand meme, avec TEXTE_CIBLE_INTROUVABLE', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		// La cible "pnj.fantome" n'existe PAS dans ce dossier — cas irrealiste pour
		// un rang re-resolu par `brain/`, mais le contrat n'en depend pas moins
		// (§ 3.2 du plan) : la ligne doit s'afficher, jamais disparaitre.
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.fantome', lien: 'un lien oublie' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))

		expect(await carte6.findByText('Personnage introuvable — référence rompue.')).toBeInTheDocument()
		expect(carte6.getByText('un lien oublie')).toBeInTheDocument()
		expect(carte6.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
	})
})

describe('relations - quatre textes de refus de contexte, tous atteignables', () => {
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
			reponse: { statut: 'illisible', motif: 'rang-inconnu' },
			texteAttendu: "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer.",
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' },
			texteAttendu: "Il manque « TON » pour proposer ce texte — complétez d'abord ce champ.",
		},
		{
			reponse: { statut: 'refuse', motif: 'cible-a-ecrire' },
			texteAttendu: "Ce personnage n'a encore aucune fiche écrite — complétez-la d'abord, dans Personnages.",
		},
		{
			reponse: { statut: 'refuse', motif: 'aucun-candidat' },
			texteAttendu: "Ce dossier n'a pas d'autre personnage à lui lier — tous sont déjà liés, ou il est seul.",
		},
		{
			reponse: { statut: 'refuse', motif: 'trop-long' },
			texteAttendu:
				"Le contexte est trop long pour proposer des relations — raccourcissez d'abord les fiches de ce dossier.",
		},
	]

	it('chaque motif rend le texte EXACT qui lui correspond, et les six sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			preparer(demander)
			const carte6 = within(regionCarte6())
			fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))

			const noeud = await carte6.findByText(`⊘ ${cas.texteAttendu}`)
			expect(noeud.textContent).toBe(`⊘ ${cas.texteAttendu}`)
			textesRendus.push(noeud.textContent ?? '')

			document.body.innerHTML = ''
		}

		expect(new Set(textesRendus).size).toBe(6)
	})
})

describe('relations - ecriture par update, ordre persistance puis evenement', () => {
	it('un seul appel a update, set avant emit', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son ami' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(await carte6.findByText('Accepté')).toBeInTheDocument()
	})

	it('ecriture refusee par validateDossier : rien n est persiste, la proposition reste affichee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son ami' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')
		jest.spyOn(brain.dossiers, 'update').mockReturnValueOnce({
			statut: 'refuse',
			errors: [
				{
					code: 'reference-pendante',
					severity: 'error',
					message: 'Anomalie de test — refus simule.',
					location: 'Personnage « pnj.a »',
					entityId: 'pnj.a',
					path: 'monde.personnages[0].relations[0].cible_id',
				},
			],
			warnings: [],
		})

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))

		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(carte6.getByText('Anomalie de test — refus simule.')).toBeInTheDocument()
		expect(carte6.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(carte6.getByRole('button', { name: 'Rejeter la proposition' })).toBeInTheDocument()
	})
})

describe('relations - changer de personnage abandonne proposition et gel (precedent BUG-108)', () => {
	it('la proposition disparait, le Select nomme la nouvelle cible, Lancer redevient actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.a', lien: 'lui-meme', intensite: 0 }],
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son ami' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		const sel = (): HTMLSelectElement => carte6.getByRole('combobox') as HTMLSelectElement
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.change(sel(), { target: { value: 'pnj.b' } })

		expect(sel().value).toBe('pnj.b')
		expect(carte6.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		// Le bloc DEJA ECRIT degele et bascule sur la cible neuve, sans reglage.
		expect(
			carte6.getByText("Ce personnage n'a encore aucune relation connue — la première proposée s'ajoute."),
		).toBeInTheDocument()
		expect(carte6.getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})

describe('relations - le gel du bloc DEJA ECRIT (regression BUG-097)', () => {
	it('le bloc reste fige sur la valeur du lancement, meme apres une acceptation qui ecrit dans le dossier', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			relations: [{ cible_id: 'pnj.b', lien: 'sa soeur', intensite: 1 }],
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.c', lien: 'son rival' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		// `personnages[0]` est `pnj.b` (semé en premier, pour que la reference de
		// `pnj.a` resolve a sa creation) : selection explicite de la cible.
		fireEvent.change(carte6.getByRole('combobox'), { target: { value: 'pnj.a' } })
		const dejaEcrit = (): HTMLElement => carte6.getByText('DÉJÀ ÉCRIT').closest('div') as HTMLElement
		expect(within(dejaEcrit()).getByText('sa soeur')).toBeInTheDocument()

		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte6.getByText('Accepté')).toBeInTheDocument())

		expect(brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.relations).toEqual([
			{ cible_id: 'pnj.b', lien: 'sa soeur', intensite: 1 },
			{ cible_id: 'pnj.c', lien: 'son rival', intensite: 0 },
		])
		// LE BLOC DEJA ECRIT RESTE FIGE : "son rival" existe bien A L'ECRAN (dans la
		// ligne de proposition acceptee), mais PAS ICI.
		expect(within(dejaEcrit()).getByText('sa soeur')).toBeInTheDocument()
		expect(within(dejaEcrit()).queryByText('son rival')).toBeNull()
	})
})

describe('relations - focus post-decision (aucun plafond, jamais desactive)', () => {
	it('apres acceptation de la premiere ligne, le focus va sur le + de la ligne suivante non decidee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.c', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(
			reponsePropose('pnj.a', [
				{ cibleId: 'pnj.b', lien: 'son frere' },
				{ cibleId: 'pnj.c', lien: 'son creancier' },
			]),
		)
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findAllByRole('button', { name: 'Accepter la proposition' })

		const [premier] = carte6.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premier)
		await waitFor(() => expect(carte6.getAllByText('Accepté')).toHaveLength(1))

		const [restant] = carte6.getAllByRole('button', { name: 'Accepter la proposition' })
		expect(restant).toBeEnabled()
		expect(restant).toHaveFocus()
	})

	it('quand toutes les lignes sont decidees, le focus revient sur Lancer, qui reste actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son ami' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte6.getByRole('button', { name: 'Accepter la proposition' }))

		const lancer = await carte6.findByRole('button', { name: 'Lancer' })
		// AUCUN plafond de document (§ 8, n° 32) : l'acceptation ne desactive
		// jamais « Lancer », contrairement a `CarteFaireParler` (BUG-109).
		expect(lancer).toBeEnabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})
})

describe('relations - eyebrow numerote rendu par la CARTE, glyphe de rejet', () => {
	it('chaque ligne proposee porte RELATION PROPOSEE n et ENVERS, le rejet utilise ×', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', [{ cibleId: 'pnj.b', lien: 'son ami' }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		await carte6.findByRole('button', { name: 'Accepter la proposition' })

		expect(carte6.getByText('RELATION PROPOSÉE 1')).toBeInTheDocument()
		expect(carte6.getByText('ENVERS')).toBeInTheDocument()
		expect(carte6.getByRole('button', { name: 'Rejeter la proposition' })).toHaveTextContent('×')
	})
})

describe('relations - un seul appel en vol (double clic Lancer)', () => {
	it('deux clics synchrones ne produisent qu un seul appel a demander', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseRelations>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte6()).getByRole('button', { name: 'Lancer' })

		act(() => {
			fireEvent.click(lancer)
			fireEvent.click(lancer)
		})

		expect(demander).toHaveBeenCalledTimes(1)
	})
})

describe('relations - Annuler pendant l appel', () => {
	it('Annuler ferme la region status sans ecrire de decision', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseRelations>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		fireEvent.click(carte6.getByRole('button', { name: 'Lancer' }))
		expect(carte6.getByRole('status')).toBeInTheDocument()

		fireEvent.click(carte6.getByRole('button', { name: 'Annuler' }))

		expect(carte6.queryByRole('status')).toBeNull()
		expect(carte6.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		expect(carte6.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('relations - copilote non configure / aucun personnage', () => {
	it('0 personnage : option nommee visible, Lancer desactive avec son title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		const carte6 = within(regionCarte6())
		expect(carte6.getByText('Aucun personnage dans ce dossier')).toBeInTheDocument()
		const lancer = carte6.getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute('title', 'Créez un personnage dans Personnages pour utiliser cet assistant.')
	})

	it('copilote non configure : Lancer desactive avec son title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, jest.fn(), () => false)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte6()).getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute(
			'title',
			'Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant.',
		)
	})
})
