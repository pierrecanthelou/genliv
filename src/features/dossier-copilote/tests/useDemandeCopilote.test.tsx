import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
	createBrain,
	BrainProvider,
	type Brain,
	type CibleCopilote,
	type Dossier,
	type ReponseCopilote,
} from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'

/**
 * LE GARDE « UN SEUL APPEL EN VOL » ÉPROUVÉ SUR LE REF, jamais sur le bouton.
 *
 * `panneauCopilote.test.tsx` prouve la face VISIBLE du garde (deux clics
 * synchrones ⇒ un seul appel). Ce fichier-ci prouve le garde LUI-MÊME, sur le
 * seul chemin que `disabled` ne couvre pas : une séquence à trois temps où
 * l'appel QUI SE TERMINE n'est plus l'appel COURANT. Le hook est monté seul —
 * `renderHook` plutôt qu'un panneau — parce qu'un bouton désactivé rendrait le
 * troisième temps INEXÉCUTABLE, donc le test trivialement vert : il mesurerait
 * `disabled`, c'est-à-dire exactement ce que le plan interdit de faire porter au
 * `disabled`.
 */

function monter(brain: Brain, dossier: Dossier) {
	return renderHook(() => useDemandeCopilote(dossier), {
		wrapper: ({ children }: { children: ReactNode }) => <BrainProvider brain={brain}>{children}</BrainProvider>,
	})
}

/** Un dossier réel (`createBrain`) + le copilote bouchonné sur `demander` —
 *  même patron de bouchon que les deux autres suites de la feature. */
function preparer(demander: jest.Mock): { brain: Brain; dossier: Dossier } {
	const brain = createBrain()
	const dossier = brain.dossiers.create('Un dossier')
	brain.copilote = { estDisponible: () => true, demander }
	return { brain, dossier }
}

const CIBLE: CibleCopilote = { entiteId: 'pnj.test', champ: 'monde.personnages[].fonction' }

beforeEach(() => window.localStorage.clear())

describe('useDemandeCopilote - le garde est rendu par l appel courant', () => {
	it('Lancer A, Annuler, Lancer B : la resolution de A ne rouvre pas le garde sous B', async () => {
		// Chaque appel reçoit SA propre promesse, retenue à la main : c'est la seule
		// façon de faire se terminer A ALORS QUE B est encore en vol.
		const resolveurs: Array<(reponse: ReponseCopilote) => void> = []
		const demander = jest.fn(
			() =>
				new Promise<ReponseCopilote>((resolve) => {
					resolveurs.push(resolve)
				}),
		)
		const { brain, dossier } = preparer(demander)
		const { result } = monter(brain, dossier)

		act(() => result.current.lancer(CIBLE)) // temps 1 — A part
		act(() => result.current.annuler()) // temps 2 — A est abandonné, le garde rouvre
		act(() => result.current.lancer(CIBLE)) // temps 3 — B part
		expect(demander).toHaveBeenCalledTimes(2)
		expect(result.current.etat).toEqual({ phase: 'en-cours' })

		// A se termine MAINTENANT, en retard, alors que B est en vol.
		await act(async () => {
			resolveurs[0]({ statut: 'indisponible', raison: 'annule' })
		})

		// B n'a pas été écrasé par la réponse tardive de A…
		expect(result.current.etat).toEqual({ phase: 'en-cours' })
		// …et surtout : le garde est TOUJOURS FERMÉ. Un `enVolRef.current = false`
		// posé inconditionnellement par A laisserait passer ce quatrième lancer et
		// mettrait DEUX appels en vol pour une seule intention d'auteur.
		act(() => result.current.lancer(CIBLE))
		expect(demander).toHaveBeenCalledTimes(2)

		// Le garde n'est pas pour autant bloqué : quand B se termine à son tour, il
		// rouvre — sans quoi ce test passerait aussi sur un garde définitivement clos.
		await act(async () => {
			resolveurs[1]({ statut: 'illisible', motif: 'schema' })
		})
		expect(result.current.etat).toEqual({ phase: 'echec', reponse: { statut: 'illisible', motif: 'schema' } })
		act(() => result.current.lancer(CIBLE))
		expect(demander).toHaveBeenCalledTimes(3)
	})
})

describe('useDemandeCopilote - une promesse rompue ne laisse pas le panneau mort', () => {
	it('un rejet de demander range en indisponible et rouvre le garde', async () => {
		// `CopiloteService.demander` est TOTAL aujourd'hui et ne rejette jamais ; ce
		// bouchon éprouve la branche qui existe POUR LE JOUR OÙ il rejetterait. Sans
		// elle, la phase resterait `en-cours` pour le reste de la session et le garde
		// resterait fermé : panneau mort, sans trace.
		const demander = jest.fn().mockRejectedValue(new Error('panne amont'))
		const { brain, dossier } = preparer(demander)
		const { result } = monter(brain, dossier)

		await act(async () => {
			result.current.lancer(CIBLE)
		})

		expect(result.current.etat).toEqual({
			phase: 'echec',
			reponse: { statut: 'indisponible', raison: 'injoignable' },
		})
		// Le garde a été rouvert par le `finally` : le panneau n'est pas mort. Ce
		// second lancer rejette lui aussi — `await act` pour que SA branche `catch`
		// retombe dans l'acte, et non après la fin du test.
		await act(async () => {
			result.current.lancer(CIBLE)
		})
		expect(demander).toHaveBeenCalledTimes(2)
	})
})
