import { useSocleEcriturePersonnages } from './useSocleEcriturePersonnages'
import { useEcritureIdentite } from './useEcritureIdentite'
import { useEcriturePlan } from './useEcriturePlan'
import { useEcritureRelationsPresence } from './useEcritureRelationsPresence'
import { useEcritureSavoirs } from './useEcritureSavoirs'
import type {
	Dossier,
	Personnage,
	CampPersonnage,
	Portee,
	Certitude,
	Characteristic,
	ChallengeTier,
	DossierIssue,
} from '../../../brain'
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
import type { BrouillonSavoir } from './useEcritureSavoirs'

/**
 * La couche d'écriture du panneau Personnages — devenue un ASSEMBLEUR (§5 lot 2
 * du plan d'itération 5, désaccord n° 1) : elle compose les cinq sous-hooks
 * de sous-domaine (socle, identité, plan, relations & présence, savoirs) et rend
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
	avertissementsAffiches: DossierIssue[]
	brouillon: BrouillonPersonnage
	butBrouillon: BrouillonBut
	etapes: BrouillonEtape[]
	contreMesures: BrouillonContreMesure[]
	relations: BrouillonRelation[]
	presence: BrouillonPresence[]
	savoirs: BrouillonSavoir[]
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
	handleAjouterSavoir: (indiceId: string) => void
	handleChangeIndiceSavoir: (index: number, indiceId: string) => void
	handleChangeCertitudeSavoir: (index: number, certitude: Certitude) => void
	handleChangeRevelComment: (index: number, valeur: string) => void
	handleBlurRevelComment: (index: number, valeur: string) => void
	handleRetirerSavoir: (index: number) => void
	handleOuvrirPorteConfiance: (index: number) => void
	handleChangeConfiance: (index: number, valeur: number) => void
	handleFermerPorteConfiance: (index: number) => void
	handleOuvrirPorteJet: (index: number) => void
	handleChangeJetCarac: (index: number, carac: Characteristic) => void
	handleChangeJetTc: (index: number, tc: ChallengeTier) => void
	handleFermerPorteJet: (index: number) => void
	handleOuvrirPorteContrepartie: (index: number, objetId: string) => void
	handleChangeContrepartieObjet: (index: number, objetId: string) => void
	handleChangeContrepartieConsomme: (index: number, consomme: boolean) => void
	handleFermerPorteContrepartie: (index: number) => void
	handleOuvrirPorteApresIndice: (index: number, indiceId: string) => void
	handleChangeApresIndice: (index: number, indiceId: string) => void
	handleFermerPorteApresIndice: (index: number) => void
}

export function useEcriturePersonnages(dossierId: string): UseEcriturePersonnagesResult {
	const socle = useSocleEcriturePersonnages(dossierId)
	const identite = useEcritureIdentite(socle.socle)
	const plan = useEcriturePlan(socle.socle)
	const relationsPresence = useEcritureRelationsPresence(socle.socle)
	const savoirs = useEcritureSavoirs(socle.socle)

	return {
		dossier: socle.dossier,
		personnageAffiche: socle.personnageAffiche,
		selection: socle.selection,
		setSelection: socle.setSelection,
		refusAffiche: socle.refusAffiche,
		avertissementsAffiches: socle.avertissementsAffiches,
		handleAjouter: socle.handleAjouter,
		...identite,
		...plan,
		...relationsPresence,
		...savoirs,
	}
}
