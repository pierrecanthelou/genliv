import { useMemo, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	validateDossier,
	frapperIdentifiant,
	PORTEE_INITIALE,
	type Dossier,
	type Personnage,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'

/**
 * LE SOCLE de l'écriture du panneau Personnages — extrait de
 * `useEcriturePersonnages.ts` (690 l., dette KR-112 datée par it3/it4,
 * désaccord n° 1 du plan d'itération 5) : sélection du personnage affiché,
 * création, `commit()` et ses DEUX indexations KR-197 (affichage/invalidation,
 * `resout: false` sur le chemin de création), le bandeau de refus et
 * l'avertissement D1 dérivé.
 *
 * Les TROIS sous-hooks de famille (`useEcritureIdentite`, `useEcriturePlan`,
 * `useEcritureRelationsPresence`) reçoivent `socle` en PARAMÈTRE et n'appellent
 * JAMAIS `useBrain`/`useOpenDossier` eux-mêmes — un seul abonnement au dossier
 * pour toute la fiche, ici. `commit` et ses deux indexations vivent
 * UNIQUEMENT dans ce fichier, jamais recopiées par sous-hook : c'est ce qui
 * garde les deux tests KR-197 existants de `panneauPersonnages.test.tsx` verts
 * SANS modification après la scission (§5 lot 2 du plan).
 */

export interface RefusAffiche {
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

interface RefusEnCours {
	personnageId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

/**
 * Le RENDEZ-VOUS INTERNE (§5 lot 2 du plan) entre le socle et les trois
 * sous-hooks de famille : ce qu'il faut, et rien de plus, pour committer une
 * écriture sur le personnage affiché.
 */
export interface SocleEcriture {
	dossierActuel: Dossier
	personnageAffiche: Personnage | undefined
	commit: (personnages: Personnage[], personnageId: string, opts?: { resout: boolean }) => EcritureDossier
}

export interface UseSocleEcriturePersonnagesResult {
	dossier: Dossier | null
	personnageAffiche: Personnage | undefined
	selection: string | null
	setSelection: (id: string) => void
	refusAffiche: RefusAffiche | null
	avertissementsD1Affiche: DossierIssue[]
	handleAjouter: () => void
	/** `null` quand le dossier est absent : aucun sous-hook n'écrit sur un
	 *  dossier disparu. */
	socle: SocleEcriture | null
}

export function useSocleEcriturePersonnages(dossierId: string): UseSocleEcriturePersonnagesResult {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113).
	const personnageAffiche =
		dossier === null
			? undefined
			: (dossier.monde.personnages.find((p) => p.id === selection) ?? dossier.monde.personnages[0])

	// Avertissement D1 (KR-189) — dérivé, jamais un état semé une fois : il doit
	// s'allumer au montage (dossier réouvert) autant qu'après un commit de session.
	const avertissementsD1Affiche = useMemo((): DossierIssue[] => {
		if (dossier === null || personnageAffiche === undefined) return []
		const index = dossier.monde.personnages.findIndex((p) => p.id === personnageAffiche.id)
		if (index === -1) return []
		const prefixe = `monde.personnages[${index}].`
		return validateDossier(dossier).warnings.filter((issue) => issue.path.startsWith(prefixe))
	}, [dossier, personnageAffiche])

	/**
	 * TROIS racines nommées, jamais un spread de `dossier`. `resout` (revue de PR
	 * it2, régression BUG-063) : un AJOUT ne résout jamais un refus, même quand il
	 * réussit et que l'entité affichée coïncide avec l'entité déjà en cause.
	 */
	function commit(
		personnages: Personnage[],
		personnageId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, personnages },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { personnageId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { personnageId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.personnageId !== personnageId ? refusPrecedent : null
		})
		return resultat
	}

	function handleAjouter(): void {
		if (dossier === null) return
		const id = frapperIdentifiant('pnj')
		const nouveau: Personnage = { id, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }
		const resultat = commit([...dossier.monde.personnages, nouveau], personnageAffiche?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setSelection(id)
	}

	// Le refus ne se rend QUE sous la fiche du personnage qui l'a produit
	// (KR-197, affichage).
	const refusAffiche: RefusAffiche | null =
		personnageAffiche !== undefined && refus !== null && refus.personnageId === personnageAffiche.id
			? { statut: refus.statut, issues: refus.issues }
			: null

	return {
		dossier,
		personnageAffiche,
		selection,
		setSelection,
		refusAffiche,
		avertissementsD1Affiche,
		handleAjouter,
		socle: dossier === null ? null : { dossierActuel: dossier, personnageAffiche, commit },
	}
}
