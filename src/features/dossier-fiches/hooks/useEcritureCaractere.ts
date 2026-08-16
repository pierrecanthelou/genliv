import { useState } from 'react'
import { CURSEURS_INITIAUX, type Personnage, type Caractere, type CurseurId } from '../../../brain'
import type { SocleEcriture } from './useSocleEcriturePersonnages'

/**
 * LA FAMILLE « CARACTÈRE EXPLOITABLE » (it8, dernière famille de la feature) —
 * curseurs/parler/jamais/cede_si, le bloc 8 (et dernier) de l'accordéon. Même
 * motif que les sous-hooks précédents, sur TROIS idiomes déjà en place :
 *  · `curseurs` — geste explicite qui sème les six clés en un commit
 *    (`handleReglerCurseurs`, précédent `handleReglerCaracteristiques`) puis
 *    écriture IMMÉDIATE par curseur (précédent `handleChangeCaracteristique`) ;
 *  · `parler` — brouillon-jusqu'au-blur par INDEX, comme les étapes de plan
 *    d'actions, mais des CHAÎNES et non des objets (pas de champ voisin à fusionner) ;
 *  · `jamais`/`cede_si` — brouillon PAR CHAMP (repli BUG-058), comme les trois
 *    proses d'identité.
 */

export interface BrouillonCaractere {
	jamais: string
	cede_si: string
}

const BROUILLON_CARACTERE_VIDE: BrouillonCaractere = { jamais: '', cede_si: '' }

function brouillonCaractereDe(personnage: Personnage): BrouillonCaractere {
	return {
		jamais: personnage.caractere?.jamais ?? '',
		cede_si: personnage.caractere?.cede_si ?? '',
	}
}

export interface UseEcritureCaractereResult {
	caractere: BrouillonCaractere
	parler: string[]
	/** Geste EXPLICITE qui sème les SIX clés à `CURSEURS_INITIAUX` en un commit —
	 *  n'écrit QUE `curseurs`, jamais `parler`/`jamais`/`cede_si`. */
	handleReglerCurseurs: () => void
	handleChangeCurseur: (curseur: CurseurId, valeur: number) => void
	handleAjouterReplique: () => void
	handleChangeReplique: (index: number, valeur: string) => void
	handleBlurReplique: (index: number, valeur: string) => void
	handleRetirerReplique: (index: number) => void
	handleChangeJamais: (valeur: string) => void
	handleBlurJamais: (valeur: string) => void
	handleChangeCedeSi: (valeur: string) => void
	handleBlurCedeSi: (valeur: string) => void
}

export function useEcritureCaractere(socle: SocleEcriture | null): UseEcritureCaractereResult {
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonCaractere>>({})
	const [repliquesBrouillons, setRepliquesBrouillons] = useState<Record<string, Record<number, string>>>({})

	if (socle === null) {
		return {
			caractere: BROUILLON_CARACTERE_VIDE,
			parler: [],
			handleReglerCurseurs: () => {},
			handleChangeCurseur: () => {},
			handleAjouterReplique: () => {},
			handleChangeReplique: () => {},
			handleBlurReplique: () => {},
			handleRetirerReplique: () => {},
			handleChangeJamais: () => {},
			handleBlurJamais: () => {},
			handleChangeCedeSi: () => {},
			handleBlurCedeSi: () => {},
		}
	}

	const { dossierActuel, personnageAffiche, commit } = socle

	function handleReglerCurseurs(): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map(
				(p): Personnage =>
					p.id === id ? { ...p, caractere: { ...p.caractere, curseurs: { ...CURSEURS_INITIAUX } } } : p,
			),
			id,
		)
	}

	function handleChangeCurseur(curseur: CurseurId, valeur: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id || p.caractere?.curseurs === undefined) return p
				return { ...p, caractere: { ...p.caractere, curseurs: { ...p.caractere.curseurs, [curseur]: valeur } } }
			}),
			id,
		)
	}

	function repliquesAffichees(personnage: Personnage): string[] {
		const drafts = repliquesBrouillons[personnage.id] ?? {}
		const liste = personnage.caractere?.parler ?? []
		const persistees = liste.map((replique, index) => drafts[index] ?? replique)
		const nouvelle = drafts[liste.length]
		return nouvelle === undefined ? persistees : [...persistees, nouvelle]
	}

	function effacerBrouillonReplique(id: string, index: number): void {
		setRepliquesBrouillons((prev) => {
			const pourPersonnage = prev[id]
			if (pourPersonnage === undefined) return prev
			const suivant = { ...pourPersonnage }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Même garde que `handleAjouterEtape` (it4) : un second clic n'écrase pas un
	 *  brouillon déjà en cours au même index. */
	function handleAjouterReplique(): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const index = (personnageAffiche.caractere?.parler ?? []).length
		setRepliquesBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			if (pourPersonnage[index] !== undefined) return prev
			return { ...prev, [id]: { ...pourPersonnage, [index]: '' } }
		})
	}

	function handleChangeReplique(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setRepliquesBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			return { ...prev, [id]: { ...pourPersonnage, [index]: valeur } }
		})
	}

	/** `PARLER_REPLIQUES` est une borne d'INTERFACE (`curseurs.ts`) : ce hook ne la
	 *  lit ni ne la fait respecter — `BlocCaractere` retire l'affordance d'ajout au
	 *  plafond, ce hook reste appelable au-delà sans jamais l'être en pratique.
	 *  Une réplique vide — nouvelle ou déjà persistée — n'entre jamais au document
	 *  (même doctrine que `plan_actions[].action`, it4) : blanchir une réplique
	 *  existante laisse le document inchangé plutôt que d'y écrire une chaîne vide. */
	function handleBlurReplique(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		if (valeur.trim() === '') return
		const id = personnageAffiche.id
		const liste = personnageAffiche.caractere?.parler ?? []
		const estNouvelle = index >= liste.length

		if (estNouvelle) {
			commit(
				dossierActuel.monde.personnages.map(
					(p): Personnage =>
						p.id === id ? { ...p, caractere: { ...p.caractere, parler: [...(p.caractere?.parler ?? []), valeur] } } : p,
				),
				id,
			)
			effacerBrouillonReplique(id, index)
			return
		}

		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				const parlerActuel = p.caractere?.parler ?? []
				return { ...p, caractere: { ...p.caractere, parler: parlerActuel.map((r, i) => (i === index ? valeur : r)) } }
			}),
			id,
		)
	}

	function handleRetirerReplique(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.caractere?.parler ?? []
		if (index >= liste.length) {
			effacerBrouillonReplique(id, index)
			return
		}
		commit(
			dossierActuel.monde.personnages.map(
				(p): Personnage =>
					p.id === id ? { ...p, caractere: { ...p.caractere, parler: liste.filter((_, i) => i !== index) } } : p,
			),
			id,
		)
		// Les indices se decalent apres un retrait : purge tous les brouillons en cours.
		setRepliquesBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	function handleChangeJamais(valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setBrouillons((prev) => {
			const actuel = prev[id]
			if (actuel !== undefined) return { ...prev, [id]: { ...actuel, jamais: valeur } }
			const personnage = dossierActuel.monde.personnages.find((p) => p.id === id)
			if (personnage === undefined) return prev
			return { ...prev, [id]: { ...brouillonCaractereDe(personnage), jamais: valeur } }
		})
	}

	function handleBlurJamais(valeur: string): void {
		if (personnageAffiche === undefined) return
		// Un blur à vide sur un champ déjà absent (simple passage de tabulation,
		// jamais rien saisi) ne doit RIEN COMMITTER — `commit()` appelle
		// `dossiers.update()` sans condition, donc le no-op doit s'arrêter ICI,
		// avant l'appel, pas dans le corps du `map` : un `caractere: {}` y
		// remplacerait un bloc ABSENT par un bloc VIDE (« absent ≠ vide »), et un
		// commit vide émettrait quand même `dossier:updated` pour rien.
		if (valeur === '' && personnageAffiche.caractere?.jamais === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (valeur === '') {
					const sansJamais: Caractere = { ...p.caractere }
					delete sansJamais.jamais
					if (Object.keys(sansJamais).length === 0) {
						const suivant: Personnage = { ...p }
						delete suivant.caractere
						return suivant
					}
					return { ...p, caractere: sansJamais }
				}
				return { ...p, caractere: { ...p.caractere, jamais: valeur } }
			}),
			id,
		)
	}

	function handleChangeCedeSi(valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setBrouillons((prev) => {
			const actuel = prev[id]
			if (actuel !== undefined) return { ...prev, [id]: { ...actuel, cede_si: valeur } }
			const personnage = dossierActuel.monde.personnages.find((p) => p.id === id)
			if (personnage === undefined) return prev
			return { ...prev, [id]: { ...brouillonCaractereDe(personnage), cede_si: valeur } }
		})
	}

	function handleBlurCedeSi(valeur: string): void {
		if (personnageAffiche === undefined) return
		// Même garde que `handleBlurJamais`, avant l'appel à `commit()` (voir son
		// commentaire) : un no-op ne doit produire ni écriture ni `dossier:updated`.
		if (valeur === '' && personnageAffiche.caractere?.cede_si === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (valeur === '') {
					const sansCedeSi: Caractere = { ...p.caractere }
					delete sansCedeSi.cede_si
					if (Object.keys(sansCedeSi).length === 0) {
						const suivant: Personnage = { ...p }
						delete suivant.caractere
						return suivant
					}
					return { ...p, caractere: sansCedeSi }
				}
				return { ...p, caractere: { ...p.caractere, cede_si: valeur } }
			}),
			id,
		)
	}

	// Repli PAR CHAMP, jamais par objet (BUG-058).
	function brouillonActuel(personnage: Personnage): BrouillonCaractere {
		const brouillon = brouillons[personnage.id]
		return {
			jamais: brouillon?.jamais ?? personnage.caractere?.jamais ?? '',
			cede_si: brouillon?.cede_si ?? personnage.caractere?.cede_si ?? '',
		}
	}

	return {
		caractere: personnageAffiche === undefined ? BROUILLON_CARACTERE_VIDE : brouillonActuel(personnageAffiche),
		parler: personnageAffiche === undefined ? [] : repliquesAffichees(personnageAffiche),
		handleReglerCurseurs,
		handleChangeCurseur,
		handleAjouterReplique,
		handleChangeReplique,
		handleBlurReplique,
		handleRetirerReplique,
		handleChangeJamais,
		handleBlurJamais,
		handleChangeCedeSi,
		handleBlurCedeSi,
	}
}
