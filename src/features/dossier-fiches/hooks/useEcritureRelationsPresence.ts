import { useState } from 'react'
import type { Personnage, Relation, Presence } from '../../../brain'
import type { SocleEcriture } from './useSocleEcriturePersonnages'

/**
 * LA FAMILLE « RELATIONS & PRÉSENCE » (§5 lot 2 du plan d'itération 5) — les
 * blocs 5 et 6 de l'accordéon. NEUF à cette itération.
 *
 * RELATIONS — `cible_id` ET `lien` sont TOUS DEUX requis DANS l'élément
 * (`CHAMPS_REQUIS`, lot 1) : commiter `{cible_id}` seul au geste d'ajout serait
 * REFUSÉ au SSOT (`lien` vide → `champ-requis-vide`). Le geste d'ajout crée
 * donc une ligne LOCALE (même patron que `plan_actions`/`contre_mesures`,
 * `estNouvelle`), `cible_id` déjà posé par le Select d'ajout, `intensite`
 * DÉJÀ à 0 (dans la plage, jamais un second geste — contrairement à `duree`
 * d'it4) : le premier commit réel n'arrive qu'au blur d'un `lien` non vide, et
 * embarque alors cible_id/intensite/secret déjà réglés dans le MÊME appel.
 * Pour une ligne DÉJÀ PERSISTÉE, `cible_id`/`intensite`/`secret` (widgets
 * fermés) committent IMMÉDIATEMENT — seul `lien` reste un brouillon-par-champ
 * commité au blur (guard identique à `action` : blanchir ne l'efface pas,
 * il est requis).
 *
 * PRÉSENCE — `lieu_id` SEUL est requis, `quand` est OPTIONNEL : le geste
 * d'ajout committe donc IMMÉDIATEMENT `{lieu_id}` (pas de ligne locale
 * possible, contrairement aux relations), et `quand` suit ensuite le patron
 * brouillon-par-champ déjà en place pour les proses de la feature (blur vide
 * ⇒ retire la clé, jamais ne refuse).
 */

export interface BrouillonRelation {
	cible_id: string
	lien: string
	intensite: number
	secret: boolean
}

export interface BrouillonPresence {
	lieu_id: string
	quand: string
}

function seedRelation(personnage: Personnage, index: number): BrouillonRelation {
	const relation = (personnage.relations ?? [])[index]
	return relation === undefined
		? { cible_id: '', lien: '', intensite: 0, secret: false }
		: {
				cible_id: relation.cible_id,
				lien: relation.lien,
				intensite: relation.intensite,
				secret: relation.secret ?? false,
			}
}

export interface UseEcritureRelationsPresenceResult {
	relations: BrouillonRelation[]
	presence: BrouillonPresence[]
	handleAjouterRelation: (cibleId: string) => void
	handleChangeCibleRelation: (index: number, cibleId: string) => void
	handleChangeLienRelation: (index: number, valeur: string) => void
	handleBlurLienRelation: (index: number, valeur: string) => void
	handleChangeIntensiteRelation: (index: number, valeur: number) => void
	handleChangeSecretRelation: (index: number, secret: boolean) => void
	handleRetirerRelation: (index: number) => void
	handleAjouterPresence: (lieuId: string) => void
	handleChangeLieuPresence: (index: number, lieuId: string) => void
	handleChangeQuandPresence: (index: number, valeur: string) => void
	handleBlurQuandPresence: (index: number, valeur: string) => void
	handleRetirerPresence: (index: number) => void
}

export function useEcritureRelationsPresence(socle: SocleEcriture | null): UseEcritureRelationsPresenceResult {
	const [relationsBrouillons, setRelationsBrouillons] = useState<Record<string, Record<number, BrouillonRelation>>>({})
	const [presenceBrouillons, setPresenceBrouillons] = useState<Record<string, Record<number, string>>>({})

	if (socle === null) {
		return {
			relations: [],
			presence: [],
			handleAjouterRelation: () => {},
			handleChangeCibleRelation: () => {},
			handleChangeLienRelation: () => {},
			handleBlurLienRelation: () => {},
			handleChangeIntensiteRelation: () => {},
			handleChangeSecretRelation: () => {},
			handleRetirerRelation: () => {},
			handleAjouterPresence: () => {},
			handleChangeLieuPresence: () => {},
			handleChangeQuandPresence: () => {},
			handleBlurQuandPresence: () => {},
			handleRetirerPresence: () => {},
		}
	}

	const { dossierActuel, personnageAffiche, commit } = socle

	// ── RELATIONS ─────────────────────────────────────────────────────────────

	function relationsAffichees(personnage: Personnage): BrouillonRelation[] {
		const drafts = relationsBrouillons[personnage.id] ?? {}
		const liste = personnage.relations ?? []
		const persistees = liste.map((relation, index): BrouillonRelation => {
			const brouillon = drafts[index]
			return {
				cible_id: relation.cible_id,
				lien: brouillon?.lien ?? relation.lien,
				intensite: relation.intensite,
				secret: relation.secret ?? false,
			}
		})
		const nouvelle = drafts[liste.length]
		return nouvelle === undefined ? persistees : [...persistees, nouvelle]
	}

	function effacerBrouillonRelation(id: string, index: number): void {
		setRelationsBrouillons((prev) => {
			const pourPersonnage = prev[id]
			if (pourPersonnage === undefined) return prev
			const suivant = { ...pourPersonnage }
			delete suivant[index]
			return { ...prev, [id]: suivant }
		})
	}

	/** Le geste d'ajout : choisir une cible dans le Select dédié pose une ligne
	 *  LOCALE, `cible_id` déjà réglé, `intensite` déjà à 0 — jamais un second
	 *  geste. Une sélection déjà en cours au même index n'est pas écrasée (même
	 *  garde que `handleAjouterEtape`). `cibleId === ''` (le placeholder d'action
	 *  du Select) n'ajoute rien. */
	function handleAjouterRelation(cibleId: string): void {
		if (personnageAffiche === undefined || cibleId === '') return
		const id = personnageAffiche.id
		const index = (personnageAffiche.relations ?? []).length
		setRelationsBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			if (pourPersonnage[index] !== undefined) return prev
			return {
				...prev,
				[id]: { ...pourPersonnage, [index]: { cible_id: cibleId, lien: '', intensite: 0, secret: false } },
			}
		})
	}

	function handleChangeCibleRelation(index: number, cibleId: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.relations ?? []
		if (index >= liste.length) {
			setRelationsBrouillons((prev) => {
				const pourPersonnage = prev[id] ?? {}
				const actuel = pourPersonnage[index] ?? seedRelation(personnageAffiche, index)
				return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, cible_id: cibleId } } }
			})
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id
					? { ...p, relations: (p.relations ?? []).map((r, i) => (i === index ? { ...r, cible_id: cibleId } : r)) }
					: p,
			),
			id,
		)
	}

	function handleChangeLienRelation(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setRelationsBrouillons((prev) => {
			const pourPersonnage = prev[id] ?? {}
			const actuel = pourPersonnage[index] ?? seedRelation(personnageAffiche, index)
			return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, lien: valeur } } }
		})
	}

	/** `lien` vide n'entre jamais au document — ni pour une relation encore
	 *  locale (elle reste un brouillon tant que le lien n'est pas écrit, MAIS
	 *  porte déjà `cible_id`/`intensite`/`secret`) ni pour une relation déjà
	 *  persistée (blanchir le lien ne l'efface pas, il est requis). */
	function handleBlurLienRelation(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.relations ?? []
		const pourPersonnage = relationsBrouillons[id] ?? {}
		const actuel = pourPersonnage[index] ?? seedRelation(personnageAffiche, index)
		const fusion = { ...actuel, lien: valeur }
		const estNouvelle = index >= liste.length

		if (estNouvelle) {
			if (fusion.lien.trim() === '') return
			const nouvelle: Relation = { cible_id: fusion.cible_id, lien: fusion.lien, intensite: fusion.intensite }
			if (fusion.secret) nouvelle.secret = true
			commit(
				dossierActuel.monde.personnages.map((p) =>
					p.id === id ? { ...p, relations: [...(p.relations ?? []), nouvelle] } : p,
				),
				id,
			)
			effacerBrouillonRelation(id, index)
			return
		}

		if (fusion.lien.trim() === '') return
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return { ...p, relations: (p.relations ?? []).map((r, i) => (i === index ? { ...r, lien: fusion.lien } : r)) }
			}),
			id,
		)
	}

	/** `intensite` est un widget FERMÉ (`Stepper`, toujours borné) : sur une
	 *  relation déjà persistée, il committe immédiatement. Sur une relation
	 *  encore locale, la valeur reste dans le brouillon jusqu'au blur du `lien`. */
	function handleChangeIntensiteRelation(index: number, valeur: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.relations ?? []
		if (index >= liste.length) {
			setRelationsBrouillons((prev) => {
				const pourPersonnage = prev[id] ?? {}
				const actuel = pourPersonnage[index] ?? seedRelation(personnageAffiche, index)
				return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, intensite: valeur } } }
			})
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id
					? { ...p, relations: (p.relations ?? []).map((r, i) => (i === index ? { ...r, intensite: valeur } : r)) }
					: p,
			),
			id,
		)
	}

	/** `secret` est un booléen optionnel : `false` retire la clé plutôt que de
	 *  l'écrire (« un champ absent se traite comme `false` », JSDoc de
	 *  `Relation.secret`). */
	function handleChangeSecretRelation(index: number, secret: boolean): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.relations ?? []
		if (index >= liste.length) {
			setRelationsBrouillons((prev) => {
				const pourPersonnage = prev[id] ?? {}
				const actuel = pourPersonnage[index] ?? seedRelation(personnageAffiche, index)
				return { ...prev, [id]: { ...pourPersonnage, [index]: { ...actuel, secret } } }
			})
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return {
					...p,
					relations: (p.relations ?? []).map((r, i): Relation => {
						if (i !== index) return r
						if (!secret) {
							const sansSecret: Relation = { ...r }
							delete sansSecret.secret
							return sansSecret
						}
						return { ...r, secret: true }
					}),
				}
			}),
			id,
		)
	}

	function handleRetirerRelation(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		const liste = personnageAffiche.relations ?? []
		if (index >= liste.length) {
			effacerBrouillonRelation(id, index)
			return
		}
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, relations: (p.relations ?? []).filter((_, i) => i !== index) } : p,
			),
			id,
		)
		setRelationsBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	// ── PRÉSENCE ──────────────────────────────────────────────────────────────

	function presenceAffichees(personnage: Personnage): BrouillonPresence[] {
		const drafts = presenceBrouillons[personnage.id] ?? {}
		return (personnage.presence ?? []).map((p, index) => ({
			lieu_id: p.lieu_id,
			quand: drafts[index] ?? p.quand ?? '',
		}))
	}

	/** `lieu_id` SEUL suffit à une présence valide (`quand` optionnel) : le geste
	 *  d'ajout committe donc directement, aucune ligne locale n'est nécessaire.
	 *  `lieuId === ''` (le placeholder d'action du Select) n'ajoute rien. */
	function handleAjouterPresence(lieuId: string): void {
		if (personnageAffiche === undefined || lieuId === '') return
		const id = personnageAffiche.id
		const nouvelle: Presence = { lieu_id: lieuId }
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, presence: [...(p.presence ?? []), nouvelle] } : p,
			),
			id,
		)
	}

	function handleChangeLieuPresence(index: number, lieuId: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id
					? { ...p, presence: (p.presence ?? []).map((pr, i) => (i === index ? { ...pr, lieu_id: lieuId } : pr)) }
					: p,
			),
			id,
		)
	}

	function handleChangeQuandPresence(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setPresenceBrouillons((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [index]: valeur } }))
	}

	/** `quand` optionnel : blur vide retire la clé (précédent `but.echeance`),
	 *  jamais un refus au SSOT. */
	function handleBlurQuandPresence(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return {
					...p,
					presence: (p.presence ?? []).map((pr, i): Presence => {
						if (i !== index) return pr
						if (valeur === '') return { lieu_id: pr.lieu_id }
						return { ...pr, quand: valeur }
					}),
				}
			}),
			id,
		)
	}

	function handleRetirerPresence(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, presence: (p.presence ?? []).filter((_, i) => i !== index) } : p,
			),
			id,
		)
		setPresenceBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	return {
		relations: personnageAffiche === undefined ? [] : relationsAffichees(personnageAffiche),
		presence: personnageAffiche === undefined ? [] : presenceAffichees(personnageAffiche),
		handleAjouterRelation,
		handleChangeCibleRelation,
		handleChangeLienRelation,
		handleBlurLienRelation,
		handleChangeIntensiteRelation,
		handleChangeSecretRelation,
		handleRetirerRelation,
		handleAjouterPresence,
		handleChangeLieuPresence,
		handleChangeQuandPresence,
		handleBlurQuandPresence,
		handleRetirerPresence,
	}
}
