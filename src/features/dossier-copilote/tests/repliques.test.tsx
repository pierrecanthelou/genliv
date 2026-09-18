import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	validateDossier,
	BrainProvider,
	type Brain,
	type Dossier,
	type EchecCopilote,
	type Personnage,
	type ReponseRepliques,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD4_TITRE } from '../textes'

/**
 * LA CARTE 4 « Écrire des répliques » — activée à l'itération 3a. Couvre :
 * l'AJOUT (jamais un remplacement, § 3.5) ; `caractere` créé SANS AUCUN
 * CURSEUR si absent (désaccord n° 2, RETENU, KR-221) ; le plafond
 * `PARLER_REPLIQUES` par ligne (jamais dans le SSOT) et son focus post-décision
 * qui saute toute ligne devenue non acceptable (prophylaxie BUG-106) ; le GEL
 * du bloc « DÉJÀ ÉCRIT » (régression BUG-097/101) ; l'écriture par
 * `DossierService.update`, ordre persistance-puis-événement (KR-004) ; la
 * contrepartie du gel au changement de personnage (précédent BUG-108) ; les
 * cinq textes d'état discriminés (KR-197/199).
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx`, `acceptation.test.tsx` et
 * `detenteurs.test.tsx` (§ 5 du plan it3a) — mêmes petits helpers, DUPLIQUÉS
 * ici à dessein (précédent constant de cette feature).
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

function regionCarte4() {
	return screen.getByRole('region', { name: CARD4_TITRE })
}

function reponsePropose(personnageId: string, ajouts: readonly string[]): ReponseRepliques {
	return { statut: 'propose', proposition: { personnageId, ajouts } }
}

beforeEach(() => window.localStorage.clear())

describe('repliques - accepter AJOUTE, ne remplace rien', () => {
	it('le tableau croit, la replique existante est conservee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Une phrase deja la.'] },
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Une phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte4.getByRole('button', { name: 'Accepter la proposition' }))

		await waitFor(() => expect(carte4.getByText('Accepté')).toBeInTheDocument())
		const parler = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.caractere?.parler
		expect(parler).toEqual(['Une phrase deja la.', 'Une phrase neuve.'])
	})
})

describe('repliques - caractere cree SANS aucun curseur (veto, KR-221)', () => {
	it('caractere absent avant acceptation ne porte que la cle parler apres', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Une phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte4.getByRole('button', { name: 'Accepter la proposition' }))

		await waitFor(() => expect(carte4.getByText('Accepté')).toBeInTheDocument())
		const caractere = brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.caractere
		expect(Object.keys(caractere ?? {})).toEqual(['parler'])
	})
})

describe('repliques - le plafond par ligne (PARLER_REPLIQUES importee)', () => {
	function preparerTroisPropositions(): { brain: Brain; dossier: Dossier } {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose('pnj.a', ['Premiere phrase.', 'Deuxieme phrase.', 'Troisieme phrase.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)
		return { brain, dossier }
	}

	it('la ligne suivante devient non acceptable au plafond, mais reste rejetable', async () => {
		preparerTroisPropositions()
		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findAllByRole('button', { name: 'Accepter la proposition' })

		const [premier, second] = carte4.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premier)
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(1))
		fireEvent.click(carte4.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(2))
		void second

		const [dernierAccepter] = carte4.getAllByRole('button', { name: 'Accepter la proposition' })
		expect(dernierAccepter).toBeDisabled()
		expect(dernierAccepter).toHaveAttribute('title', 'Plafond de deux répliques atteint.')
		// La ligne reste REJETABLE au plafond (§ 3.3) : le "x" n'est jamais desactive.
		expect(carte4.getAllByRole('button', { name: 'Rejeter la proposition' })[0]).toBeEnabled()
	})

	it('focus ne cible JAMAIS une ligne desactivee (prophylaxie BUG-106)', async () => {
		preparerTroisPropositions()
		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findAllByRole('button', { name: 'Accepter la proposition' })

		const [premier] = carte4.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premier)
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(1))

		// Deuxieme acceptation : le compteur ATTEINT le plafond dans ce meme rendu.
		//
		// BUG-109 -- CE QUE CE TEMOIN ASSERTAIT AVANT, ET POURQUOI C ETAIT FAUX.
		// Il assertait `toHaveFocus()` sur « Lancer ». Or « Lancer » se desactive
		// DANS CE MEME RENDU : `plafondAtteint` derive du dossier VIF, reveille par
		// l acceptation qu on vient de commettre. Poser le focus sur un bouton
		// `disabled` n a AUCUN effet en navigateur -- l auteur au clavier perd sa
		// place au moment exact ou il finit sa tache. Le test ne passait QUE parce
		// que jsdom laisse un focus pose juste avant que son propre `disabled` ne
		// soit commis : un contrat affirme vrai PAR L ENVIRONNEMENT, ce que la
		// mitigation de BUG-106 avait nommement interdit. 3e occurrence de la
		// famille BUG-097/101/106.
		//
		// L invariant est desormais : ne jamais viser une cible que ce meme rendu
		// desactive. Le « x » n est JAMAIS desactive -- c est la seule cible de la
		// ligne qui survive au rendu, et la ligne reste rejetable au plafond.
		const [secondAccepter] = carte4.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(secondAccepter)
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(2))

		// « Lancer » est bel et bien desactive : le viser aurait ete un focus perdu.
		expect(carte4.getByRole('button', { name: 'Lancer' })).toBeDisabled()
		// Le « + » de la 3e ligne l est aussi -- il ne doit pas etre la cible.
		const [troisiemeAccepter] = carte4.getAllByRole('button', { name: 'Accepter la proposition' })
		expect(troisiemeAccepter).toBeDisabled()
		expect(troisiemeAccepter).not.toHaveFocus()
		// La cible RETENUE, et elle est active : le « x » de la ligne non decidee.
		const [troisiemeRejeter] = carte4.getAllByRole('button', { name: 'Rejeter la proposition' })
		expect(troisiemeRejeter).toBeEnabled()
		expect(troisiemeRejeter).toHaveFocus()
	})

	it('au plafond ET toutes les lignes decidees, aucun focus n est pose sur un bouton desactive', async () => {
		// RESIDU DECLARE de BUG-109, atteignable : 3 propositions, 2 acceptees puis la
		// derniere REJETEE. Plus aucune ligne ne porte de bouton d action et « Lancer »
		// est desactive -- il n existe AUCUNE cible que ce rendu ne desactive pas. On
		// ne pose alors PAS le focus, plutot que de le poser sur un `disabled` et de
		// faire croire a un contrat vert en jsdom et faux chez l auteur.
		preparerTroisPropositions()
		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findAllByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte4.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(1))
		fireEvent.click(carte4.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(2))

		const [dernierRejeter] = carte4.getAllByRole('button', { name: 'Rejeter la proposition' })
		fireEvent.click(dernierRejeter)
		await waitFor(() => expect(carte4.getAllByText('Rejeté')).toHaveLength(1))

		// Aucun bouton d action ne subsiste, et « Lancer » est desactive.
		expect(carte4.queryAllByRole('button', { name: 'Accepter la proposition' })).toHaveLength(0)
		expect(carte4.queryAllByRole('button', { name: 'Rejeter la proposition' })).toHaveLength(0)
		const lancer = carte4.getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		// LE POINT DU TEMOIN : le focus n est PAS sur un bouton desactive.
		expect(lancer).not.toHaveFocus()
	})
})

describe('repliques - bout-en-bout (critere 8)', () => {
	it('personnage sans replique, lancer puis accepter deux propositions : parler porte deux, le dossier reste accepte', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Premiere phrase.', 'Deuxieme phrase.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findAllByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte4.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(1))
		fireEvent.click(carte4.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte4.getAllByText('Accepté')).toHaveLength(2))

		const dossierEcrit = brain.dossiers.get(dossier.id)
		const parler = dossierEcrit?.monde.personnages.find((p) => p.id === 'pnj.a')?.caractere?.parler
		expect(parler).toEqual(['Premiere phrase.', 'Deuxieme phrase.'])
		expect(validateDossier(dossierEcrit).errors).toEqual([])

		// BUG-110 -- LE SEUL TEMOIN DE LA MENTION AU PASSE, et il ne peut vivre QUE
		// ici : le bloc << DEJA ECRIT >> est GELE, donc sa branche `<p>` n'est rendue
		// que si le personnage avait ZERO replique AU LANCEMENT. Le temoin du gel
		// (suite BUG-097) seme `parler: ['Ancienne phrase.']` et rend la LISTE : il
		// est AVEUGLE a ce correctif. Ce test-ci part bien de zero.
		//
		// Au present, la mention deviendrait FAUSSE ici : elle dirait << n'a encore
		// aucune replique type >> a cote de deux badges << Accepte >>, et a rebours du
		// `title` de << Lancer >>. Le passe leve la contradiction SANS degeler le bloc
		// -- degeler aurait touche la parade de BUG-097.
		expect(
			carte4.getByText("Ce personnage n'avait aucune réplique type au lancement de cet assistant."),
		).toBeInTheDocument()
		expect(carte4.queryByText(/n'a encore aucune réplique type/)).toBeNull()
	})
})

describe('repliques - le gel du bloc DEJA ECRIT (regression BUG-097)', () => {
	it('le bloc reste fige sur la valeur du lancement, meme apres une acceptation qui ecrit dans le dossier', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Ancienne phrase.'] },
		})
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		// Le conteneur du bloc DEJA ECRIT, scope par son eyebrow -- SEUL moyen de
		// distinguer son contenu de celui de la ligne de proposition, qui rendra
		// ELLE AUSSI "Phrase neuve." une fois acceptee (LigneReplique garde son
		// bloc de lecture visible apres decision, precedent LigneDetenteur).
		const dejaEcrit = (): HTMLElement => carte4.getByText('DÉJÀ ÉCRIT').closest('div') as HTMLElement
		expect(within(dejaEcrit()).getByText('Ancienne phrase.')).toBeInTheDocument()

		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte4.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte4.getByText('Accepté')).toBeInTheDocument())

		// L'ECRITURE A REELLEMENT EU LIEU (premisse, jamais promise en prose) :
		expect(brain.dossiers.get(dossier.id)?.monde.personnages.find((p) => p.id === 'pnj.a')?.caractere?.parler).toEqual([
			'Ancienne phrase.',
			'Phrase neuve.',
		])
		// LE BLOC DEJA ECRIT RESTE FIGE : il ne montre PAS la phrase tout juste
		// ecrite, seulement celle geleee au clic Lancer -- "Phrase neuve." existe
		// bien A L'ECRAN (dans la ligne de proposition acceptee), mais PAS ICI.
		expect(within(dejaEcrit()).getByText('Ancienne phrase.')).toBeInTheDocument()
		expect(within(dejaEcrit()).queryByText('Phrase neuve.')).toBeNull()
	})
})

describe('repliques - ecriture par update, ordre persistance puis evenement', () => {
	it('un seul appel a update, set avant emit', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Une phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(carte4.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(await carte4.findByText('Accepté')).toBeInTheDocument()
	})

	it('ecriture refusee par validateDossier : rien n est persiste, la proposition reste affichee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Une phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		// Aucun mecanisme du depot ne fait echouer `validateDossier` sur une
		// prose ajoutee a `caractere.parler` (aucune borne de cardinalite au
		// schema) : ce refus est bouchonne DIRECTEMENT sur `DossierService.update`,
		// meme patron que `acceptation.test.tsx`.
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
					path: 'monde.personnages[0].caractere.parler',
				},
			],
			warnings: [],
		})

		fireEvent.click(carte4.getByRole('button', { name: 'Accepter la proposition' }))

		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(carte4.getByText('Anomalie de test — refus simule.')).toBeInTheDocument()
		expect(carte4.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(carte4.getByRole('button', { name: 'Rejeter la proposition' })).toBeInTheDocument()
	})
})

describe('repliques - changer de personnage abandonne proposition et gel (precedent BUG-108)', () => {
	it('la proposition disparait, le Select nomme la nouvelle cible, Lancer redevient actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.a',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			caractere: { parler: ['Phrase de A.'] },
		})
		semerPersonnage(brain, dossier.id, { id: 'pnj.b', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn().mockResolvedValue(reponsePropose('pnj.a', ['Une phrase neuve.']))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		const sel = (): HTMLSelectElement => carte4.getByRole('combobox') as HTMLSelectElement
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		await carte4.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.change(sel(), { target: { value: 'pnj.b' } })

		expect(sel().value).toBe('pnj.b')
		expect(carte4.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		// Le bloc DEJA ECRIT degele et bascule sur la cible neuve, sans reglage.
		expect(
			carte4.getByText(
				"Ce personnage n'a encore aucune réplique type — une proposition acceptée s'ajoute, jusqu'à deux au total.",
			),
		).toBeInTheDocument()
		expect(carte4.getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})

describe('repliques - un seul appel en vol (double clic Lancer)', () => {
	it('deux clics synchrones ne produisent qu un seul appel a demander', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseRepliques>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte4()).getByRole('button', { name: 'Lancer' })

		act(() => {
			fireEvent.click(lancer)
			fireEvent.click(lancer)
		})

		expect(demander).toHaveBeenCalledTimes(1)
	})
})

describe('repliques - Annuler pendant l appel', () => {
	it('Annuler ferme la region status sans ecrire de decision', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.a', portee: 'premier', plan_actions: [], savoirs: [] })
		const demander = jest.fn(() => new Promise<ReponseRepliques>(() => {}))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte4 = within(regionCarte4())
		fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))
		expect(carte4.getByRole('status')).toBeInTheDocument()

		fireEvent.click(carte4.getByRole('button', { name: 'Annuler' }))

		expect(carte4.queryByRole('status')).toBeNull()
		expect(carte4.queryByRole('button', { name: 'Accepter la proposition' })).toBeNull()
		expect(carte4.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('repliques - cinq textes d etat, deux a deux distincts (KR-197/199)', () => {
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
			texteAttendu: "Ce personnage n'a encore aucune identité écrite — complétez d'abord sa fiche, dans Personnages.",
		},
		{
			reponse: { statut: 'refuse', motif: 'trop-long' },
			texteAttendu:
				"Le contexte est trop long pour proposer des répliques — raccourcissez d'abord la fiche de ce personnage.",
		},
	]

	it('chaque motif rend le texte EXACT qui lui correspond, et les cinq sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			preparer(demander)
			const carte4 = within(regionCarte4())
			fireEvent.click(carte4.getByRole('button', { name: 'Lancer' }))

			const noeud = await carte4.findByText(`⊘ ${cas.texteAttendu}`)
			expect(noeud.textContent).toBe(`⊘ ${cas.texteAttendu}`)
			textesRendus.push(noeud.textContent ?? '')

			document.body.innerHTML = ''
		}

		expect(new Set(textesRendus).size).toBe(5)
	})
})
