import { useState } from 'react'
import type { Quete, EtapeQuete, EcritureDossier } from '../../../brain'

/**
 * LA FAMILLE « ÉTAPES » d'une quête (§3/§5 lot 2 du plan d'itération 3 de
 * `dossier-registres`) — brouillon différé (KR-214), précédent
 * `dossier-fiches/hooks/useEcriturePlan.ts` (la famille `plan_actions`),
 * RÉIMPLÉMENTÉ ICI localement, jamais importé d'une autre feature (import
 * croisé interdit, refusé par l'ESLint d'isolation).
 *
 * PLUS SIMPLE QUE SON PRÉCÉDENT : `EtapeQuete` ne porte qu'UN champ
 * (`libelle`) — aucun `etape` stocké (KR-013, voir la docstring du type dans
 * `brain/dossier/types.ts`) : l'étiquette « ÉTAPE N » que l'auteur lit est
 * CALCULÉE depuis la position du tableau à chaque rendu, jamais ici. Pas de
 * `duree`, pas de `declencheur_texte`, pas de `si_bloque` : une étape de quête
 * n'est pas une condition.
 *
 * Les brouillons restent scopés PAR QUÊTE (comme `useEcriturePlan.ts` les
 * scope par personnage) : changer de quête sélectionnée ne mélange pas les
 * ajouts en cours des deux fiches.
 */

export interface BrouillonEtape {
	libelle: string
}

const BROUILLON_ETAPE_VIDE: BrouillonEtape = { libelle: '' }

export interface SocleEtapes {
	/** `monde.quetes` ENTIER — nécessaire pour recomposer le tableau au commit
	 *  (une seule quête change, les autres traversent intactes). */
	quetes: Quete[]
	/** La quête AFFICHÉE par le panneau — `undefined` seulement quand le
	 *  registre est vide (aucune fiche à droite). */
	queteAffichee: Quete | undefined
	commit: (quetesSuivantes: Quete[], queteId: string) => EcritureDossier
}

export interface UseEcritureEtapesResult {
	etapes: BrouillonEtape[]
	handleAjouterEtape: () => void
	handleChangeEtape: (index: number, valeur: string) => void
	handleBlurEtape: (index: number, valeur: string) => void
	/** `filter` NU — pas de renumérotation : `EtapeQuete` ne porte aucun champ
	 *  d'ordre, il n'y a donc rien à renuméroter (§5 du plan). */
	handleRetirerEtape: (index: number) => void
}

export function useEcritureEtapes(socle: SocleEtapes | null): UseEcritureEtapesResult {
	const [brouillonsParQuete, setBrouillonsParQuete] = useState<Record<string, Record<number, BrouillonEtape>>>({})

	if (socle === null) {
		return {
			etapes: [],
			handleAjouterEtape: () => {},
			handleChangeEtape: () => {},
			handleBlurEtape: () => {},
			handleRetirerEtape: () => {},
		}
	}

	const { quetes, queteAffichee, commit } = socle

	function etapesAffichees(quete: Quete): BrouillonEtape[] {
		const persistees = quete.etapes ?? []
		const drafts = brouillonsParQuete[quete.id] ?? {}
		const rendues = persistees.map(
			(etape, index): BrouillonEtape => ({ libelle: drafts[index]?.libelle ?? etape.libelle }),
		)
		const nouvelle = drafts[persistees.length]
		return nouvelle === undefined ? rendues : [...rendues, nouvelle]
	}

	function effacerBrouillon(id: string, index: number): void {
		setBrouillonsParQuete((prev) => {
			const pourQuete = prev[id]
			if (pourQuete === undefined) return prev
			const suivant = { ...pourQuete }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Un second clic sur « + Ajouter une étape… » pointe le MÊME index tant
	 *  que le premier brouillon n'est pas commité (précédent
	 *  `handleAjouterEtape`, `useEcriturePlan.ts`) — sans cette garde, il
	 *  écraserait ce que l'auteur est en train de taper. */
	function handleAjouterEtape(): void {
		if (queteAffichee === undefined) return
		const id = queteAffichee.id
		const index = (queteAffichee.etapes ?? []).length
		setBrouillonsParQuete((prev) => {
			const pourQuete = prev[id] ?? {}
			if (pourQuete[index] !== undefined) return prev
			return { ...prev, [id]: { ...pourQuete, [index]: { ...BROUILLON_ETAPE_VIDE } } }
		})
	}

	function handleChangeEtape(index: number, valeur: string): void {
		if (queteAffichee === undefined) return
		const id = queteAffichee.id
		setBrouillonsParQuete((prev) => {
			const pourQuete = prev[id] ?? {}
			return { ...prev, [id]: { ...pourQuete, [index]: { libelle: valeur } } }
		})
	}

	/** `libelle` vide ne committe JAMAIS — ni pour une étape encore locale
	 *  (elle reste un brouillon), ni pour une étape déjà persistée (blanchir
	 *  ne l'efface pas, elle est requise — même garde que
	 *  `plan_actions[].action`). Une fois non vide au blur, l'étape entre dans
	 *  `etapes[]` (nouvelle) ou s'y met à jour (déjà écrite). */
	function handleBlurEtape(index: number, valeur: string): void {
		if (queteAffichee === undefined) return
		const id = queteAffichee.id
		const persistees = queteAffichee.etapes ?? []
		const estNouvelle = index >= persistees.length

		if (estNouvelle) {
			if (valeur.trim() === '') return
			const nouvelle: EtapeQuete = { libelle: valeur }
			const resultat = commit(
				quetes.map((q) => (q.id === id ? { ...q, etapes: [...(q.etapes ?? []), nouvelle] } : q)),
				id,
			)
			if (resultat.statut === 'ecrit') effacerBrouillon(id, index)
			return
		}

		if (valeur.trim() === '') return
		commit(
			quetes.map((q): Quete => {
				if (q.id !== id) return q
				return {
					...q,
					etapes: (q.etapes ?? []).map((etape, i) => (i === index ? { ...etape, libelle: valeur } : etape)),
				}
			}),
			id,
		)
	}

	function handleRetirerEtape(index: number): void {
		if (queteAffichee === undefined) return
		const id = queteAffichee.id
		const persistees = queteAffichee.etapes ?? []
		if (index >= persistees.length) {
			effacerBrouillon(id, index)
			return
		}
		commit(
			quetes.map((q) => (q.id === id ? { ...q, etapes: (q.etapes ?? []).filter((_, i) => i !== index) } : q)),
			id,
		)
		// Les indices se décalent après un retrait : purge tous les brouillons en
		// cours pour cette quête (même garde que `useEcriturePlan.ts`).
		setBrouillonsParQuete((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	return {
		etapes: queteAffichee === undefined ? [] : etapesAffichees(queteAffichee),
		handleAjouterEtape,
		handleChangeEtape,
		handleBlurEtape,
		handleRetirerEtape,
	}
}
