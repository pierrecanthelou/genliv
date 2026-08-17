import { useState } from 'react'
import { frapperIdentifiant, type Fin, type EcritureDossier } from '../../../brain'
import type { BrouillonFin, ChampFinTexte } from '../components/FicheFin'

/**
 * Symétrique de `useEcritureJalons.ts` (même extraction KR-112, §5 lot 2 du
 * plan d'itération 2) : un SEUL champ requis (`condition_texte`) arme le
 * commit différé, `texte` (la prose émise au joueur) n'est jamais gatant.
 */
export interface SocleFins {
	fins: Fin[]
	commit: (finsSuivantes: Fin[], finId: string, opts?: { resout: boolean }) => EcritureDossier
}

const BROUILLON_FIN_VIDE: BrouillonFin = { nom: '', condition_texte: '', texte: '' }

function brouillonFinDe(fin: Fin): BrouillonFin {
	return { nom: fin.nom ?? '', condition_texte: fin.condition_texte, texte: fin.texte ?? '' }
}

export interface UseEcritureFinsResult {
	brouillons: Record<string, BrouillonFin>
	/** L'identifiant de la fin EN COURS D'AJOUT, hors `charpente.fins` tant que
	 *  `condition_texte` reste vide (KR-214). `null` : aucun ajout en cours. */
	ajoutId: string | null
	brouillonPour: (id: string) => BrouillonFin
	handleAjouter: (onCree: (id: string) => void) => void
	abandonnerAjout: () => void
	handleChangeChamp: (id: string, champ: ChampFinTexte, valeur: string) => void
	/** Garde d'ajout DANS LE BLUR : `condition_texte` SEUL arme le commit
	 *  différé — `texte` n'entre jamais dans la garde. */
	handleBlurChamp: (id: string, champ: ChampFinTexte, valeur: string) => void
	/** Permute deux fins ADJACENTES par IDENTIFIANT, jamais par position. */
	deplacer: (id: string, sens: -1 | 1) => void
}

export function useEcritureFins(socle: SocleFins | null): UseEcritureFinsResult {
	const fins = socle?.fins ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonFin>>(() =>
		Object.fromEntries(fins.map((fin) => [fin.id, brouillonFinDe(fin)])),
	)
	const [ajoutId, setAjoutId] = useState<string | null>(null)

	function brouillonPour(id: string): BrouillonFin {
		if (brouillons[id] !== undefined) return brouillons[id]
		const fin = fins.find((f) => f.id === id)
		return fin !== undefined ? brouillonFinDe(fin) : { ...BROUILLON_FIN_VIDE }
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
		const id = frapperIdentifiant('fin')
		setBrouillons((prev) => ({ ...prev, [id]: { ...BROUILLON_FIN_VIDE } }))
		setAjoutId(id)
		onCree(id)
	}

	function handleChangeChamp(id: string, champ: ChampFinTexte, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const fin = fins.find((f) => f.id === id)
			if (fin === undefined) return prev
			return { ...prev, [id]: { ...brouillonFinDe(fin), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: ChampFinTexte, valeur: string): void {
		if (socle === null) return
		if (id === ajoutId) {
			const fusion = { ...(brouillons[id] ?? BROUILLON_FIN_VIDE), [champ]: valeur }
			if (fusion.condition_texte.trim() === '') return
			const nouveau: Fin = { id, condition_texte: fusion.condition_texte }
			if (fusion.nom.trim() !== '') nouveau.nom = fusion.nom
			if (fusion.texte.trim() !== '') nouveau.texte = fusion.texte
			const resultat = socle.commit([...fins, nouveau], id, { resout: false })
			if (resultat.statut === 'ecrit') setAjoutId(null)
			return
		}
		socle.commit(
			fins.map((fin) => (fin.id === id ? { ...fin, [champ]: valeur } : fin)),
			id,
		)
	}

	function deplacer(id: string, sens: -1 | 1): void {
		if (socle === null) return
		const index = fins.findIndex((fin) => fin.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= fins.length) return
		const permutes = [...fins]
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
