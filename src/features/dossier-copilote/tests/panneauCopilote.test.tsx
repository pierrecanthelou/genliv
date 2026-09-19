import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	BrainProvider,
	type Brain,
	type Dossier,
	type EchecCopilote,
	type Personnage,
	type ReponseCopilote,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD1_TITRE, CARD2_TITRE } from '../textes'

/**
 * Le panneau Copilote — les trois Card (§ 3.2/4.9 du plan it2), les états
 * vides, le cycle de chargement/Annuler/Échap (§ 3.5 de l'it1, désormais porté
 * par `BarreLancer`) et les quatre textes discriminés de la carte 1 (critère
 * 3, lot 1). L'écriture d'acceptation, elle, est éprouvée par
 * `acceptation.test.tsx` (carte 1) et `detenteurs.test.tsx` (carte 2, fichier
 * SÉPARÉ, § 5 du plan).
 *
 * DEPUIS L'ITÉRATION 2, DEUX boutons « Lancer » coexistent à l'écran (carte 1
 * active, carte 2 activée) : toute requête `getByRole('button', {name:
 * 'Lancer'})` NON cadrée lève `getMultipleElementsFoundError` — ce fichier
 * cadre systématiquement via `within(screen.getByRole('region', {name:
 * CARD1_TITRE}))`, le point d'ancrage exposé par `CarteAssistant` (§ 4.9).
 *
 * `brain.copilote` est BOUCHONNÉ directement (objet mutable, même patron que
 * `CopiloteService.test.ts` mockant `global.fetch` à la frontière du dessous).
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

function bouchonnerCopilote(brain: Brain, demander: jest.Mock, estDisponible = () => true): void {
	brain.copilote = { estDisponible, demander }
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

function regionCarte1() {
	return screen.getByRole('region', { name: CARD1_TITRE })
}

function choisirChamp(nom: string): void {
	fireEvent.click(within(regionCarte1()).getByRole('radio', { name: nom }))
}

beforeEach(() => window.localStorage.clear())

describe('PanneauCopilote - trois Card', () => {
	it('rend les trois Card ; seule la 3e (Eclater le synopsis) porte un Badge et aucun bouton Lancer', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		renderPanel(brain, dossier.id)

		expect(screen.getByRole('region', { name: 'Compléter une fiche' })).toBeInTheDocument()
		expect(screen.getByRole('region', { name: 'Tisser les indices' })).toBeInTheDocument()
		expect(screen.getByRole('region', { name: 'Compléter les relations' })).toBeInTheDocument()
		expect(screen.getByRole('region', { name: 'Éclater le synopsis' })).toBeInTheDocument()
		expect(screen.queryByText('Bientôt — itération 2')).toBeNull()
		expect(screen.getByText('Bientôt — itération 4')).toBeInTheDocument()
		// CINQ boutons "Lancer" désormais (cartes 1, 2, 4, 5, 6) ; la carte
		// "Bientôt" n'en affiche aucun, grisé ou non.
		expect(screen.getAllByRole('button', { name: 'Lancer' })).toHaveLength(5)
	})
})

describe('PanneauCopilote - etats vides (carte 1)', () => {
	it('0 personnage : option nommee visible, Lancer desactive avec son title', () => {
		// `estDisponible` bouchonnée VRAIE : la priorité (a) du § 3.2 point 5 ne
		// doit pas masquer la raison (b), objet de ce test — isolation de variable.
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		const carte1 = within(regionCarte1())
		expect(carte1.getByText('Aucun personnage dans ce dossier')).toBeInTheDocument()
		const lancer = carte1.getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute('title', 'Créez un personnage dans Personnages pour utiliser cet assistant.')
	})

	it('aucun champ choisi : Lancer desactive avec son title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte1()).getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute('title', 'Choisissez un champ pour activer Lancer.')
	})

	it('un champ choisi et un personnage : Lancer actif, sans title', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		choisirChamp('FONCTION')

		const lancer = within(regionCarte1()).getByRole('button', { name: 'Lancer' })
		expect(lancer).not.toBeDisabled()
	})
})

describe('PanneauCopilote - chargement, Annuler, Echap (carte 1)', () => {
	it('au clic sur Lancer : role status apparait avec le texte de chargement, focus sur Annuler', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		const carte1 = within(regionCarte1())

		fireEvent.click(carte1.getByRole('button', { name: 'Lancer' }))

		const region = carte1.getByRole('status')
		expect(within(region).getByText('Le copilote réfléchit…')).toBeInTheDocument()
		const annuler = within(region).getByRole('button', { name: 'Annuler' })
		await waitFor(() => expect(annuler).toHaveFocus())
		expect(carte1.getByRole('button', { name: 'Lancer' })).toBeDisabled()
	})

	it('Echap agit comme Annuler : la region disparait, Lancer redevient actif et reprend le focus', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		const carte1 = within(regionCarte1())
		fireEvent.click(carte1.getByRole('button', { name: 'Lancer' }))
		const region = carte1.getByRole('status')

		fireEvent.keyDown(region, { key: 'Escape' })

		expect(carte1.queryByRole('status')).toBeNull()
		const lancer = carte1.getByRole('button', { name: 'Lancer' })
		expect(lancer).not.toBeDisabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})

	it('le bouton Annuler declenche la meme sortie que Echap', async () => {
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		const carte1 = within(regionCarte1())
		fireEvent.click(carte1.getByRole('button', { name: 'Lancer' }))

		fireEvent.click(carte1.getByRole('button', { name: 'Annuler' }))

		expect(carte1.queryByRole('status')).toBeNull()
		expect(carte1.getByRole('button', { name: 'Lancer' })).not.toBeDisabled()
	})
})

describe('PanneauCopilote - un seul appel en vol (carte 1)', () => {
	it('deux clics synchrones sur Lancer ne produisent qu un seul appel a demander', () => {
		// Promise RETENUE A LA MAIN (jamais résolue pendant ce test) : le garde
		// mesuré ici est le NOMBRE D'APPELS, pas leur issue.
		const demander = jest.fn(() => new Promise<ReponseCopilote>(() => {}))
		preparer(demander)
		choisirChamp('FONCTION')
		const lancer = within(regionCarte1()).getByRole('button', { name: 'Lancer' })

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

describe('PanneauCopilote - quatre textes discrimines (carte 1)', () => {
	const CAS: Array<{ reponse: EchecCopilote; texteAttendu: string }> = [
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
			fireEvent.click(within(regionCarte1()).getByRole('button', { name: 'Lancer' }))

			const noeud = await within(regionCarte1()).findByText(`⊘ ${cas.texteAttendu}`)
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

describe('PanneauCopilote - copilote non configure (critere neuf, § 3.2 point 5)', () => {
	it('Lancer desactive avec TITRE_COPILOTE_NON_CONFIGURE sur les DEUX cartes', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerTon(brain, dossier.id, 'sec et mefiant')
		semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
		bouchonnerCopilote(brain, jest.fn(), () => false)
		renderPanel(brain, dossier.id)

		const TITRE = 'Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant.'
		const lancerCarte1 = within(regionCarte1()).getByRole('button', { name: 'Lancer' })
		const lancerCarte2 = within(screen.getByRole('region', { name: CARD2_TITRE })).getByRole('button', {
			name: 'Lancer',
		})
		expect(lancerCarte1).toBeDisabled()
		expect(lancerCarte1).toHaveAttribute('title', TITRE)
		expect(lancerCarte2).toBeDisabled()
		expect(lancerCarte2).toHaveAttribute('title', TITRE)
	})
})
