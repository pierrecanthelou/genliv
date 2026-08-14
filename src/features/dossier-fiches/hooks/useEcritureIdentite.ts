import { useState } from 'react'
import { STATS_INITIALES, type Personnage, type CampPersonnage, type Portee, type Characteristic } from '../../../brain'
import type { SocleEcriture } from './useSocleEcriturePersonnages'

/**
 * LA FAMILLE « IDENTITÉ » (§5 lot 2 du plan d'itération 5, désaccord n° 1) —
 * nom/camp/portée/objectif/stats : le bloc 1 (« Camp, plan & rattachement »),
 * le nom en en-tête de fiche et les trois proses du bloc 2 (« Identité »), et
 * le bloc 3 (« Caractéristiques »). Extrait tel quel de
 * `useEcriturePersonnages.ts` — aucun changement de comportement, seul le
 * fichier change.
 */

export interface BrouillonPersonnage {
	nom: string
	fonction: string
	apparence: string
	description_joueur: string
}
export type ChampTexte = keyof BrouillonPersonnage

const BROUILLON_PERSONNAGE_VIDE: BrouillonPersonnage = { nom: '', fonction: '', apparence: '', description_joueur: '' }

function brouillonDe(personnage: Personnage): BrouillonPersonnage {
	return {
		nom: personnage.nom ?? '',
		fonction: personnage.fonction ?? '',
		apparence: personnage.apparence ?? '',
		description_joueur: personnage.description_joueur ?? '',
	}
}

export interface UseEcritureIdentiteResult {
	brouillon: BrouillonPersonnage
	handleChangeChamp: (champ: ChampTexte, valeur: string) => void
	handleBlurChamp: (champ: ChampTexte, valeur: string) => void
	handleChangeCamp: (camp: CampPersonnage) => void
	handleChangePortee: (portee: Portee) => void
	handleChangeObjectif: (objectifId: string) => void
	/** Geste EXPLICITE (désaccord n° 2 du plan d'itération 3) qui sème les 8
	 *  clés à `CARACTERISTIQUE_MIN` en un seul commit — jamais un effet de bord
	 *  du premier Stepper touché. */
	handleReglerCaracteristiques: () => void
	handleChangeCaracteristique: (carac: Characteristic, valeur: number) => void
}

export function useEcritureIdentite(socle: SocleEcriture | null): UseEcritureIdentiteResult {
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonPersonnage>>({})

	if (socle === null) {
		return {
			brouillon: BROUILLON_PERSONNAGE_VIDE,
			handleChangeChamp: () => {},
			handleBlurChamp: () => {},
			handleChangeCamp: () => {},
			handleChangePortee: () => {},
			handleChangeObjectif: () => {},
			handleReglerCaracteristiques: () => {},
			handleChangeCaracteristique: () => {},
		}
	}

	const { dossierActuel, personnageAffiche, commit } = socle

	function handleChangeChamp(champ: ChampTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setBrouillons((prev) => {
			const actuel = prev[id]
			if (actuel !== undefined) return { ...prev, [id]: { ...actuel, [champ]: valeur } }
			const personnage = dossierActuel.monde.personnages.find((p) => p.id === id)
			if (personnage === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(personnage), [champ]: valeur } }
		})
	}

	function handleBlurChamp(champ: ChampTexte, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (valeur === '') {
					const sansChamp: Personnage = { ...p }
					delete sansChamp[champ]
					return sansChamp
				}
				return { ...p, [champ]: valeur }
			}),
			id,
		)
	}

	function handleChangeCamp(camp: CampPersonnage): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, camp } : p)),
			id,
		)
	}

	function handleChangePortee(portee: Portee): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, portee } : p)),
			id,
		)
	}

	function handleChangeObjectif(objectifId: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (objectifId === '') {
					const sansObjectif: Personnage = { ...p }
					delete sansObjectif.objectif_id
					return sansObjectif
				}
				return { ...p, objectif_id: objectifId }
			}),
			id,
		)
	}

	function handleReglerCaracteristiques(): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, stats: { ...STATS_INITIALES } } : p)),
			id,
		)
	}

	function handleChangeCaracteristique(carac: Characteristic, valeur: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map(
				(p): Personnage =>
					p.id !== id || p.stats === undefined ? p : { ...p, stats: { ...p.stats, [carac]: valeur } },
			),
			id,
		)
	}

	// Repli PAR CHAMP, jamais par objet (BUG-058 côté lecture).
	function brouillonActuel(personnage: Personnage): BrouillonPersonnage {
		const brouillon = brouillons[personnage.id]
		return {
			nom: brouillon?.nom ?? personnage.nom ?? '',
			fonction: brouillon?.fonction ?? personnage.fonction ?? '',
			apparence: brouillon?.apparence ?? personnage.apparence ?? '',
			description_joueur: brouillon?.description_joueur ?? personnage.description_joueur ?? '',
		}
	}

	return {
		brouillon: personnageAffiche === undefined ? BROUILLON_PERSONNAGE_VIDE : brouillonActuel(personnageAffiche),
		handleChangeChamp,
		handleBlurChamp,
		handleChangeCamp,
		handleChangePortee,
		handleChangeObjectif,
		handleReglerCaracteristiques,
		handleChangeCaracteristique,
	}
}
