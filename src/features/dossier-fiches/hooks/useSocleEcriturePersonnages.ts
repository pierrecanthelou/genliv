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
 * `resout: false` sur le chemin de création), le bandeau de refus et les
 * avertissements dérivés du personnage affiché.
 *
 * Les QUATRE sous-hooks de famille (`useEcritureIdentite`, `useEcriturePlan`,
 * `useEcritureRelationsPresence`, `useEcritureSavoirs`) reçoivent `socle` en
 * PARAMÈTRE et n'appellent
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
	/** Les avertissements du dossier PORTÉS PAR LE PERSONNAGE AFFICHÉ, filtrés par
	 *  PRÉFIXE DE CHEMIN — jamais par famille d'anomalie. Nommé
	 *  `avertissementsD1Affiche` jusqu'à l'itération 6, où le nom a cessé d'être
	 *  seulement imprécis pour devenir FAUX : le bloc Savoirs fait remonter ici
	 *  `revelation-sans-porte`, qui n'appartient pas à D1 (§ 8 désaccord 9). */
	avertissementsAffiches: DossierIssue[]
	handleAjouter: () => void
	/** Retire le personnage AFFICHÉ. Rend le résultat brut : le refus SSOT n'est
	 *  jamais avalé, l'appelant sait s'il doit déplacer le focus. Aucun retrait
	 *  optimiste. Sans argument — agit sur `personnageAffiche`, jamais sur un id
	 *  passé par l'appelant (une seule source de vérité, § 8 désaccord 3 du plan
	 *  d'itération 7). */
	handleRetirer: () => EcritureDossier
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

	// Avertissements du personnage affiché (KR-189) — dérivés, jamais un état semé
	// une fois : ils doivent s'allumer au montage (dossier réouvert) autant
	// qu'après un commit de session. Le filtre est un PRÉFIXE DE CHEMIN, donc TOUT
	// avertissement porté par ce personnage passe — D1 (`condition-sans-expr`)
	// comme `revelation-sans-porte`, arrivé avec le bloc Savoirs en it6.
	const avertissementsAffiches = useMemo((): DossierIssue[] => {
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

	/**
	 * LE RETRAIT du personnage affiché (itération 7). AUCUN PRÉ-VOL : ce hook ne
	 * cherche jamais qui référence ce personnage — ni pour désactiver le geste, ni
	 * pour composer un message. Il tente l'écriture et RELAIE ce que le SSOT
	 * répond (veto tech-lead/narratif-ia, § 8 désaccord 2 du plan) : dupliquer la
	 * règle ici se tromperait sur l'auto-référence (KR-194), où la relation part
	 * dans le MÊME commit que son porteur et ne pend donc jamais.
	 *
	 * AUCUNE PURGE DE BROUILLON dans les quatre sous-hooks de famille (§ 8
	 * désaccord 9) : `frapperIdentifiant` ne réutilise jamais un identifiant, donc
	 * une entrée de brouillon laissée derrière ne peut être lue par aucun
	 * personnage futur. Motivé ici, pas codé.
	 */
	function handleRetirer(): EcritureDossier {
		// Structurellement inatteignable depuis l'écran — le bouton de retrait
		// n'existe que dans la fiche d'un personnage AFFICHÉ. Le repli rend le même
		// statut que `DossierService` sur un dossier disparu, jamais un quatrième
		// statut inventé.
		if (dossier === null || personnageAffiche === undefined) return { statut: 'absent' }
		const id = personnageAffiche.id
		const index = dossier.monde.personnages.findIndex((p) => p.id === id)
		const resultat = commit(
			dossier.monde.personnages.filter((p) => p.id !== id),
			id,
		)
		// Refusé (une autre entité le référence encore) : rien n'est persisté, la
		// liste et la sélection restent celles d'avant — aucun retrait optimiste.
		if (resultat.statut !== 'ecrit') return resultat
		const restants = resultat.dossier.monde.personnages
		// Le personnage d'`index - 1`, ou le premier restant si le retiré était en
		// tête — `restants[Math.max(index - 1, 0)]` réalise les DEUX cas d'un coup
		// (précédent `PanneauLieux.handleRetirer`). `null` quand il ne reste
		// personne : l'état vide livré à it1 revient, et `selection` ne pointe
		// jamais un identifiant disparu.
		setSelection(restants.length === 0 ? null : restants[Math.max(index - 1, 0)].id)
		return resultat
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
		avertissementsAffiches,
		handleAjouter,
		handleRetirer,
		socle: dossier === null ? null : { dossierActuel: dossier, personnageAffiche, commit },
	}
}
