import { useCallback, useRef } from 'react'
import { useBrain } from '../../../brain'

/**
 * Orchestrates the create flow through brain contracts only. Persistence
 * happens inside DossierService.create, which emits `dossier:created`; we
 * then open() the dossier (emits `dossier:opened`) and navigate — strictly
 * in that order, only after the write resolves (KR-004).
 *
 * `enCours` guards against a re-entrant call from the SAME hook instance
 * (DossierService.create() is not idempotent — two calls seed two dossiers).
 * It is armed synchronously before the first call and never reset: this is
 * safe only because the create flow always navigates away on success, which
 * unmounts the dialog and this hook with it. A future caller that keeps this
 * hook mounted across multiple creates (this feature has none today) would
 * need a guard that resets after the call instead. The service itself
 * deliberately does not guard non-idempotency (its contract, § 4 of the plan).
 */
export function useCreateDossier(): (titre: string) => void {
	const { dossiers, router } = useBrain()
	const enCours = useRef(false)

	return useCallback(
		(titre: string) => {
			if (enCours.current) return
			enCours.current = true
			const dossier = dossiers.create(titre)
			dossiers.open(dossier.id)
			router.navigate({ name: 'dossier', dossierId: dossier.id })
		},
		[dossiers, router],
	)
}
