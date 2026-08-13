import { useMemo, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	validateDossier,
	frapperIdentifiant,
	PORTEE_INITIALE,
	STATS_INITIALES,
	type Dossier,
	type Personnage,
	type PlanAction,
	type But,
	type ContreMesure,
	type CampPersonnage,
	type Portee,
	type Characteristic,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'

/**
 * La couche d'écriture du panneau Personnages — extraite de `PanneauPersonnages.tsx`
 * (dette KR-112 datée par it3, désaccord n° 17 du plan d'itération 4) : sélection,
 * les cinq familles de brouillons (identité, but, étapes de plan, contre-mesures),
 * `RefusEnCours` et ses DEUX indexations KR-197 (affichage/invalidation), et
 * `resout: false` sur le chemin de création. Un seul appelant réel
 * (`PanneauPersonnages.tsx`) — extraction motivée par la taille, pas par la
 * réutilisation.
 */

export interface BrouillonPersonnage {
	nom: string
	fonction: string
	apparence: string
	description_joueur: string
}
export type ChampTexte = keyof BrouillonPersonnage

export interface BrouillonBut {
	libelle: string
	pourquoi: string
	echeance: string
}
export type ChampBut = keyof BrouillonBut

/** `duree` n'est JAMAIS un brouillon pour une étape déjà persistée (le `Stepper`
 *  committe immédiatement, même régime que les caractéristiques) — il ne sert
 *  qu'à porter la valeur d'une étape encore locale, pas encore ajoutée. */
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

export interface RefusAffiche {
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

interface RefusEnCours {
	personnageId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const BROUILLON_PERSONNAGE_VIDE: BrouillonPersonnage = { nom: '', fonction: '', apparence: '', description_joueur: '' }
const BROUILLON_BUT_VIDE: BrouillonBut = { libelle: '', pourquoi: '', echeance: '' }
const BROUILLON_ETAPE_VIDE: BrouillonEtape = { action: '', declencheur_texte: '', si_bloque: '', duree: undefined }
const BROUILLON_CONTRE_MESURE_VIDE: BrouillonContreMesure = { action: '', declencheur_texte: '' }

function brouillonDe(personnage: Personnage): BrouillonPersonnage {
	return {
		nom: personnage.nom ?? '',
		fonction: personnage.fonction ?? '',
		apparence: personnage.apparence ?? '',
		description_joueur: personnage.description_joueur ?? '',
	}
}

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

export interface UseEcriturePersonnagesResult {
	dossier: Dossier | null
	personnageAffiche: Personnage | undefined
	selection: string | null
	setSelection: (id: string) => void
	refusAffiche: RefusAffiche | null
	avertissementsD1Affiche: DossierIssue[]
	brouillon: BrouillonPersonnage
	butBrouillon: BrouillonBut
	etapes: BrouillonEtape[]
	contreMesures: BrouillonContreMesure[]
	handleAjouter: () => void
	handleChangeChamp: (champ: ChampTexte, valeur: string) => void
	handleBlurChamp: (champ: ChampTexte, valeur: string) => void
	handleChangeCamp: (camp: CampPersonnage) => void
	handleChangePortee: (portee: Portee) => void
	handleChangeObjectif: (objectifId: string) => void
	handleReglerCaracteristiques: () => void
	handleChangeCaracteristique: (carac: Characteristic, valeur: number) => void
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

/**
 * La couche d'écriture du panneau Personnages, complète. `PanneauPersonnages.tsx`
 * n'y lit plus que des données déjà résolues et des handlers déjà curriés sur le
 * personnage AFFICHÉ — il reste seul propriétaire du RENDU (liste + fiche).
 */
export function useEcriturePersonnages(dossierId: string): UseEcriturePersonnagesResult {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonPersonnage>>(() =>
		dossier === null ? {} : Object.fromEntries(dossier.monde.personnages.map((p) => [p.id, brouillonDe(p)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [butBrouillons, setButBrouillons] = useState<Record<string, BrouillonBut>>({})
	const [etapesBrouillons, setEtapesBrouillons] = useState<Record<string, Record<number, BrouillonEtape>>>({})
	const [contreMesuresBrouillons, setContreMesuresBrouillons] = useState<
		Record<string, Record<number, BrouillonContreMesure>>
	>({})

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

	if (dossier === null) {
		return {
			dossier: null,
			personnageAffiche: undefined,
			selection,
			setSelection,
			refusAffiche: null,
			avertissementsD1Affiche: [],
			brouillon: BROUILLON_PERSONNAGE_VIDE,
			butBrouillon: BROUILLON_BUT_VIDE,
			etapes: [],
			contreMesures: [],
			handleAjouter: () => {},
			handleChangeChamp: () => {},
			handleBlurChamp: () => {},
			handleChangeCamp: () => {},
			handleChangePortee: () => {},
			handleChangeObjectif: () => {},
			handleReglerCaracteristiques: () => {},
			handleChangeCaracteristique: () => {},
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

	const dossierActuel: Dossier = dossier

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
		const id = frapperIdentifiant('pnj')
		const nouveau: Personnage = { id, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }
		const resultat = commit([...dossierActuel.monde.personnages, nouveau], personnageAffiche?.id ?? id, {
			resout: false,
		})
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
	}

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

	function handleChangeBut(champ: ChampBut, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setButBrouillons((prev) => {
			const actuel = prev[id] ?? butBrouillonDe(personnageAffiche)
			return { ...prev, [id]: { ...actuel, [champ]: valeur } }
		})
	}

	/** `but.libelle` vide n'entre jamais au document (requis dans son bloc, même
	 *  motif que `stats`) : le blur ne committe QUE si `libelle` (fusionné avec
	 *  ce qui vient d'être tapé) est non vide. */
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
	 *  tant que le premier brouillon n'est pas commité — sans garde, il écraserait
	 *  silencieusement ce que l'auteur venait de taper. */
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

	/** `action` vide n'entre jamais au document — ni pour une étape encore locale
	 *  (elle reste un brouillon tant que l'intention n'est pas écrite) ni pour une
	 *  étape déjà persistée (blanchir l'intention ne l'efface pas, elle est requise). */
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

	/** Étape déjà persistée : le `Stepper` committe immédiatement (même régime que
	 *  les caractéristiques). Étape encore locale : la valeur reste dans le
	 *  brouillon, écrite au document seulement au premier blur non vide de
	 *  l'intention (`handleBlurEtape`). */
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
		// Les indices se décalent après un retrait : purge tous les brouillons
		// en cours pour ce personnage plutôt que de les laisser pointer sur la
		// mauvaise étape.
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

	/** Même garde que `handleAjouterEtape` : un second clic ne doit pas écraser
	 *  le brouillon déjà en cours au même index. */
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

	// Le refus ne se rend QUE sous la fiche du personnage qui l'a produit
	// (KR-197, affichage).
	const refusAffiche: RefusAffiche | null =
		personnageAffiche !== undefined && refus !== null && refus.personnageId === personnageAffiche.id
			? { statut: refus.statut, issues: refus.issues }
			: null

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

	function butBrouillonActuel(personnage: Personnage): BrouillonBut {
		const brouillon = butBrouillons[personnage.id]
		return {
			libelle: brouillon?.libelle ?? personnage.but?.libelle ?? '',
			pourquoi: brouillon?.pourquoi ?? personnage.but?.pourquoi ?? '',
			echeance: brouillon?.echeance ?? personnage.but?.echeance ?? '',
		}
	}

	return {
		dossier,
		personnageAffiche,
		selection,
		setSelection,
		refusAffiche,
		avertissementsD1Affiche,
		brouillon: personnageAffiche === undefined ? BROUILLON_PERSONNAGE_VIDE : brouillonActuel(personnageAffiche),
		butBrouillon: personnageAffiche === undefined ? BROUILLON_BUT_VIDE : butBrouillonActuel(personnageAffiche),
		etapes: personnageAffiche === undefined ? [] : etapesAffichees(personnageAffiche),
		contreMesures: personnageAffiche === undefined ? [] : contreMesuresAffichees(personnageAffiche),
		handleAjouter,
		handleChangeChamp,
		handleBlurChamp,
		handleChangeCamp,
		handleChangePortee,
		handleChangeObjectif,
		handleReglerCaracteristiques,
		handleChangeCaracteristique,
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
