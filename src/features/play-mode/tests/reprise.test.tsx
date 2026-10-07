/**
 * moteur-fins it2 — tests d integration reprise
 *
 * Criteres couverts (composant) :
 *  #1 — Session terminee (finAtteinte) -> nouvelle partie directe
 *  #2 — Session reprenable -> reprise sans interstitiel (avec heros)
 *  #3 — Session perimee -> ecran refus + bouton nouvelle partie
 *  #4 — Session illisible -> ecran refus
 *  #5 — Nouvelle partie via bouton relance (dialog confirmation)
 *  #7 — ecrire jamais appele tant que perime/illisible affiche
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	fixerHeros,
	type Brain,
	type Dossier,
	type ExprNode,
	ouvrirSession,
	dossierSessionKey,
} from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { EcranPartie } from '../components/EcranPartie'

const OUVERTURE_TEST =
	"Le vent siffle sur la lande grise ; la porte du sanctuaire bâille déjà.\n\nVous n'avez pas fait dix pas que la pluie vous rattrape."

const HEROS_TEST = {
	name: 'Aldric',
	caracs: { FO: 12, AG: 10, DX: 10, EN: 10, IN: 10, IG: 10, SE: 10, CA: 10 } as Record<string, number>,
	pvMax: 20,
	pv: 20,
	peMax: 10,
	pe: 10,
	mcBonus: 0,
	xp: 0,
}

function avecOuverture(dossier: Dossier): Dossier {
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: OUVERTURE_TEST },
		},
		updatedAt: '2026-09-24T10:00:00.000Z',
	}
}

function avecFinConditionnelle(dossier: Dossier, jalonId: string): Dossier {
	const condExpr: ExprNode = { op: 'predicat', predicat: 'jalon_atteint', cibles: [jalonId] }
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			jalons: [
				{
					id: jalonId,
					enonce_texte: 'Le jalon est atteint.',
					declencheur_texte: 'Condition de test',
					effet: [],
				},
			],
			fins: [
				{
					id: 'fin.victoire',
					nom: 'Victoire',
					condition_texte: 'Le jalon est atteint',
					condition_expr: condExpr,
					texte: 'Vous avez triomphé.',
				},
			],
		},
	}
}

function monterPartieJouable(brain: Brain): Dossier {
	const seme = brain.dossiers.create('Test reprise')
	brain.persistence.set(dossierKey(seme.id), avecOuverture(seme))
	return brain.dossiers.get(seme.id) as Dossier
}

function sauvegarderSessionValide(brain: Brain, dossier: Dossier): void {
	const resultat = ouvrirSession(dossier, { graine_alea: 42 })
	if (!resultat.ok) throw new Error('ouvrirSession a refuse')
	brain.sessions.ecrire(dossier.id, resultat.session)
}

describe('moteur-fins it2 reprise', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('critere #2 — session reprenable avec heros monte PartieEnCours', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		// Session avec heros — prouve la reprise, pas la creation
		const resultat = ouvrirSession(dossier, { graine_alea: 42 })
		if (!resultat.ok) throw new Error('ouvrirSession a refuse')
		const avecHeros = fixerHeros(resultat.session, HEROS_TEST)
		brain.sessions.ecrire(dossier.id, avecHeros)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// Heros deja cree → bandeau visible (pas ecran creation)
		expect(screen.getByText('Aldric')).toBeInTheDocument()
		// EcranReprise ne doit PAS etre monte
		expect(screen.queryByText("Cette partie n'est plus à jour")).not.toBeInTheDocument()
		expect(screen.queryByText('Cette partie ne peut pas être lue')).not.toBeInTheDocument()
	})

	it('critere #1 — session terminee (finAtteinte) route vers nouvelle partie', () => {
		const brain = createBrain()
		const seme = brain.dossiers.create('Test fin')
		const dossierAvecFin = avecFinConditionnelle(avecOuverture(seme), 'jalon.victoire')
		brain.persistence.set(dossierKey(seme.id), dossierAvecFin)
		const dossier = brain.dossiers.get(seme.id) as Dossier

		// Session avec le jalon atteint → finAtteinte sera vrai
		const resultat = ouvrirSession(dossier, { graine_alea: 42 })
		if (!resultat.ok) throw new Error('ouvrirSession a refuse')
		const sessionTerminee = {
			...resultat.session,
			monde: {
				...resultat.session.monde,
				jalons_atteints: ['jalon.victoire'],
			},
		}
		brain.sessions.ecrire(dossier.id, sessionTerminee)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// Doit monter PartieDemarree (ecran creation), PAS EcranFin
		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
		// Verifier qu on n est PAS sur EcranFin
		expect(screen.queryByText(/Victoire/)).not.toBeInTheDocument()
		expect(screen.queryByText('Vous avez triomphé.')).not.toBeInTheDocument()
	})

	it('critere #3 — session perimee monte EcranReprise dans CadrePartie', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		sauvegarderSessionValide(brain, dossier)

		// Modifier le dossier pour rendre la session perimee (updatedAt different)
		const dossierModifie = { ...dossier, updatedAt: '2099-01-01T00:00:00.000Z' }
		brain.persistence.set(dossierKey(dossier.id), dossierModifie)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(screen.getByText("Cette partie n'est plus à jour")).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nouvelle partie/ })).toBeInTheDocument()
		// CadrePartie present — bouton de sortie du shell
		expect(screen.getByRole('button', { name: /Quitter le test/ })).toBeInTheDocument()
	})

	it('critere #4 — session illisible monte EcranReprise', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		// Ecrire directement une session corrompue
		const cle = dossierSessionKey(dossier.id)
		window.localStorage.setItem(cle, '{"schema":1,"corrompu":true}')

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(screen.getByText('Cette partie ne peut pas être lue')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nouvelle partie/ })).toBeInTheDocument()
	})

	it('critere #7 — ecrire jamais appele tant que perime affiche (KR-305)', () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		sauvegarderSessionValide(brain, dossier)

		// Rendre perimee
		const dossierModifie = { ...dossier, updatedAt: '2099-01-01T00:00:00.000Z' }
		brain.persistence.set(dossierKey(dossier.id), dossierModifie)

		const cle = dossierSessionKey(dossier.id)
		const sessionAvant = window.localStorage.getItem(cle)
		expect(sessionAvant).not.toBeNull()

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// EcranReprise monte
		expect(screen.getByText("Cette partie n'est plus à jour")).toBeInTheDocument()
		// La session dans le storage n a PAS ete ecrasee
		expect(window.localStorage.getItem(cle)).toBe(sessionAvant)
	})

	it('critere #5 — Nouvelle partie via bouton relance', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)
		sauvegarderSessionValide(brain, dossier)

		// Rendre la session perimee pour avoir le bouton Nouvelle partie
		const dossierModifie = { ...dossier, updatedAt: '2099-01-01T00:00:00.000Z' }
		brain.persistence.set(dossierKey(dossier.id), dossierModifie)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// On est sur EcranReprise
		expect(screen.getByText("Cette partie n'est plus à jour")).toBeInTheDocument()

		// Cliquer Nouvelle partie
		await user.click(screen.getByRole('button', { name: /Nouvelle partie/ }))

		// EcranReprise doit avoir disparu, remplace par PartieDemarree (ecran de creation)
		expect(screen.queryByText("Cette partie n'est plus à jour")).not.toBeInTheDocument()
		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
	})
})
