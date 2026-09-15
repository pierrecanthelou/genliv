import { render, screen, within } from '@testing-library/react'
import { createBrain, BrainProvider, type Dossier } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { PanneauControles } from '../components/PanneauControles'

describe('PanneauControles', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('rend une ligne par controle, pastille et trois etages', () => {
		const brain = createBrain()
		// Dossier fraichement seme (construireAmorce) : les quatre proses
		// portent encore le marqueur -- 1 bloquant/depart + 3 alertes/canon,
		// exactement le rapport du critere 1 du lot L1.
		const dossier = brain.dossiers.create('Un dossier')

		render(
			<BrainProvider brain={brain}>
				<PanneauControles dossierId={dossier.id} />
			</BrainProvider>,
		)

		const liste = screen.getByRole('list')
		const lignes = within(liste).getAllByRole('listitem')
		expect(lignes).toHaveLength(4)

		expect(within(liste).getAllByText('BLOQUANT')).toHaveLength(1)
		expect(within(liste).getAllByText('ALERTE')).toHaveLength(3)

		// Fragments francais SANS glyphe (le marqueur ne s ecrit jamais en
		// source, KR-223) : le bloquant se distingue par « mot pour mot »
		// (lu par le moteur), les trois alertes par « contexte du modele ».
		// « mot pour mot » apparait a la fois en OU (« lu par le joueur, mot pour
		// mot ») et en QUOI (« ... marqueur compris. ») pour la ligne bloquante :
		// deux occurrences, jamais une seule (RTL Query Safety, docs/WORKFLOW.md).
		expect(within(liste).getAllByText(/mot pour mot/)).toHaveLength(2)
		expect(within(liste).getAllByText(/contexte du modèle/)).toHaveLength(3)

		// Chaque ligne porte ses trois etages -- OU, QUOI, QUOI FAIRE (non vide).
		lignes.forEach((ligne) => {
			const etages = ligne.querySelectorAll('p')
			expect(etages).toHaveLength(3)
			etages.forEach((etage) => expect(etage.textContent).not.toBe(''))
		})
	})

	it('dossier calme : texte d amorce, jamais une liste vide', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier calme')

		// Les quatre proses sont REECRITES (plus de marqueur) -- ecrit
		// directement derriere le service, comme `dossier:updated` ailleurs
		// dans la suite : ce test ne connait ni n importe `MARQUEUR_A_ECRIRE`
		// (non exporte du baril, § 8 du plan, desaccord 5).
		const dossierCalme: Dossier = {
			...dossier,
			charpente: {
				...dossier.charpente,
				depart: {
					...dossier.charpente.depart,
					texte_ouverture_joueur: 'Le hall de pierre s ouvre devant vous, torches allumees.',
				},
			},
			canon: {
				...dossier.canon,
				mj: { synopsis_mj: 'Un synopsis complet, deja redige par l auteur.' },
				partage: { accroche_joueur: 'Une accroche complete, deja redigee par l auteur.' },
				ton: 'Sombre et feutre, sans humour.',
			},
			updatedAt: '2026-09-15T09:00:00.000Z',
		}
		brain.persistence.set(dossierKey(dossier.id), dossierCalme)

		render(
			<BrainProvider brain={brain}>
				<PanneauControles dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(
			screen.getByText('Aucun contrôle à signaler — le dossier passe tous les contrôles connus.'),
		).toBeInTheDocument()
		expect(screen.queryByRole('list')).toBeNull()
		expect(screen.queryAllByRole('listitem')).toHaveLength(0)
	})

	it('un indice orphelin remonte une ligne BLOQUANT dans le panneau', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier injouable')

		// LA PREUVE VERTICALE -- la phrase de demo de l iteration, de bout en bout :
		// une regle de `brain/dossier/controles.ts` allume une ligne REELLE du
		// panneau, sans qu aucune surface neuve ait ete ecrite. Les quatre proses
		// sont REECRITES (sinon le panneau serait rempli des controles d amorce) et
		// un seul indice est ajoute, que ni savoir, ni effet, ni enchainement ne
		// produit. Ecrit DERRIERE le service puis relu par `useOpenDossier`, meme
		// patron que le test calme ci-dessus -- ce test n importe ni ne connait
		// `MARQUEUR_A_ECRIRE` (KR-223).
		const dossierOrphelin: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				indices: [{ id: 'indice.trace-oubliee', nom: 'Une trace dans la cendre' }],
			},
			charpente: {
				...dossier.charpente,
				depart: {
					...dossier.charpente.depart,
					texte_ouverture_joueur: 'Le hall de pierre s ouvre devant vous, torches allumees.',
				},
			},
			canon: {
				...dossier.canon,
				mj: { synopsis_mj: 'Un synopsis complet, deja redige par l auteur.' },
				partage: { accroche_joueur: 'Une accroche complete, deja redigee par l auteur.' },
				ton: 'Sombre et feutre, sans humour.',
			},
			updatedAt: '2026-09-15T09:00:00.000Z',
		}
		brain.persistence.set(dossierKey(dossier.id), dossierOrphelin)

		render(
			<BrainProvider brain={brain}>
				<PanneauControles dossierId={dossier.id} />
			</BrainProvider>,
		)

		const liste = screen.getByRole('list')
		const lignes = within(liste).getAllByRole('listitem')
		expect(lignes).toHaveLength(1)
		expect(within(liste).getAllByText('BLOQUANT')).toHaveLength(1)

		// FRAGMENTS distinctifs, jamais une phrase entiere recopiee : le texte
		// francais appartient a `brain/dossier/controles.ts` et n a pas a etre tenu
		// en double ici -- le reformuler ne doit pas faire rougir ce test, le
		// SUPPRIMER doit. Le OU nomme l indice fautif, le QUOI dit pourquoi il est
		// injouable, le QUOI FAIRE nomme l ecran ou le geste se fait.
		expect(within(liste).getAllByText(/Une trace dans la cendre/)).toHaveLength(1)
		expect(within(liste).getAllByText(/aucun enchaînement/)).toHaveLength(1)
		expect(within(liste).getAllByText(/Personnages → Savoirs/)).toHaveLength(1)

		// Les trois etages sont la, et aucun n est vide -- meme garde que sur les
		// lignes d amorce, sur une ligne produite par une AUTRE regle.
		const etages = lignes[0].querySelectorAll('p')
		expect(etages).toHaveLength(3)
		etages.forEach((etage) => expect(etage.textContent).not.toBe(''))
	})

	it('aucune ligne n est un arret de tabulation', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')

		render(
			<BrainProvider brain={brain}>
				<PanneauControles dossierId={dossier.id} />
			</BrainProvider>,
		)

		const liste = screen.getByRole('list')
		const lignes = within(liste).getAllByRole('listitem')
		expect(lignes.length).toBeGreaterThan(0)

		lignes.forEach((ligne) => {
			expect(ligne).not.toHaveAttribute('role', 'button')
			expect(ligne).not.toHaveAttribute('tabindex')
		})
		expect(within(liste).queryAllByRole('button')).toHaveLength(0)
	})
})
