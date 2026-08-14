import { useState } from 'react'
import type { Personnage, PlanAction, But, ContreMesure } from '../../../brain'
import type { SocleEcriture } from './useSocleEcriturePersonnages'

/** LA FAMILLE « OBJECTIF & PLAN D'ACTIONS » (§5 lot 2 du plan d'itération 5) —
 *  but/plan_actions/contre_mesures, le bloc 4 de l'accordéon. Extrait de
 *  `useEcriturePersonnages.ts` (it4), comportement inchangé. */

export interface BrouillonBut {
	libelle: string
	pourquoi: string
	echeance: string
}
export type ChampBut = keyof BrouillonBut

/** `duree` n'est jamais un brouillon pour une étape déjà persistée (le `Stepper` committe
 *  immédiatement) — il porte la valeur d'une étape encore locale, pas encore ajoutée. */
export interface BrouillonEtape {
	action: string
	declencheur_texte: string
	si_bloque: string
	duree: number | undefined
}
export type ChampEtapeTexte = 'action' | 'declencheur_texte' | 'si_bloque'

export interface BrouillonContreMesure {
	action: string
	declencheur_texte: string
}
export type ChampContreMesureTexte = 'action' | 'declencheur_texte'

const BROUILLON_BUT_VIDE: BrouillonBut = { libelle: '', pourquoi: '', echeance: '' }
const BROUILLON_ETAPE_VIDE: BrouillonEtape = { action: '', declencheur_texte: '', si_bloque: '', duree: undefined }
const BROUILLON_CONTRE_MESURE_VIDE: BrouillonContreMesure = { action: '', declencheur_texte: '' }

function butBrouillonDe(personnage: Personnage): BrouillonBut {
	return {
		libelle: personnage.but?.libelle ?? '',
		pourquoi: personnage.but?.pourquoi ?? '',
		echeance: personnage.but?.echeance ?? '',
	}
}

function etapeBrouillonDe(etape: PlanAction): BrouillonEtape {
	return {
		action: etape.action,
		declencheur_texte: etape.declencheur_texte ?? '',
		si_bloque: etape.si_bloque ?? '',
		duree: etape.duree,
	}
}

function seedEtape(personnage: Personnage, index: number): BrouillonEtape {
	const etape = personnage.plan_actions[index]
	return etape === undefined ? { ...BROUILLON_ETAPE_VIDE } : etapeBrouillonDe(etape)
}

function contreMesureBrouillonDe(cm: ContreMesure): BrouillonContreMesure {
	return { action: cm.action, declencheur_texte: cm.declencheur_texte ?? '' }
}

function seedContreMesure(personnage: Personnage, index: number): BrouillonContreMesure {
	const cm = (personnage.contre_mesures ?? [])[index]
	return cm === undefined ? { ...BROUILLON_CONTRE_MESURE_VIDE } : contreMesureBrouillonDe(cm)
}

export interface UseEcriturePlanResult {
	butBrouillon: BrouillonBut
	etapes: BrouillonEtape[]
	contreMesures: BrouillonContreMesure[]
	handleChangeBut: (champ: ChampBut, valeur: string) => void
	handleBlurBut: (champ: ChampBut, valeur: string) => void
	handleAjouterEtape: () => void
	handleChangeEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	handleBlurEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	handleChangeDureeEtape: (index: number, valeur: number) => void
	handleRetirerEtape: (index: number) => void
	handleAjouterContreMesure: () => void
	handleChangeContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	handleBlurContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	handleRetirerContreMesure: (index: number) => void
}

export function useEcriturePlan(socle: SocleEcriture | null): UseEcriturePlanResult {
	const [butBrouillons, setButBrouillons] = useState<Record<string, BrouillonBut>>({})
	const [etapesBrouillons, setEtapesBrouillons] = useState<Record<string, Record<number, BrouillonEtape>>>({})
	const [contreMesuresBrouillons, setContreMesuresBrouillons] = useState<
		Record<string, Record<number, BrouillonContreMesure>>
	>({})

	if (socle === null) {
		return {
			butBrouillon: BROUILLON_BUT_VIDE,
			etapes: [],
			contreMesures: [],
			handleChangeBut: () => {},
			handleBlurBut: () => {},
			handleAjouterEtape: () => {},
			handleChangeEtape: () => {},
			handleBlurEtape: () => {},
			handleChangeDureeEtape: () => {},
			handleRetirerEtape: () => {},
			handleAjouterContreMesure: () => {},
			handleChangeContreMesure: () => {},
			handleBlurContreMesure: () => {},
			handleRetirerContreMesure: () => {},
		}
	}

	const { dossierActuel, personnageAffiche, commit } = socle

	function handleChangeBut(champ: ChampBut, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setButBrouillons((prev) => {
			const actuel = prev[id] ?? butBrouillonDe(personnageAffiche)
			return { ...prev, [id]: { ...actuel, [champ]: valeur } }
		})
	}

	/** `but.libelle` vide n'entre jamais au document : le blur ne committe QUE si
	 *  `libelle` (fusionné avec ce qui vient d'être tapé) est non vide. */
	function handleBlurBut(champ: ChampBut, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const actuel = butBrouillons[id] ?? butBrouillonDe(personnageAffiche)
		const fusion = { ...actuel, [champ]: valeur }
		if (fusion.libelle.trim() === '') return
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				const but: But = { libelle: fusion.libelle }
				if (fusion.pourquoi !== '') but.pourquoi = fusion.pourquoi
				if (fusion.echeance !== '') but.echeance = fusion.echeance
				return { ...p, but }
			}),
			id,
		)
	}

	function etapesAffichees(personnage: Personnage): BrouillonEtape[] {
		const drafts = etapesBrouillons[personnage.id] ?? {}
		const persistees = personnage.plan_actions.map((etape, index): BrouillonEtape => {
			const brouillon = drafts[index]
			return {
				action: brouillon?.action ?? etape.action,
				declencheur_texte: brouillon?.declencheur_texte ?? etape.declencheur_texte ?? '',
				si_bloque: brouillon?.si_bloque ?? etape.si_bloque ?? '',
				duree: etape.duree,
			}
		})
		const nouvelle = drafts[personnage.plan_actions.length]
		return nouvelle === undefined ? persistees : [...persistees, nouvelle]
	}

	function effacerBrouillonEtape(id: string, index: number): void {
		setEtapesBrouillons((prev) => {
			const pourPersonnage = prev[id]
			if (pourPersonnage === undefined) return prev
			const suivant = { ...pourPersonnage }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Revue de PR (it4) : un second clic sur « + Ajouter… » pointe le MÊME index
	 *  tant que le premier brouillon n'est pas commité — sans garde il écraserait ce qui est tapé. */
	function handleAjouterEtape(): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const index = personnageAffiche.plan_actions.length
		setEtapesBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			if (pourPersonnage[index] !== undefined) return prev
			return { ...prev, [id]: { ...pourPersonnage, [index]: { ...BROUILLON_ETAPE_VIDE } } }
		})
	}

	function handleChangeEtape(index: number, champ: ChampEtapeTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setEtapesBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			const actuel = pourPersonnage[index] ?? seedEtape(personnageAffiche, index)
			return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, [champ]: valeur } } }
		})
	}

	/** `action` vide n'entre jamais au document, ni pour une étape locale (reste
	 *  brouillon) ni pour une étape persistée (blanchir ne l'efface pas, requise). */
	function handleBlurEtape(index: number, champ: ChampEtapeTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const pourPersonnage = etapesBrouillons[id] ?? {}
		const actuel = pourPersonnage[index] ?? seedEtape(personnageAffiche, index)
		const fusion = { ...actuel, [champ]: valeur }
		const estNouvelle = index >= personnageAffiche.plan_actions.length

		if (estNouvelle) {
			if (fusion.action.trim() === '') return
			const nouvelle: PlanAction = { etape: index + 1, action: fusion.action }
			if (fusion.declencheur_texte !== '') nouvelle.declencheur_texte = fusion.declencheur_texte
			if (fusion.duree !== undefined) nouvelle.duree = fusion.duree
			if (fusion.si_bloque !== '') nouvelle.si_bloque = fusion.si_bloque
			commit(
				dossierActuel.monde.personnages.map((p) =>
					p.id === id ? { ...p, plan_actions: [...p.plan_actions, nouvelle] } : p,
				),
				id,
			)
			effacerBrouillonEtape(id, index)
			return
		}

		if (champ === 'action' && fusion.action.trim() === '') return
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return {
					...p,
					plan_actions: p.plan_actions.map((etape, i): PlanAction => {
						if (i !== index) return etape
						if (champ === 'action') return { ...etape, action: fusion.action }
						const suivante: PlanAction = { ...etape }
						if (fusion[champ] === '') {
							delete suivante[champ]
							return suivante
						}
						suivante[champ] = fusion[champ]
						return suivante
					}),
				}
			}),
			id,
		)
	}

	/** Étape persistée : le `Stepper` committe immédiatement. Étape locale : la valeur
	 *  reste en brouillon, écrite au premier blur non vide de l'intention. */
	function handleChangeDureeEtape(index: number, valeur: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		if (index >= personnageAffiche.plan_actions.length) {
			setEtapesBrouillons((prev) => {
				const pourPersonnage = prev[id] ?? {}
				const actuel = pourPersonnage[index] ?? seedEtape(personnageAffiche, index)
				return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, duree: valeur } } }
			})
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id
					? { ...p, plan_actions: p.plan_actions.map((e, i) => (i === index ? { ...e, duree: valeur } : e)) }
					: p,
			),
			id,
		)
	}

	function handleRetirerEtape(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		if (index >= personnageAffiche.plan_actions.length) {
			effacerBrouillonEtape(id, index)
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, plan_actions: p.plan_actions.filter((_, i) => i !== index) } : p,
			),
			id,
		)
		// Les indices se décalent après un retrait : purge tous les brouillons en cours.
		setEtapesBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	function contreMesuresAffichees(personnage: Personnage): BrouillonContreMesure[] {
		const drafts = contreMesuresBrouillons[personnage.id] ?? {}
		const liste = personnage.contre_mesures ?? []
		const persistees = liste.map((cm, index): BrouillonContreMesure => {
			const brouillon = drafts[index]
			return {
				action: brouillon?.action ?? cm.action,
				declencheur_texte: brouillon?.declencheur_texte ?? cm.declencheur_texte ?? '',
			}
		})
		const nouvelle = drafts[liste.length]
		return nouvelle === undefined ? persistees : [...persistees, nouvelle]
	}

	function effacerBrouillonContreMesure(id: string, index: number): void {
		setContreMesuresBrouillons((prev) => {
			const pourPersonnage = prev[id]
			if (pourPersonnage === undefined) return prev
			const suivant = { ...pourPersonnage }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Même garde que `handleAjouterEtape` (ne pas écraser le brouillon en cours). */
	function handleAjouterContreMesure(): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const index = (personnageAffiche.contre_mesures ?? []).length
		setContreMesuresBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			if (pourPersonnage[index] !== undefined) return prev
			return { ...prev, [id]: { ...pourPersonnage, [index]: { ...BROUILLON_CONTRE_MESURE_VIDE } } }
		})
	}

	function handleChangeContreMesure(index: number, champ: ChampContreMesureTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setContreMesuresBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			const actuel = pourPersonnage[index] ?? seedContreMesure(personnageAffiche, index)
			return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, [champ]: valeur } } }
		})
	}

	function handleBlurContreMesure(index: number, champ: ChampContreMesureTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.contre_mesures ?? []
		const pourPersonnage = contreMesuresBrouillons[id] ?? {}
		const actuel = pourPersonnage[index] ?? seedContreMesure(personnageAffiche, index)
		const fusion = { ...actuel, [champ]: valeur }
		const estNouvelle = index >= liste.length

		if (estNouvelle) {
			if (fusion.action.trim() === '') return
			const nouvelle: ContreMesure = { action: fusion.action }
			if (fusion.declencheur_texte !== '') nouvelle.declencheur_texte = fusion.declencheur_texte
			commit(
				dossierActuel.monde.personnages.map((p) =>
					p.id === id ? { ...p, contre_mesures: [...(p.contre_mesures ?? []), nouvelle] } : p,
				),
				id,
			)
			effacerBrouillonContreMesure(id, index)
			return
		}

		if (champ === 'action' && fusion.action.trim() === '') return
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return {
					...p,
					contre_mesures: (p.contre_mesures ?? []).map((cm, i): ContreMesure => {
						if (i !== index) return cm
						if (champ === 'action') return { ...cm, action: fusion.action }
						if (fusion.declencheur_texte === '') {
							const sansDeclencheur: ContreMesure = { ...cm }
							delete sansDeclencheur.declencheur_texte
							return sansDeclencheur
						}
						return { ...cm, declencheur_texte: fusion.declencheur_texte }
					}),
				}
			}),
			id,
		)
	}

	function handleRetirerContreMesure(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.contre_mesures ?? []
		if (index >= liste.length) {
			effacerBrouillonContreMesure(id, index)
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, contre_mesures: (p.contre_mesures ?? []).filter((_, i) => i !== index) } : p,
			),
			id,
		)
		setContreMesuresBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	// Un brouillon présent porte TOUJOURS ses trois champs (jamais partiel).
	function butBrouillonActuel(personnage: Personnage): BrouillonBut {
		return butBrouillons[personnage.id] ?? butBrouillonDe(personnage)
	}

	return {
		butBrouillon: personnageAffiche === undefined ? BROUILLON_BUT_VIDE : butBrouillonActuel(personnageAffiche),
		etapes: personnageAffiche === undefined ? [] : etapesAffichees(personnageAffiche),
		contreMesures: personnageAffiche === undefined ? [] : contreMesuresAffichees(personnageAffiche),
		handleChangeBut,
		handleBlurBut,
		handleAjouterEtape,
		handleChangeEtape,
		handleBlurEtape,
		handleChangeDureeEtape,
		handleRetirerEtape,
		handleAjouterContreMesure,
		handleChangeContreMesure,
		handleBlurContreMesure,
		handleRetirerContreMesure,
	}
}
