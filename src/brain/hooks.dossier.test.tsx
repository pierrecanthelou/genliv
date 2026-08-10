import { useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrainProvider, createBrain } from './BrainContext'
import { useOpenDossier } from './hooks'
import { dossierKey } from './persistenceKeys'
import type { Dossier } from './dossier/types'

/**
 * `useOpenDossier` — la vue LIVE du dossier ouvert. Deux propriétés :
 *  · elle répercute une adoption cloud survenue pendant que l'écran est ouvert
 *    (`dossier:updated`), sans remontage ;
 *  · son instantané reste STABLE entre deux rendus sans événement — sans quoi
 *    `useSyncExternalStore` reboucle à l'infini (KR-071), et `DossierService.get()`
 *    rend justement un objet neuf à chaque appel (il re-valide et gèle).
 */

/** Ce que le hook a rendu, rendu par rendu — l'instrument de la stabilité. */
const rendus: Array<Dossier | null> = []

function Sonde({ dossierId }: { dossierId: string | null }): JSX.Element {
	const dossier = useOpenDossier(dossierId)
	rendus.push(dossier)
	const [tic, setTic] = useState(0)
	return (
		<div>
			<p>{dossier === null ? 'aucun dossier' : dossier.titre}</p>
			<button type="button" onClick={() => setTic(tic + 1)}>
				re-rendre
			</button>
		</div>
	)
}

function monter(dossierId: string | null): ReturnType<typeof createBrain> {
	const brain = createBrain()
	render(
		<BrainProvider brain={brain}>
			<Sonde dossierId={dossierId} />
		</BrainProvider>,
	)
	return brain
}

describe('useOpenDossier', () => {
	beforeEach(() => {
		window.localStorage.clear()
		rendus.length = 0
	})

	it('rend le dossier persiste au montage', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('La Caverne')
		render(
			<BrainProvider brain={brain}>
				<Sonde dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(screen.getByText('La Caverne')).toBeInTheDocument()
	})

	it('rend null sans identifiant, et sur un identifiant inconnu', () => {
		monter(null)

		expect(screen.getByText('aucun dossier')).toBeInTheDocument()

		rendus.length = 0
		monter('dossier-jamais-importe')

		expect(screen.getAllByText('aucun dossier').length).toBe(2)
	})

	it('repercute dossier:updated emis apres le montage, sans remontage', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('La Caverne')
		render(
			<BrainProvider brain={brain}>
				<Sonde dossierId={dossier.id} />
			</BrainProvider>,
		)
		const rendusAvant = rendus.length

		// L'adoption cloud, telle que `CloudSyncService.reconcileDossier` la fait :
		// écriture DERRIÈRE le service, puis l'événement (KR-004) — donc un abonné
		// relit toujours un magasin déjà à jour.
		act(() => {
			brain.persistence.set(dossierKey(dossier.id), {
				...dossier,
				titre: 'La Caverne des Echos',
				updatedAt: '2026-08-09T11:00:00.000Z',
			})
			brain.events.emit('dossier:updated', { dossierId: dossier.id })
		})

		expect(screen.getByText('La Caverne des Echos')).toBeInTheDocument()
		expect(screen.queryByText('La Caverne')).toBeNull()
		// Re-rendu, pas remonté : la sonde a conservé son historique de rendus.
		expect(rendus.length).toBeGreaterThan(rendusAvant)
		expect(rendus[0]?.titre).toBe('La Caverne')
	})

	it('retombe a null quand le dossier ouvert est supprime', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('La Caverne')
		render(
			<BrainProvider brain={brain}>
				<Sonde dossierId={dossier.id} />
			</BrainProvider>,
		)

		// `remove` retire la clé PUIS émet `dossier:deleted` — vrai émetteur, pas
		// un événement fabriqué pour le test.
		act(() => {
			brain.dossiers.remove(dossier.id)
		})

		expect(screen.getByText('aucun dossier')).toBeInTheDocument()
	})

	it('garde le MEME instantane entre deux rendus sans evenement', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('La Caverne')
		render(
			<BrainProvider brain={brain}>
				<Sonde dossierId={dossier.id} />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('button', { name: 're-rendre' }))

		expect(rendus.length).toBeGreaterThan(1)
		// Référence IDENTIQUE, pas seulement un contenu égal : c'est la référence
		// que `useSyncExternalStore` compare.
		expect(rendus.every((vu) => vu === rendus[0])).toBe(true)
	})
})
