import { useState } from 'react'
import { frapperIdentifiant, type Jalon, type EcritureDossier } from '../../../brain'
import type { BrouillonJalon, ChampJalonTexte } from '../components/FicheJalon'

/**
 * EXTRACTION KR-112 (§5 lot 2 du plan d'itération 2) : `PanneauJalonsFins.tsx`
 * franchissait 400 lignes une fois les DEUX collections câblées. `commit` et
 * `refus` restent au panneau (précédent `useSocleEcriturePersonnages.ts`,
 * `dossier-fiches`) — un SEUL bandeau de refus pour les deux collections,
 * indexé par `{espace, id}` — ce hook ne connaît QUE l'écriture propre aux
 * jalons : brouillons, ajout différé (KR-214), réordonnancement.
 */
export interface SocleJalons {
	jalons: Jalon[]
	commit: (jalonsSuivants: Jalon[], jalonId: string, opts?: { resout: boolean }) => EcritureDossier
}

const BROUILLON_JALON_VIDE: BrouillonJalon = { nom: '', declencheur_texte: '', enonce_texte: '' }

function brouillonJalonDe(jalon: Jalon): BrouillonJalon {
	return { nom: jalon.nom ?? '', declencheur_texte: jalon.declencheur_texte, enonce_texte: jalon.enonce_texte }
}

export interface UseEcritureJalonsResult {
	brouillons: Record<string, BrouillonJalon>
	/** L'identifiant du jalon EN COURS D'AJOUT, hors `charpente.jalons` tant que
	 *  ses deux champs requis ne sont pas non vides (KR-214). `null` : aucun
	 *  ajout en cours. */
	ajoutId: string | null
	brouillonPour: (id: string) => BrouillonJalon
	/** Un second appel pendant un ajout en cours ne l'écrase pas (piège 1, §5
	 *  du plan). `onCree` reçoit le nouvel id — le panneau y pose la sélection
	 *  et l'intention de focus, qu'il est seul à connaître. */
	handleAjouter: (onCree: (id: string) => void) => void
	/** Abandon SILENCIEUX du brouillon d'ajout en cours — rien n'a jamais été
	 *  écrit, donc rien à confirmer (hors « actions dangereuses »). */
	abandonnerAjout: () => void
	handleChangeChamp: (id: string, champ: ChampJalonTexte, valeur: string) => void
	/**
	 * Garde d'ajout DANS LE BLUR, en amont de tout `commit()` (piège 1) :
	 * `declencheur_texte` ET `enonce_texte` doivent être non vides pour committer
	 * le brouillon différé. Avant ce point, aucune écriture, aucun refus.
	 */
	handleBlurChamp: (id: string, champ: ChampJalonTexte, valeur: string) => void
	/** Permute deux jalons ADJACENTS par IDENTIFIANT, jamais par position. */
	deplacer: (id: string, sens: -1 | 1) => void
}

export function useEcritureJalons(socle: SocleJalons | null): UseEcritureJalonsResult {
	const jalons = socle?.jalons ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonJalon>>(() =>
		Object.fromEntries(jalons.map((jalon) => [jalon.id, brouillonJalonDe(jalon)])),
	)
	const [ajoutId, setAjoutId] = useState<string | null>(null)

	function brouillonPour(id: string): BrouillonJalon {
		if (brouillons[id] !== undefined) return brouillons[id]
		const jalon = jalons.find((j) => j.id === id)
		return jalon !== undefined ? brouillonJalonDe(jalon) : { ...BROUILLON_JALON_VIDE }
	}

	function abandonnerAjout(): void {
		if (ajoutId === null) return
		const id = ajoutId
		setAjoutId(null)
		setBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	function handleAjouter(onCree: (id: string) => void): void {
		if (ajoutId !== null) return
		const id = frapperIdentifiant('jalon')
		setBrouillons((prev) => ({ ...prev, [id]: { ...BROUILLON_JALON_VIDE } }))
		setAjoutId(id)
		onCree(id)
	}

	function handleChangeChamp(id: string, champ: ChampJalonTexte, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const jalon = jalons.find((j) => j.id === id)
			if (jalon === undefined) return prev
			return { ...prev, [id]: { ...brouillonJalonDe(jalon), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: ChampJalonTexte, valeur: string): void {
		if (socle === null) return
		if (id === ajoutId) {
			const fusion = { ...(brouillons[id] ?? BROUILLON_JALON_VIDE), [champ]: valeur }
			if (fusion.declencheur_texte.trim() === '' || fusion.enonce_texte.trim() === '') return
			const nouveau: Jalon = {
				id,
				declencheur_texte: fusion.declencheur_texte,
				enonce_texte: fusion.enonce_texte,
				effet: [],
			}
			if (fusion.nom.trim() !== '') nouveau.nom = fusion.nom
			const resultat = socle.commit([...jalons, nouveau], id, { resout: false })
			if (resultat.statut === 'ecrit') setAjoutId(null)
			return
		}
		socle.commit(
			jalons.map((jalon) => (jalon.id === id ? { ...jalon, [champ]: valeur } : jalon)),
			id,
		)
	}

	function deplacer(id: string, sens: -1 | 1): void {
		if (socle === null) return
		const index = jalons.findIndex((jalon) => jalon.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= jalons.length) return
		const permutes = [...jalons]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		socle.commit(permutes, id)
	}

	return {
		brouillons,
		ajoutId,
		brouillonPour,
		handleAjouter,
		abandonnerAjout,
		handleChangeChamp,
		handleBlurChamp,
		deplacer,
	}
}
