import { useState } from 'react'
import type { Evenement, Resolution, Delta, EcritureDossier } from '../../../brain'

/**
 * LA FAMILLE « RÉSOLUTIONS » d'un événement (§5 lot 2 du plan d'itération 4 de
 * `dossier-registres`) — brouillon différé sur `resultat` (KR-214), précédent
 * `useEcritureEtapes.ts` (it3), RÉIMPLÉMENTÉ ICI localement, jamais importé
 * d'une autre feature (import croisé interdit, refusé par l'ESLint d'isolation
 * de toute façon).
 *
 * DEUX DIFFÉRENCES avec son précédent :
 *  1. Chaque résolution porte aussi `consequence: Delta[]` — les trois gestes
 *     d'effet (ajout à deux temps, changement de cible, retrait), délégués
 *     à `EditeurEffets` côté écran, sont ICI de simples écritures fermées sur
 *     le RANG de la résolution (aucun brouillon supplémentaire : `EditeurEffets`
 *     garde son propre état d'ajout à deux temps en interne).
 *  2. LE JETON DE REMONTAGE — un compteur monotone, incrémenté au SEUL retrait
 *     d'une résolution PERSISTÉE (jamais à l'ajout, au changement, ni au
 *     retrait d'un brouillon encore local). Ce n'est PAS de l'état dérivé
 *     (KR-013/113) : il ne miroite rien du document, et rien ne pourrait le
 *     recalculer depuis `dossier` — il existe pour une seule raison, forcer
 *     React à DÉMONTER/REMONTER les instances `EditeurEffets` après un retrait
 *     qui décale des index. Sans lui, une résolution qui glisse à la position
 *     laissée vacante hériterait — par réutilisation de clé React — de
 *     l'instance `EditeurEffets` (et donc du brouillon d'effet EN COURS DE
 *     SAISIE) de l'ancien occupant de cette position, qui n'a plus rien à voir
 *     avec elle. DEUX AXES DE FUITE, DEUX MOITIÉS DE CLÉ : le jeton ferme l'axe
 *     INTER-RANG (un retrait décale les index de la MÊME fiche) ; l'identifiant
 *     de l'événement ferme l'axe INTER-FICHE (changer de sélection ne doit pas
 *     non plus faire hériter un brouillon d'effet de l'événement précédent). Le
 *     composant appelant inclut les deux dans la clé React de chaque ligne :
 *     `` key={`${evenement.id}:${jetonDeRemontage}:${rang}`} ``.
 *
 * Les brouillons de texte (`resultat`) restent scopés PAR ÉVÉNEMENT (comme
 * `useEcritureEtapes.ts` les scope par quête) : changer d'événement sélectionné
 * ne mélange pas les ajouts de résolution en cours des deux fiches — et depuis
 * la clé à trois parties ci-dessus, l'état interne d'`EditeurEffets` (brouillon
 * d'effet) suit désormais la même garantie.
 */

export interface BrouillonResolution {
	resultat: string
}

const BROUILLON_RESOLUTION_VIDE: BrouillonResolution = { resultat: '' }

export interface ResolutionAffichee {
	resultat: string
	/**
	 * `null` tant que la résolution n'existe pas encore dans `resolutions[]` —
	 * on ne peut pas éditer les conséquences d'une résolution qui n'a pas
	 * encore de place où les écrire (§3 point 4 du plan). Devient un tableau
	 * (potentiellement vide) dès le premier commit.
	 */
	consequence: Delta[] | null
}

export interface SocleResolutions {
	/** `monde.evenements` ENTIER — nécessaire pour recomposer le tableau au
	 *  commit (un seul événement change, les autres traversent intacts). */
	evenements: Evenement[]
	/** L'événement AFFICHÉ par le panneau — `undefined` seulement quand le
	 *  sous-ensemble filtré est vide (aucune fiche à droite). */
	evenementAffiche: Evenement | undefined
	commit: (evenementsSuivants: Evenement[], evenementId: string) => EcritureDossier
}

export interface UseEcritureResolutionsResult {
	resolutions: ResolutionAffichee[]
	jetonDeRemontage: number
	handleAjouterResolution: () => void
	handleChangeResolution: (rang: number, valeur: string) => void
	handleBlurResolution: (rang: number, valeur: string) => void
	handleRetirerResolution: (rang: number) => void
	handleAjouterEffetResolution: (rang: number, effet: Delta) => void
	handleChangerCibleEffetResolution: (rang: number, index: number, rangCible: number, valeur: string) => void
	handleRetirerEffetResolution: (rang: number, index: number) => void
}

export function useEcritureResolutions(socle: SocleResolutions | null): UseEcritureResolutionsResult {
	const [brouillonsParEvenement, setBrouillonsParEvenement] = useState<
		Record<string, Record<number, BrouillonResolution>>
	>({})
	const [jetonDeRemontage, setJetonDeRemontage] = useState(0)

	if (socle === null) {
		return {
			resolutions: [],
			jetonDeRemontage,
			handleAjouterResolution: () => {},
			handleChangeResolution: () => {},
			handleBlurResolution: () => {},
			handleRetirerResolution: () => {},
			handleAjouterEffetResolution: () => {},
			handleChangerCibleEffetResolution: () => {},
			handleRetirerEffetResolution: () => {},
		}
	}

	const { evenements, evenementAffiche, commit } = socle

	function resolutionsAffichees(evenement: Evenement): ResolutionAffichee[] {
		const persistees = evenement.resolutions
		const drafts = brouillonsParEvenement[evenement.id] ?? {}
		const rendues = persistees.map(
			(resolution, index): ResolutionAffichee => ({
				resultat: drafts[index]?.resultat ?? resolution.resultat,
				consequence: resolution.consequence,
			}),
		)
		const nouvelle = drafts[persistees.length]
		return nouvelle === undefined ? rendues : [...rendues, { resultat: nouvelle.resultat, consequence: null }]
	}

	function effacerBrouillon(id: string, index: number): void {
		setBrouillonsParEvenement((prev) => {
			const pourEvenement = prev[id]
			if (pourEvenement === undefined) return prev
			const suivant = { ...pourEvenement }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Un second clic sur « + Ajouter une résolution… » pointe le MÊME index
	 *  tant que le premier brouillon n'est pas commité (précédent
	 *  `handleAjouterEtape`) — sans cette garde, il écraserait ce que l'auteur
	 *  est en train de taper. */
	function handleAjouterResolution(): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		const index = evenementAffiche.resolutions.length
		setBrouillonsParEvenement((prev) => {
			const pourEvenement = prev[id] ?? {}
			if (pourEvenement[index] !== undefined) return prev
			return { ...prev, [id]: { ...pourEvenement, [index]: { ...BROUILLON_RESOLUTION_VIDE } } }
		})
	}

	function handleChangeResolution(index: number, valeur: string): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		setBrouillonsParEvenement((prev) => {
			const pourEvenement = prev[id] ?? {}
			return { ...prev, [id]: { ...pourEvenement, [index]: { resultat: valeur } } }
		})
	}

	/** `resultat` vide ne committe JAMAIS — ni pour une résolution encore
	 *  locale (elle reste un brouillon), ni pour une résolution déjà persistée
	 *  (blanchir ne l'efface pas, il est requis). Une fois non vide au blur, la
	 *  résolution entre dans `resolutions[]` (nouvelle, `consequence: []`) ou
	 *  s'y met à jour (déjà écrite, `consequence` inchangée). */
	function handleBlurResolution(index: number, valeur: string): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		const persistees = evenementAffiche.resolutions
		const estNouvelle = index >= persistees.length

		if (estNouvelle) {
			if (valeur.trim() === '') return
			const nouvelle: Resolution = { resultat: valeur, consequence: [] }
			const resultat = commit(
				evenements.map((ev) => (ev.id === id ? { ...ev, resolutions: [...ev.resolutions, nouvelle] } : ev)),
				id,
			)
			if (resultat.statut === 'ecrit') effacerBrouillon(id, index)
			return
		}

		if (valeur.trim() === '') return
		commit(
			evenements.map((ev): Evenement => {
				if (ev.id !== id) return ev
				return {
					...ev,
					resolutions: ev.resolutions.map((resolution, i) =>
						i === index ? { ...resolution, resultat: valeur } : resolution,
					),
				}
			}),
			id,
		)
	}

	function handleRetirerResolution(index: number): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		const persistees = evenementAffiche.resolutions
		if (index >= persistees.length) {
			// Un brouillon encore local (jamais écrit) : rien à décaler dans le
			// document, donc PAS de jeton de remontage — voir la docstring du
			// module.
			effacerBrouillon(id, index)
			return
		}
		commit(
			evenements.map((ev) =>
				ev.id === id ? { ...ev, resolutions: ev.resolutions.filter((_, i) => i !== index) } : ev,
			),
			id,
		)
		// Les indices se décalent après un retrait : purge tous les brouillons de
		// TEXTE en cours pour cet événement (même garde que `useEcritureEtapes.ts`).
		setBrouillonsParEvenement((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
		// Le jeton de remontage force le démontage/remontage des `EditeurEffets`
		// restants — voir la docstring du module.
		setJetonDeRemontage((jeton) => jeton + 1)
	}

	function handleAjouterEffetResolution(rang: number, effet: Delta): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		commit(
			evenements.map((ev): Evenement => {
				if (ev.id !== id) return ev
				return {
					...ev,
					resolutions: ev.resolutions.map((resolution, i) =>
						i === rang ? { ...resolution, consequence: [...resolution.consequence, effet] } : resolution,
					),
				}
			}),
			id,
		)
	}

	function handleChangerCibleEffetResolution(rang: number, index: number, rangCible: number, valeur: string): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		commit(
			evenements.map((ev): Evenement => {
				if (ev.id !== id) return ev
				return {
					...ev,
					resolutions: ev.resolutions.map((resolution, i) => {
						if (i !== rang) return resolution
						return {
							...resolution,
							consequence: resolution.consequence.map((effet, r) =>
								r === index
									? { ...effet, cibles: effet.cibles.map((cible, c) => (c === rangCible ? valeur : cible)) }
									: effet,
							),
						}
					}),
				}
			}),
			id,
		)
	}

	function handleRetirerEffetResolution(rang: number, index: number): void {
		if (evenementAffiche === undefined) return
		const id = evenementAffiche.id
		commit(
			evenements.map((ev): Evenement => {
				if (ev.id !== id) return ev
				return {
					...ev,
					resolutions: ev.resolutions.map((resolution, i) =>
						i === rang
							? { ...resolution, consequence: resolution.consequence.filter((_, r) => r !== index) }
							: resolution,
					),
				}
			}),
			id,
		)
	}

	return {
		resolutions: evenementAffiche === undefined ? [] : resolutionsAffichees(evenementAffiche),
		jetonDeRemontage,
		handleAjouterResolution,
		handleChangeResolution,
		handleBlurResolution,
		handleRetirerResolution,
		handleAjouterEffetResolution,
		handleChangerCibleEffetResolution,
		handleRetirerEffetResolution,
	}
}
