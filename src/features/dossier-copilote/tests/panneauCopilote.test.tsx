import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	BrainProvider,
	type Brain,
	type Dossier,
	type Personnage,
	type ReponseCopilote,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'

/**
 * Le panneau Copilote — les trois Card (§ 3.3/3.4), les états vides (§ 3.3),
 * le cycle de chargement/Annuler/Échap (§ 3.5) et les quatre textes
 * discriminés (§ 3.6, critère 3). L'écriture d'acceptation, elle, est éprouvée
 * par `acceptation.test.tsx` — fichier SÉPARÉ (§ 5 du plan, lot `panneau`).
 *
 * `brain.copilote` est BOUCHONNÉ directement (objet mutable, même patron que
 * `CopiloteService.test.ts` mockant `global.fetch` à la frontière du dessous) :
 * `BUDGET_CARACTERES_CONTEXTE` n'est pas exporté vers les features (§ 4 du
 * plan), donc un scénario RÉEL de refus « trop-long » n'est pas constructible
 * depuis le code de cette feature — la frontière sur laquelle cette feature a
 * prise est `CopiloteService`, pas le réseau.
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

function semerTon(brain: Brain, dossierId: string, ton: string): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: { ...d.canon, ton },
		monde: d.monde,
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function bouchonnerCopilote(brain: Brain, demander: jest.Mock): void {
	brain.copilote = { estDisponible: () => true, demander }
}

/** Un dossier prêt (ton écrit, un personnage) + le copilote bouchonné sur
 *  `demander`. Retourne aussi `unmount`, pour les tests qui montent/démontent
 *  plusieurs panneaux dans le même `it` (précédent `fichePersonnage.test.tsx`). */
function preparer(demander: jest.Mock): { brain: Brain; unmount: () => void } {
	const brain = createBrain()
	const dossier = brain.dossiers.create('Un dossier')
	semerTon(brain, dossier.id, 'sec et mefiant')
	semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
	bouchonnerCopilote(brain, demander)
	const { unmount } = renderPanel(brain, dossier.id)
	return { brain, unmount }
}

function choisirChamp(nom: string): void {
	fireEvent.click(screen.getByRole('radio', { name: nom }))
}

beforeEach(() => window.localStorage.clear())

describe('PanneauCopilote - trois Card, deux Bientot', () => {
	it('rend les trois Card ; les deux Bientot portent un Badge muted et aucun bouton Lancer', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		expect(screen.getByText('Compléter une fiche')).toBeInTheDocument()
		expect(screen.getByText('Tisser les indices')).toBeInTheDocument()
		expect(screen.getByText('Éclater le synopsis')).toBeInTheDocument()
		expect(screen.getByText('Bientôt — itération 2')).toBeInTheDocument()
		expect(screen.getByText('Bientôt — itération 4')).toBeInTheDocument()
		// Un seul bouton "Lancer" existe dans tout le panneau : ni Card "Bientôt"
		// n'en affiche un, grisé ou non (§ 3.4).
		expect(screen.getAllByRole('button', { name: 'Lancer' })).toHaveLength(1)
	})
})

describe('PanneauCopilote - etats vides', () => {
	it('0 personnage : option nommee visible, Lancer desactive avec son title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		expect(screen.getByText('Aucun personnage dans ce dossier')).toBeInTheDocument()
		const lancer = screen.getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute('title', 'Créez un personnage dans Personnages pour utiliser cet assistant.')
	})

	it('aucun champ choisi : Lancer desactive avec son title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		const lancer = screen.getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute('title', 'Choisissez un champ pour activer Lancer.')
	})

	it('un champ choisi et un personnage : Lancer actif, sans title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
		renderPanel(brain, dossier.id)

		choisirChamp('FONCTION')

		const lancer = screen.getByRole('button', { name: 'Lancer' })
		expect(lancer).not.toBeDisabled()
	})
})

describe('PanneauCopilote - chargement, Annuler, Echap', () => {
	it('au clic sur Lancer : role status apparait avec le texte de chargement, focus sur Annuler', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')

		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))

		const region = screen.getByRole('status')
		expect(within(region).getByText('Le copilote réfléchit…')).toBeInTheDocument()
		const annuler = within(region).getByRole('button', { name: 'Annuler' })
		await waitFor(() => expect(annuler).toHaveFocus())
		expect(screen.getByRole('button', { name: 'Lancer' })).toBeDisabled()
	})

	it('Echap agit comme Annuler : la region disparait, Lancer redevient actif et reprend le focus', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))
		const region = screen.getByRole('status')

		fireEvent.keyDown(region, { key: 'Escape' })

		expect(screen.queryByRole('status')).toBeNull()
		const lancer = screen.getByRole('button', { name: 'Lancer' })
		expect(lancer).not.toBeDisabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})

	it('le bouton Annuler declenche la meme sortie que Echap', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))

		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(screen.queryByRole('status')).toBeNull()
		expect(screen.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('PanneauCopilote - un seul appel en vol', () => {
	it('deux clics synchrones sur Lancer ne produisent qu un seul appel a demander', () => {
		// Promise RETENUE A LA MAIN (jamais résolue pendant ce test) : le garde
		// mesuré ici est le NOMBRE D'APPELS, pas leur issue.
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		const lancer = screen.getByRole('button', { name: 'Lancer' })

		// Les DEUX clics dans le MEME act() : React 18 les traite comme un seul lot,
		// donc le second frappe le DOM AVANT que `disabled` n'ait été re-rendu — le
		// seul garde encore actif à cet instant est `enVolRef` (critère 1, mutant
		// obligatoire : retirer ce ref en gardant `disabled` fait rougir ce test).
		act(() => {
			fireEvent.click(lancer)
			fireEvent.click(lancer)
		})

		expect(demander).toHaveBeenCalledTimes(1)
	})
})

describe('PanneauCopilote - quatre textes discrimines', () => {
	const CAS: Array<{ reponse: ReponseCopilote; texteAttendu: string }> = [
		{
			reponse: { statut: 'indisponible', raison: 'injoignable' },
			texteAttendu: 'Le copilote est indisponible… Réessayez dans un instant.',
		},
		{
			reponse: { statut: 'illisible', motif: 'schema' },
			texteAttendu: "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer.",
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' },
			texteAttendu: "Il manque « TON » pour proposer ce texte — complétez d'abord ce champ.",
		},
		{
			reponse: { statut: 'refuse', motif: 'trop-long' },
			texteAttendu:
				"Le contexte est trop long pour proposer ce texte — raccourcissez d'abord la fiche de ce personnage.",
		},
	]

	it('chaque motif rend le texte EXACT qui lui correspond, et les quatre sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			const { unmount } = preparer(demander)
			choisirChamp('FONCTION')
			fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))

			const noeud = await screen.findByText(`⊘ ${cas.texteAttendu}`)
			// Assertion PAR MOTIF (KR-197/199) : l'unicité seule n'a aucun pouvoir
			// séparateur sur un branchement motif→texte inversé — un mutant qui
			// échangerait deux textes resterait invisible à `new Set(...).size===4`
			// seul. Mutant obligatoire : inverser deux branches de `texteEchec` fait
			// rougir CETTE assertion précisément, sur CE cas.
			expect(noeud.textContent).toBe(`⊘ ${cas.texteAttendu}`)
			textesRendus.push(noeud.textContent ?? '')

			// Démonté avant le cas suivant : `screen` interroge tout `document.body`,
			// et un panneau laissé monté ferait interférer son propre texte avec la
			// recherche `findByText` de l'itération suivante.
			unmount()
		}

		expect(new Set(textesRendus).size).toBe(4)
	})
})
