/**
 * Integration tests for combat loop — real engine (no mocks).
 *
 * Validates:
 * - KR-304: Determinism — same seed, same report
 * - Combat resolution exercised (combats_traverses >= 1)
 *
 * Reads dossier-reference.json (KR-156): real dossier, no fixtures fabricated.
 */

import path from 'path'
import fs from 'fs'
import { repeter, ROUNDS_MAX } from '../utils/repeter'
import { controlerDossier } from '../../../brain'
import type { Dossier } from '../../../brain/dossier/types'

const CHEMIN_REFERENCE = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'brain',
	'dossier',
	'__fixtures__',
	'dossier-reference.json',
)

function chargerDossierReference(): Dossier {
	const contenu = fs.readFileSync(CHEMIN_REFERENCE, 'utf-8')
	return JSON.parse(contenu)
}

describe('repeterCombat — integration (real engine)', () => {
	it('integration_deterministe — graines 0-9, meme graine = meme rapport, combat atteint', () => {
		const dossier = chargerDossierReference()

		// Verify playability
		const controle = controlerDossier(dossier)
		expect(controle.jouable).toBe(true)

		let auMoinsUnCombat = false

		// Run with graines 0-9, then re-run each graine and verify determinism
		for (let graine = 0; graine < 10; graine++) {
			const r1 = repeter(dossier, graine)
			const r2 = repeter(dossier, graine)

			// Both must succeed
			expect(r1.ok).toBe(true)
			expect(r2.ok).toBe(true)

			if (r1.ok && r2.ok) {
				// Reports must be identical (KR-304)
				expect(r1.rapport).toEqual(r2.rapport)

				// Never `combat_ouvert`
				expect(r1.rapport.arret).not.toBe('combat_ouvert')

				if (r1.rapport.combats_traverses > 0) auMoinsUnCombat = true
			}
		}

		// At least one seed must traverse a combat — otherwise the integration test exercises nothing
		expect(auMoinsUnCombat).toBe(true)
	})

	it('boucle_combat_reelle — au moins une graine traverse un combat avec le moteur reel', () => {
		const dossier = chargerDossierReference()

		// Find a seed that traverses a combat (probe showed all 0-9 do)
		const r = repeter(dossier, 0)
		expect(r.ok).toBe(true)
		if (!r.ok) return

		// The combat was resolved (not stopped as combat_ouvert)
		expect(r.rapport.combats_traverses).toBeGreaterThanOrEqual(1)
		expect(r.rapport.arret).not.toBe('combat_ouvert')

		// ROUNDS_MAX is the constant used
		expect(ROUNDS_MAX).toBe(50)
	})
})
