import { useSocleEcriturePersonnages } from './useSocleEcriturePersonnages'
import { useEcritureIdentite } from './useEcritureIdentite'
import { useEcriturePlan } from './useEcriturePlan'
import { useEcritureRelationsPresence } from './useEcritureRelationsPresence'
import type { Dossier, Personnage, CampPersonnage, Portee, Characteristic, DossierIssue } from '../../../brain'
import type { RefusAffiche } from './useSocleEcriturePersonnages'
import type { BrouillonPersonnage, ChampTexte } from './useEcritureIdentite'
import type {
	BrouillonBut,
	ChampBut,
	BrouillonEtape,
	ChampEtapeTexte,
	BrouillonContreMesure,
	ChampContreMesureTexte,
} from './useEcriturePlan'
import type { BrouillonRelation, BrouillonPresence } from './useEcritureRelationsPresence'

/**
 * La couche d'écriture du panneau Personnages — devenue un ASSEMBLEUR (§5 lot 2
 * du plan d'itération 5, désaccord n° 1) : elle compose les quatre sous-hooks
 * de sous-domaine (socle, identité, plan, relations & présence) et rend
 * EXACTEMENT la même forme qu'avant leur scission, augmentée seulement des
 * champs additifs de cette itération. `PanneauPersonnages.tsx` n'y lit plus
 * qu'un objet plat de données déjà résolues et de handlers déjà curriés sur le
 * personnage AFFICHÉ — il reste seul propriétaire du RENDU (liste + fiche).
 */
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
	relations: BrouillonRelation[]
	presence: BrouillonPresence[]
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

export function useEcriturePersonnages(dossierId: string): UseEcriturePersonnagesResult {
	const socle = useSocleEcriturePersonnages(dossierId)
	const identite = useEcritureIdentite(socle.socle)
	const plan = useEcriturePlan(socle.socle)
	const relationsPresence = useEcritureRelationsPresence(socle.socle)

	return {
		dossier: socle.dossier,
		personnageAffiche: socle.personnageAffiche,
		selection: socle.selection,
		setSelection: socle.setSelection,
		refusAffiche: socle.refusAffiche,
		avertissementsD1Affiche: socle.avertissementsD1Affiche,
		handleAjouter: socle.handleAjouter,
		...identite,
		...plan,
		...relationsPresence,
	}
}
