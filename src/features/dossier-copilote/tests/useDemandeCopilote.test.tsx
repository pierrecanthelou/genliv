import { act, renderHook } from '@testing-library/react'
import type { EchecCopilote } from '../../../brain'
import { useDemandeCopilote } from '../hooks/useDemandeCopilote'

/**
 * LE GARDE « UN SEUL APPEL EN VOL » ÉPROUVÉ SUR LE REF, jamais sur le bouton
 * (précédent de l'itération 1, BUG-099). Le hook est GÉNÉRIQUE depuis
 * l'itération 2 (§ 4.8 du plan) : plus de `useBrain()`, plus de `dossier` en
 * paramètre — `demander` est directement la fonction `(cible, signal) =>
 * Promise<...>` que chaque carte compose depuis
 * `copilote.demander(dossier, cible, signal)`.
 * Ce fichier bouchonne `demander` DIRECTEMENT, sans `BrainProvider` : la boucle
 * d'appel ne connaît plus rien du dossier ni du service.
 *
 * ⚠ LE `Cible` LOCAL CI-DESSOUS N'EST PAS `CibleIndice` DU CONTRAT, et il ne l'a
 * jamais été : le hook est générique, donc son témoin fabrique SA PROPRE forme de
 * cible. C'est ce qui fait que l'union étiquetée de l'itération 3c — le rôle
 * devenu une clé de la cible — ne touche pas une ligne de ce fichier : ce qui est
 * éprouvé ici est LA MACHINE D'APPEL, jamais le contrat de `CopiloteService`.
 *
 * `renderHook` plutôt qu'un panneau : un bouton désactivé rendrait la séquence
 * à trois temps du premier `describe` INEXÉCUTABLE, donc le test trivialement
 * vert — il mesurerait `disabled`, exactement ce que le plan interdit de faire
 * porter au `disabled`.
 */

type Cible = { indiceId: string }
type Proposition = { personnageIds: readonly string[] }

const CIBLE: Cible = { indiceId: 'indice.test' }

function monter(demander: jest.Mock) {
	return renderHook(() => useDemandeCopilote<Cible, Proposition>(demander))
}

describe('useDemandeCopilote - le garde est rendu par l appel courant', () => {
	it('Lancer A, Annuler, Lancer B : la resolution de A ne rouvre pas le garde sous B', async () => {
		// Chaque appel reçoit SA propre promesse, retenue à la main : c'est la seule
		// façon de faire se terminer A ALORS QUE B est encore en vol.
		const resolveurs: Array<(reponse: { statut: 'propose'; proposition: Proposition } | EchecCopilote) => void> = []
		const demander = jest.fn(
			() =>
				new Promise<{ statut: 'propose'; proposition: Proposition } | EchecCopilote>((resolve) => {
					resolveurs.push(resolve)
				}),
		)
		const { result } = monter(demander)

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
		expect(result.current.etat).toEqual({ phase: 'echec', echec: { statut: 'illisible', motif: 'schema' } })
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
		const { result } = monter(demander)

		await act(async () => {
			result.current.lancer(CIBLE)
		})

		expect(result.current.etat).toEqual({
			phase: 'echec',
			echec: { statut: 'indisponible', raison: 'injoignable' },
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

describe('useDemandeCopilote - demander est lu au moment de l appel', () => {
	it('un deuxieme lancer utilise la DERNIERE fonction demander passee au hook, jamais la premiere', async () => {
		// Le hook ne stocke JAMAIS `demander` dans un ref (§ 4.8 du plan) : à chaque
		// rendu, `lancer` capture la closure la PLUS RÉCENTE. `rerender` avec un
		// second bouchon prouve que ce n'est pas l'ancien qui répond.
		const premier = jest.fn().mockResolvedValue({ statut: 'illisible', motif: 'schema' } as EchecCopilote)
		const second = jest.fn().mockResolvedValue({ statut: 'propose', proposition: { personnageIds: ['pnj.x'] } })
		const { result, rerender } = renderHook(({ demander }: { demander: jest.Mock }) => useDemandeCopilote(demander), {
			initialProps: { demander: premier },
		})

		rerender({ demander: second })
		await act(async () => {
			result.current.lancer(CIBLE)
		})

		expect(premier).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledTimes(1)
		expect(result.current.etat).toEqual({
			phase: 'proposition',
			proposition: { personnageIds: ['pnj.x'] },
		})
	})
})
