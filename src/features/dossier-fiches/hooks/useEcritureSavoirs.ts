import { useState } from 'react'
import {
	CERTITUDE_INITIALE,
	CONFIANCE_INITIALE_PORTE,
	DEFAULT_CHARACTERISTIC,
	DEFAULT_CHALLENGE_TIER,
	type Personnage,
	type Savoir,
	type Revelation,
	type Certitude,
	type Characteristic,
	type ChallengeTier,
} from '../../../brain'
import type { SocleEcriture } from './useSocleEcriturePersonnages'

/**
 * LA FAMILLE « SAVOIRS » (§5 du plan d'itération 6) — le bloc 7 de l'accordéon.
 * QUATRIÈME sous-hook de famille, même contrat que les trois autres : il reçoit
 * `socle` en PARAMÈTRE et n'appelle JAMAIS `useBrain`/`useOpenDossier`
 * lui-même ; `commit` et ses deux indexations KR-197 vivent UNIQUEMENT dans
 * `useSocleEcriturePersonnages.ts`.
 *
 * UN SEUL RÉGIME DE COMMIT, contrairement aux relations : `indice_id` ET
 * `certitude` sont les DEUX seuls champs requis d'un savoir, et le geste
 * d'ajout (un `Select` d'indice) les pose TOUS LES DEUX — le premier avec la
 * référence choisie par l'auteur, le second avec `CERTITUDE_INITIALE`. Il n'y a
 * donc AUCUNE ligne locale possible, le commit est immédiat (précédent
 * `presence[]`, pas `relations[]`). Seul `revele_comment` (optionnel) suit le
 * patron brouillon-par-champ, commité au blur, blur vide ⇒ retire la clé.
 *
 * LES QUATRE PORTES sont des widgets FERMÉS : elles committent immédiatement.
 * Chacune pose TOUTES ses clés en UN SEUL geste à l'ouverture (doctrine du
 * « geste explicite », précédent `stats`) et retire sa clé racine à la
 * fermeture. Deux d'entre elles s'ouvrent par un `Select` et exigent donc un
 * identifiant en paramètre — une porte ouverte sur `objets[0].id` écrirait une
 * référence que personne n'a choisie (veto tech-lead, § 8 désaccord 6).
 */

export interface BrouillonSavoir {
	indice_id: string
	certitude: Certitude
	revele_comment: string
	/** `null` = porte NON POSÉE. Jamais `CONFIANCE_INITIALE_PORTE` en repli de
	 *  lecture : une porte absente n'est pas une porte fermée. */
	confiance_min: number | null
	jet: { carac: Characteristic; tc: ChallengeTier } | null
	contrepartie: { objet_id: string; consomme: boolean } | null
	apres_indice_id: string | null
}

/**
 * POSER une porte — `revele_si` naît avec elle si le savoir n'en portait
 * aucune. Le spread d'un `revele_si` absent donne `{}`, ce qui est exactement le
 * cas « première porte posée ».
 */
function poserPorte<C extends keyof Revelation>(savoir: Savoir, porte: C, valeur: NonNullable<Revelation[C]>): Savoir {
	return { ...savoir, revele_si: { ...savoir.revele_si, [porte]: valeur } }
}

/**
 * RETIRER une porte — la clé racine `revele_si.<porte>` DISPARAÎT, elle ne
 * devient jamais un objet vide (critère #2 du plan). Et si c'était la dernière,
 * `revele_si` disparaît avec elle : « absent ≠ vide », et un `revele_si: {}`
 * laissé derrière serait un porteur de portes qui n'en porte aucune — un état
 * que `Revelation` déclare ne pas vouloir (« une porte absente n'est pas une
 * porte fermée : c'est une porte non posée »).
 */
function retirerPorte(savoir: Savoir, porte: keyof Revelation): Savoir {
	const restantes: Revelation = { ...savoir.revele_si }
	delete restantes[porte]
	if (Object.keys(restantes).length === 0) {
		const sansRevelation: Savoir = { ...savoir }
		delete sansRevelation.revele_si
		return sansRevelation
	}
	return { ...savoir, revele_si: restantes }
}

export interface UseEcritureSavoirsResult {
	savoirs: BrouillonSavoir[]
	/** Select-comme-geste : `''` (le placeholder d'action) n'ajoute rien. */
	handleAjouterSavoir: (indiceId: string) => void
	handleChangeIndiceSavoir: (index: number, indiceId: string) => void
	handleChangeCertitudeSavoir: (index: number, certitude: Certitude) => void
	/** Brouillon-par-champ — n'écrit rien au document. */
	handleChangeRevelComment: (index: number, valeur: string) => void
	/** Commit au blur ; valeur vide ⇒ retire la clé (le champ est optionnel). */
	handleBlurRevelComment: (index: number, valeur: string) => void
	handleRetirerSavoir: (index: number) => void
	handleOuvrirPorteConfiance: (index: number) => void
	handleChangeConfiance: (index: number, valeur: number) => void
	handleFermerPorteConfiance: (index: number) => void
	handleOuvrirPorteJet: (index: number) => void
	handleChangeJetCarac: (index: number, carac: Characteristic) => void
	handleChangeJetTc: (index: number, tc: ChallengeTier) => void
	handleFermerPorteJet: (index: number) => void
	/** Identifiant OBLIGATOIRE : la porte ne s'ouvre que sur un objet CHOISI. */
	handleOuvrirPorteContrepartie: (index: number, objetId: string) => void
	handleChangeContrepartieObjet: (index: number, objetId: string) => void
	handleChangeContrepartieConsomme: (index: number, consomme: boolean) => void
	handleFermerPorteContrepartie: (index: number) => void
	/** Identifiant OBLIGATOIRE, même motif que la contrepartie. */
	handleOuvrirPorteApresIndice: (index: number, indiceId: string) => void
	handleChangeApresIndice: (index: number, indiceId: string) => void
	handleFermerPorteApresIndice: (index: number) => void
}

export function useEcritureSavoirs(socle: SocleEcriture | null): UseEcritureSavoirsResult {
	const [revelCommentBrouillons, setRevelCommentBrouillons] = useState<Record<string, Record<number, string>>>({})

	if (socle === null) {
		return {
			savoirs: [],
			handleAjouterSavoir: () => {},
			handleChangeIndiceSavoir: () => {},
			handleChangeCertitudeSavoir: () => {},
			handleChangeRevelComment: () => {},
			handleBlurRevelComment: () => {},
			handleRetirerSavoir: () => {},
			handleOuvrirPorteConfiance: () => {},
			handleChangeConfiance: () => {},
			handleFermerPorteConfiance: () => {},
			handleOuvrirPorteJet: () => {},
			handleChangeJetCarac: () => {},
			handleChangeJetTc: () => {},
			handleFermerPorteJet: () => {},
			handleOuvrirPorteContrepartie: () => {},
			handleChangeContrepartieObjet: () => {},
			handleChangeContrepartieConsomme: () => {},
			handleFermerPorteContrepartie: () => {},
			handleOuvrirPorteApresIndice: () => {},
			handleChangeApresIndice: () => {},
			handleFermerPorteApresIndice: () => {},
		}
	}

	const { dossierActuel, personnageAffiche, commit } = socle

	/**
	 * Repli PAR CHAMP, jamais par objet (BUG-058 côté lecture) : les quatre
	 * portes se lisent du document tel quel, `null` quand elles ne sont pas
	 * posées — aucune valeur n'est fabriquée à la lecture.
	 */
	function savoirsAffiches(personnage: Personnage): BrouillonSavoir[] {
		const drafts = revelCommentBrouillons[personnage.id] ?? {}
		return personnage.savoirs.map((savoir, index) => ({
			indice_id: savoir.indice_id,
			certitude: savoir.certitude,
			revele_comment: drafts[index] ?? savoir.revele_comment ?? '',
			confiance_min: savoir.revele_si?.confiance_min ?? null,
			jet: savoir.revele_si?.jet ?? null,
			contrepartie: savoir.revele_si?.contrepartie ?? null,
			apres_indice_id: savoir.revele_si?.apres_indice_id ?? null,
		}))
	}

	/**
	 * L'UNIQUE site d'indexation de cette famille (KR-197) : le personnage
	 * AFFICHÉ, jamais `personnages[0]`, et le savoir de RANG `index` chez lui
	 * seul. Toutes les écritures de savoir passent par ici — muter cette ligne
	 * doit faire rougir la sonde à deux personnages de `savoirs.test.tsx`.
	 */
	function commitSavoir(index: number, transforme: (savoir: Savoir) => Savoir): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				return { ...p, savoirs: p.savoirs.map((s, i) => (i === index ? transforme(s) : s)) }
			}),
			id,
		)
	}

	/** Le savoir PERSISTÉ de rang `index` chez le personnage affiché — la source
	 *  des gardes de porte ci-dessous, jamais un brouillon. */
	function savoirPersiste(index: number): Savoir | undefined {
		return personnageAffiche?.savoirs[index]
	}

	// ── LE SAVOIR LUI-MÊME ────────────────────────────────────────────────────

	/** Le geste d'ajout : choisir un indice dans le `Select` dédié committe
	 *  IMMÉDIATEMENT les deux champs requis — aucune ligne locale n'est
	 *  nécessaire (précédent `handleAjouterPresence`). `indiceId === ''` (le
	 *  placeholder d'action du Select) n'ajoute rien. */
	function handleAjouterSavoir(indiceId: string): void {
		if (personnageAffiche === undefined || indiceId === '') return
		const id = personnageAffiche.id
		const nouveau: Savoir = { indice_id: indiceId, certitude: CERTITUDE_INITIALE }
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, savoirs: [...p.savoirs, nouveau] } : p)),
			id,
		)
	}

	function handleChangeIndiceSavoir(index: number, indiceId: string): void {
		commitSavoir(index, (savoir) => ({ ...savoir, indice_id: indiceId }))
	}

	function handleChangeCertitudeSavoir(index: number, certitude: Certitude): void {
		commitSavoir(index, (savoir) => ({ ...savoir, certitude }))
	}

	function handleChangeRevelComment(index: number, valeur: string): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		setRevelCommentBrouillons((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [index]: valeur } }))
	}

	/** `revele_comment` est OPTIONNEL : blur vide retire la clé (précédent
	 *  `but.echeance` / `presence[].quand`), jamais un refus au SSOT. */
	function handleBlurRevelComment(index: number, valeur: string): void {
		commitSavoir(index, (savoir) => {
			if (valeur === '') {
				const sansCommentaire: Savoir = { ...savoir }
				delete sansCommentaire.revele_comment
				return sansCommentaire
			}
			return { ...savoir, revele_comment: valeur }
		})
	}

	function handleRetirerSavoir(index: number): void {
		if (personnageAffiche === undefined) return
		const id = personnageAffiche.id
		commit(
			dossierActuel.monde.personnages.map((p) =>
				p.id === id ? { ...p, savoirs: p.savoirs.filter((_, i) => i !== index) } : p,
			),
			id,
		)
		// Les indices se décalent après un retrait : purge tous les brouillons.
		setRevelCommentBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	// ── PORTE 1 — CONFIANCE ───────────────────────────────────────────────────

	/** Graine `CONFIANCE_INITIALE_PORTE` (= 1), JAMAIS `CONFIANCE_MIN` (= −3) :
	 *  une porte au bas de l'échelle n'exigerait rien tout en éteignant
	 *  l'avertissement `revelation-sans-porte` (§ 8 désaccord 5). */
	function handleOuvrirPorteConfiance(index: number): void {
		commitSavoir(index, (savoir) => poserPorte(savoir, 'confiance_min', CONFIANCE_INITIALE_PORTE))
	}

	function handleChangeConfiance(index: number, valeur: number): void {
		commitSavoir(index, (savoir) => poserPorte(savoir, 'confiance_min', valeur))
	}

	function handleFermerPorteConfiance(index: number): void {
		commitSavoir(index, (savoir) => retirerPorte(savoir, 'confiance_min'))
	}

	// ── PORTE 2 — JET ─────────────────────────────────────────────────────────

	/** Les DEUX clés du jet en un seul geste : `carac` seule serait un jet sans
	 *  difficulté, et les deux sont `requis: true` sous ce porteur optionnel. */
	function handleOuvrirPorteJet(index: number): void {
		commitSavoir(index, (savoir) =>
			poserPorte(savoir, 'jet', { carac: DEFAULT_CHARACTERISTIC, tc: DEFAULT_CHALLENGE_TIER }),
		)
	}

	function handleChangeJetCarac(index: number, carac: Characteristic): void {
		const jet = savoirPersiste(index)?.revele_si?.jet
		if (jet === undefined) return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'jet', { ...jet, carac }))
	}

	function handleChangeJetTc(index: number, tc: ChallengeTier): void {
		const jet = savoirPersiste(index)?.revele_si?.jet
		if (jet === undefined) return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'jet', { ...jet, tc }))
	}

	function handleFermerPorteJet(index: number): void {
		commitSavoir(index, (savoir) => retirerPorte(savoir, 'jet'))
	}

	// ── PORTE 3 — CONTREPARTIE ────────────────────────────────────────────────

	/** `consomme` est posé À `false` AU MÊME COMMIT, explicitement : il est
	 *  `requis: true` dans la porte (`ENUMERES_FERMES`), donc l'idiome « `false`
	 *  retire la clé » de `Relation.secret` NE S'APPLIQUE PAS ici — un
	 *  `contrepartie` sans `consomme` serait refusé au SSOT. */
	function handleOuvrirPorteContrepartie(index: number, objetId: string): void {
		if (objetId === '') return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'contrepartie', { objet_id: objetId, consomme: false }))
	}

	function handleChangeContrepartieObjet(index: number, objetId: string): void {
		const contrepartie = savoirPersiste(index)?.revele_si?.contrepartie
		if (objetId === '' || contrepartie === undefined) return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'contrepartie', { ...contrepartie, objet_id: objetId }))
	}

	function handleChangeContrepartieConsomme(index: number, consomme: boolean): void {
		const contrepartie = savoirPersiste(index)?.revele_si?.contrepartie
		if (contrepartie === undefined) return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'contrepartie', { ...contrepartie, consomme }))
	}

	function handleFermerPorteContrepartie(index: number): void {
		commitSavoir(index, (savoir) => retirerPorte(savoir, 'contrepartie'))
	}

	// ── PORTE 4 — INDICE PRÉALABLE ────────────────────────────────────────────

	/** MÊME CORPS que `handleChangeApresIndice` ci-dessous, et les deux restent
	 *  DEUX gestionnaires : la porte n'a qu'une seule clé, donc l'ouvrir et la
	 *  changer écrivent la même chose — mais le contrat du bloc distingue les
	 *  deux gestes, et les fondre obligerait le composant à savoir que la porte
	 *  est mono-clé. Le jour où elle en gagne une seconde, seul l'un des deux
	 *  change. */
	function handleOuvrirPorteApresIndice(index: number, indiceId: string): void {
		if (indiceId === '') return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'apres_indice_id', indiceId))
	}

	function handleChangeApresIndice(index: number, indiceId: string): void {
		if (indiceId === '') return
		commitSavoir(index, (savoir) => poserPorte(savoir, 'apres_indice_id', indiceId))
	}

	function handleFermerPorteApresIndice(index: number): void {
		commitSavoir(index, (savoir) => retirerPorte(savoir, 'apres_indice_id'))
	}

	return {
		savoirs: personnageAffiche === undefined ? [] : savoirsAffiches(personnageAffiche),
		handleAjouterSavoir,
		handleChangeIndiceSavoir,
		handleChangeCertitudeSavoir,
		handleChangeRevelComment,
		handleBlurRevelComment,
		handleRetirerSavoir,
		handleOuvrirPorteConfiance,
		handleChangeConfiance,
		handleFermerPorteConfiance,
		handleOuvrirPorteJet,
		handleChangeJetCarac,
		handleChangeJetTc,
		handleFermerPorteJet,
		handleOuvrirPorteContrepartie,
		handleChangeContrepartieObjet,
		handleChangeContrepartieConsomme,
		handleFermerPorteContrepartie,
		handleOuvrirPorteApresIndice,
		handleChangeApresIndice,
		handleFermerPorteApresIndice,
	}
}
